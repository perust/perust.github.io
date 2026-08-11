import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  DEFAULT_IMAGE_ZOOM,
  MAX_IMAGE_ZOOM,
  MIN_IMAGE_ZOOM,
  calculateImageFitWidth,
  calculatePreservedScroll,
  nextImageZoom,
} from '../../src/utils/image-lightbox.mjs';

const root = new URL('../../', import.meta.url);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);
const lightboxScriptPath = new URL('src/utils/image-lightbox.mjs', root);

const readImplementation = async () => {
  const [page, script] = await Promise.all([
    readFile(blogPagePath, 'utf8'),
    readFile(lightboxScriptPath, 'utf8'),
  ]);
  return { page, script };
};

test('블로그 본문 이미지는 키보드로도 확대 대화상자를 열 수 있다', async () => {
  const { page, script } = await readImplementation();

  assert.match(page, /<dialog[^>]*data-image-lightbox[^>]*aria-labelledby="image-lightbox-caption"/);
  assert.match(page, /data-lightbox-image/);
  assert.match(page, /data-lightbox-close/);
  assert.match(page, /data-lightbox-fit/);
  assert.match(page, /data-lightbox-original/);
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

test('확대 이미지는 기본 125퍼센트이며 100퍼센트부터 300퍼센트까지 조절한다', () => {
  assert.equal(DEFAULT_IMAGE_ZOOM, 1.25);
  assert.equal(MIN_IMAGE_ZOOM, 1);
  assert.equal(MAX_IMAGE_ZOOM, 3);

  assert.deepEqual(nextImageZoom({ zoom: 1.25, delta: 0.25, isFit: false }), { zoom: 1.5, exitFit: true });
  assert.deepEqual(nextImageZoom({ zoom: 3, delta: 0.25, isFit: false }), { zoom: 3, exitFit: true });
  assert.deepEqual(nextImageZoom({ zoom: 1, delta: -0.25, isFit: false }), { zoom: 1, exitFit: true });
});

test('화면 맞춤에서 축소는 확대를 일으키지 않고 확대는 100퍼센트로 전환한다', () => {
  assert.deepEqual(nextImageZoom({ zoom: 1.25, delta: -0.25, isFit: true }), { zoom: 1.25, exitFit: false });
  assert.deepEqual(nextImageZoom({ zoom: 1.25, delta: 0.25, isFit: true }), { zoom: 1, exitFit: true });
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

test('확대 단계 변경은 사용자가 보고 있던 이미지 중심을 유지한다', () => {
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

test('대화상자는 실제 크기·화면 맞춤·안정된 스크롤바 레이아웃을 선언한다', async () => {
  const { page, script } = await readImplementation();

  assert.match(page, /\.image-lightbox__viewport\s*\{[\s\S]*?overflow: auto;/);
  assert.match(page, /\.image-lightbox__image\s*\{[\s\S]*?max-width: none;[\s\S]*?max-height: none;/);
  assert.match(page, /\.image-lightbox\[data-lightbox-fit="true"\] \.image-lightbox__image\s*\{[\s\S]*?max-width: 100%;[\s\S]*?max-height: 100%;/);
  assert.match(page, /html\s*\{[\s\S]*?scrollbar-gutter: stable;/);
  assert.match(page, /\.post-article img\[data-lightbox-ready="true"\][\s\S]*?cursor: zoom-in;/);
  assert.match(script, /window\.addEventListener\('resize',[\s\S]*?updateZoom\(\)/);
  assert.match(script, /calculatePreservedScroll/);
});
