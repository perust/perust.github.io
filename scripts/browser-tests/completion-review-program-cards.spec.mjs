import { expect, test } from '@playwright/test';

const postUrl = '/blog/2026-08-18-vibe-coding-completion-review/';
const launchCards = [
  {
    href: 'https://ai-empathy-diary-sigma.vercel.app/',
    name: '마음 구슬 AI 공감 다이어리 실행 페이지로 이동',
    text: '마음 구슬 실행하기',
  },
  {
    href: '/contents/digit-recognizer/',
    name: '손글씨 숫자 인식기 실행 페이지로 이동',
    text: '손글씨 숫자 인식기 실행하기',
  },
  {
    href: 'https://perust.github.io/quiz-by-quiz/',
    name: 'quiz by quiz 실행 페이지로 이동',
    text: 'quiz by quiz 실행하기',
  },
  {
    href: '/my-what-todo/',
    name: 'My What Todo 실행 페이지로 이동',
    text: 'My What Todo 실행하기',
  },
];

const collectPageErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
};

const readLaunchCardLayout = (page) => page.evaluate(() => ({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  cards: [...document.querySelectorAll('.post-article .app-launch-button')].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      text: element.textContent?.replace(/\s+/g, ' ').trim(),
      width: rect.width,
    };
  }),
}));

test('완독 후기 끝의 제작 프로그램 카드는 목적지와 행동 표기를 제공한다', async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto(postUrl);

  const article = page.locator('.post-article');
  const heading = article.getByRole('heading', { level: 2, name: '만든 프로그램 직접 실행하기' });
  const cards = article.locator('.app-launch-button');

  await expect(heading).toBeVisible();
  await expect(cards).toHaveCount(launchCards.length);

  for (const [index, expected] of launchCards.entries()) {
    const card = cards.nth(index);
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', expected.href);
    await expect(card).toHaveAttribute('aria-label', expected.name);
    await expect(card).toContainText(expected.text);
    await expect(card).toContainText('바로가기 →');
  }

  const layout = await readLaunchCardLayout(page);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.cards).toHaveLength(launchCards.length);
  expect(layout.cards.every((card) => card.left >= 0 && card.right <= layout.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('390px 모바일에서도 제작 프로그램 카드가 가로 넘침 없이 보인다', async ({ browser, baseURL }) => {
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
    await expect(page.getByRole('heading', { level: 2, name: '만든 프로그램 직접 실행하기' })).toBeVisible();
    const cards = page.locator('.post-article .app-launch-button');
    await expect(cards).toHaveCount(launchCards.length);

    const layout = await readLaunchCardLayout(page);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.cards).toHaveLength(launchCards.length);
    expect(layout.cards.every((card) => card.left >= 0 && card.right <= layout.clientWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
