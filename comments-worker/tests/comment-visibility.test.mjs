import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'index.ts',
});
const workerModule = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const dashboardSource = await readFile(new URL('../dashboard-worker.js', import.meta.url), 'utf8');
const dashboardModule = await import(`data:text/javascript;base64,${Buffer.from(dashboardSource).toString('base64')}`);

const implementations = [
  ['TypeScript Worker', workerModule.default],
  ['dashboard Worker', dashboardModule.default],
];

const rows = [
  {
    id: 'public-comment',
    postSlug: 'target-post',
    nickname: '공개 독자',
    body: '공개 댓글 본문',
    ipPrefix: '203.0.xxx.xxx',
    isPrivate: 0,
    status: 'approved',
    createdAt: '2026-08-17 10:00:00',
    ipHash: 'public-ip-hash',
    deleteHash: 'public-delete-hash',
  },
  {
    id: 'private-comment',
    postSlug: 'target-post',
    nickname: '숨겨야 할 닉네임',
    body: '절대 공개되면 안 되는 비공개 원문',
    ipPrefix: '118.235.xxx.xxx',
    isPrivate: 1,
    status: 'approved',
    createdAt: '2026-08-17 11:00:00',
    ipHash: 'private-ip-hash',
    deleteHash: 'private-delete-hash',
  },
  {
    id: 'pending-comment',
    postSlug: 'target-post',
    nickname: '대기 독자',
    body: '대기 댓글 본문',
    ipPrefix: '211.10.xxx.xxx',
    isPrivate: 0,
    status: 'pending',
    createdAt: '2026-08-17 12:00:00',
  },
  {
    id: 'other-post-comment',
    postSlug: 'other-post',
    nickname: '다른 글 독자',
    body: '다른 글 댓글 본문',
    ipPrefix: '192.0.xxx.xxx',
    isPrivate: 0,
    status: 'approved',
    createdAt: '2026-08-17 13:00:00',
  },
];

class FakeCommentsD1 {
  constructor({ prepareError = null } = {}) {
    this.prepareError = prepareError;
    this.calls = [];
  }

  prepare(sql) {
    const call = { sql, params: [] };
    this.calls.push(call);
    if (this.prepareError) throw this.prepareError;

    const statement = {
      bind: (...params) => {
        call.params = params;
        return statement;
      },
      all: async () => {
        assert.match(sql, /WHERE post_slug = \? AND status = 'approved'/i);
        assert.match(sql, /ORDER BY created_at ASC/i);
        const [postSlug] = call.params;
        let result = rows.filter((row) => row.postSlug === postSlug && row.status === 'approved');
        if (/COALESCE\(is_private,\s*0\)\s*=\s*0/i.test(sql)) {
          result = result.filter((row) => !row.isPrivate);
        }
        return { results: result };
      },
      first: async () => {
        throw new Error(`Unexpected first() query: ${sql}`);
      },
      run: async () => {
        throw new Error(`Unexpected write query: ${sql}`);
      },
    };
    return statement;
  }
}

const env = (db) => ({
  DB: db,
  ALLOWED_ORIGIN: 'https://perust.github.io',
  ADMIN_TOKEN: 'correct-admin-token',
});

const request = (token = '') => new Request('https://worker.test/comments?slug=target-post', {
  headers: {
    origin: 'https://perust.github.io',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  },
});

test('public GET keeps an approved private comment in order but returns only its placeholder', async () => {
  for (const [name, implementation] of implementations) {
    const db = new FakeCommentsD1();
    const response = await implementation.fetch(request(), env(db));
    const data = await response.json();
    const serialized = JSON.stringify(data);

    assert.equal(response.status, 200, name);
    assert.deepEqual(data.comments.map(({ id, isPrivate, isRedacted, body }) => ({ id, isPrivate, isRedacted, body })), [
      {
        id: 'public-comment',
        isPrivate: false,
        isRedacted: false,
        body: '공개 댓글 본문',
      },
      {
        id: 'private-comment',
        isPrivate: true,
        isRedacted: true,
        body: '비공개 댓글입니다.',
      },
    ], name);
    assert.equal(data.comments[1].nickname, '비공개', name);
    assert.equal(data.comments[1].ipPrefix, '', name);
    assert.doesNotMatch(serialized, /절대 공개되면 안 되는 비공개 원문|숨겨야 할 닉네임|118\.235|private-ip-hash|private-delete-hash/, name);
    assert.doesNotMatch(serialized, /대기 댓글 본문|다른 글 댓글 본문/, name);

    const listQuery = db.calls.at(0)?.sql || '';
    assert.match(listQuery, /COALESCE\(is_private,\s*0\) AS isPrivate/i, name);
    assert.doesNotMatch(listQuery, /COALESCE\(is_private,\s*0\)\s*=\s*0/i, name);
  }
});

test('authenticated GET returns the approved private body and never caches it', async () => {
  let canonicalData;
  for (const [name, implementation] of implementations) {
    const db = new FakeCommentsD1();
    const response = await implementation.fetch(request('correct-admin-token'), env(db));
    const data = await response.json();
    const privateComment = data.comments.find(({ id }) => id === 'private-comment');

    assert.equal(response.status, 200, name);
    assert.equal(response.headers.get('cache-control'), 'no-store', name);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://perust.github.io', name);
    assert.deepEqual(privateComment, {
      id: 'private-comment',
      postSlug: 'target-post',
      nickname: '숨겨야 할 닉네임',
      body: '절대 공개되면 안 되는 비공개 원문',
      ipPrefix: '118.235.xxx.xxx',
      isPrivate: true,
      isRedacted: false,
      createdAt: '2026-08-17 11:00:00',
    }, name);
    assert.doesNotMatch(JSON.stringify(data), /private-ip-hash|private-delete-hash/, name);

    if (canonicalData) assert.deepEqual(data, canonicalData, `${name}: authenticated output drifted`);
    canonicalData = data;
  }
});

test('an invalid article-view token is rejected before D1 and cleared with no-store semantics', async () => {
  for (const [name, implementation] of implementations) {
    const db = new FakeCommentsD1();
    const response = await implementation.fetch(request('wrong-token'), env(db));

    assert.equal(response.status, 401, name);
    assert.deepEqual(await response.json(), { error: 'unauthorized' }, name);
    assert.equal(response.headers.get('cache-control'), 'no-store', name);
    assert.equal(db.calls.length, 0, name);
  }
});

test('authenticated article-view failures are generic and never cacheable', async () => {
  for (const [name, implementation] of implementations) {
    const db = new FakeCommentsD1({ prepareError: new Error('private D1 detail must not leak') });
    const response = await implementation.fetch(request('correct-admin-token'), env(db));

    assert.equal(response.status, 500, name);
    assert.deepEqual(await response.json(), { error: 'server error' }, name);
    assert.equal(response.headers.get('cache-control'), 'no-store', name);
  }
});
