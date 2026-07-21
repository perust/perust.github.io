// AdSense 저가치 콘텐츠 개선 정책 검증 스크립트.
// 사용법: npm run build 이후 `node scripts/check-content-quality.mjs`
// 표준 라이브러리만 사용하며, 위반이 있으면 종료 코드 1로 끝난다.
//
// 검사 항목:
//  1. 보관(archive) 대상 슬러그가 src/content/blog 와 dist/blog 에 없다.
//  2. 모든 태그 페이지는 noindex, follow 다.
//  3. 카테고리 페이지는 글 3개 이상일 때만 index, 그 외에는 noindex, follow 다.
//  4. sitemap 에 태그 URL 과 noindex 카테고리 URL 이 없다.
//  5. 개인정보처리방침이 실제 댓글 처리(닉네임/본문/삭제 비밀번호/IP/Cloudflare/Turnstile)와
//     Analytics/AdSense/Clarity 를 설명한다.
//  6. 편집·운영 원칙 페이지가 존재하고 footer 에서 연결된다.
//  7. 블로그 글 상세에 작성자 byline(post-byline)이 있다.
//  8. 공개 HTML 에 보관 슬러그로 가는 내부 링크가 남아 있지 않다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const BLOG_SRC = 'src/content/blog';

// 보존용 레거시 정적 아카이브 — 링크 검사에서 제외한다.
const LEGACY_PREFIXES = ['contents/', 'homepage/', 'study/'];

// content-archive/adsense-remediation/ 으로 이동해 공개 빌드에서 제거하는 슬러그.
const ARCHIVED_SLUGS = [
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

// 카테고리를 index 로 유지하기 위한 최소 공개 글 수.
const CATEGORY_INDEX_MIN_POSTS = 3;

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

const toPosix = (p) => p.split(sep).join('/');

const slugify = (value) =>
  value
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

const failures = [];
const fail = (message) => failures.push(message);
const report = (ok, message) => {
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${message}`);
  if (!ok) fail(message);
};

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

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

// --- 카테고리별 공개 글 수 집계 (astro.config.mjs 와 같은 frontmatter 파싱) ---
const categoryCountBySlug = new Map();
for (const file of srcFiles) {
  const raw = readFileSync(join(BLOG_SRC, file), 'utf8');
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const category = block.match(/^category:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (!category) continue;
  const key = slugify(category);
  categoryCountBySlug.set(key, (categoryCountBySlug.get(key) || 0) + 1);
}

// --- 2~3. 태그/카테고리 robots 규칙 ---
const allHtml = htmlFiles(DIST).sort();
const noindexCategorySlugs = new Set();
let tagPagesChecked = 0;
const badTagRobots = [];
for (const file of allHtml) {
  const rel = toPosix(relative(DIST, file));

  const tagMatch = rel.match(/^blog\/tag\/([^/]+)\/index\.html$/);
  if (tagMatch) {
    const html = readFileSync(file, 'utf8');
    tagPagesChecked += 1;
    if (normalizedRobots(html) !== 'noindex, follow') {
      badTagRobots.push(`${rel} (현재 "${robotsContent(html)}")`);
    }
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
report(
  badTagRobots.length === 0,
  `태그 페이지 ${tagPagesChecked}개가 모두 robots="noindex, follow" 여야 함${badTagRobots.length ? ` (위반: ${badTagRobots.slice(0, 5).join(', ')})` : ''}`,
);

// --- 4. sitemap 검사 ---
const sitemapFiles = readdirSync(DIST).filter((file) => /^sitemap-\d+\.xml$/.test(file));
if (!sitemapFiles.length) {
  report(false, 'sitemap-*.xml 이 dist 에 있어야 함');
} else {
  const sitemap = sitemapFiles.map((file) => readFileSync(join(DIST, file), 'utf8')).join('\n');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  const tagUrls = urls.filter((url) => url.includes('/blog/tag/'));
  report(tagUrls.length === 0, `sitemap 에 태그 URL 이 없어야 함 (발견 ${tagUrls.length}개)`);
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

console.log(`\n[check-content-quality] 위반 ${failures.length}건`);
process.exit(failures.length ? 1 : 0);
