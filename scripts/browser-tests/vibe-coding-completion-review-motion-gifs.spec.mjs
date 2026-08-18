import { expect, test } from '@playwright/test';

const postUrl = '/blog/2026-08-18-vibe-coding-completion-review/';
const motionMedia = [
  {
    file: '03a-empathy-diary-memory-motion.gif',
    poster: '03a-empathy-diary-memory-motion-still.webp',
    width: 600,
    height: 303,
    alt: '마음 구슬 앱의 기억 저장소에서 세 감정 구슬 안의 이모티콘과 짧은 글자가 서로 다른 박자로 흔들리고 세 구슬이 위아래로 움직이는 애니메이션 GIF.',
    caption: '저장한 이모티콘과 글자가 구슬 안에서 흔들리고, 구슬도 둥실둥실 움직이는 모습.',
  },
  {
    file: '04a-quiz-by-quiz-walker-motion.gif',
    poster: '04a-quiz-by-quiz-walker-motion-still.webp',
    width: 960,
    height: 540,
    alt: 'quiz by quiz 시작 화면에서 파란 캐릭터가 내 캐릭터 카드와 랭킹 보기 카드 사이를 좌우로 이동하며 점프하듯 걷는 애니메이션 GIF.',
    caption: '시작 화면에서 방향키로 캐릭터를 옮길 때, 파란 캐릭터가 점프하듯 움직이는 모습.',
  },
  {
    file: '05a-my-what-todo-pomodoro-motion.gif',
    poster: '05a-my-what-todo-pomodoro-motion-still.webp',
    width: 640,
    height: 424,
    alt: 'My What Todo 앱에서 GIF 데모 장면 확인 할 일을 추가한 뒤 뽀모도로 타이머를 시작하고 큰 원형 시계를 펼친 화면. 24분대 남은 시간이 줄어드는 애니메이션 GIF.',
    caption: '할 일을 추가하고 뽀모도로를 시작한 뒤, 펼친 원형 시계에서 시간이 흐르는 모습.',
  },
];

const collectPageErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
};

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

const getMotionFigure = (page, file) => page.locator('.book-page-figure').filter({
  has: page.locator(`img[src="/images/posts/2026-08-18-vibe-coding-completion-review/${file}"]`),
});

test('완독 후기의 세 GIF는 일반 모션 환경에서 실제로 움직이고 설명과 원본 크기를 제공한다', async ({ browser, baseURL }) => {
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

    for (const media of motionMedia) {
      const figure = getMotionFigure(page, media.file);
      const image = figure.locator('img');
      const poster = figure.locator('source');

      await expect(figure).toBeVisible();
      await figure.scrollIntoViewIfNeeded();
      await waitForImage(image);
      await expect(image).toHaveAttribute('alt', media.alt);
      await expect(image).toHaveAttribute('loading', 'lazy');
      await expect(image).toHaveAttribute('decoding', 'async');
      await expect(figure.locator('figcaption')).toHaveText(media.caption);
      await expect(poster).toHaveAttribute('media', '(prefers-reduced-motion: reduce)');
      await expect(poster).toHaveAttribute('srcset', `/images/posts/2026-08-18-vibe-coding-completion-review/${media.poster}`);

      const before = await image.screenshot();
      await page.waitForTimeout(1200);
      const after = await image.screenshot();
      expect(after.equals(before), `${media.file}은 정지 화면이 아니라 실제 모션을 보여야 한다`).toBe(false);

      const rendered = await image.evaluate((element) => ({
        currentSrc: element.currentSrc,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
      }));
      expect(rendered.currentSrc).toContain(`/images/posts/2026-08-18-vibe-coding-completion-review/${media.file}`);
      expect(rendered.naturalWidth).toBe(media.width);
      expect(rendered.naturalHeight).toBe(media.height);
    }

    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('390px reduced-motion 환경은 세 GIF 대신 정지 WebP를 표시하고 가로 넘침이 없다', async ({ browser, baseURL }) => {
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

    for (const media of motionMedia) {
      const figure = getMotionFigure(page, media.file);
      const image = figure.locator('img');
      await expect(figure).toBeVisible();
      await figure.scrollIntoViewIfNeeded();
      await waitForImage(image);

      const rendered = await image.evaluate((element) => ({
        currentSrc: element.currentSrc,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        rect: element.getBoundingClientRect().toJSON(),
      }));
      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(rendered.currentSrc).toContain(`/images/posts/2026-08-18-vibe-coding-completion-review/${media.poster}`);
      expect(rendered.naturalWidth).toBe(media.width);
      expect(rendered.naturalHeight).toBe(media.height);
      expect(rendered.rect.width).toBeGreaterThan(0);
      expect(rendered.rect.right).toBeLessThanOrEqual(layout.clientWidth);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    }

    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
