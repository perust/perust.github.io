import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as imageLightbox from '../../src/utils/image-lightbox.mjs';

const root = new URL('../../', import.meta.url);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);
const lightboxScriptPath = new URL('src/utils/image-lightbox.mjs', root);
const packagePath = new URL('package.json', root);
const deployWorkflowPath = new URL('.github/workflows/deploy.yml', root);
const playwrightConfigPath = new URL('playwright.config.mjs', root);
const browserSpecPath = new URL('scripts/browser-tests/image-lightbox.spec.mjs', root);

const readImplementation = async () => {
  const [page, script, packageSource] = await Promise.all([
    readFile(blogPagePath, 'utf8'),
    readFile(lightboxScriptPath, 'utf8'),
    readFile(packagePath, 'utf8'),
  ]);
  return { page, script, manifest: JSON.parse(packageSource) };
};

test('PhotoSwipe 5.4.4를 고정하고 블로그 상세 페이지에 공식 CSS를 번들링한다', async () => {
  const { page, manifest } = await readImplementation();

  assert.equal(manifest.dependencies?.photoswipe, '5.4.4');
  assert.match(page, /import 'photoswipe\/style\.css'/);
});

test('정적 dialog 대신 PhotoSwipe를 클릭 시점에 lazy-load한다', async () => {
  const { page, script } = await readImplementation();

  assert.doesNotMatch(page, /<dialog[^>]*data-image-lightbox/);
  assert.doesNotMatch(page, /data-lightbox-(?:viewport|canvas|image|caption)/);
  assert.match(script, /import\('photoswipe\/lightbox'\)/);
  assert.match(script, /pswpModule:\s*\(\)\s*=>\s*import\('photoswipe'\)/);
  assert.match(script, /lightbox\.loadAndOpen\(index, items, initialPoint\)/);
  assert.doesNotMatch(script, /showModal\(|lightbox\.close\(\)|calculatePreservedScroll/);
});

test('본문 이미지만 키보드 트리거로 만들고 링크 및 opt-out 이미지는 제외한다', async () => {
  const { script } = await readImplementation();

  assert.match(script, /document\.querySelectorAll\('\.post-article img'\)/);
  assert.match(script, /image\.dataset\.lightboxInitialized !== 'true'/);
  assert.match(script, /image\.dataset\.lightboxInitialized = 'true'/);
  assert.match(script, /image\.addEventListener\('error'/);
  assert.match(script, /!image\.closest\('a'\)/);
  assert.match(script, /image\.hasAttribute\('data-no-lightbox'\)/);
  assert.match(script, /image\.setAttribute\('role', 'button'\)/);
  assert.match(script, /image\.setAttribute\('aria-haspopup', 'dialog'\)/);
  assert.match(script, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(script, /await ensureImageReady\(image\)/);
  assert.match(script, /naturalWidth/);
  assert.match(script, /naturalHeight/);
});

test('이미지 decode가 멈춰도 readiness 전체 예산 안에 실패로 반환한다', async () => {
  const originalWindow = globalThis.window;
  const listeners = new Map();
  const image = {
    naturalWidth: 0,
    naturalHeight: 0,
    complete: false,
    loading: 'lazy',
    decode: () => new Promise(() => {}),
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name, listener) => {
      if (listeners.get(name) === listener) listeners.delete(name);
    },
  };

  globalThis.window = { setTimeout, clearTimeout };
  const startedAt = Date.now();
  try {
    assert.equal(await imageLightbox.ensureImageReady(image, 25), false);
  } finally {
    globalThis.window = originalWindow;
  }

  assert.ok(Date.now() - startedAt < 250);
  assert.equal(image.loading, 'eager');
  assert.equal(listeners.size, 0);
});

test('준비 중 연속 활성화는 latest request만 PhotoSwipe를 연다', async () => {
  const { script } = await readImplementation();

  assert.match(script, /let latestOpenRequest = 0/);
  assert.match(script, /const request = \+\+latestOpenRequest/);
  assert.match(script, /if \(request !== latestOpenRequest\) return/);
});

test('slide 준비 실패 이미지는 가짜 버튼에서 제외하고 후속 load에 복구한다', () => {
  const attributes = new Map([
    ['tabindex', '0'],
    ['role', 'button'],
    ['aria-haspopup', 'dialog'],
    ['aria-label', '기존 라벨'],
  ]);
  const image = {
    alt: '복구 이미지',
    dataset: {},
    tabIndex: 0,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: (name) => attributes.delete(name),
  };

  imageLightbox.setImageLightboxAvailability(image, false);
  assert.equal(image.dataset.lightboxReady, 'false');
  assert.deepEqual([...attributes], []);

  imageLightbox.setImageLightboxAvailability(image, true);
  assert.equal(image.dataset.lightboxReady, 'true');
  assert.equal(image.tabIndex, 0);
  assert.equal(attributes.get('role'), 'button');
  assert.equal(attributes.get('aria-haspopup'), 'dialog');
  assert.equal(attributes.get('aria-label'), '복구 이미지 이미지 크게 보기');
});

test('timeout으로 비활성화된 slide는 후속 준비에서 다시 대기하지 않는다', async () => {
  const { script } = await readImplementation();

  assert.match(script, /images\.map\(async \(image\) => \{\s*if \(image\.dataset\.lightboxReady === 'false'\) return null;\s*const declaredSize/);
  assert.match(script, /pendingItems\.then\(/);
  assert.match(script, /itemsPromise = undefined/);
});

test('PhotoSwipe가 fit으로 열리고 원본 1:1·핀치·휠·포커스 복귀를 제공한다', async () => {
  const { script } = await readImplementation();

  assert.match(script, /initialZoomLevel:\s*'fit'/);
  assert.match(script, /secondaryZoomLevel:\s*1/);
  assert.match(script, /wheelToZoom:\s*true/);
  assert.match(script, /pinchToClose:\s*true/);
  assert.match(script, /closeOnVerticalDrag:\s*true/);
  assert.match(script, /trapFocus:\s*true/);
  assert.match(script, /returnFocus:\s*true/);
  assert.match(script, /lightbox\.on\('keydown'/);
  assert.match(script, /keyboardEvent\.key !== 'Tab'/);
  assert.match(script, /shouldWrapBackward/);
  assert.match(script, /shouldWrapForward/);
  assert.match(script, /keyboardEvent\.preventDefault\(\)/);
  assert.match(script, /escKey:\s*true/);
  assert.match(script, /imageClickAction:\s*'zoom'/);
  assert.match(script, /doubleTapAction:\s*'zoom'/);
});

test('왼쪽 fit·원본 토글과 오른쪽 닫기 버튼은 표준 SVG와 동적 접근성 이름을 사용한다', async () => {
  const { page, script } = await readImplementation();

  assert.match(script, /lightbox\.on\('uiRegister'/);
  assert.match(script, /registerElement\(\{/);
  assert.match(script, /name:\s*'fit-original'/);
  assert.match(script, /appendTo:\s*'root'/);
  assert.match(script, /isButton:\s*true/);
  assert.match(script, /M12 5v14M5 12h14/);
  assert.match(script, /M5 12h14/);
  assert.match(script, /m6 6 12 12M18 6 6 18/);
  assert.match(script, /원본 크기로 보기/);
  assert.match(script, /화면에 맞추기/);
  assert.match(script, /확대 이미지 닫기/);
  assert.match(script, /aria-modal/);
  assert.match(script, /setAttribute\('aria-label', '본문 이미지 갤러리'\)/);
  assert.doesNotMatch(script, /aria-pressed/);

  const sharedControlStyles = page.match(/\.pswp__button--fit-original,\s*\.pswp__button--close\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(sharedControlStyles, /width:\s*2\.75rem/);
  assert.match(sharedControlStyles, /height:\s*2\.75rem/);
  assert.match(sharedControlStyles, /background:\s*#0f172a/);
  assert.match(page, /\.pswp__button--fit-original\s*\{[^}]*top:\s*1rem;[^}]*left:\s*1rem;/s);
  assert.match(page, /\.pswp__button--close\s*\{[^}]*top:\s*1rem;[^}]*right:\s*1rem;/s);
  assert.match(page, /\.pswp-lightbox__control-icon\s*\{[^}]*width:\s*1\.5rem;[^}]*height:\s*1\.5rem;/s);
  assert.match(page, /outline:\s*3px solid #ffffff/);
  assert.match(page, /0 0 0 7px #0f172a/);
  assert.match(page, /\.pswp__counter\s*\{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*transform:\s*translateX\(-50%\);/s);
  assert.match(page, /\.pswp__counter\s*\{[^}]*background:\s*#0f172a;[^}]*color:\s*#ffffff;[^}]*opacity:\s*1;/s);
});

test('PhotoSwipe zoom 상태 판정은 허용 오차 안의 fit만 화면 맞춤으로 취급한다', () => {
  assert.equal(typeof imageLightbox.isPhotoSwipeFitZoom, 'function');
  assert.equal(imageLightbox.isPhotoSwipeFitZoom({ currentZoom: 0.4, fitZoom: 0.4 }), true);
  assert.equal(imageLightbox.isPhotoSwipeFitZoom({ currentZoom: 0.405, fitZoom: 0.4 }), true);
  assert.equal(imageLightbox.isPhotoSwipeFitZoom({ currentZoom: 1, fitZoom: 0.4 }), false);
  assert.equal(imageLightbox.isPhotoSwipeFitZoom({ currentZoom: Number.NaN, fitZoom: 0.4 }), false);
});

test('기존 수동 dialog 구현과 전용 scroll 계산 코드를 완전히 제거한다', async () => {
  const { page, script } = await readImplementation();

  assert.doesNotMatch(page, /\.image-lightbox(?:__|\s|\[)/);
  assert.doesNotMatch(page, /html\.image-lightbox-open/);
  assert.doesNotMatch(script, /calculateImageFitWidth|calculatePreservedScroll|expandedImage|viewportSnapshot/);
  assert.match(page, /html\.pswp-lightbox-open\s*\{[^}]*overflow:\s*hidden;/s);
});

test('배포 브라우저 검사는 환경변수가 적용된 기존 빌드 산출물을 덮어쓰지 않는다', async () => {
  const [packageSource, workflow, playwrightConfig] = await Promise.all([
    readFile(packagePath, 'utf8'),
    readFile(deployWorkflowPath, 'utf8'),
    readFile(playwrightConfigPath, 'utf8'),
  ]);
  const manifest = JSON.parse(packageSource);

  assert.equal(manifest.scripts['test:browser'], 'playwright test');
  assert.equal(manifest.scripts['verify:browser'], 'npm run build && npm run test:browser');
  assert.match(workflow, /- name: Build[\s\S]*?- name: Test browser interactions\n\s+run: npm run test:browser/);
  assert.match(playwrightConfig, /reuseExistingServer:\s*false/);
  assert.doesNotMatch(playwrightConfig, /reuseExistingServer:\s*!process\.env\.CI/);
});

test('수동 Playwright 컨텍스트는 설정의 baseURL을 명시적으로 전달한다', async () => {
  const browserSpec = await readFile(browserSpecPath, 'utf8');

  assert.equal(
    browserSpec.match(/browser\.newContext\(\{\s*baseURL,\s*viewport:/g)?.length ?? 0,
    2,
  );
});
