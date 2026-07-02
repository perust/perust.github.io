// dist/ HTML에서 SEO/GEO/AEO 메타와 JSON-LD 존재 여부를 점검한다.
// 사용법: npm run build 이후 `node scripts/check-seo.mjs`
// 표준 라이브러리만 사용하며, 누락이 있으면 종료 코드 1로 끝난다.
//
// 검사 대상은 Astro가 생성하는 주요 페이지와 블로그 글로 한정한다.
// contents/, homepage/, study/ 아래의 레거시 정적 아카이브 HTML은
// SEO 품질 게이트의 대상이 아니므로 스킵(경고)하고 실패시키지 않는다.
import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';

// 보존용 레거시 정적 아카이브 — 품질 게이트에서 제외하고 스킵한다.
const LEGACY_PREFIXES = ['contents/', 'homepage/', 'study/'];

// 검색엔진 소유권 확인용 루트 HTML 파일은 일부러 메타 태그가 없는 단문 파일이다.
// Google/Bing/Naver 인증 파일은 SEO 품질 게이트 대상이 아니므로 스킵한다.
const WEBMASTER_VERIFICATION_RE = /^(google[\w-]+|BingSiteAuth|naver[\w-]+)\.html$/i;

const toPosix = (p) => p.split(sep).join('/');

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const CHECKS = [
  ['canonical', /<link[^>]+rel="canonical"[^>]*>/i],
  ['description', /<meta[^>]+name="description"[^>]*>/i],
  ['robots', /<meta[^>]+name="robots"[^>]*>/i],
  ['favicon', /<link[^>]+rel="icon"[^>]+href="\/favicon\.ico"[^>]*>|<link[^>]+href="\/favicon\.ico"[^>]+rel="icon"[^>]*>/i],
  ['manifest', /<link[^>]+rel="manifest"[^>]+href="\/site\.webmanifest"[^>]*>|<link[^>]+href="\/site\.webmanifest"[^>]+rel="manifest"[^>]*>/i],
  ['og:title', /<meta[^>]+property="og:title"[^>]*>/i],
  ['og:description', /<meta[^>]+property="og:description"[^>]*>/i],
  ['og:url', /<meta[^>]+property="og:url"[^>]*>/i],
  ['og:site_name', /<meta[^>]+property="og:site_name"[^>]*>/i],
  ['og:image', /<meta[^>]+property="og:image"[^>]*>/i],
  ['twitter:card', /<meta[^>]+name="twitter:card"[^>]*>/i],
  ['twitter:title', /<meta[^>]+name="twitter:title"[^>]*>/i],
  ['twitter:image', /<meta[^>]+name="twitter:image"[^>]*>/i],
];

const JSONLD_RE = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

let failures = 0;
let skipped = 0;
let checked = 0;

const files = (await htmlFiles(DIST)).sort();
for (const file of files) {
  const rel = toPosix(relative(DIST, file));

  // 레거시 아카이브는 검사하지 않고 스킵한다.
  if (LEGACY_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
    skipped += 1;
    console.log(`[skip] ${rel}  (레거시 아카이브 — SEO 게이트 제외)`);
    continue;
  }

  if (WEBMASTER_VERIFICATION_RE.test(rel)) {
    skipped += 1;
    console.log(`[skip] ${rel}  (검색엔진 소유권 확인 파일 — SEO 게이트 제외)`);
    continue;
  }

  checked += 1;
  const html = await readFile(file, 'utf8');
  const missing = CHECKS.filter(([, re]) => !re.test(html)).map(([name]) => name);

  const blocks = [...html.matchAll(JSONLD_RE)];
  const types = [];
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw);
      types.push(data['@type'] || '(no @type)');
    } catch {
      types.push('INVALID-JSON');
      failures += 1;
    }
  }

  // 페이지 유형별로 반드시 있어야 하는 JSON-LD @type 을 검증한다.
  // - 홈(index.html): WebSite
  // - 블로그 인덱스(blog/index.html): Blog
  // - 카테고리/태그 목록(blog/category|tag/<slug>/index.html): CollectionPage + BreadcrumbList
  // - 블로그 글 상세(blog/<slug>/index.html): BlogPosting + BreadcrumbList
  const isCategory = rel.startsWith('blog/category/') && rel.endsWith('index.html');
  const isTag = rel.startsWith('blog/tag/') && rel.endsWith('index.html');
  const isPost = rel.startsWith('blog/') && rel !== 'blog/index.html' && rel.endsWith('index.html') && !isCategory && !isTag;
  if (rel === 'index.html' && !types.includes('WebSite')) {
    missing.push('WebSite JSON-LD');
  } else if (rel === 'blog/index.html' && !types.includes('Blog')) {
    missing.push('Blog JSON-LD');
  } else if (isCategory || isTag) {
    if (!types.includes('CollectionPage')) missing.push('CollectionPage JSON-LD');
    if (!types.includes('BreadcrumbList')) missing.push('BreadcrumbList JSON-LD');
  } else if (isPost) {
    if (!types.includes('BlogPosting')) missing.push('BlogPosting JSON-LD');
    if (!types.includes('BreadcrumbList')) missing.push('BreadcrumbList JSON-LD');
    // 글 상세의 og:image 는 글별(/og/posts/<slug>.png) 또는 카테고리(/og/<cat>.png) 이미지를 가리켜야 한다.
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"[^>]*>/i)?.[1] ?? '';
    if (!/\/og\/[^"']*\.png$/i.test(ogImage)) {
      missing.push('og:image (/og/...png 아님)');
    }
  }

  if (missing.length) failures += missing.length;
  const status = missing.length ? 'FAIL' : 'ok';
  console.log(`[${status}] ${rel}  jsonld=[${types.join(', ') || '-'}]${missing.length ? `  missing: ${missing.join(', ')}` : ''}`);
}

// RSS 피드(dist/rss.xml) 존재 여부를 확인한다. 없으면 실패시킨다.
try {
  await access(join(DIST, 'rss.xml'));
  console.log('[ok] rss.xml  (RSS 피드 존재)');
} catch {
  failures += 1;
  console.log('[FAIL] rss.xml  (RSS 피드 누락 — dist/rss.xml 없음. src/pages/rss.xml.ts 확인)');
}

// 네이버 서치어드바이저 기본 체크: robots.txt, sitemap, favicon/manifest 정적 파일 존재.
for (const [file, label] of [
  ['robots.txt', 'robots.txt'],
  ['sitemap-index.xml', 'sitemap-index.xml'],
  ['favicon.ico', 'favicon.ico'],
  ['favicon-32x32.png', 'favicon PNG'],
  ['site.webmanifest', 'webmanifest'],
]) {
  try {
    await access(join(DIST, file));
    console.log(`[ok] ${file}  (${label} 존재)`);
  } catch {
    failures += 1;
    console.log(`[FAIL] ${file}  (${label} 누락)`);
  }
}

console.log(`\n검사한 HTML: ${checked}개, 스킵(레거시): ${skipped}개, 문제: ${failures}건`);
process.exit(failures ? 1 : 0);
