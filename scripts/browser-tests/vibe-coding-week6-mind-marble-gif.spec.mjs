import { expect, test } from '@playwright/test';

const postUrl = '/blog/2026-08-18-vibe-coding-week6-mcp-database/';
const motionGif = '/images/posts/2026-08-18-vibe-coding-week6-mcp-database/07a-mind-marble-orb-motion.gif';
const motionPoster = '/images/posts/2026-08-18-vibe-coding-week6-mcp-database/07a-mind-marble-orb-motion-still.webp';
const motionCaption = '구슬 안에 넣은 이모티콘이 서로 다른 박자로 흔들리고, 구슬도 위아래로 움직이는 모습.';
const motionAlt = '마음 구슬 앱의 기억 저장소. 노랑, 보라, 주황 감정 구슬 안에 웃는 얼굴, 반짝임, 꽃, 하트 이모티콘이 움직이는 애니메이션 GIF.';

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

test('6주차 마음 구슬 GIF는 일반 모션 환경에서 실제 GIF를 표시한다', async ({ browser, baseURL }) => {
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
    expect(media.naturalHeight).toBe(404);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('390px reduced-motion 환경은 정지 WebP를 표시하고 가로 넘침이 없다', async ({ browser, baseURL }) => {
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
    expect(media.naturalHeight).toBe(404);
    expect(media.rect.width).toBeGreaterThan(0);
    expect(media.rect.right).toBeLessThanOrEqual(layout.clientWidth);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
