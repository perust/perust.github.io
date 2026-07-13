#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const publisherId = 'pub-1573639772192057';
const clientId = 'ca-pub-1573639772192057';
const adsenseUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
const adsTxtLine = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
const failures = [];

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => failures.push(message);

if (!existsSync('public/ads.txt')) {
  fail('public/ads.txt is missing.');
} else {
  const adsTxt = read('public/ads.txt').trim();
  if (adsTxt !== adsTxtLine) fail(`public/ads.txt must exactly be: ${adsTxtLine}`);
}

if (!existsSync('src/layouts/BaseLayout.astro')) {
  fail('src/layouts/BaseLayout.astro is missing.');
} else {
  const layout = read('src/layouts/BaseLayout.astro');
  const scriptCount = layout.split(adsenseUrl).length - 1;
  if (scriptCount !== 1) fail(`BaseLayout must include the AdSense script exactly once; found ${scriptCount}.`);
  if (!/crossorigin=["']anonymous["']/.test(layout)) fail('AdSense script must include crossorigin="anonymous".');
}

if (!existsSync('src/pages/privacy.astro')) {
  fail('src/pages/privacy.astro is missing.');
} else {
  const privacy = read('src/pages/privacy.astro');
  if (!privacy.includes('Google AdSense')) fail('Privacy page must disclose Google AdSense.');
  if (!privacy.includes('Google Analytics')) fail('Privacy page must disclose Google Analytics.');
}

if (!existsSync('public/robots.txt')) {
  fail('public/robots.txt is missing.');
} else {
  const robots = read('public/robots.txt');
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt must not disallow the whole site.');
  if (!robots.includes('Sitemap: https://perust.github.io/sitemap-index.xml')) fail('robots.txt should include the sitemap URL.');
}

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
};

if (!existsSync('dist')) {
  fail('dist is missing. Run npm run build before npm run check:adsense.');
} else {
  if (!existsSync('dist/ads.txt')) {
    fail('dist/ads.txt is missing after build.');
  } else if (read('dist/ads.txt').trim() !== adsTxtLine) {
    fail('dist/ads.txt does not contain the expected AdSense publisher line.');
  }

  const htmlFiles = walk('dist').filter((path) => path.endsWith('.html'));
  const publicAstroPages = htmlFiles.filter((path) => {
    const rel = '/' + relative('dist', path).replaceAll('\\', '/');
    return !rel.startsWith('/contents/') && !rel.startsWith('/homepage/') && !rel.startsWith('/study/') && !rel.includes('naver4a4df7bf2289685cee39c3f594382503.html');
  });

  const badScriptPages = [];
  const noindexPages = [];
  for (const path of publicAstroPages) {
    const rel = '/' + relative('dist', path).replaceAll('\\', '/');
    const html = read(path);
    const count = html.split(adsenseUrl).length - 1;
    if (count !== 1) badScriptPages.push(`${rel} (${count})`);
    const isIntentionalIndexUtility = rel.startsWith('/blog/tag/') || rel.startsWith('/blog/category/');
    if (!isIntentionalIndexUtility && /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) noindexPages.push(rel);
  }

  if (badScriptPages.length) fail(`Public Astro HTML pages must include AdSense script exactly once. Bad pages: ${badScriptPages.slice(0, 10).join(', ')}${badScriptPages.length > 10 ? `, ... +${badScriptPages.length - 10}` : ''}`);
  if (noindexPages.length) fail(`Core public Astro HTML pages must not be noindex. Bad pages: ${noindexPages.slice(0, 10).join(', ')}`);
  if (publicAstroPages.length < 20) fail(`Expected substantial public content; found only ${publicAstroPages.length} public Astro HTML pages.`);
}

if (failures.length) {
  console.error('[adsense-check] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[adsense-check] OK');
console.log(`publisher=${publisherId}`);
console.log(`script=${adsenseUrl}`);
