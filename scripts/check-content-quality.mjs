// AdSense 저가치 콘텐츠 개선 정책 검증 스크립트.
// 사용법: npm run build 이후 `node scripts/check-content-quality.mjs`
// 표준 라이브러리만 사용하며, 위반이 있으면 종료 코드 1로 끝난다.
//
// 검사 항목:
//  1. 보관(archive) 대상 슬러그가 src/content/blog 와 dist/blog 에 없다.
//  2. 태그 페이지는 색인 판정 SSOT(isIndexableTag: INDEXABLE_TAGS allowlist + 글 3개 이상)를
//     통과할 때만 index, 그 외에는 noindex, follow 다. noindex 태그로 가는 내부 링크도 0이어야 한다.
//  3. 카테고리 페이지는 글 3개 이상일 때만 index, 그 외에는 noindex, follow 다.
//  4. sitemap 에 noindex 태그/카테고리 URL 이 없다.
//  5. 개인정보처리방침이 실제 댓글 처리(닉네임/본문/삭제 비밀번호/IP/Cloudflare/Turnstile)와
//     Analytics/AdSense/Clarity 를 설명한다.
//  6. 편집·운영 원칙 페이지가 존재하고 footer 에서 연결된다.
//  7. 블로그 글 상세에 작성자 byline(post-byline)이 있다.
//  8. 공개 HTML 에 보관 슬러그로 가는 내부 링크가 남아 있지 않다.
//  9. 기준일(NEW_POST_POLICY_BASELINE) 이후 새 글은 frontmatter 에 사람 편집 검토 완료
//     (editorialReview: true)와 독자적 가치 유형(valueType) 하나를 명시해야 한다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORY_INDEX_MIN_POSTS,
  MAX_NEW_POSTS_PER_DAY,
  MIN_POST_BODY_CHARS,
  NEW_POST_POLICY_BASELINE,
  VALUE_TYPES,
  isIndexableTag,
  postDayOf,
  slugify,
} from '../src/config/taxonomy.ts';
import { loadSecondCurationManifest, manifestSlugs } from './lib/second-curation-manifest.mjs';
import { LEGACY_PREFIXES, htmlFiles, toPosix } from './lib/site-scan.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = 'dist';
const BLOG_SRC = 'src/content/blog';

// content-archive/adsense-remediation/ 으로 이동해 공개 빌드에서 제거하는 슬러그.
// 1차 보관(2026-07-21) 14편은 여기 나열하고, 2차 큐레이션 5편은
// second-curation-manifest.json(SSOT)에서 읽는다 — 슬러그 목록을 중복 정의하지 않는다.
const ROUND1_ARCHIVED_SLUGS = [
  // P0 저가치·비공개 전환
  '2026-06-28-content-plan',
  '2026-06-28-why-this-blog',
  '2026-07-20-jim-collins-how-to-live-before-reading',
  '2026-07-21-living-in-my-own-language-before-reading',
  '2026-06-30-haidilao-sauce-recipes',
  '2026-06-28-astro-github-pages',
  // 중복 통합 후 보관
  '2026-07-03-weekly-economy-checklist',
  '2026-07-20-economic-trends-household-investor-checklist',
  '2026-07-14-claude-code-2-1-209-update-background-agents',
  '2026-07-15-claude-code-2-1-210-worktree-attach-hooks',
  '2026-07-02-claude-fable-5-usage-credits',
  '2026-07-10-fake-ai-subscription-ad-checklist',
  '2026-07-13-chatgpt-unauthorized-payment-checklist',
  '2026-07-03-recording-habit-return-system',
];
const ARCHIVED_SLUGS = [
  ...ROUND1_ARCHIVED_SLUGS,
  ...manifestSlugs(loadSecondCurationManifest(REPO_ROOT)),
];

// 개인정보처리방침에 반드시 설명되어야 하는 실제 데이터 처리 항목.
const PRIVACY_REQUIRED_TERMS = [
  '닉네임',
  '최대 40자',
  '최대 800자',
  '삭제 비밀번호',
  'IP',
  'IP 해시값',
  '1분에 1회',
  '원본 IP 주소 자체는 저장하지 않습니다',
  '별도의 자동 삭제 기한은 두지 않습니다',
  'Cloudflare',
  'Turnstile',
  'Google Analytics',
  'Google AdSense',
  'Microsoft Clarity',
];

const failures = [];
const fail = (message) => failures.push(message);
const report = (ok, message) => {
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${message}`);
  if (!ok) fail(message);
};

const robotsContent = (html) =>
  html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ?? '';
const normalizedRobots = (html) => robotsContent(html).toLowerCase().replace(/\s+/g, ' ').trim();

if (!existsSync(DIST)) {
  console.error('[check-content-quality] dist 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

// --- 1. 보관 슬러그가 src 와 dist 에 없어야 한다 ---
const srcFiles = existsSync(BLOG_SRC)
  ? readdirSync(BLOG_SRC).filter((file) => file.endsWith('.md'))
  : [];
for (const slug of ARCHIVED_SLUGS) {
  report(!srcFiles.includes(`${slug}.md`), `보관 대상 ${slug} 이(가) src/content/blog 에 없어야 함`);
  report(
    !existsSync(join(DIST, 'blog', slug, 'index.html')),
    `보관 대상 ${slug} 이(가) dist/blog 에 없어야 함`,
  );
  report(
    !existsSync(join('public', 'og', 'posts', `${slug}.png`)),
    `보관 대상 ${slug} 의 OG 이미지가 public/og/posts 에 없어야 함`,
  );
  report(
    !existsSync(join(DIST, 'og', 'posts', `${slug}.png`)),
    `보관 대상 ${slug} 의 OG 이미지가 dist/og/posts 에 없어야 함`,
  );
}

// --- 카테고리/태그별 공개 글 수 집계 (astro.config.mjs 와 같은 frontmatter 파싱) ---
const categoryCountBySlug = new Map();
const tagCountBySlug = new Map();
const newPostCountByDay = new Map();
let thinPosts = 0;
// 기준일 이후 새 글의 편집 검토 게이트 — content.config.ts 의 선택 필드를 새 글에는 필수로 강제한다.
// (VALUE_TYPES 는 src/config/taxonomy.ts 의 SSOT 를 그대로 쓴다.)
let editorialGateFailures = 0;
for (const file of srcFiles) {
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = frontmatter?.[1] ?? '';
  const category = block.match(/^category:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (category) {
    const key = slugify(category);
    categoryCountBySlug.set(key, (categoryCountBySlug.get(key) || 0) + 1);
  }

  // 발행 속도 게이트 집계: 기준일 이후 날짜의 글만 센다(기존 글은 grandfathering).
  const date = block.match(/^date:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!date) {
    fail(`${file}: date frontmatter 가 없음`);
  } else {
    try {
      const day = postDayOf(date);
      if (day > NEW_POST_POLICY_BASELINE) {
        newPostCountByDay.set(day, (newPostCountByDay.get(day) || 0) + 1);

        // 새 글은 raw frontmatter 에 사람 편집 검토 완료와 독자적 가치 유형이 명시되어야 한다.
        if (!/^editorialReview:\s*true\s*$/m.test(block)) {
          editorialGateFailures += 1;
          console.log(`[FAIL] ${file}: 기준일 이후 새 글은 frontmatter 에 editorialReview: true (사람 편집 검토 완료)를 명시해야 함`);
        }
        const valueType = block.match(/^valueType:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
        if (!valueType || !VALUE_TYPES.includes(valueType)) {
          editorialGateFailures += 1;
          console.log(
            `[FAIL] ${file}: 기준일 이후 새 글은 valueType 이 ${VALUE_TYPES.join(' | ')} 중 하나여야 함 (현재 "${valueType ?? '없음'}")`,
          );
        }
      }
    } catch (error) {
      fail(`${file}: ${error.message}`);
    }
  }

  // 본문 최소 분량 게이트(공백 제외 문자 수). 얇은 글이 공개 빌드로 나가는 것을 막는다.
  const body = frontmatter ? raw.slice(frontmatter[0].length) : raw;
  const bodyChars = body.replace(/\s+/g, '').length;
  if (bodyChars < MIN_POST_BODY_CHARS) {
    thinPosts += 1;
    console.log(`[FAIL] ${file}: 본문 ${bodyChars}자 < 최소 ${MIN_POST_BODY_CHARS}자 (공백 제외)`);
  }
  const hasTags = /^tags:/m.test(block);
  const tagsLine = block.match(/^tags:\s*(\[.*\])\s*$/m)?.[1];
  if (hasTags && !tagsLine) {
    fail(`${file}: tags 는 단일행 JSON 배열 형식이어야 함`);
  } else if (tagsLine) {
    try {
      const tags = JSON.parse(tagsLine);
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) throw new TypeError('문자열 배열이 아님');
      for (const tag of tags) {
        const key = slugify(tag);
        tagCountBySlug.set(key, (tagCountBySlug.get(key) || 0) + 1);
      }
    } catch (error) {
      fail(`${file}: tags 파싱 실패 (${error.message})`);
    }
  }
}

// --- 발행 운영 게이트: 본문 분량 + 발행 속도 (대량 자동 발행 재발 방지) ---
report(thinPosts === 0, `모든 글 본문이 최소 ${MIN_POST_BODY_CHARS}자(공백 제외) 이상이어야 함 (위반 ${thinPosts}건)`);
const overPacedDays = [...newPostCountByDay.entries()]
  .filter(([, count]) => count > MAX_NEW_POSTS_PER_DAY)
  .map(([day, count]) => `${day}: ${count}편`);
report(
  overPacedDays.length === 0,
  `기준일(${NEW_POST_POLICY_BASELINE}) 이후에는 하루 최대 ${MAX_NEW_POSTS_PER_DAY}편만 발행해야 함 (위반: ${overPacedDays.join(', ') || '없음'})`,
);
report(
  editorialGateFailures === 0,
  `기준일(${NEW_POST_POLICY_BASELINE}) 이후 새 글은 editorialReview: true 와 valueType(${VALUE_TYPES.join(' | ')})을 명시해야 함 (위반 ${editorialGateFailures}건)`,
);

// --- 2~3. 태그/카테고리 robots 규칙 ---
const allHtml = htmlFiles(DIST).sort();
const noindexCategorySlugs = new Set();
const noindexTagSlugs = new Set();
for (const file of allHtml) {
  const rel = toPosix(relative(DIST, file));

  const tagMatch = rel.match(/^blog\/tag\/([^/]+)\/index\.html$/);
  if (tagMatch) {
    const slug = decodeURIComponent(tagMatch[1]);
    const count = tagCountBySlug.get(slug) || 0;
    const html = readFileSync(file, 'utf8');
    const expected = isIndexableTag(slug, count) ? 'index, follow' : 'noindex, follow';
    report(
      normalizedRobots(html) === expected,
      `태그 ${slug} (글 ${count}개) 는 robots="${expected}" 여야 함 (현재 "${robotsContent(html)}")`,
    );
    if (expected === 'noindex, follow') noindexTagSlugs.add(slug);
    continue;
  }

  const categoryMatch = rel.match(/^blog\/category\/([^/]+)\/index\.html$/);
  if (categoryMatch) {
    const slug = decodeURIComponent(categoryMatch[1]);
    const count = categoryCountBySlug.get(slug) || 0;
    const html = readFileSync(file, 'utf8');
    if (count >= CATEGORY_INDEX_MIN_POSTS) {
      report(
        normalizedRobots(html) === 'index, follow',
        `카테고리 ${slug} (글 ${count}개) 는 robots="index, follow" 여야 함 (현재 "${robotsContent(html)}")`,
      );
    } else {
      if (normalizedRobots(html) === 'noindex, follow') {
        console.log(`[ok] 카테고리 ${slug} (글 ${count}개) noindex`);
      } else {
        report(false, `카테고리 ${slug} (글 ${count}개) 는 robots="noindex, follow" 여야 함 (현재 "${robotsContent(html)}")`);
      }
      noindexCategorySlugs.add(slug);
    }
  }
}

// --- 4. sitemap 검사 ---
const sitemapFiles = readdirSync(DIST).filter((file) => /^sitemap-\d+\.xml$/.test(file));
if (!sitemapFiles.length) {
  report(false, 'sitemap-*.xml 이 dist 에 있어야 함');
} else {
  const sitemap = sitemapFiles.map((file) => readFileSync(join(DIST, file), 'utf8')).join('\n');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  const badTagUrls = urls.filter((url) => {
    const slug = url.match(/\/blog\/tag\/([^/]+)\/?$/)?.[1];
    return slug && noindexTagSlugs.has(decodeURIComponent(slug));
  });
  report(
    badTagUrls.length === 0,
    `sitemap 에 noindex 태그 URL 이 없어야 함 (발견: ${badTagUrls.join(', ') || '없음'})`,
  );
  const badCategoryUrls = urls.filter((url) => {
    const slug = url.match(/\/blog\/category\/([^/]+)\/?$/)?.[1];
    return slug && noindexCategorySlugs.has(decodeURIComponent(slug));
  });
  report(
    badCategoryUrls.length === 0,
    `sitemap 에 noindex 카테고리 URL 이 없어야 함 (발견: ${badCategoryUrls.join(', ') || '없음'})`,
  );
  const archivedUrls = urls.filter((url) =>
    ARCHIVED_SLUGS.some((slug) => url.includes(`/blog/${slug}/`)),
  );
  report(archivedUrls.length === 0, `sitemap 에 보관 슬러그 URL 이 없어야 함 (발견 ${archivedUrls.length}개)`);
}

// --- 5. 개인정보처리방침 ---
const privacyPath = join(DIST, 'privacy', 'index.html');
if (!existsSync(privacyPath)) {
  report(false, 'dist/privacy/index.html 이 있어야 함');
} else {
  const privacy = readFileSync(privacyPath, 'utf8');
  for (const term of PRIVACY_REQUIRED_TERMS) {
    report(privacy.includes(term), `개인정보처리방침이 "${term}" 처리를 설명해야 함`);
  }
}

// --- 6. 편집·운영 원칙 페이지와 footer 링크 ---
const editorialPath = join(DIST, 'editorial-policy', 'index.html');
if (!existsSync(editorialPath)) {
  report(false, 'dist/editorial-policy/index.html 이 있어야 함');
} else {
  const editorial = readFileSync(editorialPath, 'utf8');
  for (const term of ['AI', '출처', '수정']) {
    report(editorial.includes(term), `편집·운영 원칙이 "${term}" 를 다뤄야 함`);
  }
}
const homePath = join(DIST, 'index.html');
if (existsSync(homePath)) {
  const home = readFileSync(homePath, 'utf8');
  report(home.includes('href="/editorial-policy/"'), 'footer 등에서 /editorial-policy/ 링크가 있어야 함');
}

// --- 7. 글 상세 byline / 8. 보관 슬러그 내부 링크 ---
let postPages = 0;
let bylineMissing = 0;
const brokenLinks = [];
const noindexTagLinks = [];
for (const file of allHtml) {
  const rel = toPosix(relative(DIST, file));
  if (LEGACY_PREFIXES.some((prefix) => rel.startsWith(prefix))) continue;

  const html = readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const slug of ARCHIVED_SLUGS) {
    if (hrefs.some((href) => href.includes(`/blog/${slug}/`))) {
      brokenLinks.push(`${rel} → /blog/${slug}/`);
    }
  }

  // noindex 태그 페이지로 크롤 예산이 새지 않도록, 내부 <a> 링크는 색인 대상 태그로만 향해야 한다.
  // 사이트 상대 경로(/blog/tag/…)뿐 아니라 https://perust.github.io 절대 내부 링크도 잡는다.
  // canonical 은 <link> 요소라 <a> href 만 보는 이 검사에 걸리지 않는다.
  const anchorHrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of anchorHrefs) {
    const tagSlug = href.match(/^(?:https?:\/\/perust\.github\.io)?\/blog\/tag\/([^/?#]+)\/?$/i)?.[1];
    if (tagSlug && noindexTagSlugs.has(decodeURIComponent(tagSlug))) {
      noindexTagLinks.push(`${rel} → ${href}`);
    }
  }

  const isPost =
    /^blog\/[^/]+\/index\.html$/.test(rel) &&
    !rel.startsWith('blog/tag/') &&
    !rel.startsWith('blog/category/');
  if (isPost) {
    postPages += 1;
    if (!html.includes('post-byline')) {
      bylineMissing += 1;
      if (bylineMissing <= 3) console.log(`[FAIL] ${rel} 에 post-byline 작성자 표기가 없음`);
    }
  }
}
report(postPages > 0, `블로그 글 상세 페이지가 존재해야 함 (발견 ${postPages}개)`);
if (bylineMissing) fail(`블로그 글 ${bylineMissing}개에 post-byline 작성자 표기가 없음`);
report(
  brokenLinks.length === 0,
  `보관 슬러그로 가는 내부 링크가 없어야 함 (발견: ${brokenLinks.slice(0, 5).join(', ') || '없음'}${brokenLinks.length > 5 ? ` 외 ${brokenLinks.length - 5}건` : ''})`,
);
report(
  noindexTagLinks.length === 0,
  `noindex 태그 페이지로 가는 내부 링크가 없어야 함 (발견: ${noindexTagLinks.slice(0, 5).join(', ') || '없음'}${noindexTagLinks.length > 5 ? ` 외 ${noindexTagLinks.length - 5}건` : ''})`,
);

// --- 자기소개성 페이지(포트폴리오·소개·작업)의 근거 없는 정량 주장 차단 ---
// 공개 근거(링크·데이터)를 붙일 수 없는 "+50%", "20% 개선" 류 수치 주장이 다시 들어오는 것을 막는다.
// CSS/JS 안의 퍼센트(width:100% 등)와 헷갈리지 않도록 style/script 블록은 제거하고 본문만 본다.
const CLAIM_PAGES = ['portfolio/index.html', 'about/index.html', 'work/index.html'];
const UNSUPPORTED_CLAIM_RE = /[+＋]\s*\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*%p?\s*(?:개선|향상|증가|감소|단축|절감)/;
for (const page of CLAIM_PAGES) {
  const path = join(DIST, page);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, 'utf8')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  const match = html.match(UNSUPPORTED_CLAIM_RE);
  report(
    match === null,
    `/${page.replace('/index.html', '/')} 에 근거 없는 정량 주장 패턴이 없어야 함 (발견: "${match?.[0] ?? '없음'}")`,
  );
}

console.log(`\n[check-content-quality] 위반 ${failures.length}건`);
process.exit(failures.length ? 1 : 0);
