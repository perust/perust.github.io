import { expect, test } from '@playwright/test';

const libraryUrl = '/wiki/';
const bookUrl = '/wiki/web-building/';
const middleChapterUrl = '/wiki/web-building/content-collections/';

const collectPageErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
};

test.describe('위키 전자책 독서 흐름', () => {
  test('서재 검색은 책과 장 제목을 찾고 책 목차로 이어진다', async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await page.goto(libraryUrl);

    await expect(page.getByRole('heading', { level: 1, name: '무료 전자책' })).toBeVisible();
    const search = page.getByRole('searchbox', { name: '서재 검색' });
    const bookCard = page.locator('[data-wiki-search-item]');
    await expect(bookCard).toHaveCount(1);

    await search.fill('존재하지 않는 장');
    await expect(bookCard).toBeHidden();
    await expect(page.getByText('일치하는 책이나 장이 없습니다.')).toBeVisible();

    await search.fill('GitHub Pages');
    await expect(bookCard).toBeVisible();
    await expect(page.locator('[data-wiki-search-status]')).toHaveText('검색 결과 1권');

    await page.getByRole('link', { name: '웹사이트 만들기와 운영', exact: true }).click();
    await expect(page).toHaveURL(bookUrl);
    await expect(page.getByRole('heading', { level: 2, name: '전체 목차' })).toBeVisible();
    await expect(page.locator('.wiki-book-part a')).toHaveCount(3);
    expect(pageErrors).toEqual([]);
  });

  test('장 화면은 현재 목차, 공식 출처, 이전과 다음 장을 제공하고 열어 본 장을 저장한다', async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await page.goto(libraryUrl);
    await page.evaluate(() => {
      localStorage.setItem('wiki-progress:web-building', JSON.stringify(['site-structure', 'retired-chapter']));
    });
    await page.goto(middleChapterUrl);

    await expect(page.getByRole('heading', { level: 1, name: '콘텐츠를 구조화해서 관리하기' })).toBeVisible();
    const articleLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts
        .map((script) => JSON.parse(script.textContent ?? '{}'))
        .find((item) => item['@type'] === 'TechArticle'),
    );
    expect(articleLd).toMatchObject({
      datePublished: '2026-08-17T00:00:00.000Z',
      dateModified: '2026-08-17T00:00:00.000Z',
    });
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      'content',
      articleLd.datePublished,
    );
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute(
      'content',
      articleLd.dateModified,
    );
    const currentTocLink = page.locator('#wiki-toc a[aria-current="page"]');
    await expect(currentTocLink).toContainText('콘텐츠를 구조화해서 관리하기');
    await expect(currentTocLink).toHaveClass(/is-current/);
    expect(await currentTocLink.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await expect(page.getByRole('heading', { level: 2, name: '공식 출처' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Content collections Astro/ })).toHaveAttribute('rel', 'noreferrer');
    await expect(page.getByRole('navigation', { name: '이전 다음 장 이동' })).toContainText('정적 사이트의 기본 구조');
    await expect(page.getByRole('navigation', { name: '이전 다음 장 이동' })).toContainText('GitHub Pages에 자동 배포하기');
    await expect(page.locator('[data-wiki-completion]')).toHaveText('열어 본 장 2 / 3');

    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('wiki-progress:web-building') ?? '[]'));
    expect(progress).toEqual(['site-structure', 'content-collections']);
    expect(pageErrors).toEqual([]);
  });

  test('390px 모바일에서 목차를 열고 닫을 수 있으며 가로 넘침이 없다', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      locale: 'ko-KR',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const pageErrors = collectPageErrors(page);
    await page.goto(middleChapterUrl);

    const toggle = page.getByRole('button', { name: '목차', exact: true });
    const toc = page.locator('#wiki-toc');
    const close = page.locator('[data-wiki-toc-close]');
    const overlay = page.locator('[data-wiki-toc-overlay]');
    const toolbar = page.locator('.wiki-mobile-toolbar');
    const readingPane = page.locator('.wiki-reading-pane');
    const currentTocLink = toc.locator('a[aria-current="page"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toc).toHaveAttribute('aria-hidden', 'true');
    expect(await toc.evaluate((element) => element.inert)).toBe(true);
    expect(await close.evaluate((element) => {
      element.focus();
      return document.activeElement === element;
    })).toBe(false);
    expect((await toc.boundingBox()).x).toBeLessThan(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toc).not.toHaveAttribute('aria-hidden', 'true');
    await expect(toc).toHaveAttribute('role', 'dialog');
    await expect(toc).toHaveAttribute('aria-modal', 'true');
    expect(await toc.evaluate((element) => element.inert)).toBe(false);
    expect(await toolbar.evaluate((element) => element.inert)).toBe(true);
    expect(await readingPane.evaluate((element) => element.inert)).toBe(true);
    await expect(close).toBeVisible();
    await expect(close).toBeFocused();
    await expect(overlay).toBeVisible();
    await expect.poll(async () => (await toc.boundingBox()).x).toBeGreaterThanOrEqual(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Shift+Tab');
    expect(await toc.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await close.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(toc).toHaveAttribute('aria-hidden', 'true');
    expect(await toc.evaluate((element) => element.inert)).toBe(true);
    expect(await toolbar.evaluate((element) => element.inert)).toBe(false);
    expect(await readingPane.evaluate((element) => element.inert)).toBe(false);
    await expect.poll(async () => (await toc.boundingBox()).x).toBeLessThan(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

    await toggle.click();
    await overlay.click({ position: { x: 380, y: 420 } });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(toc).toHaveAttribute('aria-hidden', 'true');

    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(overlay).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

    await toggle.click();
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(overlay).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await toc.evaluate((element) => element.inert)).toBe(false);
    await expect(toc).not.toHaveAttribute('aria-hidden', 'true');
    await expect(toc).not.toHaveAttribute('role', 'dialog');
    await expect.poll(async () => (await toc.boundingBox()).x).toBeGreaterThanOrEqual(0);
    await expect(currentTocLink).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(toggle).toBeFocused();
    await expect(toc).toHaveAttribute('aria-hidden', 'true');
    expect(await toc.evaluate((element) => element.inert)).toBe(true);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('인쇄 화면에서는 탐색 UI를 제외하고 본문과 출처를 남긴다', async ({ page }) => {
    await page.goto(middleChapterUrl);
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('#wiki-toc')).toBeHidden();
    await expect(page.locator('.wiki-chapter-pager')).toBeHidden();
    await expect(page.locator('.wiki-article')).toBeVisible();
    await expect(page.locator('.wiki-sources')).toBeVisible();
  });
});
