// check-publish-policy.mjs 의 fixture/self negative 테스트.
// 실행: npm run test:publish-policy (= node --test scripts/tests/)
//
// 프로덕션 검증기 파일을 그대로 spawn 하되, CHECK_ROOT 대신 cwd 를 임시 git 저장소(fixture)로
// 옮겨 실제 tree 를 오염시키지 않는다. fixture 는 os.tmpdir() 아래에 만들고 테스트 종료 시 삭제한다.
// 각 negative 케이스는 "정말 실패하는가"를 종료 코드와 실패 메시지로 확인한다.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { MIN_POST_BODY_CHARS } from '../../src/config/taxonomy.ts';
import { SECOND_CURATION_MANIFEST_RELPATH } from '../lib/second-curation-manifest.mjs';
import { SECOND_CURATION_POLICY_ANCHOR } from '../lib/second-curation-policy-anchor.mjs';

const SCRIPT = fileURLToPath(new URL('../check-publish-policy.mjs', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ARCH_DIR = 'content-archive/adsense-remediation/2026-07-21';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

const GIT_ENV = {
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_SYSTEM: devNull,
  GIT_AUTHOR_NAME: 'fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.com',
  GIT_COMMITTER_NAME: 'fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.com',
};

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...GIT_ENV } });
  assert.equal(result.status, 0, `git ${args.join(' ')} 실패: ${result.stderr}`);
  return result.stdout.trim();
}

function runValidator(root, envOverrides = {}) {
  const env = { ...process.env, ...GIT_ENV, ...envOverrides };
  delete env.CHECK_ROOT; // cwd(fixture 루트)를 그대로 쓰게 한다.
  if (!('POLICY_GIT_BASELINE' in envOverrides)) delete env.POLICY_GIT_BASELINE;
  if (!('POLICY_REQUIRE_COMMITTED_DIFF' in envOverrides)) delete env.POLICY_REQUIRE_COMMITTED_DIFF;
  return spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: 'utf8', env });
}

const assertPass = (result) =>
  assert.equal(result.status, 0, `통과해야 하는데 실패함:\n${result.stdout}\n${result.stderr}`);
function assertFailWith(result, substring) {
  assert.notEqual(result.status, 0, `실패해야 하는데 통과함:\n${result.stdout}`);
  assert.ok(
    result.stdout.includes(substring),
    `실패 메시지에 "${substring}" 가 있어야 함:\n${result.stdout}\n${result.stderr}`,
  );
}

const FIXTURE_GITIGNORE = `dist/\n`;

function postSource({
  date = '2026-07-22',
  category = 'AI/IT 정보',
  tags = ['AI'],
  editorialReview = true,
  valueType = 'experience',
  publishPacingException = null,
  bodyChars = MIN_POST_BODY_CHARS + 200,
  body = null,
} = {}) {
  const lines = ['---', 'title: "fixture"', 'description: "fixture"', `date: "${date}"`, `category: "${category}"`];
  if (tags !== null) lines.push(`tags: ${JSON.stringify(tags)}`);
  if (editorialReview !== null) lines.push(`editorialReview: ${editorialReview}`);
  if (valueType !== null) lines.push(`valueType: "${valueType}"`);
  if (publishPacingException !== null) lines.push(`publishPacingException: "${publishPacingException}"`);
  lines.push('---', '', body ?? '가'.repeat(bodyChars), '');
  return lines.join('\n');
}

function writeDist(root) {
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist', 'index.html'), '<html><body><a href="/blog/kept-post/">kept</a></body></html>\n');
  writeFileSync(
    join(root, 'dist', 'sitemap-0.xml'),
    '<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>https://example.com/blog/kept-post/</loc></url></urlset>\n',
  );
  writeFileSync(
    join(root, 'dist', 'rss.xml'),
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><item><link>https://example.com/blog/kept-post/</link></item></channel></rss>\n',
  );
}

// 프로덕션 immutable anchor와 같은 실제 13편/42 payload 보관 세트를 fixture로 복사한다.
function writeArchiveSet(root) {
  cpSync(join(REPO_ROOT, ARCH_DIR), join(root, ARCH_DIR), { recursive: true });
}

function mutateManifest(root, mutate) {
  const path = join(root, SECOND_CURATION_MANIFEST_RELPATH);
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  mutate(manifest);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

// 기본 fixture: 기준일 당일(2026-07-21) date 의 grandfathered 글 1편이 커밋되어 있고,
// 보관 세트·매니페스트·최소 dist 가 갖춰져 검증기가 통과하는 상태.
function makeFixture(t, { archiveUntracked = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'publish-policy-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, '.gitignore'), FIXTURE_GITIGNORE);
  mkdirSync(join(root, 'src', 'content', 'blog'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/blog/2026-07-21-grandfathered-post.md'),
    postSource({ date: '2026-07-21', tags: null, editorialReview: null, valueType: null, bodyChars: 300 }),
  );
  writeDist(root);
  git(root, 'init', '-q', '-b', 'main');
  if (archiveUntracked) {
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', 'baseline');
    writeArchiveSet(root); // 커밋 뒤에 써서 untracked 상태를 재현한다.
  } else {
    writeArchiveSet(root);
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', 'baseline');
  }
  return root;
}

const newPostPath = (root, name) => join(root, 'src', 'content', 'blog', name);

// --- 실제 저장소 대상: 2차 큐레이션 확정 13편 ---

// AdSense 저가치 콘텐츠 감사에서 공개 중단이 확정된 슬러그 전체.
// policy anchor 와 독립적으로 여기에 적어 둔다 — anchor 를 줄여서 검사를 빠져나가는 회귀를 잡기 위함이다.
const SECOND_CURATION_SLUGS = [
  // 1차 확정(5편)
  '2026-06-28-money-weekly-2026-june-week-4',
  '2026-07-02-investment-data-records-not-emotion',
  '2026-07-03-productivity-apps-system-first',
  '2026-07-03-reduce-procrastination-small-tasks',
  '2026-07-09-gpt-5-6-release-preview-checklist',
  // 2차 확정(8편)
  '2026-07-07-ai-agent-cost-power',
  '2026-07-07-ai-chatbot-answer-verification',
  '2026-07-07-ai-coding-tool-trust-claude-code',
  '2026-07-07-gemini-image-generation-free',
  '2026-07-07-kpass-card-update-checklist',
  '2026-07-07-second-half-policy-changes-checklist',
  '2026-07-08-kakao-card-receipt-shopping-points',
  '2026-07-08-phone-opening-identity-check',
];

/** dir 아래 모든 파일의 저장소 상대 경로(posix). */
function filesUnder(root, dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(root, rel));
    else out.push(rel);
  }
  return out;
}

test('실제 저장소: 확정 13편이 policy anchor 에 모두 있고 보관본 해시가 일치한다', () => {
  const anchored = SECOND_CURATION_POLICY_ANCHOR.posts.map((post) => post.slug).sort();
  assert.deepEqual(
    anchored,
    [...SECOND_CURATION_SLUGS].sort(),
    'immutable policy anchor 는 확정 13편을 정확히 담아야 함(축소·누락 금지)',
  );
  for (const post of SECOND_CURATION_POLICY_ANCHOR.posts) {
    for (const file of post.files) {
      const archive = join(REPO_ROOT, file.archivePath);
      assert.ok(existsSync(archive), `보관본이 있어야 함: ${file.archivePath}`);
      assert.equal(
        sha256(readFileSync(archive)),
        file.sha256,
        `보관본이 anchor 해시와 byte-identical 해야 함: ${file.archivePath}`,
      );
    }
  }
});

test('실제 저장소: 확정 13편의 소스와 slug-addressable public 자산이 공개 트리에 없다', () => {
  const publicFiles = [...filesUnder(REPO_ROOT, 'public/images/posts'), ...filesUnder(REPO_ROOT, 'public/og/posts')];
  for (const slug of SECOND_CURATION_SLUGS) {
    assert.ok(
      !existsSync(join(REPO_ROOT, 'src', 'content', 'blog', `${slug}.md`)),
      `보관 슬러그 ${slug} 이(가) src/content/blog 에 남아 있으면 안 됨`,
    );
    const leftovers = publicFiles.filter((rel) => rel.split('/').pop().startsWith(slug));
    assert.deepEqual(leftovers, [], `보관 슬러그 ${slug} 의 public 자산이 남아 있으면 안 됨`);
  }
});

// src/ 에는 글 본문·내부 링크·홈 큐레이션·주제 허브·카테고리 설정이 모두 들어 있다.
// (보관 슬러그를 정당하게 담는 곳은 enforcement anchor·매니페스트뿐이라 scripts/ 는 대상이 아니다.)
test('실제 저장소: 확정 13편의 슬러그를 참조하는 소스·설정이 없다', () => {
  const hits = [];
  for (const rel of filesUnder(REPO_ROOT, 'src')) {
    const text = readFileSync(join(REPO_ROOT, rel), 'utf8');
    for (const slug of SECOND_CURATION_SLUGS) {
      if (text.includes(slug)) hits.push(`${rel} → ${slug}`);
    }
  }
  assert.deepEqual(hits, [], '내부 링크·홈 큐레이션·주제 허브·설정에 보관 슬러그 참조가 없어야 함');
});

// --- 양성 대조군 ---

test('기본 fixture(보관 파일 커밋됨)는 통과한다', (t) => {
  assertPass(runValidator(makeFixture(t)));
});

test('보관 파일이 아직 커밋 전 untracked 상태여도 통과한다 (ls-files 만 보면 안 되는 케이스)', (t) => {
  assertPass(runValidator(makeFixture(t, { archiveUntracked: true })));
});

test('게이트를 모두 만족하는 신규 글 1편은 통과한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-valid-new-post.md'), postSource());
  assertPass(runValidator(root));
});

test('신규 글의 고신뢰 챗봇 잔재는 발행을 차단한다', (t) => {
  const root = makeFixture(t);
  const body = `물론입니다! 요청하신 글입니다.\n\n${'가'.repeat(MIN_POST_BODY_CHARS + 200)}`;
  writeFileSync(newPostPath(root, '2026-07-22-chatbot-residue.md'), postSource({ body }));
  assertFailWith(runValidator(root), 'chatbot-preface');
});

test('신규 글의 문맥 의존 AI 문체 신호는 warning만 내고 통과한다', (t) => {
  const root = makeFixture(t);
  const body = `## 초보 추천도\n\n${'가'.repeat(MIN_POST_BODY_CHARS + 200)}`;
  writeFileSync(newPostPath(root, '2026-07-22-style-warning.md'), postSource({ body }));
  const result = runValidator(root);
  assertPass(result);
  assert.ok(result.stdout.includes('[warn] 신규 글'));
  assert.ok(result.stdout.includes('generic-outline'));
});

test('게이트를 만족하는 staged 신규 글도 baseline 트리와 비교해 통과한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-valid-staged-post.md'), postSource());
  git(root, 'add', 'src/content/blog/2026-07-22-valid-staged-post.md');
  assertPass(runValidator(root));
});

test('기준일 당일 date 의 기존(grandfathered) 글은 상한에 잡히지 않는다 — 같은 날 신규 1편은 통과', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-21-new-on-baseline-day.md'), postSource({ date: '2026-07-21' }));
  assertPass(runValidator(root));
});

test('명시한 all-zero POLICY_GIT_BASELINE 은 fallback 없이 실패한다', (t) => {
  const root = makeFixture(t);
  const result = runValidator(root, { POLICY_GIT_BASELINE: '0'.repeat(40) });
  assertFailWith(result, 'all-zero');
});

// --- 신규 글 게이트 negative ---

test('backdate(기준일 이전 date) 신규 글도 게이트가 적용되어 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    newPostPath(root, '2026-07-15-backdated-new-post.md'),
    postSource({ date: '2026-07-15', tags: null, editorialReview: null, valueType: null }),
  );
  const result = runValidator(root);
  assertFailWith(result, '2026-07-15-backdated-new-post.md');
  assertFailWith(result, 'editorialReview: true');
});

test('신규 글의 editorialReview 누락은 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-no-review.md'), postSource({ editorialReview: null }));
  assertFailWith(runValidator(root), 'editorialReview: true');
});

test('신규 글의 valueType 누락은 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-no-value-type.md'), postSource({ valueType: null }));
  assertFailWith(runValidator(root), 'valueType');
});

test('신규 글의 valueType 오류값은 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-bad-value-type.md'), postSource({ valueType: 'news-rehash' }));
  assertFailWith(runValidator(root), '"news-rehash"');
});

test('신규 글의 tags 빈 배열은 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-empty-tags.md'), postSource({ tags: [] }));
  assertFailWith(runValidator(root), '통제 태그를 1~');
});

test('신규 글의 tags 6개는 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    newPostPath(root, '2026-07-22-six-tags.md'),
    postSource({ tags: ['AI', 'ChatGPT', 'Claude', 'Gemini', 'MCP', '보안'] }),
  );
  assertFailWith(runValidator(root), '통제 태그를 1~');
});

test('신규 글의 통제 어휘 밖 태그는 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-rogue-tag.md'), postSource({ tags: ['임의비통제태그'] }));
  assertFailWith(runValidator(root), '임의비통제태그');
});

test('같은 date 의 신규 글 2편은 하루 상한을 넘어 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-first.md'), postSource());
  writeFileSync(newPostPath(root, '2026-07-22-second.md'), postSource());
  assertFailWith(runValidator(root), '하루 최대');
});

test('기한형 도서 챌린지는 명시적 사유로 같은 날 발행할 수 있다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-first.md'), postSource());
  writeFileSync(
    newPostPath(root, '2026-07-22-deadline-challenge.md'),
    postSource({
      category: '도서 학습 챌린지',
      publishPacingException: 'deadline-bound-challenge',
    }),
  );
  assertPass(runValidator(root));
});

test('기한형 챌린지 발행 예외는 다른 카테고리에서 사용할 수 없다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    newPostPath(root, '2026-07-22-invalid-exception.md'),
    postSource({ publishPacingException: 'deadline-bound-challenge' }),
  );
  assertFailWith(runValidator(root), '도서 학습 챌린지');
});

test('알 수 없는 기한형 챌린지 예외값은 fail-closed로 거부한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    newPostPath(root, '2026-07-22-unknown-exception.md'),
    postSource({
      category: '도서 학습 챌린지',
      publishPacingException: 'challenge-catch-up',
    }),
  );
  assertFailWith(runValidator(root), '도서 학습 챌린지');
});

test('기한형 챌린지 예외 글도 사람 편집 검토를 생략할 수 없다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    newPostPath(root, '2026-07-22-unreviewed-exception.md'),
    postSource({
      category: '도서 학습 챌린지',
      editorialReview: null,
      publishPacingException: 'deadline-bound-challenge',
    }),
  );
  assertFailWith(runValidator(root), 'editorialReview: true');
});

test('기준일 당일(포함) date 의 신규 글 2편도 하루 상한을 넘어 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-21-first.md'), postSource({ date: '2026-07-21' }));
  writeFileSync(newPostPath(root, '2026-07-21-second.md'), postSource({ date: '2026-07-21' }));
  assertFailWith(runValidator(root), '하루 최대');
});

test('신규 글의 본문 2,000자 미만은 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-07-22-thin-post.md'), postSource({ bodyChars: 500 }));
  assertFailWith(runValidator(root), `최소 ${MIN_POST_BODY_CHARS}자`);
});

// --- Git 기준선(baseline) 감지 경로 ---

test('이미 커밋된 신규 글도 POLICY_GIT_BASELINE(CI push 이전 SHA)으로 감지한다', (t) => {
  const root = makeFixture(t);
  const baseSha = git(root, 'rev-parse', 'HEAD');
  writeFileSync(
    newPostPath(root, '2026-07-10-committed-backdate.md'),
    postSource({ date: '2026-07-10', editorialReview: null }),
  );
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'sneak in backdated post');
  const result = runValidator(root, { POLICY_GIT_BASELINE: baseSha });
  assertFailWith(result, '2026-07-10-committed-backdate.md');
});

test('invalid explicit baseline은 origin/main==HEAD여도 fallback하지 않고 실패한다', (t) => {
  const root = makeFixture(t);
  git(root, 'remote', 'add', 'origin', root);
  git(root, 'fetch', '-q', 'origin', 'main:refs/remotes/origin/main');
  assertFailWith(runValidator(root, { POLICY_GIT_BASELINE: 'not-a-commit' }), 'POLICY_GIT_BASELINE');
});

test('force-push처럼 이전 SHA가 현재 checkout에서 unreachable이면 실패한다', (t) => {
  const root = makeFixture(t);
  assertFailWith(runValidator(root, { POLICY_GIT_BASELINE: '1234567890123456789012345678901234567890' }), 'POLICY_GIT_BASELINE');
});

test('workflow_dispatch/committed-diff 명시 모드는 baseline이 비었으면 실패한다', (t) => {
  const root = makeFixture(t);
  assertFailWith(runValidator(root, { POLICY_REQUIRE_COMMITTED_DIFF: 'true', POLICY_GIT_BASELINE: '' }), 'committed-diff');
});

test('committed-diff 명시 모드에서 baseline==HEAD이면 실패한다', (t) => {
  const root = makeFixture(t);
  const head = git(root, 'rev-parse', 'HEAD');
  assertFailWith(runValidator(root, { POLICY_REQUIRE_COMMITTED_DIFF: 'true', POLICY_GIT_BASELINE: head }), 'HEAD');
});

test('postsAtRef(git ls-tree) 실패 시 신규 감지를 건너뛰지 않고 실패한다', (t) => {
  const root = makeFixture(t);
  const bin = join(root, 'fixture-bin');
  mkdirSync(bin);
  const shim = join(bin, 'git');
  writeFileSync(shim, '#!/bin/sh\nif [ "$1" = "ls-tree" ]; then exit 9; fi\nexec /usr/bin/git "$@"\n');
  chmodSync(shim, 0o755);
  assertFailWith(
    runValidator(root, { POLICY_GIT_BASELINE: git(root, 'rev-parse', 'HEAD'), PATH: `${bin}:${process.env.PATH}` }),
    'ls-tree',
  );
});

test('upstream 이 있는 일반 checkout(clone)에서는 merge-base 로 커밋된 신규 글을 감지한다', (t) => {
  const origin = makeFixture(t);
  const parent = mkdtempSync(join(tmpdir(), 'publish-policy-clone-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const clone = join(parent, 'clone');
  git(parent, 'clone', '-q', origin, clone);
  writeDist(clone); // dist 는 ignore 대상이라 clone 에 없다 — 최소 dist 재구성.
  writeFileSync(
    newPostPath(clone, '2026-07-12-committed-backdate.md'),
    postSource({ date: '2026-07-12', valueType: null }),
  );
  git(clone, 'add', '-A');
  git(clone, 'commit', '-q', '-m', 'sneak in backdated post');
  assertFailWith(runValidator(clone), '2026-07-12-committed-backdate.md');
});

// --- 보관(archive) 무결성 negative ---

test('매니페스트 파일이 없으면 실패한다', (t) => {
  const root = makeFixture(t);
  rmSync(join(root, SECOND_CURATION_MANIFEST_RELPATH));
  assertFailWith(runValidator(root), '보관 선언 사본');
});

test('보관 파일이 없으면 실패한다', (t) => {
  const root = makeFixture(t);
  rmSync(join(root, ARCH_DIR, '2026-06-28-money-weekly-2026-june-week-4.md'));
  assertFailWith(runValidator(root), '2026-06-28-money-weekly-2026-june-week-4.md 이(가) 존재해야 함');
});

test('보관 파일이 변조되면 sha256 불일치로 실패한다', (t) => {
  const root = makeFixture(t);
  appendFileSync(join(root, ARCH_DIR, 'images', '2026-06-28-money-weekly-2026-june-week-4-01.jpg'), 'tampered');
  assertFailWith(runValidator(root), 'sha256');
});

test('보관 파일이 .gitignore 에 막혀 추적 불가하면 실패한다', (t) => {
  const root = makeFixture(t, { archiveUntracked: true });
  // 뒤에 오는 무시 규칙이 앞의 예외(negation)를 덮는다 → untracked + ignored 상태.
  appendFileSync(join(root, '.gitignore'), `${ARCH_DIR}/2026-07-03-productivity-apps-system-first.md\n`);
  assertFailWith(runValidator(root), 'Git 추적 불가');
});

test('manifest 항목 삭제 후 빠진 글 source를 복원해도 immutable anchor 불일치로 실패한다', (t) => {
  const root = makeFixture(t);
  const slug = '2026-07-03-productivity-apps-system-first';
  mutateManifest(root, (manifest) => { manifest.posts = manifest.posts.filter((post) => post.slug !== slug); });
  cpSync(join(root, ARCH_DIR, `${slug}.md`), newPostPath(root, `${slug}.md`));
  assertFailWith(runValidator(root), 'immutable policy anchor');
});

test('manifest만 12편으로 축소하면 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => { manifest.posts.pop(); });
  assertFailWith(runValidator(root), '정확히 13');
});

test('manifest에서 2차 확정 8편 중 1편을 빼고 그 원문을 되살려도 immutable anchor가 실패시킨다', (t) => {
  const root = makeFixture(t);
  const slug = '2026-07-08-phone-opening-identity-check';
  mutateManifest(root, (manifest) => { manifest.posts = manifest.posts.filter((post) => post.slug !== slug); });
  cpSync(join(root, ARCH_DIR, `${slug}.md`), newPostPath(root, `${slug}.md`));
  assertFailWith(runValidator(root), 'immutable policy anchor');
});

test('존재하는 파일로 빠져나가는 archivePath traversal도 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => {
    const file = manifest.posts[0].files[0];
    file.archivePath = `${ARCH_DIR}/../../../.gitignore`;
    file.sha256 = sha256(readFileSync(join(root, '.gitignore')));
  });
  assertFailWith(runValidator(root), '안전한 상대경로');
});

test('publicPath/archivePath 중복은 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => { manifest.posts[1].files[0] = { ...manifest.posts[0].files[0] }; });
  assertFailWith(runValidator(root), '중복');
});

test('보관 파일과 manifest sha를 함께 변조해도 immutable anchor가 실패시킨다', (t) => {
  const root = makeFixture(t);
  const rel = `${ARCH_DIR}/2026-07-03-productivity-apps-system-first.md`;
  appendFileSync(join(root, rel), 'tampered together');
  mutateManifest(root, (manifest) => {
    manifest.posts.find((post) => post.slug === '2026-07-03-productivity-apps-system-first').files[0].sha256 =
      sha256(readFileSync(join(root, rel)));
  });
  assertFailWith(runValidator(root), 'immutable policy anchor');
});

test('curation/removalPolicy 필드 변조는 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => { manifest.removalPolicy.redirect = 'temporary'; });
  assertFailWith(runValidator(root), 'removalPolicy');
});

test('removalPolicy.note 단독 변조도 immutable anchor 전체 비교로 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => { manifest.removalPolicy.note = 'tampered note'; });
  assertFailWith(runValidator(root), '매니페스트 전체');
});

test('description 단독 변조도 immutable anchor 전체 비교로 실패한다', (t) => {
  const root = makeFixture(t);
  mutateManifest(root, (manifest) => { manifest.description = 'tampered description'; });
  assertFailWith(runValidator(root), '매니페스트 전체');
});

// --- 보관 슬러그·자산 재등장 negative ---

test('보관 슬러그가 소스(src/content/blog)에 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(newPostPath(root, '2026-06-28-money-weekly-2026-june-week-4.md'), postSource());
  assertFailWith(runValidator(root), '2026-06-28-money-weekly-2026-june-week-4 이(가) src/content/blog 에 재등장하면 안 됨');
});

test('보관 슬러그가 dist 에 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  mkdirSync(join(root, 'dist', 'blog', '2026-06-28-money-weekly-2026-june-week-4'), { recursive: true });
  writeFileSync(join(root, 'dist', 'blog', '2026-06-28-money-weekly-2026-june-week-4', 'index.html'), '<html></html>\n');
  assertFailWith(runValidator(root), '2026-06-28-money-weekly-2026-june-week-4 이(가) dist/blog 에 재등장하면 안 됨');
});

test('보관 슬러그가 sitemap 에 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    join(root, 'dist', 'sitemap-0.xml'),
    '<?xml version="1.0"?><urlset><url><loc>https://example.com/blog/2026-06-28-money-weekly-2026-june-week-4/</loc></url></urlset>\n',
  );
  assertFailWith(runValidator(root), 'sitemap 에 보관 슬러그');
});

test('보관 슬러그로 가는 내부 링크가 dist HTML 에 있으면 실패한다', (t) => {
  const root = makeFixture(t);
  mkdirSync(join(root, 'dist', 'some-page'), { recursive: true });
  writeFileSync(
    join(root, 'dist', 'some-page', 'index.html'),
    '<html><body><a href="/blog/2026-07-03-productivity-apps-system-first/">old link</a></body></html>\n',
  );
  assertFailWith(runValidator(root), '내부 링크');
});

test('slash 없는 absolute 보관 링크도 dist HTML 에 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    join(root, 'dist', 'index.html'),
    '<a href="https://perust.github.io/blog/2026-07-03-reduce-procrastination-small-tasks">old</a>\n',
  );
  assertFailWith(runValidator(root), '내부 링크');
});

test('보관 슬러그가 RSS 피드에 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  writeFileSync(
    join(root, 'dist', 'rss.xml'),
    '<?xml version="1.0"?><rss><channel><item><link>https://example.com/blog/2026-07-07-ai-agent-cost-power/</link></item></channel></rss>\n',
  );
  assertFailWith(runValidator(root), 'RSS 피드');
});

test('dist/rss.xml 이 없으면 실패한다 (피드 검사를 조용히 건너뛰지 않는다)', (t) => {
  const root = makeFixture(t);
  rmSync(join(root, 'dist', 'rss.xml'));
  assertFailWith(runValidator(root), 'dist/rss.xml');
});

test('보관 글의 OG 이미지가 public/og/posts 에 복원되면 실패한다', (t) => {
  const root = makeFixture(t);
  const slug = '2026-07-08-phone-opening-identity-check';
  mkdirSync(join(root, 'public', 'og', 'posts'), { recursive: true });
  cpSync(join(root, ARCH_DIR, 'og', `${slug}.png`), join(root, 'public', 'og', 'posts', `${slug}.png`));
  assertFailWith(runValidator(root), `public/og/posts/${slug}.png 이(가) 삭제되어야 함`);
});

test('보관 글의 summary 이미지가 public/images/posts/summary 에 복원되면 실패한다', (t) => {
  const root = makeFixture(t);
  const name = '2026-07-07-ai-coding-tool-trust-claude-code-summary.svg';
  mkdirSync(join(root, 'public', 'images', 'posts', 'summary'), { recursive: true });
  cpSync(join(root, ARCH_DIR, 'images', 'summary', name), join(root, 'public', 'images', 'posts', 'summary', name));
  assertFailWith(runValidator(root), `public/images/posts/summary/${name} 이(가) 삭제되어야 함`);
});

test('보관 자산이 dist 에 그대로 복사되어 재등장하면 실패한다', (t) => {
  const root = makeFixture(t);
  const slug = '2026-07-07-gemini-image-generation-free';
  mkdirSync(join(root, 'dist', 'og', 'posts'), { recursive: true });
  cpSync(join(root, ARCH_DIR, 'og', `${slug}.png`), join(root, 'dist', 'og', 'posts', `${slug}.png`));
  assertFailWith(runValidator(root), `보관 자산 /og/posts/${slug}.png 이(가) dist 에 재등장하면 안 됨`);
});

test('보관 자산 경로를 참조하는 dist HTML 이 있으면 실패한다', (t) => {
  const root = makeFixture(t);
  mkdirSync(join(root, 'dist', 'asset-page'), { recursive: true });
  writeFileSync(
    join(root, 'dist', 'asset-page', 'index.html'),
    '<html><body><img src="/images/posts/2026-06-28-money-weekly-2026-june-week-4-01.jpg"></body></html>\n',
  );
  assertFailWith(runValidator(root), '보관 자산 경로');
});
