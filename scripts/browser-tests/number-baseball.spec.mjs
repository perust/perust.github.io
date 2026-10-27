import { expect, test } from '@playwright/test';

// 난수를 고정하면 테스트의 정답은 항상 1234가 됩니다. 실제 게임의 난수는 바꾸지 않습니다.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/contents/number-baseball.html');
});

test('확인 버튼으로 제출하고 스트라이크와 볼을 표시한다', async ({ page }) => {
  await page.locator('#input').fill('1243');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('#logs')).toContainText('1243: 2 스트라이크 2 볼');
  await expect(page.locator('#input')).toHaveValue('');
});

test('Enter로 제출하고 숫자가 모두 다르면 0 스트라이크 0 볼이다', async ({ page }) => {
  await page.locator('#input').fill('5678');
  await page.locator('#input').press('Enter');
  await expect(page.locator('#logs')).toContainText('5678: 0 스트라이크 0 볼');
});

test('잘못된 입력은 기록하지 않고 입력값을 유지한다', async ({ page }) => {
  for (const value of ['', '123', 'abcd', '가나다라', '0123', '1123']) {
    await page.locator('#input').fill(value);
    await page.locator('#input').press('Enter');
    await expect(page.locator('#status')).toContainText('입력해 주세요.');
    await expect(page.locator('#input')).toHaveValue(value);
    await expect(page.locator('#logs li')).toHaveCount(0);
  }
});

test('이미 제출한 숫자는 다시 기록하지 않는다', async ({ page }) => {
  await page.locator('#input').fill('5678');
  await page.locator('#input').press('Enter');
  await page.locator('#input').fill('5678');
  await page.locator('#input').press('Enter');
  await expect(page.locator('#status')).toHaveText('이미 시도한 숫자입니다.');
  await expect(page.locator('#logs li')).toHaveCount(1);
  await expect(page.locator('#input')).toHaveValue('5678');
});

test('정답이면 종료하고 새 게임으로 기록과 입력 상태를 초기화한다', async ({ page }) => {
  await page.locator('#input').fill('5678');
  await page.locator('#input').press('Enter');
  await page.locator('#input').fill('1234');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('#logs li')).toHaveCount(2);
  await expect(page.locator('#logs')).toContainText('1234: 4 스트라이크 0 볼');
  await expect(page.locator('#status')).toHaveText('2번 만에 정답을 맞혔습니다!');
  await expect(page.locator('#input')).toBeDisabled();
  await expect(page.getByRole('button', { name: '확인', exact: true })).toBeDisabled();

  // 종료 후 submit 이벤트가 다시 발생해도 기록을 추가하지 않습니다.
  await page.locator('#form').dispatchEvent('submit');
  await expect(page.locator('#logs li')).toHaveCount(2);
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await expect(page.locator('#logs li')).toHaveCount(0);
  await expect(page.locator('#input')).toBeEnabled();
  await expect(page.locator('#input')).toBeFocused();
  await expect(page.locator('#input')).toHaveValue('');
  await expect(page.getByRole('button', { name: '확인', exact: true })).toBeEnabled();
  await expect(page.locator('#status')).toHaveText('숫자를 입력해 주세요.');
  await page.locator('#input').fill('5678');
  await page.locator('#input').press('Enter');
  await expect(page.locator('#logs li')).toHaveCount(1);
});

test('입력 안내와 모바일 숫자 키보드 속성을 제공한다', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '숫자야구', exact: true })).toBeVisible();
  await expect(page.getByLabel('숫자 4개')).toHaveAttribute('inputmode', 'numeric');
  await expect(page.getByLabel('숫자 4개')).toHaveAttribute('maxlength', '4');
});

test('화면 너비가 달라도 입력과 버튼이 잘리지 않는다', async ({ page }) => {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      buttons: [...document.querySelectorAll('button')].map((button) => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, right: rect.right, height: rect.height };
      }),
    }));
    expect(geometry.scrollWidth).toBe(geometry.width);
    for (const button of geometry.buttons) {
      expect(button.left).toBeGreaterThanOrEqual(0);
      expect(button.right).toBeLessThanOrEqual(width);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
  }
});
