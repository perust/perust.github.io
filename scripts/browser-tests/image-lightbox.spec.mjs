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

const overlaps = (left, right) => !(
  left.x + left.width <= right.x
  || right.x + right.width <= left.x
  || left.y + left.height <= right.y
  || right.y + right.height <= left.y
);

const rgbChannels = (color) => {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  expect(channels).toHaveLength(3);
  return channels;
};

const relativeLuminance = (color) => rgbChannels(color)
  .map((channel) => channel / 255)
  .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);

const contrastRatio = (foreground, background) => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
};

const controlMetrics = (control) => control.evaluate((node) => {
  const icon = node.querySelector('.pswp-lightbox__control-icon:not([hidden])');
  const controlStyle = getComputedStyle(node);
  const iconStyle = getComputedStyle(icon);
  return {
    tagName: node.tagName,
    control: [Number.parseFloat(controlStyle.width), Number.parseFloat(controlStyle.height)],
    icon: [Number.parseFloat(iconStyle.width), Number.parseFloat(iconStyle.height)],
    stroke: iconStyle.stroke,
    background: controlStyle.backgroundColor,
  };
});

const focusIndicatorMetrics = (control) => control.evaluate((node) => {
  const style = getComputedStyle(node);
  return {
    outlineColor: style.outlineColor,
    outlineStyle: style.outlineStyle,
    outlineWidth: Number.parseFloat(style.outlineWidth),
    boxShadow: style.boxShadow,
  };
});

const counterMetrics = (counter) => counter.evaluate((node) => {
  const style = getComputedStyle(node);
  return {
    color: style.color,
    background: style.backgroundColor,
    opacity: style.opacity,
  };
});

const pswpZoom = (page) => page.evaluate(() => ({
  current: window.pswp?.currSlide?.currZoomLevel ?? null,
  fit: window.pswp?.currSlide?.zoomLevels?.fit ?? null,
}));

const waitForPhotoSwipeReady = async (page) => {
  await expect.poll(() => page.evaluate(() => window.pswp?.opener?.isOpen === true)).toBe(true);
};

const focusWithKeyboard = async (page, target, maxTabs = 12) => {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((node) => document.activeElement === node)) return;
  }
  throw new Error(`키보드 Tab ${maxTabs}회 안에 대상 컨트롤에 도달하지 못했습니다.`);
};

const openImage = async ({ page, url, alt, naturalWidth, naturalHeight, keyboard = false }) => {
  await page.goto(url);
  const trigger = page.locator(`.post-article img[alt="${alt}"]`);
  await trigger.scrollIntoViewIfNeeded();

  if (keyboard) {
    await trigger.focus();
    await trigger.press('Enter');
  } else {
    await trigger.click();
  }

  const dialog = page.locator('.pswp[role="dialog"]');
  const image = dialog.locator('.pswp__item[aria-hidden="false"] .pswp__img:not(.pswp__img--placeholder)');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-label', '본문 이미지 갤러리');
  await expect(page.getByRole('dialog', { name: '본문 이미지 갤러리' })).toHaveCount(1);
  await waitForPhotoSwipeReady(page);
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

const pinchOut = async ({ context, page, centerX, centerY }) => {
  const client = await context.newCDPSession(page);
  const points = (distance) => [
    { x: centerX - distance, y: centerY, radiusX: 2, radiusY: 2, force: 1, id: 0 },
    { x: centerX + distance, y: centerY, radiusX: 2, radiusY: 2, force: 1, id: 1 },
  ];

  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(35) });
  for (const distance of [50, 70, 90, 110]) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(distance) });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

test.describe('PhotoSwipe 이미지 라이트박스 런타임 회귀', () => {
  test('lazy chunk 준비 중 연속 활성화는 마지막 이미지만 연다', async ({ page }) => {
    let releaseLightboxChunk;
    const lightboxChunkReleased = new Promise((resolve) => {
      releaseLightboxChunk = resolve;
    });
    let lightboxChunkRequested;
    const lightboxChunkRequest = new Promise((resolve) => {
      lightboxChunkRequested = resolve;
    });

    await page.route('**/photoswipe-lightbox*.js', async (route) => {
      lightboxChunkRequested();
      await lightboxChunkReleased;
      await route.continue();
    });
    await page.goto(week5Url);
    const images = page.locator('.post-article img[data-lightbox-ready="true"]');
    await images.nth(0).click();
    await lightboxChunkRequest;
    await images.nth(1).click();
    releaseLightboxChunk();

    await waitForPhotoSwipeReady(page);
    expect(await page.evaluate(() => window.pswp?.currIndex)).toBe(1);
    await expect(images.nth(1)).toBeFocused();
  });

  test('크기 준비 실패 이미지는 가짜 버튼에서 제외하고 후속 load에 복구한다', async ({ page }) => {
    await page.goto(week5Url);

    const image = page.locator('img[alt="2026년 2월 2일에 확인한 OpenRouter 모델 사용량 순위"]');
    const healthyImage = page.locator('img[alt="2026년 8월 3일에 확인한 OpenRouter 모델 사용량 순위"]');
    const eligibleCount = await page.locator('.post-article img[data-lightbox-ready="true"]').count();
    const originalSource = await image.getAttribute('src');
    await image.evaluate((element) => {
      element.setAttribute('width', '800');
      element.setAttribute('height', '600');
      element.src = '/__missing-lightbox-image__.webp';
    });
    await expect.poll(() => image.evaluate((element) => (
      element.complete && element.naturalWidth === 0 && element.naturalHeight === 0
    ))).toBe(true);
    await expect(image).toHaveAttribute('data-lightbox-ready', 'false');
    await expect(image).not.toHaveAttribute('role');
    await expect(image).not.toHaveAttribute('tabindex');
    await expect(image).not.toHaveAttribute('aria-haspopup');
    await image.evaluate((element) => element.click());
    await expect(page.locator('.pswp')).toHaveCount(0);

    await healthyImage.click();
    await waitForPhotoSwipeReady(page);
    await expect(image).toHaveAttribute('data-lightbox-ready', 'false');
    await expect(image).not.toHaveAttribute('role');
    await expect(image).not.toHaveAttribute('tabindex');
    expect(await page.evaluate(() => window.pswp?.getNumItems())).toBe(eligibleCount - 1);
    expect(await page.evaluate(() => (
      window.pswp?.options.dataSource.some((item) => (
        item.element?.alt === '2026년 2월 2일에 확인한 OpenRouter 모델 사용량 순위'
      ))
    ))).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('.pswp')).toHaveCount(0);

    await image.evaluate((element, source) => {
      element.src = source;
    }, originalSource);
    await expect.poll(() => image.evaluate((element) => (
      element.complete && element.naturalWidth > 0 && element.naturalHeight > 0
    ))).toBe(true);
    await expect(image).toHaveAttribute('data-lightbox-ready', 'true');
    await expect(image).toHaveAttribute('role', 'button');
    await expect(image).toHaveAttribute('tabindex', '0');
    await expect(image).toHaveAttribute('aria-haspopup', 'dialog');

    await image.click();
    await waitForPhotoSwipeReady(page);
    expect(await page.evaluate(() => window.pswp?.currSlide?.data.element?.alt)).toBe(
      '2026년 2월 2일에 확인한 OpenRouter 모델 사용량 순위',
    );
  });

  test('데스크톱에서 fit과 원본 1:1을 양방향 전환하고 표준 갤러리를 탐색한다', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
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
    const viewport = dialog.locator('.pswp__scroll-wrap');
    const toggle = dialog.locator('.pswp__button--fit-original');
    const close = dialog.locator('.pswp__button--close');
    const counter = dialog.locator('.pswp__counter');

    const dialogBox = await box(dialog);
    expect(Math.abs(dialogBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.width - 1280)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.height - 800)).toBeLessThanOrEqual(1);
    await expect(dialog).toHaveAttribute('data-image-fit', 'true');
    await expect(toggle).toHaveAttribute('aria-label', '원본 크기로 보기');
    await expect(toggle).not.toHaveAttribute('aria-pressed', /.+/);
    await expect(toggle.locator('[data-fit-original-icon="original"]')).toBeVisible();
    await expect(toggle.locator('[data-fit-original-icon="fit"]')).toBeHidden();
    await expect(close).toHaveAttribute('aria-label', '확대 이미지 닫기');
    expect(isInside(await box(image), await box(viewport))).toBe(true);
    const toggleMetrics = await controlMetrics(toggle);
    const closeMetrics = await controlMetrics(close);
    const toggleBox = await box(toggle);
    const closeBox = await box(close);
    const counterBox = await box(counter);
    expect(toggleMetrics).toEqual({
      tagName: 'BUTTON',
      control: [44, 44],
      icon: [24, 24],
      stroke: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
    });
    expect(closeMetrics).toEqual({
      tagName: 'BUTTON',
      control: [44, 44],
      icon: [24, 24],
      stroke: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
    });
    expect(contrastRatio(toggleMetrics.stroke, toggleMetrics.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(closeMetrics.stroke, closeMetrics.background)).toBeGreaterThanOrEqual(4.5);
    const desktopCounterMetrics = await counterMetrics(counter);
    expect(Math.abs(counterBox.x + counterBox.width / 2 - dialogBox.width / 2)).toBeLessThanOrEqual(1);
    expect(overlaps(counterBox, toggleBox)).toBe(false);
    expect(overlaps(counterBox, closeBox)).toBe(false);
    expect(desktopCounterMetrics).toEqual({
      color: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
      opacity: '1',
    });
    expect(contrastRatio(desktopCounterMetrics.color, desktopCounterMetrics.background)).toBeGreaterThanOrEqual(4.5);
    await expect(counter).toHaveText(/1\s*\/\s*\d+/);

    await focusWithKeyboard(page, toggle);
    const focusIndicator = await focusIndicatorMetrics(toggle);
    expect(focusIndicator.outlineStyle).toBe('solid');
    expect(focusIndicator.outlineWidth).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(focusIndicator.outlineColor, toggleMetrics.background)).toBeGreaterThanOrEqual(3);
    expect(focusIndicator.boxShadow).toContain('rgb(15, 23, 42) 0px 0px 0px 7px');
    expect(contrastRatio('rgb(15, 23, 42)', 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3);

    await toggle.press('Enter');
    await expect(dialog).toHaveAttribute('data-image-fit', 'false');
    await expect(toggle).toHaveAttribute('aria-label', '화면에 맞추기');
    await expect(toggle.locator('[data-fit-original-icon="original"]')).toBeHidden();
    await expect(toggle.locator('[data-fit-original-icon="fit"]')).toBeVisible();
    await expect.poll(async () => image.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return [Math.round(rect.width), Math.round(rect.height)];
    })).toEqual([1350, 1800]);
    const originalZoom = await pswpZoom(page);
    expect(originalZoom.current).toBeCloseTo(1, 3);
    expect(originalZoom.fit).toBeLessThan(1);
    expect(await image.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

    await toggle.press(' ');
    await expect(dialog).toHaveAttribute('data-image-fit', 'true');
    expect(isInside(await box(image), await box(viewport))).toBe(true);

    const firstSource = await image.getAttribute('src');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('.pswp__item[aria-hidden="false"] .pswp__img:not(.pswp__img--placeholder)')).not.toHaveAttribute('src', firstSource);
    await expect(counter).toHaveText(/2\s*\/\s*\d+/);
    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('모바일 실제 두 손가락 pinch-out으로 확대하고 컨트롤은 viewport에 고정한다', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const { dialog, image } = await openLargeCarouselImage(page);
    const toggle = dialog.locator('.pswp__button--fit-original');
    const close = dialog.locator('.pswp__button--close');

    const dialogBox = await box(dialog);
    expect(Math.abs(dialogBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.width - 390)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.height - 844)).toBeLessThanOrEqual(1);
    expect(await controlMetrics(toggle)).toEqual({
      tagName: 'BUTTON',
      control: [44, 44],
      icon: [24, 24],
      stroke: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
    });
    expect(await controlMetrics(close)).toEqual({
      tagName: 'BUTTON',
      control: [44, 44],
      icon: [24, 24],
      stroke: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
    });
    const toggleBox = await box(toggle);
    const closeBox = await box(close);
    const counter = dialog.locator('.pswp__counter');
    const counterBox = await box(counter);
    expect(isInside(toggleBox, dialogBox)).toBe(true);
    expect(isInside(closeBox, dialogBox)).toBe(true);
    expect(Math.abs(counterBox.x + counterBox.width / 2 - dialogBox.width / 2)).toBeLessThanOrEqual(1);
    expect(overlaps(counterBox, toggleBox)).toBe(false);
    expect(overlaps(counterBox, closeBox)).toBe(false);
    const mobileCounterMetrics = await counterMetrics(counter);
    expect(mobileCounterMetrics).toEqual({
      color: 'rgb(255, 255, 255)',
      background: 'rgb(15, 23, 42)',
      opacity: '1',
    });
    expect(contrastRatio(mobileCounterMetrics.color, mobileCounterMetrics.background)).toBeGreaterThanOrEqual(4.5);

    const before = await pswpZoom(page);
    expect(before.current).toBeCloseTo(before.fit, 3);
    const imageBox = await box(image);
    await pinchOut({
      context,
      page,
      centerX: imageBox.x + imageBox.width / 2,
      centerY: imageBox.y + imageBox.height / 2,
    });
    await expect.poll(async () => (await pswpZoom(page)).current).toBeGreaterThan(before.current * 1.35);
    await expect(dialog).toHaveAttribute('data-image-fit', 'false');
    expect(isInside(await box(toggle), dialogBox)).toBe(true);
    expect(isInside(await box(close), dialogBox)).toBe(true);
    await context.close();
  });

  test('키보드 열기·포커스 트랩·Escape·문서 잠금·포커스 복귀가 동작한다', async ({ page }) => {
    const { trigger, dialog } = await openImage({
      page,
      url: week5Url,
      alt: '냉장고 재료로 만들 수 있는 추천 요리 목록',
      naturalWidth: 1600,
      naturalHeight: 1024,
      keyboard: true,
    });

    await expect(page.locator('html')).toHaveClass(/pswp-lightbox-open/);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await expect(dialog).toBeFocused();

    const focusableControls = dialog.locator('button:visible:not([disabled])');
    expect(await focusableControls.count()).toBeGreaterThanOrEqual(4);
    await focusableControls.first().focus();
    await page.keyboard.press('Shift+Tab');
    await expect(focusableControls.last()).toBeFocused();
    await focusableControls.last().focus();
    await page.keyboard.press('Tab');
    await expect(focusableControls.first()).toBeFocused();
    await trigger.focus();
    await expect(dialog).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/pswp-lightbox-open/);
    await expect(trigger).toBeFocused();

    await trigger.press(' ');
    const reopened = page.locator('.pswp[role="dialog"]');
    await expect(reopened).toBeVisible();
    await waitForPhotoSwipeReady(page);
    await reopened.locator('.pswp__button--close').click();
    await expect(reopened).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test('기존 캐러셀 제어·번호·스크롤 동기화가 PhotoSwipe 왕복 뒤에도 동작한다', async ({ page }) => {
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
  const dialog = page.locator('.pswp[role="dialog"]');
  await expect(dialog).toBeVisible();
  await waitForPhotoSwipeReady(page);
  await dialog.locator('.pswp__button--close').click();
  await expect(dialog).toHaveCount(0);
  await expect(activeImage).toBeFocused();
  await expect(status).toHaveText('사진 6 / 6');

  await previous.click();
  await expect(status).toHaveText('사진 5 / 6');
  await track.press('ArrowLeft');
  await expect(status).toHaveText('사진 4 / 6');
});
