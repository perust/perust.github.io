import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

const xmlFiles = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? xmlFiles(path) : entry.name.endsWith('.xml') ? [path] : [];
  });
};

test('the comments admin page keeps the page shell public but protects comment data with a session-only token', () => {
  const path = 'src/pages/admin/comments.astro';
  assert.equal(existsSync(path), true, `${path} must exist`);
  const page = read(path);

  assert.match(page, /PUBLIC_COMMENTS_API_URL/);
  assert.match(page, /robots="noindex, nofollow"/);
  assert.match(page, /loadAnalytics=\{false\}/);
  assert.match(page, /sessionStorage/);
  assert.doesNotMatch(page, /localStorage/);
  assert.doesNotMatch(page, /PUBLIC_ADMIN_TOKEN|import\.meta\.env\.ADMIN_TOKEN/);
  assert.match(page, /authorization["']?\s*:\s*`Bearer \$\{token\}`/i);
});

test('the base layout can disable third-party analytics on the admin page', () => {
  const layout = read('src/layouts/BaseLayout.astro');
  assert.match(layout, /loadAnalytics\?: boolean/);
  assert.match(layout, /loadAnalytics\s*=\s*true/);
  assert.match(layout, /loadAnalytics\s*&&/);
});

test('an owner article session gates every third-party script before its provider URL', () => {
  const layout = read('src/layouts/BaseLayout.astro');
  const comments = read('src/components/Comments.astro');
  const storageMarker = 'lentoludens-comments-admin-token';
  const gateIndex = layout.indexOf(storageMarker);

  assert.notEqual(gateIndex, -1, 'BaseLayout must inspect the owner session before loading third-party scripts');
  for (const provider of [
    'pagead2.googlesyndication.com',
    'www.googletagmanager.com',
    'www.clarity.ms',
  ]) {
    assert.ok(layout.indexOf(provider) > gateIndex, `${provider} must appear after the owner-session gate`);
  }
  assert.equal(layout.match(/sessionStorage\.getItem/g)?.length, 1);
  assert.match(layout, /dataset\.adminSession/);
  assert.match(layout, /dataset\.adminSession\s*===\s*['"]true['"]/);
  assert.match(comments, /lentoludens-comments-admin-token/);
  assert.match(comments, /authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(comments, /authorization: `Bearer \$\{adminToken\}`/);
  assert.match(comments, /response\.status === 401/);
  assert.match(comments, /비공개 댓글입니다\./);
  assert.doesNotMatch(comments, /<script[^>]+src=["']https:\/\/challenges\.cloudflare\.com/i);
});

test('a legacy public page clears the owner token before loading its third-party script', () => {
  const legacyPage = read('public/homepage/gyobo/index.html');
  const clearIndex = legacyPage.indexOf("sessionStorage.removeItem('lentoludens-comments-admin-token')");
  const thirdPartyIndex = legacyPage.indexOf('https://ajax.googleapis.com/ajax/libs/jquery');

  assert.ok(thirdPartyIndex >= 0, 'the legacy fixture must retain its external script');
  assert.ok(clearIndex >= 0, 'the legacy page must clear the owner token');
  assert.ok(clearIndex < thirdPartyIndex, 'the token must be cleared before the provider URL executes');
});

test('admin pages are deliberately excluded from sitemap and allowed by the noindex AdSense gate', () => {
  const astroConfig = read('astro.config.mjs');
  const adsenseCheck = read('scripts/check-adsense.mjs');

  assert.match(astroConfig, /url\.pathname\.startsWith\(['"]\/admin\/['"]\)/);
  assert.match(adsenseCheck, /rel\.startsWith\(['"]\/admin\/['"]\)/);
});

test('the comments worker regression suite is wired into repository CI', () => {
  const packageJson = JSON.parse(read('package.json'));
  const workflow = read('.github/workflows/deploy.yml');

  assert.equal(packageJson.scripts['test:comments-worker'], 'node --test comments-worker/tests/*.test.mjs');
  assert.match(workflow, /npm run test:comments-worker/);
});

test('built comments admin page is noindex, has no ad or analytics scripts, and is absent from every sitemap', () => {
  const path = 'dist/admin/comments/index.html';
  assert.equal(existsSync(path), true, `${path} must exist; run npm run build first`);
  const html = read(path);

  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
  assert.doesNotMatch(html, /googletagmanager\.com|G-HLB0E46BLH|clarity\.ms|xfwvbc1z9a/);
  assert.doesNotMatch(html, /secret-admin-token|PUBLIC_ADMIN_TOKEN/);

  const sitemap = xmlFiles('dist').map(read).join('\n');
  assert.doesNotMatch(sitemap, /https:\/\/perust\.github\.io\/admin\//);
});
