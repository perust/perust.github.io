import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);

test('블로그 본문 이미지는 키보드로도 원본 보기 대화상자를 열 수 있다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /<dialog[^>]*data-image-lightbox[^>]*aria-labelledby="image-lightbox-caption"/);
  assert.match(page, /data-lightbox-image/);
  assert.match(page, /data-lightbox-close/);
  assert.match(page, /data-lightbox-fit/);
  assert.match(page, /data-lightbox-original/);
  assert.match(page, /querySelectorAll\('\.post-article img'\)/);
  assert.match(page, /image\.closest\('a'\)/);
  assert.match(page, /image\.addEventListener\('click'/);
  assert.match(page, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(page, /lightbox\.showModal\(\)/);
});

test('원본 보기 대화상자는 닫기와 포커스 복귀를 지원한다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /closeButton\.addEventListener\('click', \(\) => lightbox\.close\(\)\)/);
  assert.match(page, /if \(event\.target === lightbox\) lightbox\.close\(\)/);
  assert.match(page, /lightbox\.addEventListener\('close'/);
  assert.match(page, /triggerImage\?\.focus\(\)/);
  assert.match(page, /document\.documentElement\.classList\.remove\('image-lightbox-open'\)/);
});

test('대화상자는 실제 이미지 크기를 유지하고 필요할 때 화면 맞춤으로 전환한다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /\.image-lightbox__viewport\s*\{[\s\S]*?overflow: auto;/);
  assert.match(page, /\.image-lightbox__image\s*\{[\s\S]*?max-width: none;[\s\S]*?max-height: none;/);
  assert.match(page, /data-lightbox-fit="true"/);
  assert.match(page, /\.image-lightbox\[data-lightbox-fit="true"\] \.image-lightbox__image\s*\{[\s\S]*?max-width: 100%;[\s\S]*?max-height: 100%;/);
  assert.match(page, /fitButton\.textContent = isFit \? '확대 보기' : '화면에 맞추기'/);
  assert.match(page, /\.post-article img\[data-lightbox-ready="true"\][\s\S]*?cursor: zoom-in;/);
});

test('확대 이미지는 기본 125퍼센트로 열리고 100퍼센트부터 300퍼센트까지 조절할 수 있다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /data-lightbox-zoom-out/);
  assert.match(page, /data-lightbox-zoom-status[^>]*>125%/);
  assert.match(page, /data-lightbox-zoom-in/);
  assert.match(page, /const DEFAULT_ZOOM = 1\.25;/);
  assert.match(page, /const MIN_ZOOM = 1;/);
  assert.match(page, /const MAX_ZOOM = 3;/);
  assert.match(page, /const ZOOM_STEP = 0\.25;/);
  assert.match(page, /expandedImage\.style\.width = `\$\{Math\.round\(baseWidth \* zoom\)\}px`/);
  assert.match(page, /zoomStatus\.textContent = isFit \? '맞춤' : `\$\{Math\.round\(zoom \* 100\)\}%`/);
  assert.match(page, /zoomOutButton\.addEventListener\('click'/);
  assert.match(page, /zoomInButton\.addEventListener\('click'/);
});

test('화면 맞춤은 가로와 세로 여유를 함께 계산해 세로로 긴 이미지도 대화상자 안에 맞춘다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /const canvas = lightbox\?\.querySelector\('\.image-lightbox__canvas'\)/);
  assert.match(page, /let baseHeight = 0;/);
  assert.match(page, /const availableWidth = Math\.max\(1, viewport\.clientWidth - horizontalPadding\)/);
  assert.match(page, /const availableHeight = Math\.max\(1, viewport\.clientHeight - verticalPadding\)/);
  assert.match(page, /const fitScale = Math\.min\(availableWidth \/ baseWidth, availableHeight \/ baseHeight, 1\)/);
  assert.match(page, /expandedImage\.style\.width = `\$\{Math\.max\(1, Math\.floor\(baseWidth \* fitScale\)\)\}px`/);
  assert.match(page, /window\.addEventListener\('resize',[\s\S]*?updateZoom\(\)/);
});
