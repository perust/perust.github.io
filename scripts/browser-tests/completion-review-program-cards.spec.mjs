import { expect, test } from '@playwright/test';

const postUrl = '/blog/2026-08-18-vibe-coding-completion-review/';
const launchCards = [
  {
    href: 'https://ai-empathy-diary-sigma.vercel.app/',
    name: '마음 구슬, AI 공감 다이어리 실행하기',
    text: '마음 구슬, AI 공감 다이어리 실행하기',
  },
  {
    href: '/contents/digit-recognizer/',
    name: '손글씨 숫자 인식기 실행하기',
    text: '손글씨 숫자 인식기 실행하기',
  },
  {
    href: 'https://perust.github.io/quiz-by-quiz/',
    name: 'quiz by quiz, 퀴즈 게임 실행하기',
    text: 'quiz by quiz 실행하기',
  },
  {
    href: '/my-what-todo/',
    name: 'My What Todo, 할 일 관리 프로그램 실행하기',
    text: 'My What Todo 실행하기',
  },
];

const chapterHeadings = [
  '1장 - 나의 첫 바이브 코딩',
  '2장 - 효과적인 프롬프트로 AI 200% 활용하기',
  '3장 - 클로드 코드 시작하기',
  '4장 - 클로드 코드 실전 활용',
  '5장 - 게임 제작으로 배우는 체계적인 개발과 관리',
  '6장 - 클로드 코드에 API 날개 달기',
  '7장 - 클로드 코드 AI 에이전트로 개발팀 구성하기',
  '8장 - MCP로 클로드 코드의 한계 넘어서기',
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

const readChapterHeadingLayout = (page) => page.evaluate((summaryHeadingText) => {
  const summaryHeading = [...document.querySelectorAll('.post-article h2')]
    .find((element) => element.textContent?.trim() === summaryHeadingText);
  if (!summaryHeading) return null;

  const headings = [];
  for (let sibling = summaryHeading.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
    if (sibling.tagName === 'H2') break;
    if (sibling.tagName !== 'H3') continue;

    const rect = sibling.getBoundingClientRect();
    headings.push({
      left: rect.left,
      right: rect.right,
      text: sibling.textContent?.replace(/\s+/g, ' ').trim(),
    });
  }

  return {
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    headings,
  };
}, '1장부터 8장까지, 간단히 정리');

test('완독 후기 1~8장은 사용자가 제공한 장별 부제를 390px 폭에서도 온전히 표시한다', async ({ browser, baseURL }) => {
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
    const summaryHeading = page.getByRole('heading', { level: 2, name: '1장부터 8장까지, 간단히 정리' });
    await expect(summaryHeading).toBeVisible();

    const layout = await readChapterHeadingLayout(page);
    expect(layout).not.toBeNull();
    expect(layout.headings.map((heading) => heading.text)).toEqual(chapterHeadings);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.headings).toHaveLength(chapterHeadings.length);
    expect(layout.headings.every((heading) => heading.left >= 0 && heading.right <= layout.clientWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('완독 후기 끝의 제작 프로그램 카드는 목적지와 행동 표기를 제공한다', async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto(postUrl);

  const article = page.locator('.post-article');
  const heading = article.getByRole('heading', { level: 2, name: '만들어본 프로그램들,' });
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
    await expect(page.getByRole('heading', { level: 2, name: '만들어본 프로그램들,' })).toBeVisible();
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
