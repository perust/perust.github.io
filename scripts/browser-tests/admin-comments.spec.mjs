import { expect, test } from '@playwright/test';

const comments = [
  {
    id: 'private-comment',
    postSlug: '2026-07-01-static-blog-anonymous-comments',
    nickname: '비밀 독자',
    body: '작성자에게만 보이는 댓글입니다.',
    ipPrefix: '118.235.xxx.xxx',
    isPrivate: true,
    status: 'approved',
    createdAt: '2026-08-17 12:00:00',
    approvedAt: '2026-08-17 12:00:00',
  },
  {
    id: 'hidden-comment',
    postSlug: 'missing-post',
    nickname: '익명',
    body: '<img src=x onerror=alert(1)>',
    ipPrefix: '211.10.xxx.xxx',
    isPrivate: false,
    status: 'rejected',
    createdAt: '2026-08-16 09:00:00',
    approvedAt: null,
  },
];

test('admin token unlocks the complete comment list and remains only in session storage', async ({ page }) => {
  let authorization = '';
  await page.route('**/admin/comments?**', async (route) => {
    authorization = route.request().headers().authorization || '';
    await route.fulfill({
      status: authorization === 'Bearer correct-token' ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(authorization === 'Bearer correct-token'
        ? { comments, pagination: { total: 2, limit: 50, offset: 0, hasMore: false } }
        : { error: 'unauthorized' }),
    });
  });

  await page.goto('/admin/comments/');
  await expect(page.getByRole('heading', { name: '댓글 관리' })).toBeVisible();
  await expect(page.locator('[data-admin-comments-list]')).toBeHidden();

  await page.getByLabel('관리자 암호').fill('correct-token');
  await page.getByRole('button', { name: '댓글 확인' }).click();

  await expect.poll(() => authorization).toBe('Bearer correct-token');
  await expect(page.locator('[data-admin-comments-list]')).toBeVisible();
  await expect(page.locator('[data-admin-comment]')).toHaveCount(2);
  await expect(page.getByRole('link', { name: '깃허브 블로그 댓글 기능 만들기: Cloudflare Worker와 D1로 익명 댓글 구현' })).toHaveAttribute('href', '/blog/2026-07-01-static-blog-anonymous-comments/');
  await expect(page.getByText('비공개', { exact: true })).toBeVisible();
  await expect(page.getByText('숨김', { exact: true })).toBeVisible();
  await expect(page.locator('.admin-comment-badge.is-private')).toHaveCSS('background-color', 'rgb(243, 232, 255)');
  await expect(page.locator('[data-admin-comment]').first()).toHaveCSS('border-top-style', 'solid');
  await expect(page.locator('[data-admin-comment]').nth(1).locator('img')).toHaveCount(0);
  await expect(page.locator('[data-admin-comment]').nth(1)).toContainText('<img src=x onerror=alert(1)>');

  const storage = await page.evaluate(() => ({
    session: sessionStorage.getItem('lentoludens-comments-admin-token'),
    local: localStorage.getItem('lentoludens-comments-admin-token'),
  }));
  expect(storage).toEqual({ session: 'correct-token', local: null });
  await page.screenshot({ path: 'test-results/admin-comments-desktop.png', fullPage: true });

  await page.reload();
  await expect(page.locator('[data-admin-comment]')).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
  await page.screenshot({ path: 'test-results/admin-comments-mobile.png', fullPage: true });
});

test('an unauthorized token is cleared and never reveals comments', async ({ page }) => {
  await page.route('**/admin/comments?**', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'unauthorized' }),
  }));

  await page.goto('/admin/comments/');
  await page.getByLabel('관리자 암호').fill('wrong-token');
  await page.getByRole('button', { name: '댓글 확인' }).click();

  await expect(page.locator('[data-admin-message]')).toContainText('관리자 암호가 맞지 않습니다.');
  await expect(page.locator('[data-admin-comments-list]')).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('lentoludens-comments-admin-token'))).toBeNull();
});

test('refresh errors stay visible while the comment panel remains open', async ({ page }) => {
  let shouldFail = false;
  await page.route('**/admin/comments?**', (route) => route.fulfill({
    status: shouldFail ? 503 : 200,
    contentType: 'application/json',
    body: JSON.stringify(shouldFail
      ? { error: '댓글 서버가 잠시 응답하지 않습니다.' }
      : { comments, pagination: { total: 2, limit: 50, offset: 0, hasMore: false } }),
  }));

  await page.goto('/admin/comments/');
  await page.getByLabel('관리자 암호').fill('correct-token');
  await page.getByRole('button', { name: '댓글 확인' }).click();
  await expect(page.locator('[data-admin-panel]')).toBeVisible();

  shouldFail = true;
  await page.getByRole('button', { name: '새로고침' }).click();

  await expect(page.locator('[data-admin-panel]')).toBeVisible();
  await expect(page.locator('[data-admin-message]')).toBeVisible();
  await expect(page.locator('[data-admin-message]')).toContainText('댓글 서버가 잠시 응답하지 않습니다.');
});

test('logout clears private DOM and ignores a stale successful response', async ({ page }) => {
  await page.addInitScript((seedComments) => {
    let requestCount = 0;
    window.fetch = () => {
      requestCount += 1;
      const success = () => new Response(JSON.stringify({
        comments: seedComments,
        pagination: { total: seedComments.length, limit: 50, offset: 0, hasMore: false },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      if (requestCount === 1) return Promise.resolve(success());
      return new Promise((resolve) => {
        window.__resolveStaleAdminComments = () => resolve(success());
      });
    };
  }, comments);

  await page.goto('/admin/comments/');
  await page.getByLabel('관리자 암호').fill('correct-token');
  await page.getByRole('button', { name: '댓글 확인' }).click();
  await expect(page.locator('[data-admin-comment]')).toHaveCount(2);

  await page.getByRole('button', { name: '새로고침' }).click();
  await expect.poll(() => page.evaluate(() => typeof window.__resolveStaleAdminComments)).toBe('function');
  await page.getByRole('button', { name: '로그아웃' }).click();

  await expect(page.locator('[data-admin-login]')).toBeVisible();
  await expect(page.locator('[data-admin-panel]')).toBeHidden();
  await expect(page.locator('[data-admin-comment]')).toHaveCount(0);
  await expect(page.locator('[data-admin-count]')).toHaveText('');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('lentoludens-comments-admin-token'))).toBeNull();

  await page.evaluate(() => window.__resolveStaleAdminComments());
  await expect(page.locator('[data-admin-panel]')).toBeHidden();
  await expect(page.locator('[data-admin-comment]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('lentoludens-comments-admin-token'))).toBeNull();
});
