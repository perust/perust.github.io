// 카테고리 통합 / 태그 색인 기준 / 주제 허브(topic hub) 전용 검증 스크립트.
// check-content-quality.mjs 가 이미 다루는 "태그·카테고리 robots + sitemap 정렬"과는 별개로,
// 이 스크립트는 src/config/taxonomy.ts 를 SSOT로 삼아 아래를 검증한다:
//   1. 정식 카테고리 수 <= 8, 모든 글의 frontmatter category 가 정식 카테고리다.
//   2. 레거시 카테고리 URL마다 크롤 안전한 호환 페이지가 있고(noindex,follow + 정식 아카이브로 canonical),
//      sitemap 에는 없다.
//   3. 태그 색인 임계값(TAG_INDEX_MIN_POSTS)과 sitemap 포함 여부가 정확히 일치한다(양방향 검증).
//   4. 주제 허브 페이지마다 canonical/robots/CollectionPage+BreadcrumbList JSON-LD 가 있고,
//      sitemap 에 있으며, 블로그 인덱스에서 눈에 띄게 링크된다.
//   5. 모든 글 상세 페이지에 주제 경로(topic-path) 블록이 있고, 카테고리(+허브) 링크를 포함한다.
// 사용법: npm run build 이후 `node scripts/check-taxonomy.mjs`
// 표준 라이브러리만 사용하며, 위반이 있으면 종료 코드 1로 끝난다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  CANONICAL_CATEGORIES,
  CANONICAL_CATEGORY_NAMES,
  LEGACY_CATEGORY_MAP,
  LEGACY_COMPAT_ENTRIES,
  POST_CATEGORY_OVERRIDES,
  TOPIC_HUBS,
  TAG_INDEX_MIN_POSTS,
  canonicalCategoryFor,
  hubForCategory,
  slugify,
} from '../src/config/taxonomy.ts';

const DIST = 'dist';
const BLOG_SRC = 'src/content/blog';

const failures = [];
const fail = (message) => failures.push(message);
const report = (ok, message) => {
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${message}`);
  if (!ok) fail(message);
};

if (!existsSync(DIST)) {
  console.error('[check-taxonomy] dist 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
const toPosix = (p) => p.split(sep).join('/');
const robotsContent = (html) =>
  html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ?? '';
const normalizedRobots = (html) => robotsContent(html).toLowerCase().replace(/\s+/g, ' ').trim();
const canonicalHref = (html) =>
  html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)?.[1] ?? '';
const jsonLdTypes = (html) => {
  const types = [];
  for (const [, raw] of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      types.push(JSON.parse(raw)['@type']);
    } catch {
      types.push('INVALID-JSON');
    }
  }
  return types;
};

const allHtml = htmlFiles(DIST).sort();
const srcFiles = existsSync(BLOG_SRC) ? readdirSync(BLOG_SRC).filter((f) => f.endsWith('.md')) : [];

// --- 1. 정식 카테고리 개수 <= 8, 모든 글이 정식 카테고리를 쓴다 ---
report(CANONICAL_CATEGORIES.length <= 8, `정식 카테고리 수는 8개 이하여야 함 (현재 ${CANONICAL_CATEGORIES.length}개: ${CANONICAL_CATEGORIES.map((c) => c.name).join(', ')})`);

// 통합 직전(83개 글, HEAD^^) Git 이력에서 실제 확인한 19개 라벨이다.
// 현재 공개 소스에서 글이 보관되어 사라진 라벨도 과거 URL 호환을 위해 계속 매핑해야 한다.
const historicalCategoryLabels = [
  'AI', 'AI Weekly', 'Automation', 'Book Review', 'Build Note', 'Content Strategy',
  'Economy', 'Finance', 'Food', 'Life', 'Maker Log', 'Money', 'Money Weekly',
  'Product', 'Retrospective', 'Tech', 'Travel', '금융', '생활',
];
const missingHistoricalLabels = historicalCategoryLabels.filter((label) => !LEGACY_CATEGORY_MAP[label]);
report(
  missingHistoricalLabels.length === 0,
  `통합 직전 83개 글에서 확인된 역사 카테고리 19개가 모두 매핑되어야 함 (누락: ${missingHistoricalLabels.join(', ') || '없음'})`,
);

let categoryDrift = 0;
const categoryCountBySlug = new Map();
const tagCountBySlug = new Map();
for (const file of srcFiles) {
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const category = block.match(/^category:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!category) {
    fail(`${file} 에 category frontmatter 가 없음`);
    continue;
  }
  if (!CANONICAL_CATEGORY_NAMES.has(category)) {
    categoryDrift += 1;
    console.log(`[FAIL] ${file}: category "${category}" 는 정식 카테고리가 아님 (${canonicalCategoryFor(category)} 로 매핑되어야 함)`);
  }
  const postSlug = file.replace(/\.md$/, '');
  const expectedOverride = POST_CATEGORY_OVERRIDES[postSlug];
  if (expectedOverride && category !== expectedOverride) {
    categoryDrift += 1;
    console.log(`[FAIL] ${file}: 결정론적 개별 분류는 "${expectedOverride}" 이어야 함 (현재 "${category}")`);
  }
  const key = slugify(category);
  categoryCountBySlug.set(key, (categoryCountBySlug.get(key) || 0) + 1);

  const tagsLine = block.match(/^tags:\s*(\[.*\])\s*$/m)?.[1];
  if (tagsLine) {
    try {
      for (const tag of JSON.parse(tagsLine)) {
        const tagKey = slugify(tag);
        tagCountBySlug.set(tagKey, (tagCountBySlug.get(tagKey) || 0) + 1);
      }
    } catch {
      // 무시
    }
  }
}
report(categoryDrift === 0, `모든 글의 frontmatter category 가 정식 카테고리여야 함 (위반 ${categoryDrift}건)`);

// 허브에 직접 큐레이션한 대표 글은 실제 공개 소스에 존재해야 한다.
// 페이지 구현은 없는 슬러그를 filter(Boolean)로 숨기므로, 이 독립 검사가 없으면 조용히 링크가 사라질 수 있다.
const sourceSlugs = new Set(srcFiles.map((file) => file.replace(/\.md$/, '')));
const missingCuratedSlugs = [];
for (const hub of TOPIC_HUBS) {
  for (const subtopic of hub.subtopics) {
    for (const slug of subtopic.slugs) {
      if (!sourceSlugs.has(slug)) missingCuratedSlugs.push(`${hub.title} > ${subtopic.label}: ${slug}`);
    }
  }
}
report(
  missingCuratedSlugs.length === 0,
  `주제 허브의 큐레이션 대표 글 슬러그가 모두 공개 소스에 있어야 함 (누락: ${missingCuratedSlugs.join(', ') || '없음'})`,
);

// --- 2. 레거시 카테고리 호환 페이지 ---
const sitemapFiles = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const sitemapUrls = sitemapFiles.length
  ? [...sitemapFiles.map((f) => readFileSync(join(DIST, f), 'utf8')).join('\n').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u)
  : [];
report(sitemapUrls.length > 0, 'sitemap-*.xml 에서 URL 을 읽을 수 있어야 함');

for (const entry of LEGACY_COMPAT_ENTRIES) {
  const distPath = join(DIST, 'blog', 'category', entry.legacySlug, 'index.html');
  if (!existsSync(distPath)) {
    report(false, `레거시 카테고리 호환 페이지 누락: /blog/category/${entry.legacySlug}/ (→ ${entry.canonical.name})`);
    continue;
  }
  const html = readFileSync(distPath, 'utf8');
  report(
    normalizedRobots(html) === 'noindex, follow',
    `레거시 호환 페이지 /blog/category/${entry.legacySlug}/ 는 robots="noindex, follow" 여야 함 (현재 "${robotsContent(html)}")`,
  );
  const expectedCanonical = `https://perust.github.io/blog/category/${encodeURIComponent(entry.canonical.slug)}/`;
  report(
    canonicalHref(html) === expectedCanonical,
    `레거시 호환 페이지 /blog/category/${entry.legacySlug}/ 의 canonical 이 정식 아카이브(${expectedCanonical})를 가리켜야 함 (현재 "${canonicalHref(html)}")`,
  );
  const types = jsonLdTypes(html);
  report(
    types.includes('CollectionPage') && types.includes('BreadcrumbList'),
    `레거시 호환 페이지 /blog/category/${entry.legacySlug}/ 에 CollectionPage+BreadcrumbList JSON-LD 가 있어야 함 (현재 [${types.join(', ')}])`,
  );
  const inSitemap = sitemapUrls.some((url) => url.includes(`/blog/category/${entry.legacySlug}/`));
  report(!inSitemap, `레거시 호환 페이지 /blog/category/${entry.legacySlug}/ 는 sitemap 에 없어야 함`);
}

// --- 3. 태그 색인 임계값과 sitemap 포함 여부 양방향 검증 ---
const tagPageBySlug = new Map();
for (const file of allHtml) {
  const rel = toPosix(relative(DIST, file));
  const m = rel.match(/^blog\/tag\/([^/]+)\/index\.html$/);
  if (m) tagPageBySlug.set(decodeURIComponent(m[1]), file);
}
let tagAlignmentFailures = 0;
for (const [slug, count] of tagCountBySlug.entries()) {
  const file = tagPageBySlug.get(slug);
  if (!file) {
    tagAlignmentFailures += 1;
    console.log(`[FAIL] 태그 ${slug} (글 ${count}개): 빌드된 태그 페이지가 없음`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const shouldIndex = count >= TAG_INDEX_MIN_POSTS;
  const isIndexed = normalizedRobots(html) === 'index, follow';
  const inSitemap = sitemapUrls.some((url) => url.includes(`/blog/tag/${encodeURIComponent(slug)}/`));
  const expectedCanonical = `https://perust.github.io/blog/tag/${encodeURIComponent(slug)}/`;
  const hasSafeCanonical = canonicalHref(html) === expectedCanonical;
  if (isIndexed !== shouldIndex || inSitemap !== shouldIndex || !hasSafeCanonical) {
    tagAlignmentFailures += 1;
    console.log(
      `[FAIL] 태그 ${slug} (글 ${count}개): robots=${isIndexed ? 'index' : 'noindex'}, sitemap=${inSitemap}, canonical=${canonicalHref(html)}, 기대값=${shouldIndex ? 'index+sitemap' : 'noindex+제외'} + self-canonical`,
    );
  }
}
report(tagAlignmentFailures === 0, `태그 robots/sitemap 임계값(${TAG_INDEX_MIN_POSTS}) 정렬 위반 ${tagAlignmentFailures}건`);

// --- 4. 주제 허브 메타데이터/스키마/색인/블로그 인덱스 링크 ---
const blogIndexHtml = existsSync(join(DIST, 'blog', 'index.html')) ? readFileSync(join(DIST, 'blog', 'index.html'), 'utf8') : '';
report(blogIndexHtml !== '', 'dist/blog/index.html 이 있어야 함');

for (const hub of TOPIC_HUBS) {
  const distPath = join(DIST, 'blog', 'topic', hub.slug, 'index.html');
  if (!existsSync(distPath)) {
    report(false, `주제 허브 페이지 누락: /blog/topic/${hub.slug}/`);
    continue;
  }
  const html = readFileSync(distPath, 'utf8');
  report(normalizedRobots(html) === 'index, follow', `주제 허브 /blog/topic/${hub.slug}/ 는 robots="index, follow" 여야 함 (현재 "${robotsContent(html)}")`);
  const expectedCanonical = `https://perust.github.io/blog/topic/${encodeURIComponent(hub.slug)}/`;
  report(canonicalHref(html) === expectedCanonical, `주제 허브 /blog/topic/${hub.slug}/ 의 canonical 이 자기 자신이어야 함 (현재 "${canonicalHref(html)}")`);
  const types = jsonLdTypes(html);
  report(
    types.includes('CollectionPage') && types.includes('BreadcrumbList'),
    `주제 허브 /blog/topic/${hub.slug}/ 에 CollectionPage+BreadcrumbList JSON-LD 가 있어야 함 (현재 [${types.join(', ')}])`,
  );
  const inSitemap = sitemapUrls.some((url) => url.includes(`/blog/topic/${encodeURIComponent(hub.slug)}/`));
  report(inSitemap, `주제 허브 /blog/topic/${hub.slug}/ 는 sitemap 에 있어야 함`);
  report(
    blogIndexHtml.includes(`href="/blog/topic/${hub.slug}/"`),
    `블로그 인덱스(/blog/)에서 주제 허브 /blog/topic/${hub.slug}/ 로 가는 링크가 보여야 함`,
  );
}

// --- 5. 모든 글 상세에 주제 경로(topic-path) 블록과 카테고리(+허브) 링크 ---
let postsChecked = 0;
let missingTopicPath = 0;
let missingCategoryLink = 0;
let missingHubLink = 0;
for (const file of srcFiles) {
  const slug = file.replace(/\.md$/, '');
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const rawCategory = block.match(/^category:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!rawCategory) continue;
  const category = canonicalCategoryFor(rawCategory);
  const categorySlug = slugify(category);
  const hub = hubForCategory(category);

  const distPath = join(DIST, 'blog', slug, 'index.html');
  if (!existsSync(distPath)) {
    fail(`글 ${slug} 의 빌드 결과(/blog/${slug}/)가 없음`);
    continue;
  }
  postsChecked += 1;
  const html = readFileSync(distPath, 'utf8');
  if (!html.includes('class="topic-path"')) {
    missingTopicPath += 1;
    if (missingTopicPath <= 3) console.log(`[FAIL] /blog/${slug}/ 에 topic-path 블록이 없음`);
    continue;
  }
  const topicPathBlock = html.match(/<nav class="topic-path"[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
  // href 는 Astro가 원문 유니코드 그대로 출력한다(canonical/JSON-LD의 절대 URL과 달리 percent-encoding 안 됨).
  if (!topicPathBlock.includes(`href="/blog/category/${categorySlug}/"`)) {
    missingCategoryLink += 1;
    if (missingCategoryLink <= 3) console.log(`[FAIL] /blog/${slug}/ 의 topic-path 블록에 카테고리(${category}) 링크가 없음`);
  }
  if (hub && !topicPathBlock.includes(`href="/blog/topic/${hub.slug}/"`)) {
    missingHubLink += 1;
    if (missingHubLink <= 3) console.log(`[FAIL] /blog/${slug}/ 의 topic-path 블록에 허브(${hub.title}) 링크가 없음`);
  }
}
report(postsChecked > 0, `블로그 글 상세 페이지가 존재해야 함 (확인 ${postsChecked}개)`);
if (missingTopicPath) fail(`글 ${missingTopicPath}개에 topic-path 블록이 없음`);
if (missingCategoryLink) fail(`글 ${missingCategoryLink}개의 topic-path 블록에 카테고리 링크가 없음`);
if (missingHubLink) fail(`글 ${missingHubLink}개의 topic-path 블록에 허브 링크가 없음`);

console.log(`\n[check-taxonomy] 위반 ${failures.length}건`);
process.exit(failures.length ? 1 : 0);
