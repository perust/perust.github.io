// 발행 정책 프로덕션 검증기 — 2차 큐레이션 보관 무결성 + Git 신규 글 게이트.
// 사용법: npm run build 이후 `node scripts/check-publish-policy.mjs`
// (verify:site 와 CI 배포 게이트에 포함된다. 표준 라이브러리만 사용, 위반 시 종료 코드 1.)
//
// 환경변수:
//  - CHECK_ROOT: 검사할 저장소 루트(기본 process.cwd()). fixture 테스트가 임시 저장소를 넘긴다.
//  - POLICY_GIT_BASELINE: 명시 시 신규 글 판정 기준 커밋. nonempty invalid/all-zero/unreachable은 fail-closed.
//  - POLICY_REQUIRE_COMMITTED_DIFF=true: CI 모드. nonempty baseline 필수이며 baseline==HEAD도 실패한다.
//
// 검사 항목:
//  1. 보관 매니페스트(second-curation-manifest.json, SSOT)가 존재하고 구조가 유효하다.
//  2. 매니페스트의 모든 보관 파일이 존재하고 Git 추적 가능(tracked 또는 untracked-비무시)하며
//     sha256 이 매니페스트와 일치한다(변조 감지). 원본 공개 경로는 삭제되어 있다.
//  3. 매니페스트 슬러그가 소스(src/content/blog)·dist·sitemap·내부 링크 어디에도 재등장하지 않는다.
//     보관 자산의 공개 URL 경로도 dist HTML 에서 참조되지 않는다. (동등 대체 URL 이 없는 글이므로
//     redirect 없이 GitHub Pages 일반 404 로 남기는 것이 정책이다.)
//  4. Git 기준 새로 추가된 글은 date 가 기준일(2026-07-21) 이전이어도(backdate)
//     editorialReview: true, 유효한 valueType, 통제 태그 1~5개, 본문 최소 분량을 만족해야 한다.
//     신규 글 중 date 가 기준일 당일(포함) 이후인 글은 날짜별 하루 1편 상한을 넘을 수 없다
//     (기존 파일은 grandfathering — 신규 파일 집합만 센다).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  CONTROLLED_TAG_SLUGS,
  MAX_NEW_POSTS_PER_DAY,
  MIN_POST_BODY_CHARS,
  NEW_POST_MAX_TAGS,
  NEW_POST_POLICY_BASELINE,
  VALUE_TYPES,
  postDayOf,
  slugify,
} from '../src/config/taxonomy.ts';
import { detectNewPostFiles, gitTrackableState } from './lib/git-policy.mjs';
import {
  SECOND_CURATION_MANIFEST_RELPATH,
  loadSecondCurationManifest,
  manifestFiles,
  manifestSlugs,
} from './lib/second-curation-manifest.mjs';
import { LEGACY_PREFIXES, htmlFiles, toPosix } from './lib/site-scan.mjs';

const ROOT = resolve(process.env.CHECK_ROOT ?? process.cwd());
const DIST = join(ROOT, 'dist');
const BLOG_SRC = join(ROOT, 'src', 'content', 'blog');

const failures = [];
const fail = (message) => failures.push(message);
const report = (ok, message) => {
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${message}`);
  if (!ok) fail(message);
};

if (!existsSync(DIST)) {
  console.error('[check-publish-policy] dist 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

// --- 1. immutable policy anchor와 보관 선언 매니페스트 존재/구조 ---
let manifest = null;
report(existsSync(join(ROOT, SECOND_CURATION_MANIFEST_RELPATH)), `${SECOND_CURATION_MANIFEST_RELPATH} (보관 선언 사본) 이 존재해야 함`);
try {
  manifest = loadSecondCurationManifest(ROOT);
  report(true, `매니페스트 구조 유효 (글 ${manifest.posts.length}편, 파일 ${manifestFiles(manifest).length}개)`);
} catch (error) {
  report(false, error.message);
}

if (manifest) {
  // --- 2. 보관 파일: 존재 + Git 추적 가능 + 체크섬(변조 감지), 원본 공개 경로 삭제 ---
  for (const file of manifestFiles(manifest)) {
    const trackable = gitTrackableState(ROOT, file.archivePath);
    if (!trackable.ok) {
      report(
        false,
        trackable.state === 'missing'
          ? `보관 파일 ${file.archivePath} 이(가) 존재해야 함`
          : `보관 파일 ${file.archivePath} 이(가) .gitignore 에 막혀 Git 추적 불가 상태임`,
      );
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(join(ROOT, file.archivePath))).digest('hex');
    report(
      actual === file.sha256,
      `보관 파일 ${file.archivePath} 의 sha256 이 매니페스트(HEAD 원본)와 일치해야 함 (추적 상태: ${trackable.state})${actual === file.sha256 ? '' : ` — 변조 의심: ${actual}`}`,
    );
    report(!existsSync(join(ROOT, file.publicPath)), `원본 공개 경로 ${file.publicPath} 이(가) 삭제되어야 함`);
  }

  // --- 3. 보관 슬러그·자산의 재등장 차단 (source / dist / sitemap / 내부 링크) ---
  const slugs = manifestSlugs(manifest);
  for (const slug of slugs) {
    report(!existsSync(join(BLOG_SRC, `${slug}.md`)), `보관 슬러그 ${slug} 이(가) src/content/blog 에 재등장하면 안 됨`);
    report(!existsSync(join(DIST, 'blog', slug, 'index.html')), `보관 슬러그 ${slug} 이(가) dist/blog 에 재등장하면 안 됨`);
  }
  // 공개 자산(public/…)은 dist 에 같은 경로(public/ 제거)로 복사되므로 dist 쪽 잔존도 함께 본다.
  const assetUrlPaths = [];
  for (const file of manifestFiles(manifest)) {
    if (!file.publicPath.startsWith('public/')) continue;
    const urlPath = `/${file.publicPath.slice('public/'.length)}`;
    assetUrlPaths.push(urlPath);
    report(!existsSync(join(DIST, ...urlPath.slice(1).split('/'))), `보관 자산 ${urlPath} 이(가) dist 에 재등장하면 안 됨`);
  }

  const sitemapFiles = readdirSync(DIST).filter((name) => /^sitemap-\d+\.xml$/.test(name));
  report(sitemapFiles.length > 0, 'sitemap-*.xml 이 dist 에 있어야 함');
  if (sitemapFiles.length) {
    const sitemap = sitemapFiles.map((name) => readFileSync(join(DIST, name), 'utf8')).join('\n');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
    const reappeared = urls.filter((url) => slugs.some((slug) => url.includes(`/blog/${slug}/`)));
    report(reappeared.length === 0, `sitemap 에 보관 슬러그 URL 이 없어야 함 (발견: ${reappeared.join(', ') || '없음'})`);
  }

  const linkHits = [];
  const assetHits = [];
  for (const file of htmlFiles(DIST)) {
    const rel = toPosix(relative(DIST, file));
    if (LEGACY_PREFIXES.some((prefix) => rel.startsWith(prefix))) continue;
    const html = readFileSync(file, 'utf8');
    for (const slug of slugs) {
      if (html.includes(`/blog/${slug}`)) linkHits.push(`${rel} → /blog/${slug}`);
    }
    for (const urlPath of assetUrlPaths) {
      if (html.includes(urlPath)) assetHits.push(`${rel} → ${urlPath}`);
    }
  }
  report(
    linkHits.length === 0,
    `보관 슬러그로 가는 내부 링크가 없어야 함 (발견: ${linkHits.slice(0, 5).join(', ') || '없음'}${linkHits.length > 5 ? ` 외 ${linkHits.length - 5}건` : ''})`,
  );
  report(
    assetHits.length === 0,
    `보관 자산 경로를 참조하는 HTML 이 없어야 함 (발견: ${assetHits.slice(0, 5).join(', ') || '없음'}${assetHits.length > 5 ? ` 외 ${assetHits.length - 5}건` : ''})`,
  );
}

// --- 4. Git 신규 글 게이트 (backdate 우회 방지) ---
const currentFiles = existsSync(BLOG_SRC)
  ? readdirSync(BLOG_SRC).filter((name) => name.endsWith('.md'))
  : [];
const detection = detectNewPostFiles(ROOT, currentFiles);
const { baseline, newFiles } = detection;
for (const warning of baseline.warnings) console.log(`[warn] ${warning}`);
for (const error of baseline.errors) console.log(`[FAIL] ${error}`);
console.log(`[info] 신규 글 기준선: ${baseline.ref ?? '없음'} (${baseline.source}) — 신규 글 ${newFiles.length}편`);
report(
  detection.ok && baseline.ref !== null,
  'Git 기준선과 postsAtRef를 완전히 해석해 신규 글을 감지할 수 있어야 함 (명시 baseline 실패는 fallback 금지)',
);

const newPostsByDay = new Map();
for (const file of newFiles) {
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = frontmatter?.[1] ?? '';

  const date = block.match(/^date:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  let day = null;
  if (!date) {
    report(false, `신규 글 ${file}: date frontmatter 가 있어야 함`);
  } else {
    try {
      day = postDayOf(date);
    } catch (error) {
      report(false, `신규 글 ${file}: ${error.message}`);
    }
  }
  if (day !== null && day >= NEW_POST_POLICY_BASELINE) {
    newPostsByDay.set(day, (newPostsByDay.get(day) || 0) + 1);
  }

  report(
    /^editorialReview:\s*true\s*$/m.test(block),
    `신규 글 ${file}: date(${day ?? '?'}) 와 무관하게 editorialReview: true (사람 편집 검토 완료)를 명시해야 함`,
  );
  const valueType = block.match(/^valueType:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  report(
    Boolean(valueType) && VALUE_TYPES.includes(valueType),
    `신규 글 ${file}: valueType 이 ${VALUE_TYPES.join(' | ')} 중 하나여야 함 (현재 "${valueType ?? '없음'}")`,
  );

  const tagsLine = block.match(/^tags:\s*(\[.*\])\s*$/m)?.[1];
  let tags = null;
  if (tagsLine) {
    try {
      const parsed = JSON.parse(tagsLine);
      if (Array.isArray(parsed) && parsed.every((tag) => typeof tag === 'string')) tags = parsed;
    } catch {
      // tags = null 로 남겨 아래에서 실패 처리한다.
    }
  }
  report(
    tags !== null && tags.length >= 1 && tags.length <= NEW_POST_MAX_TAGS,
    `신규 글 ${file}: 통제 태그를 1~${NEW_POST_MAX_TAGS}개 명시해야 함 (현재 ${tags === null ? 'tags 없음/파싱 불가' : `${tags.length}개`})`,
  );
  const outside = (tags ?? []).filter((tag) => !CONTROLLED_TAG_SLUGS.has(slugify(tag)));
  report(
    outside.length === 0,
    `신규 글 ${file}: 통제 어휘(CONTROLLED_TAGS) 밖의 태그가 없어야 함 (발견: ${outside.join(', ') || '없음'})`,
  );

  const body = frontmatter ? raw.slice(frontmatter[0].length) : raw;
  const bodyChars = body.replace(/\s+/g, '').length;
  report(
    bodyChars >= MIN_POST_BODY_CHARS,
    `신규 글 ${file}: 본문이 최소 ${MIN_POST_BODY_CHARS}자(공백 제외) 이상이어야 함 (현재 ${bodyChars}자)`,
  );
}

const overPacedDays = [...newPostsByDay.entries()]
  .filter(([, count]) => count > MAX_NEW_POSTS_PER_DAY)
  .map(([day, count]) => `${day}: ${count}편`);
report(
  overPacedDays.length === 0,
  `신규 글 중 date 가 기준일(${NEW_POST_POLICY_BASELINE}, 당일 포함) 이후인 글은 하루 최대 ${MAX_NEW_POSTS_PER_DAY}편이어야 함 (위반: ${overPacedDays.join(', ') || '없음'})`,
);

console.log(`\n[check-publish-policy] 위반 ${failures.length}건`);
process.exit(failures.length ? 1 : 0);
