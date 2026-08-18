import { expect, test } from '@playwright/test';

const postUrl = '/blog/2026-08-18-vibe-coding-week6-mcp-database/';
const motionGif = '/images/posts/2026-08-18-vibe-coding-week6-mcp-database/09a-quiz-by-quiz-walker-motion.gif';
const motionPoster = '/images/posts/2026-08-18-vibe-coding-week6-mcp-database/09a-quiz-by-quiz-walker-motion-still.webp';
const motionCaption = '시작 화면에서 방향키로 캐릭터를 옮길 때, 파란 캐릭터가 점프하듯 움직이는 모습.';
const motionAlt = 'quiz by quiz 시작 화면에서 파란 캐릭터가 내 캐릭터 카드와 랭킹 보기 카드 사이를 좌우로 이동하며 점프하듯 걷는 애니메이션 GIF.';

const collectPageErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
};

const getMotionFigure = (page) => page.locator('.post-media-figure').filter({
  has: page.locator(`img[src="${motionGif}"]`),
});

const waitForImage = async (image) => {
  await image.evaluate((element) => new Promise((resolve, reject) => {
    if (element.complete && element.naturalWidth > 0) {
      resolve();
      return;
    }
    element.addEventListener('load', resolve, { once: true });
    element.addEventListener('error', () => reject(new Error('motion image failed to load')), { once: true });
  }));
};

test('6주차 quiz by quiz GIF는 일반 모션 환경에서 실제 움직이는 이미지와 설명을 표시한다', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    colorScheme: 'light',
    locale: 'ko-KR',
    reducedMotion: 'no-preference',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = collectPageErrors(page);

  try {
    await page.goto(postUrl);
    const figure = getMotionFigure(page);
    const image = figure.locator('img');
    const poster = figure.locator('source');

    await expect(figure).toBeVisible();
    await figure.scrollIntoViewIfNeeded();
    await waitForImage(image);
    await expect(image).toHaveAttribute('alt', motionAlt);
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect(figure.locator('figcaption')).toHaveText(motionCaption);
    await expect(poster).toHaveAttribute('media', '(prefers-reduced-motion: reduce)');
    await expect(poster).toHaveAttribute('srcset', motionPoster);

    const media = await image.evaluate((element) => ({
      complete: element.complete,
      currentSrc: element.currentSrc,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
    }));
    expect(media.complete).toBe(true);
    expect(media.currentSrc).toContain(motionGif);
    expect(media.naturalWidth).toBe(960);
    expect(media.naturalHeight).toBe(540);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('390px reduced-motion 환경은 quiz by quiz 정지 WebP를 표시하고 가로 넘침이 없다', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    colorScheme: 'light',
    locale: 'ko-KR',
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const pageErrors = collectPageErrors(page);

  try {
    await page.goto(postUrl);
    const figure = getMotionFigure(page);
    const image = figure.locator('img');

    await expect(figure).toBeVisible();
    await figure.scrollIntoViewIfNeeded();
    await waitForImage(image);

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const media = await image.evaluate((element) => ({
      currentSrc: element.currentSrc,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      rect: element.getBoundingClientRect().toJSON(),
    }));

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(media.currentSrc).toContain(motionPoster);
    expect(media.naturalWidth).toBe(960);
    expect(media.naturalHeight).toBe(540);
    expect(media.rect.width).toBeGreaterThan(0);
    expect(media.rect.right).toBeLessThanOrEqual(layout.clientWidth);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('quiz by quiz GIF는 PhotoSwipe 크게 보기에서도 열리고 Escape로 닫힌다', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    colorScheme: 'light',
    locale: 'ko-KR',
    reducedMotion: 'no-preference',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = collectPageErrors(page);

  try {
    await page.goto(postUrl);
    const figure = getMotionFigure(page);
    const image = figure.locator('img');
    await figure.scrollIntoViewIfNeeded();
    await waitForImage(image);
    await image.click();
    await page.waitForFunction((expectedSource) => (
      window.pswp?.currSlide?.data?.src?.includes(expectedSource)
    ), motionGif);
    await expect(page.locator('.pswp')).toBeVisible();

    const lightboxState = await page.evaluate(() => ({
      currentIndex: window.pswp?.currIndex,
      source: window.pswp?.currSlide?.data?.src,
      itemCount: document.querySelectorAll('.post-article img[data-lightbox-initialized="true"]').length,
    }));
    expect(lightboxState.source).toContain(motionGif);
    expect(lightboxState.currentIndex).toBe(lightboxState.itemCount - 1);

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.pswp?.opener?.isOpen);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
