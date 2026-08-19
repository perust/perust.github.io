// 카테고리 통합 / 태그 색인 기준 / 주제 허브(topic hub) 전용 검증 스크립트.
// check-content-quality.mjs 가 이미 다루는 "태그·카테고리 robots + sitemap 정렬"과는 별개로,
// 이 스크립트는 src/config/taxonomy.ts 를 SSOT로 삼아 아래를 검증한다:
//   1. 정식 카테고리 이름·순서가 약속한 5개와 일치하고, 모든 글의 frontmatter category 가 정식 카테고리다.
//   2. 레거시 카테고리 URL마다 크롤 안전한 호환 페이지가 있고(noindex,follow + 정식 아카이브로 canonical),
//      sitemap 에는 없다.
//   3. 태그 색인 판정(isIndexableTag: INDEXABLE_TAGS allowlist + TAG_INDEX_MIN_POSTS)과
//      robots/sitemap 포함 여부가 정확히 일치한다(양방향 검증).
//   4. 주제 허브 페이지마다 canonical/robots/CollectionPage+BreadcrumbList JSON-LD 가 있고,
//      sitemap 에 있으며, 블로그 인덱스에서 눈에 띄게 링크된다.
//   5. 글 상세에는 내부용 주제 경로 UI를 노출하지 않되, 상단 카테고리 링크와 BreadcrumbList JSON-LD는 유지한다.
// 사용법: npm run build 이후 `node scripts/check-taxonomy.mjs`
// 표준 라이브러리만 사용하며, 위반이 있으면 종료 코드 1로 끝난다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  CANONICAL_CATEGORIES,
  CANONICAL_CATEGORY_NAMES,
  CONTROLLED_TAGS,
  CONTROLLED_TAG_SLUGS,
  FEATURED_MAKER_SLUGS,
  LEGACY_CATEGORY_MAP,
  LEGACY_COMPAT_ENTRIES,
  NEW_POST_MAX_TAGS,
  NEW_POST_POLICY_BASELINE,
  POST_CATEGORY_OVERRIDES,
  TOPIC_HUBS,
  TAG_INDEX_MIN_POSTS,
  canonicalCategoryFor,
  isIndexableTag,
  postDayOf,
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

// --- 1. 정식 카테고리는 독자에게 약속한 5개와 정확히 일치하고, 모든 글이 그중 하나를 쓴다 ---
const expectedCanonicalCategoryNames = [
  '책 서평',
  '미리 알아보는 책 정보',
  '도서 학습 챌린지',
  'AI/IT 정보',
  '경제 정보',
];
const actualCanonicalCategoryNames = CANONICAL_CATEGORIES.map((category) => category.name);
report(
  JSON.stringify(actualCanonicalCategoryNames) === JSON.stringify(expectedCanonicalCategoryNames),
  `정식 카테고리 이름·순서는 약속한 5개와 정확히 일치해야 함 (현재 ${actualCanonicalCategoryNames.length}개: ${actualCanonicalCategoryNames.join(', ')})`,
);

// 전체 Git 이력에서 실제 확인한 역사 라벨 25개 — 최초 라벨 20개와,
// 1차 통합(2026-07)의 정식 카테고리였다가 2차 개편(2026-07-22)으로 레거시가 된 6개 중
// 슬러그가 겹치지 않는 5개('AI' 는 최초 라벨과 동일 표기)를 합친 것이다.
// 새 정식 카테고리 5개와 슬러그가 전부 다르므로 25개 모두 레거시 호환 페이지 대상이다.
const historicalCategoryLabels = [
  'AI', 'AI Weekly', 'Automation', 'Book Review', 'Build Note', 'Content Strategy', 'Science',
  'Economy', 'Finance', 'Food', 'Life', 'Maker Log', 'Money', 'Money Weekly',
  'Product', 'Retrospective', 'Tech', 'Travel', '금융', '생활',
  '생활금융·경제', '자동화·만들기', '서평', '회고', '일상',
];
const missingHistoricalLabels = historicalCategoryLabels.filter((label) => !LEGACY_CATEGORY_MAP[label]);
report(
  missingHistoricalLabels.length === 0,
  `전체 Git 이력에서 확인된 역사 카테고리 ${historicalCategoryLabels.length}개가 모두 매핑되어야 함 (누락: ${missingHistoricalLabels.join(', ') || '없음'})`,
);
// 역사 라벨은 하나도 새 정식 슬러그와 겹치지 않아야 호환 페이지가 전부 생성된다(양방향 고정).
const overlappingHistoricalLabels = historicalCategoryLabels.filter((label) =>
  CANONICAL_CATEGORIES.some((category) => category.slug === slugify(label)),
);
report(
  overlappingHistoricalLabels.length === 0,
  `역사 카테고리 라벨의 슬러그가 새 정식 카테고리 슬러그와 겹치지 않아야 함 (겹침: ${overlappingHistoricalLabels.join(', ') || '없음'})`,
);
report(
  LEGACY_COMPAT_ENTRIES.length === historicalCategoryLabels.length,
  `레거시 호환 페이지 대상은 역사 라벨 ${historicalCategoryLabels.length}개 전부여야 함 (현재 ${LEGACY_COMPAT_ENTRIES.length}개)`,
);

let categoryDrift = 0;
const categoryCountBySlug = new Map();
const postSlugsByCategory = new Map(CANONICAL_CATEGORIES.map((category) => [category.name, []]));
const tagCountBySlug = new Map();
const postTagInfo = []; // { file, day, tags } — 기준일 이후 글의 통제 태그 검증에 쓴다.
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
  if (CANONICAL_CATEGORY_NAMES.has(category)) postSlugsByCategory.get(category).push(postSlug);

  const hasTags = /^tags:/m.test(block);
  const tagsLine = block.match(/^tags:\s*(\[.*\])\s*$/m)?.[1];
  let tags = null; // null = tags frontmatter 없음(또는 파싱 실패) — 기준일 이후 글은 아래에서 실패 처리된다.
  if (hasTags && !tagsLine) {
    fail(`${file}: tags 는 단일행 JSON 배열 형식이어야 함`);
  } else if (tagsLine) {
    try {
      const parsed = JSON.parse(tagsLine);
      if (!Array.isArray(parsed) || parsed.some((tag) => typeof tag !== 'string')) throw new TypeError('문자열 배열이 아님');
      tags = parsed;
      for (const tag of tags) {
        const tagKey = slugify(tag);
        tagCountBySlug.set(tagKey, (tagCountBySlug.get(tagKey) || 0) + 1);
      }
    } catch (error) {
      fail(`${file}: tags 파싱 실패 (${error.message})`);
    }
  }
  const date = block.match(/^date:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (date) {
    try {
      postTagInfo.push({ file, day: postDayOf(date), tags });
    } catch {
      // 잘못된 date 형식은 check-content-quality 가 별도로 실패시킨다.
    }
  }
}
report(categoryDrift === 0, `모든 글의 frontmatter category 가 정식 카테고리여야 함 (위반 ${categoryDrift}건)`);

// --- 통제 태그 어휘: 기준일 이후 새 글은 CONTROLLED_TAGS 안에서만 태그를 고른다 ---
// (기준일 이전 글과 그 태그 URL 은 grandfathering — 여기서 검사하지 않는다.)
const controlledDuplicates = CONTROLLED_TAGS.filter(
  (tag, index) => CONTROLLED_TAGS.findIndex((other) => slugify(other) === slugify(tag)) !== index,
);
report(
  controlledDuplicates.length === 0,
  `CONTROLLED_TAGS 에 슬러그가 중복되는 태그가 없어야 함 (중복: ${controlledDuplicates.join(', ') || '없음'})`,
);
let uncontrolledTagFailures = 0;
for (const { file, day, tags } of postTagInfo) {
  if (day <= NEW_POST_POLICY_BASELINE) continue;
  if (tags === null || tags.length < 1 || tags.length > NEW_POST_MAX_TAGS) {
    uncontrolledTagFailures += 1;
    console.log(
      `[FAIL] ${file}: 기준일 이후 새 글은 tags 를 생략하거나 비울 수 없고 통제 태그 1~${NEW_POST_MAX_TAGS}개를 명시해야 함 (현재 ${tags === null ? 'tags 없음' : `${tags.length}개`})`,
    );
  }
  const outside = (tags ?? []).filter((tag) => !CONTROLLED_TAG_SLUGS.has(slugify(tag)));
  if (outside.length) {
    uncontrolledTagFailures += 1;
    console.log(
      `[FAIL] ${file}: 통제 어휘에 없는 태그 [${outside.join(', ')}] — 새 태그가 필요하면 src/config/taxonomy.ts 의 CONTROLLED_TAGS 에 먼저 추가하세요`,
    );
  }
}
report(
  uncontrolledTagFailures === 0,
  `기준일(${NEW_POST_POLICY_BASELINE}) 이후 새 글은 통제 태그 어휘만 사용해야 함 (위반 ${uncontrolledTagFailures}건)`,
);

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
  const expectedLegacyPath = `/blog/category/${entry.legacySlug}/`;
  const inSitemap = sitemapUrls.some((url) => decodeURIComponent(new URL(url).pathname) === expectedLegacyPath);
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
  const shouldIndex = isIndexableTag(slug, count);
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
report(
  tagAlignmentFailures === 0,
  `태그 robots/sitemap 이 색인 판정(isIndexableTag: allowlist + 글 ${TAG_INDEX_MIN_POSTS}개 이상)과 정렬되어야 함 (위반 ${tagAlignmentFailures}건)`,
);

// --- 4. 주제 허브 메타데이터/스키마/색인/블로그 인덱스 링크 ---
const blogIndexHtml = existsSync(join(DIST, 'blog', 'index.html')) ? readFileSync(join(DIST, 'blog', 'index.html'), 'utf8') : '';
report(blogIndexHtml !== '', 'dist/blog/index.html 이 있어야 함');

// 독자가 블로그 UI에서 5개 분류를 모두 선택할 수 있어야 하고, 각 아카이브는 그 분류의 글만 보여야 한다.
for (const category of CANONICAL_CATEGORIES) {
  const archivePath = `/blog/category/${category.slug}/`;
  report(
    blogIndexHtml.includes(`href="${archivePath}"`) && blogIndexHtml.includes(`<span>${category.name}</span>`),
    `블로그 인덱스에 정식 카테고리 "${category.name}" 링크(${archivePath})가 보여야 함`,
  );

  const distPath = join(DIST, 'blog', 'category', category.slug, 'index.html');
  if (!existsSync(distPath)) {
    report(false, `정식 카테고리 아카이브 누락: ${archivePath}`);
    continue;
  }
  const html = readFileSync(distPath, 'utf8');
  const renderedSlugs = [...html.matchAll(/<a class="post-list-item" href="\/blog\/([^/"]+)\/">/g)].map((match) => match[1]);
  const expectedSlugs = postSlugsByCategory.get(category.name) ?? [];
  const renderedSet = new Set(renderedSlugs);
  const missing = expectedSlugs.filter((slug) => !renderedSet.has(slug));
  const extra = renderedSlugs.filter((slug) => !expectedSlugs.includes(slug));
  report(
    renderedSlugs.length === expectedSlugs.length && missing.length === 0 && extra.length === 0,
    `정식 카테고리 "${category.name}" 아카이브는 해당 글 ${expectedSlugs.length}편만 보여야 함 (현재 ${renderedSlugs.length}편 / 누락: ${missing.join(', ') || '없음'} / 초과: ${extra.join(', ') || '없음'})`,
  );
}

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

  // 허브는 수동 큐레이션 글만 중복 없이 나열해야 하고(카테고리 전체 글 목록 금지),
  // CollectionPage 의 ItemList 도 정확히 그 큐레이션 글만 담아야 한다.
  const expectedCuratedSlugs = [];
  const seenCurated = new Set();
  for (const subtopic of hub.subtopics) {
    for (const slug of subtopic.slugs) {
      if (sourceSlugs.has(slug) && !seenCurated.has(slug)) {
        seenCurated.add(slug);
        expectedCuratedSlugs.push(slug);
      }
    }
  }
  const renderedSlugs = [...html.matchAll(/<ul class="hub-subtopic-list">[\s\S]*?<\/ul>/g)]
    .flatMap(([block]) => [...block.matchAll(/href="\/blog\/([^/"]+)\/"/g)].map((m) => m[1]));
  const duplicatedSlugs = renderedSlugs.filter((slug, index) => renderedSlugs.indexOf(slug) !== index);
  const renderedSet = new Set(renderedSlugs);
  const missingRendered = expectedCuratedSlugs.filter((slug) => !renderedSet.has(slug));
  const extraRendered = renderedSlugs.filter((slug) => !expectedCuratedSlugs.includes(slug));
  report(
    duplicatedSlugs.length === 0 && missingRendered.length === 0 && extraRendered.length === 0,
    `주제 허브 /blog/topic/${hub.slug}/ 는 큐레이션 글 ${expectedCuratedSlugs.length}편만 중복 없이 나열해야 함 (중복: ${duplicatedSlugs.join(', ') || '없음'} / 누락: ${missingRendered.join(', ') || '없음'} / 초과: ${extraRendered.join(', ') || '없음'})`,
  );
  let itemListPaths = null;
  for (const [, rawLd] of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(rawLd);
      if (data['@type'] === 'CollectionPage' && data.mainEntity?.['@type'] === 'ItemList') {
        itemListPaths = (data.mainEntity.itemListElement ?? []).map((item) => decodeURIComponent(new URL(item.url).pathname));
      }
    } catch {
      // JSON 파싱 실패는 위 jsonLdTypes 검사가 INVALID-JSON 으로 잡는다.
    }
  }
  const expectedPaths = expectedCuratedSlugs.map((slug) => `/blog/${slug}/`);
  report(
    itemListPaths !== null &&
      itemListPaths.length === expectedPaths.length &&
      expectedPaths.every((path, index) => itemListPaths[index] === path),
    `주제 허브 /blog/topic/${hub.slug}/ 의 ItemList 는 큐레이션 글 ${expectedPaths.length}편만 담아야 함 (현재 ${itemListPaths ? `${itemListPaths.length}편` : 'ItemList 없음'})`,
  );
}

// --- 홈 큐레이션(FEATURED_MAKER_SLUGS) ---
// 큐레이션 슬러그가 실제 공개 글이어야 하고(페이지 구현은 없는 슬러그를 filter(Boolean)로 조용히
// 숨기므로 독립 검사가 필요), 홈에서 눈에 띄게 링크되어야 한다.
const homeHtml = existsSync(join(DIST, 'index.html')) ? readFileSync(join(DIST, 'index.html'), 'utf8') : '';
report(homeHtml !== '', 'dist/index.html 이 있어야 함');
const missingFeatured = FEATURED_MAKER_SLUGS.filter((slug) => !sourceSlugs.has(slug));
report(
  missingFeatured.length === 0,
  `FEATURED_MAKER_SLUGS 가 모두 공개 소스에 있어야 함 (누락: ${missingFeatured.join(', ') || '없음'})`,
);
for (const slug of FEATURED_MAKER_SLUGS) {
  if (!sourceSlugs.has(slug)) continue;
  report(homeHtml.includes(`href="/blog/${slug}/"`), `홈(/)에서 큐레이션 글 /blog/${slug}/ 링크가 보여야 함`);
}

// --- 5. 내부 분류 UI 비노출 + 독자용 카테고리 링크/검색엔진용 BreadcrumbList 유지 ---
let postsChecked = 0;
let visibleTopicPath = 0;
let missingCategoryLink = 0;
let missingBreadcrumbLd = 0;
for (const file of srcFiles) {
  const slug = file.replace(/\.md$/, '');
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const rawCategory = block.match(/^category:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!rawCategory) continue;
  const category = canonicalCategoryFor(rawCategory);
  const categorySlug = slugify(category);

  const distPath = join(DIST, 'blog', slug, 'index.html');
  if (!existsSync(distPath)) {
    fail(`글 ${slug} 의 빌드 결과(/blog/${slug}/)가 없음`);
    continue;
  }
  postsChecked += 1;
  const html = readFileSync(distPath, 'utf8');
  if (html.includes('class="topic-path"') || html.includes('주제 경로 · 자동 분류')) {
    visibleTopicPath += 1;
    if (visibleTopicPath <= 3) console.log(`[FAIL] /blog/${slug}/ 에 내부용 topic-path 블록이 노출됨`);
  }
  // 상단 카테고리 링크는 독자가 분류 글 목록으로 이동하는 최소 내비게이션으로 유지한다.
  if (!html.includes(`<p class="section-kicker"><a href="/blog/category/${categorySlug}/">${category}</a></p>`)) {
    missingCategoryLink += 1;
    if (missingCategoryLink <= 3) console.log(`[FAIL] /blog/${slug}/ 상단에 카테고리(${category}) 링크가 없음`);
  }
  if (!html.includes('"@type":"BreadcrumbList"') || !html.includes(`"position":3,"name":"${category}"`)) {
    missingBreadcrumbLd += 1;
    if (missingBreadcrumbLd <= 3) console.log(`[FAIL] /blog/${slug}/ 의 BreadcrumbList JSON-LD에 카테고리(${category})가 없음`);
  }
}
report(postsChecked > 0, `블로그 글 상세 페이지가 존재해야 함 (확인 ${postsChecked}개)`);
if (visibleTopicPath) fail(`글 ${visibleTopicPath}개에 내부용 topic-path 블록이 노출됨`);
if (missingCategoryLink) fail(`글 ${missingCategoryLink}개의 상단 카테고리 링크가 없음`);
if (missingBreadcrumbLd) fail(`글 ${missingBreadcrumbLd}개의 BreadcrumbList JSON-LD에 카테고리가 없음`);

console.log(`\n[check-taxonomy] 위반 ${failures.length}건`);
process.exit(failures.length ? 1 : 0);
