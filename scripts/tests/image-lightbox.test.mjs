import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  calculateImageFitWidth,
  calculatePreservedScroll,
} from '../../src/utils/image-lightbox.mjs';

const root = new URL('../../', import.meta.url);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);
const lightboxScriptPath = new URL('src/utils/image-lightbox.mjs', root);
const packagePath = new URL('package.json', root);
const deployWorkflowPath = new URL('.github/workflows/deploy.yml', root);
const playwrightConfigPath = new URL('playwright.config.mjs', root);
const browserSpecPath = new URL('scripts/browser-tests/image-lightbox.spec.mjs', root);

const readImplementation = async () => {
  const [page, script] = await Promise.all([
    readFile(blogPagePath, 'utf8'),
    readFile(lightboxScriptPath, 'utf8'),
  ]);
  return { page, script };
};

test('블로그 본문 이미지는 키보드로도 확대 대화상자를 열 수 있다', async () => {
  const { page, script } = await readImplementation();

  assert.match(page, /<dialog[^>]*data-image-lightbox[^>]*data-lightbox-fit="true"[^>]*aria-labelledby="image-lightbox-caption"/);
  assert.match(page, /data-lightbox-image/);
  assert.match(page, /data-lightbox-close/);
  const sizeToggleTag = page.match(/<button[^>]*class="image-lightbox__size-toggle"[^>]*data-lightbox-size-toggle[^>]*>/)?.[0] ?? '';
  assert.match(sizeToggleTag, /aria-label="원본 크기로 보기"/);
  assert.doesNotMatch(sizeToggleTag, /aria-pressed=/);
  assert.match(page, /<span[^>]*data-lightbox-size-icon[^>]*aria-hidden="true"[^>]*>\+<\/span>/);
  assert.doesNotMatch(page, /image-lightbox__toolbar/);
  assert.doesNotMatch(page, /data-lightbox-zoom-(?:in|out|status)/);
  assert.doesNotMatch(page, /data-lightbox-original/);
  assert.match(page, /import \{ initializeImageLightbox \} from '\.\.\/\.\.\/utils\/image-lightbox\.mjs'/);
  assert.match(script, /querySelectorAll\('\.post-article img'\)/);
  assert.match(script, /image\.closest\('a'\)/);
  assert.match(script, /image\.addEventListener\('click'/);
  assert.match(script, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(script, /lightbox\.showModal\(\)/);
});

test('확대 대화상자는 닫기와 포커스 복귀를 지원한다', async () => {
  const { script } = await readImplementation();

  assert.match(script, /closeButton\.addEventListener\('click', \(\) => lightbox\.close\(\)\)/);
  assert.match(script, /if \(event\.target === lightbox\) lightbox\.close\(\)/);
  assert.match(script, /lightbox\.addEventListener\('close'/);
  assert.match(script, /triggerImage\?\.focus\(\)/);
  assert.match(script, /document\.documentElement\.classList\.remove\('image-lightbox-open'\)/);
});

test('확대 대화상자는 화면 맞춤으로 열리고 반투명 플러스 버튼으로 원본 크기를 전환한다', async () => {
  const { page, script } = await readImplementation();

  assert.match(script, /lightbox\.dataset\.lightboxFit = 'true'/);
  assert.match(script, /expandedImage\.style\.width = `\$\{baseWidth\}px`/);
  assert.match(script, /sizeToggle\.addEventListener\('click'/);
  assert.doesNotMatch(script, /aria-pressed/);
  assert.match(script, /sizeToggle\.setAttribute\('aria-label', isFit \? '원본 크기로 보기' : '화면에 맞추기'\)/);
  assert.match(script, /sizeIcon\.textContent = isFit \? '\+' : '−'/);
  assert.match(page, /<div class="image-lightbox__frame">[\s\S]*?<img[^>]*data-lightbox-image[^>]*>[\s\S]*?<button[^>]*data-lightbox-size-toggle/);
  assert.match(page, /\.image-lightbox__frame\s*\{[\s\S]*?position: relative;[\s\S]*?display: grid;[\s\S]*?width: max-content;/);
  assert.match(page, /\.image-lightbox__size-toggle\s*\{[\s\S]*?position: sticky;[\s\S]*?grid-area: 1 \/ 1;[\s\S]*?background: rgba\([^)]*\);/);
});

test('화면 맞춤은 가로와 세로 여유를 함께 계산해 세로로 긴 이미지도 맞춘다', () => {
  assert.equal(calculateImageFitWidth({
    baseWidth: 1350,
    baseHeight: 1800,
    availableWidth: 1195,
    availableHeight: 443,
  }), 332);
  assert.equal(calculateImageFitWidth({
    baseWidth: 552,
    baseHeight: 684,
    availableWidth: 358,
    availableHeight: 669,
  }), 358);
  assert.equal(calculateImageFitWidth({ baseWidth: 0, baseHeight: 684, availableWidth: 358, availableHeight: 669 }), null);
});

test('원본 크기 전환은 사용자가 보고 있던 이미지 중심을 유지한다', () => {
  const before = {
    scrollLeft: 500,
    scrollTop: 30,
    clientWidth: 390,
    clientHeight: 701,
    scrollWidth: 1475,
    scrollHeight: 765,
  };
  const after = calculatePreservedScroll({ ...before, nextScrollWidth: 1763, nextScrollHeight: 912 });
  const oldFocusX = (before.scrollLeft + before.clientWidth / 2) / before.scrollWidth;
  const newFocusX = (after.left + before.clientWidth / 2) / 1763;

  assert.ok(after.left > 0);
  assert.ok(Math.abs(oldFocusX - newFocusX) < 1e-12);
  assert.ok(after.top >= 0);
});

test('대화상자는 원본 크기·화면 맞춤·안정된 스크롤바 레이아웃을 선언한다', async () => {
  const { page, script } = await readImplementation();

  assert.match(page, /\.image-lightbox\s*\{[\s\S]*?position: fixed;[\s\S]*?inset: 0;[\s\S]*?margin: auto;/);
  assert.match(page, /\.image-lightbox__viewport\s*\{[\s\S]*?overflow: auto;/);
  assert.match(page, /\.image-lightbox__image\s*\{[\s\S]*?max-width: none;[\s\S]*?max-height: none;/);
  assert.match(page, /\.image-lightbox\[data-lightbox-fit="true"\] \.image-lightbox__image\s*\{[\s\S]*?max-width: 100%;[\s\S]*?max-height: 100%;/);
  assert.match(page, /html\s*\{[\s\S]*?scrollbar-gutter: stable;/);
  assert.match(page, /html\.image-lightbox-open\s*\{[^}]*overflow: hidden;[^}]*background: #020617;[^}]*\}/);
  assert.match(page, /\.post-article img\[data-lightbox-ready="true"\][\s\S]*?cursor: zoom-in;/);
  assert.match(script, /window\.addEventListener\('resize',[\s\S]*?updateZoom\(\)/);
  assert.match(script, /calculatePreservedScroll/);
});

test('원본 크기 토글과 닫기 버튼은 상단 메뉴 없이 보조기술 상태를 제공한다', async () => {
  const { page, script } = await readImplementation();

  assert.match(page, /<button[^>]*data-lightbox-close[^>]*aria-label="확대 이미지 닫기"/);
  assert.match(page, /\.image-lightbox__close\s*\{[\s\S]*?position: absolute;/);
  assert.doesNotMatch(page, /원본 파일 열기/);
  assert.doesNotMatch(script, /DEFAULT_IMAGE_ZOOM|MIN_IMAGE_ZOOM|MAX_IMAGE_ZOOM|IMAGE_ZOOM_STEP|nextImageZoom/);
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
