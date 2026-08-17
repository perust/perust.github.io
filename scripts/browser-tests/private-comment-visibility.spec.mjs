import { expect, test } from '@playwright/test';

const postPath = '/blog/2026-07-01-static-blog-anonymous-comments/';
const storageKey = 'lentoludens-comments-admin-token';
const thirdPartyHosts = [
  'pagead2.googlesyndication.com',
  'www.googletagmanager.com',
  'www.clarity.ms',
  'challenges.cloudflare.com',
];

const publicComments = [
  {
    id: 'public-comment',
    postSlug: '2026-07-01-static-blog-anonymous-comments',
    nickname: '공개 독자',
    body: '공개 댓글입니다.',
    ipPrefix: '203.0.xxx.xxx',
    isPrivate: false,
    isRedacted: false,
    createdAt: '2026-08-17 10:00:00',
  },
  {
    id: '',
    postSlug: '2026-07-01-static-blog-anonymous-comments',
    nickname: '비공개',
    body: '비공개 댓글입니다.',
    ipPrefix: '',
    isPrivate: true,
    isRedacted: true,
    createdAt: '2026-08-17 11:00:00',
  },
];

const privateOwnerComments = [
  publicComments[0],
  {
    id: 'private-comment',
    postSlug: '2026-07-01-static-blog-anonymous-comments',
    nickname: '비밀 독자',
    body: '관리자에게만 보이는 <img src=x onerror=alert(1)> 원문',
    ipPrefix: '118.235.xxx.xxx',
    isPrivate: true,
    isRedacted: false,
    createdAt: '2026-08-17 11:00:00',
  },
];

test('a public article shows the private placeholder without a delete control', async ({ page }) => {
  const thirdPartyRequests = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    if (thirdPartyHosts.includes(host)) thirdPartyRequests.push(host);
  });
  for (const host of thirdPartyHosts) {
    await page.route(`https://${host}/**`, (route) => route.abort());
  }
  await page.route('**/comments?**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ comments: publicComments }),
  }));

  await page.goto(postPath);

  await expect(page.locator('[data-comment-item]')).toHaveCount(2);
  const privateComment = page.locator('[data-comment-item][data-private-redacted="true"]');
  await expect(privateComment).toContainText('비공개 댓글입니다.');
  await expect(privateComment).toContainText('비공개');
  await expect(privateComment.locator('[data-delete-form]')).toHaveCount(0);
  await expect(privateComment).not.toContainText('118.235');
  await expect.poll(() => [...new Set(thirdPartyRequests)].sort()).toEqual([
    'pagead2.googlesyndication.com',
    'www.clarity.ms',
    'www.googletagmanager.com',
  ]);
});

test('an owner session reveals the private body and blocks third-party scripts before they load', async ({ page }) => {
  const thirdPartyRequests = [];
  let authorization = '';

  page.on('request', (request) => {
    if (thirdPartyHosts.includes(new URL(request.url()).hostname)) thirdPartyRequests.push(request.url());
  });
  for (const host of thirdPartyHosts) {
    await page.route(`https://${host}/**`, (route) => route.abort());
  }
  await page.addInitScript(({ key, token }) => sessionStorage.setItem(key, token), {
    key: storageKey,
    token: 'correct-admin-token',
  });
  await page.route('**/comments?**', (route) => {
    authorization = route.request().headers().authorization || '';
    return route.fulfill({
      status: authorization === 'Bearer correct-admin-token' ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(authorization === 'Bearer correct-admin-token'
        ? { comments: privateOwnerComments }
        : { error: 'unauthorized' }),
    });
  });

  await page.goto(postPath);

  await expect.poll(() => authorization).toBe('Bearer correct-admin-token');
  await expect(page.locator('[data-comments-owner-mode]')).toBeVisible();
  await expect(page.locator('[data-comments-owner-mode]')).toContainText('관리자 모드');
  const privateComment = page.locator('[data-comment-item][data-private-redacted="false"]').filter({ hasText: '비밀 독자' });
  await expect(privateComment).toContainText('관리자에게만 보이는 <img src=x onerror=alert(1)> 원문');
  await expect(privateComment.locator('img')).toHaveCount(0);
  await expect(page.getByText('비공개 댓글입니다.', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(250);
  expect(thirdPartyRequests).toEqual([]);
});

test('a stale owner session is cleared before retrying the public placeholder view', async ({ page }) => {
  const authorizationHeaders = [];
  await page.addInitScript(({ key, token }) => sessionStorage.setItem(key, token), {
    key: storageKey,
    token: 'stale-admin-token',
  });
  await page.route('**/comments?**', (route) => {
    const authorization = route.request().headers().authorization || '';
    authorizationHeaders.push(authorization);
    return route.fulfill({
      status: authorization ? 401 : 200,
      contentType: 'application/json',
      body: JSON.stringify(authorization ? { error: 'unauthorized' } : { comments: publicComments }),
    });
  });

  await page.goto(postPath);

  await expect(page.getByText('비공개 댓글입니다.', { exact: true })).toBeVisible();
  await expect.poll(() => authorizationHeaders).toEqual(['Bearer stale-admin-token', '']);
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), storageKey)).toBeNull();
  await expect(page.locator('[data-comments-owner-mode]')).toBeHidden();
});

test('a legacy page clears the owner token before requesting its third-party script', async ({ page }) => {
  const thirdPartyRequests = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'ajax.googleapis.com') thirdPartyRequests.push(request.url());
  });
  await page.route('https://ajax.googleapis.com/**', (route) => route.abort());
  await page.addInitScript(({ key, token }) => sessionStorage.setItem(key, token), {
    key: storageKey,
    token: 'correct-admin-token',
  });

  await page.goto('/homepage/gyobo/');

  expect(thirdPartyRequests).toHaveLength(1);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), storageKey)).toBeNull();
});
