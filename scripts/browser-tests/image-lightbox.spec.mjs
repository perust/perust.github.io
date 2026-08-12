import { expect, test } from '@playwright/test';

const week5Url = '/blog/2026-08-11-vibe-coding-week5-api-ai-agents/';
const week4EngineeringUrl = '/blog/2026-08-10-vibe-engineering-week4-review/';

const box = async (locator) => {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value;
};

const isInside = (inner, outer, tolerance = 1) => (
  inner.x >= outer.x - tolerance
  && inner.y >= outer.y - tolerance
  && inner.x + inner.width <= outer.x + outer.width + tolerance
  && inner.y + inner.height <= outer.y + outer.height + tolerance
);

const overlaps = (first, second) => (
  first.x < second.x + second.width
  && first.x + first.width > second.x
  && first.y < second.y + second.height
  && first.y + first.height > second.y
);

const openImage = async ({ page, url, alt, naturalWidth, naturalHeight }) => {
  await page.goto(url);
  const trigger = page.locator(`.post-article img[alt="${alt}"]`);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const dialog = page.locator('[data-image-lightbox]');
  const image = dialog.locator('[data-lightbox-image]');
  await expect(dialog).toBeVisible();
  await expect.poll(() => image.evaluate((node) => [node.naturalWidth, node.naturalHeight])).toEqual([naturalWidth, naturalHeight]);
  return { trigger, dialog, image };
};

const openLargeCarouselImage = (page) => openImage({
  page,
  url: week5Url,
  alt: '냉장고 재료로 만들 수 있는 추천 요리 목록',
  naturalWidth: 1600,
  naturalHeight: 1024,
});

test.describe('이미지 라이트박스 런타임 회귀', () => {
  test('데스크톱에서 화면 맞춤과 원본 크기를 양방향 전환한다', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    const { dialog, image } = await openImage({
      page,
      url: week4EngineeringUrl,
      alt: '태블릿 화면에 표시된 바이브 엔지니어링 표지',
      naturalWidth: 1350,
      naturalHeight: 1800,
    });
    const viewport = dialog.locator('[data-lightbox-viewport]');
    const toggle = dialog.locator('[data-lightbox-size-toggle]');
    const close = dialog.locator('[data-lightbox-close]');

    const dialogBox = await box(dialog);
    expect(Math.abs(dialogBox.width - 1280 * 0.96)).toBeLessThanOrEqual(2);
    expect(Math.abs(dialogBox.height - 800 * 0.94)).toBeLessThanOrEqual(2);
    await expect(dialog).toHaveAttribute('data-lightbox-fit', 'true');
    await expect(toggle).toHaveAttribute('aria-label', '원본 크기로 보기');
    await expect(toggle).not.toHaveAttribute('aria-pressed', /.+/);
    await expect(toggle).toHaveText('+');
    expect(isInside(await box(image), await box(viewport))).toBe(true);
    expect(isInside(await box(toggle), await box(image))).toBe(true);
    expect(overlaps(await box(toggle), await box(close))).toBe(false);
    await expect(dialog.locator('.image-lightbox__toolbar')).toHaveCount(0);

    await toggle.click();
    await expect(dialog).toHaveAttribute('data-lightbox-fit', 'false');
    await expect(toggle).toHaveAttribute('aria-label', '화면에 맞추기');
    await expect(toggle).not.toHaveAttribute('aria-pressed', /.+/);
    await expect(toggle).toHaveText('−');
    const original = await image.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const viewport = node.closest('[data-lightbox-viewport]');
      return {
        natural: [node.naturalWidth, node.naturalHeight],
        rendered: [Math.round(rect.width), Math.round(rect.height)],
        hasInternalScroll: viewport.scrollWidth > viewport.clientWidth || viewport.scrollHeight > viewport.clientHeight,
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(original.rendered).toEqual(original.natural);
    expect(original.natural).toEqual([1350, 1800]);
    expect(original.hasInternalScroll).toBe(true);
    expect(original.documentOverflow).toBeLessThanOrEqual(0);
    expect(isInside(await box(toggle), dialogBox)).toBe(true);
    expect(isInside(await box(toggle), await box(image))).toBe(true);
    expect(isInside(await box(close), dialogBox)).toBe(true);

    await toggle.click();
    await expect(dialog).toHaveAttribute('data-lightbox-fit', 'true');
    await expect(toggle).toHaveAttribute('aria-label', '원본 크기로 보기');
    await expect(toggle).toHaveText('+');
    expect(isInside(await box(image), await box(viewport))).toBe(true);
    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('모바일에서 화면 전체를 사용하고 버튼은 보이며 겹치지 않는다', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const { dialog, image } = await openLargeCarouselImage(page);
    const viewport = dialog.locator('[data-lightbox-viewport]');
    const toggle = dialog.locator('[data-lightbox-size-toggle]');
    const close = dialog.locator('[data-lightbox-close]');

    const dialogBox = await box(dialog);
    expect(Math.abs(dialogBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.width - 390)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.height - 844)).toBeLessThanOrEqual(1);
    expect(isInside(await box(image), await box(viewport))).toBe(true);
    expect(isInside(await box(toggle), await box(image))).toBe(true);
    expect(isInside(await box(close), dialogBox)).toBe(true);
    expect(overlaps(await box(toggle), await box(close))).toBe(false);

    await toggle.click();
    await expect(dialog).toHaveAttribute('data-lightbox-fit', 'false');
    const original = await image.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const viewport = node.closest('[data-lightbox-viewport]');
      return {
        natural: [node.naturalWidth, node.naturalHeight],
        rendered: [Math.round(rect.width), Math.round(rect.height)],
        hasInternalScroll: viewport.scrollWidth > viewport.clientWidth || viewport.scrollHeight > viewport.clientHeight,
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(original.rendered).toEqual(original.natural);
    expect(original.hasInternalScroll).toBe(true);
    expect(original.documentOverflow).toBeLessThanOrEqual(0);
    expect(isInside(await box(toggle), dialogBox)).toBe(true);
    expect(isInside(await box(close), dialogBox)).toBe(true);
    expect(isInside(await box(toggle), await box(image))).toBe(true);
    expect(overlaps(await box(toggle), await box(close))).toBe(false);
    await context.close();
  });

  test('키보드로 열고 Escape로 닫으면 문서 잠금을 해제한 뒤 트리거로 포커스를 돌려준다', async ({ page }) => {
    await page.goto(week5Url);
    const trigger = page.locator('.post-article img[alt="냉장고 재료로 만들 수 있는 추천 요리 목록"]');
    const dialog = page.locator('[data-image-lightbox]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await trigger.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/image-lightbox-open/);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/image-lightbox-open/);
    await expect(trigger).toBeFocused();
    await expect(dialog.locator('[data-lightbox-image]')).not.toHaveAttribute('src', /.+/);

    await trigger.press(' ');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-lightbox-close]').click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
});

test('캐러셀 제어와 상태가 라이트박스 왕복 뒤에도 동작한다', async ({ page }) => {
  await page.goto(week5Url);
  const carousel = page.locator('[data-image-carousel]').filter({ has: page.locator('img[alt="냉장고 사진을 올려 재료 분석을 시작하는 화면"]') });
  const track = carousel.locator('.image-carousel-track');
  const previous = carousel.locator('[data-carousel-prev]');
  const next = carousel.locator('[data-carousel-next]');
  const status = carousel.locator('[data-carousel-status]');

  await expect(status).toHaveText('사진 1 / 6');
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(status).toHaveText('사진 2 / 6');
  await track.press('ArrowRight');
  await expect(status).toHaveText('사진 3 / 6');

  await track.evaluate((node) => node.scrollTo({ left: node.scrollWidth, behavior: 'auto' }));
  await expect(status).toHaveText('사진 6 / 6');
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();

  const activeImage = carousel.locator('img').nth(5);
  await activeImage.click();
  const dialog = page.locator('[data-image-lightbox]');
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-lightbox-close]').click();
  await expect(dialog).not.toBeVisible();
  await expect(activeImage).toBeFocused();
  await expect(status).toHaveText('사진 6 / 6');

  await previous.click();
  await expect(status).toHaveText('사진 5 / 6');
  await track.press('ArrowLeft');
  await expect(status).toHaveText('사진 4 / 6');
});
