import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const sourceUrl = new URL('../src/index.ts', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'index.ts',
});
const workerModule = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const worker = workerModule.default;
const dashboardSource = await readFile(new URL('../dashboard-worker.js', import.meta.url), 'utf8');
const dashboardModule = await import(`data:text/javascript;base64,${Buffer.from(dashboardSource).toString('base64')}`);
const dashboardWorker = dashboardModule.default;

class FakeD1 {
  constructor(rows = [], prepareError = null) {
    this.rows = rows;
    this.prepareError = prepareError;
    this.calls = [];
  }

  prepare(sql) {
    const call = { sql, params: [] };
    this.calls.push(call);
    if (this.prepareError) throw this.prepareError;
    const db = this;

    const statement = {
      bind(...params) {
        call.params = params;
        return statement;
      },
      async first() {
        if (/COUNT\(\*\)/i.test(sql)) return { total: db.rows.length };
        throw new Error(`Unexpected first() query: ${sql}`);
      },
      async all() {
        if (!/ORDER BY created_at DESC/i.test(sql)) throw new Error(`Admin list must be newest-first: ${sql}`);
        const [limit, offset] = call.params;
        return { results: db.rows.slice(offset, offset + limit) };
      },
      async run() {
        throw new Error(`Unexpected write query: ${sql}`);
      },
    };
    return statement;
  }
}

const adminEnv = (db) => ({
  DB: db,
  ALLOWED_ORIGIN: 'https://perust.github.io',
  ADMIN_TOKEN: 'secret-admin-token',
});

const adminRequest = (query = '', token = '') => new Request(
  `https://worker.test/admin/comments${query}`,
  {
    headers: {
      origin: 'https://perust.github.io',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  },
);

test('GET /admin/comments rejects a request without the admin token before querying D1', async () => {
  const db = new FakeD1();
  const response = await worker.fetch(adminRequest(), adminEnv(db));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'unauthorized' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(db.calls.length, 0);
});

test('GET /admin/comments fails closed when the Worker admin secret is missing', async () => {
  for (const implementation of [worker, dashboardWorker]) {
    const db = new FakeD1();
    const env = adminEnv(db);
    delete env.ADMIN_TOKEN;
    const response = await implementation.fetch(adminRequest('', 'undefined'), env);

    assert.equal(response.status, 401);
    assert.equal(db.calls.length, 0);
  }
});

test('the dashboard-paste worker carries the authenticated admin list route too', async () => {
  const db = new FakeD1();
  const response = await dashboardWorker.fetch(adminRequest(), adminEnv(db));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'unauthorized' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(db.calls.length, 0);
});

test('GET /admin/comments returns every visibility and status newest-first without secret fields', async () => {
  const rows = [
    {
      id: 'private-new',
      postSlug: 'new-post',
      nickname: '비밀 독자',
      body: '작성자에게만 보이는 댓글',
      ipPrefix: '2001:db8:0:xxxx',
      isPrivate: 1,
      status: 'approved',
      createdAt: '2026-08-17 12:00:00',
      approvedAt: '2026-08-17 12:00:00',
      ipHash: 'must-not-leak',
      deleteHash: 'must-not-leak',
    },
    {
      id: 'pending-middle',
      postSlug: 'pending-post',
      nickname: '검토 대기 독자',
      body: '대기 중인 댓글',
      ipPrefix: '203.0.xxx.xxx',
      isPrivate: 0,
      status: 'pending',
      createdAt: '2026-08-17 11:00:00',
      approvedAt: null,
      ipHash: 'must-not-leak',
      deleteHash: 'must-not-leak',
    },
    {
      id: 'rejected-old',
      postSlug: 'old-post',
      nickname: '익명',
      body: '숨겨진 댓글',
      ipPrefix: '118.235.xxx.xxx',
      isPrivate: 0,
      status: 'rejected',
      createdAt: '2026-08-16 12:00:00',
      approvedAt: null,
      ipHash: 'must-not-leak',
      deleteHash: 'must-not-leak',
    },
    {
      id: 'public-oldest',
      postSlug: 'oldest-post',
      nickname: '독자',
      body: '공개 댓글',
      ipPrefix: '211.10.xxx.xxx',
      isPrivate: 0,
      status: 'approved',
      createdAt: '2026-08-15 12:00:00',
      approvedAt: '2026-08-15 12:00:00',
    },
  ];

  let canonicalData;
  for (const [name, implementation] of [['TypeScript Worker', worker], ['dashboard Worker', dashboardWorker]]) {
    const db = new FakeD1(rows);
    const response = await implementation.fetch(
      adminRequest('?limit=10&offset=0', 'secret-admin-token'),
      adminEnv(db),
    );
    const data = await response.json();

    assert.equal(response.status, 200, name);
    assert.equal(response.headers.get('cache-control'), 'no-store', name);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://perust.github.io', name);
    assert.deepEqual(data.pagination, { total: 4, limit: 10, offset: 0, hasMore: false }, name);
    assert.deepEqual(data.comments.map(({ id, isPrivate, status }) => ({ id, isPrivate, status })), [
      { id: 'private-new', isPrivate: true, status: 'approved' },
      { id: 'pending-middle', isPrivate: false, status: 'pending' },
      { id: 'rejected-old', isPrivate: false, status: 'rejected' },
      { id: 'public-oldest', isPrivate: false, status: 'approved' },
    ], name);
    for (const comment of data.comments) {
      assert.equal('ipHash' in comment, false, name);
      assert.equal('deleteHash' in comment, false, name);
    }

    const countQuery = db.calls.find(({ sql }) => /COUNT\(\*\)/i.test(sql));
    const listQuery = db.calls.find(({ sql }) => /ORDER BY created_at DESC/i.test(sql));
    assert.ok(countQuery, `${name}: count query missing`);
    assert.ok(listQuery, `${name}: list query missing`);
    assert.doesNotMatch(countQuery.sql, /\b(?:WHERE|HAVING)\b/i, `${name}: count must include every status`);
    assert.doesNotMatch(listQuery.sql, /\b(?:WHERE|HAVING)\b/i, `${name}: list must include every status`);
    assert.deepEqual(listQuery.params, [10, 0], name);

    if (canonicalData) assert.deepEqual(data, canonicalData, `${name}: authenticated output drifted`);
    canonicalData = data;
  }
});

test('admin exceptions are generic and never cacheable in both Worker variants', async () => {
  for (const [name, implementation] of [['TypeScript Worker', worker], ['dashboard Worker', dashboardWorker]]) {
    const db = new FakeD1([], new Error('D1 internal table detail must not leak'));
    const response = await implementation.fetch(
      adminRequest('', 'secret-admin-token'),
      adminEnv(db),
    );

    assert.equal(response.status, 500, name);
    assert.deepEqual(await response.json(), { error: 'server error' }, name);
    assert.equal(response.headers.get('cache-control'), 'no-store', name);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://perust.github.io', name);
  }
});

test('GET /admin/comments clamps pagination to safe bounds', async () => {
  const db = new FakeD1([]);
  const response = await worker.fetch(adminRequest('?limit=9999&offset=-20', 'secret-admin-token'), adminEnv(db));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(data.pagination, { total: 0, limit: 100, offset: 0, hasMore: false });
  const listQuery = db.calls.find(({ sql }) => /ORDER BY created_at DESC/i.test(sql));
  assert.deepEqual(listQuery?.params, [100, 0]);
});
