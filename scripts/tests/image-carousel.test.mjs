import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);
const carouselPosts = [
  new URL('src/content/blog/2026-07-26-vibe-coding-week3-handwriting-recognition.md', root),
  new URL('src/content/blog/2026-08-04-vibe-coding-week4-todo-quiz.md', root),
];

test('모든 이미지 캐러셀에 이전·다음 버튼과 현재 사진 표시가 있다', async () => {
  const posts = await Promise.all(carouselPosts.map((path) => readFile(path, 'utf8')));
  const combined = posts.join('\n');
  const carouselCount = (combined.match(/data-image-carousel/g) ?? []).length;

  assert.equal(carouselCount, 3, '세 개의 기존 이미지 캐러셀을 모두 새 마크업으로 변환해야 한다');
  assert.equal((combined.match(/data-carousel-prev/g) ?? []).length, carouselCount);
  assert.equal((combined.match(/data-carousel-next/g) ?? []).length, carouselCount);
  assert.equal((combined.match(/data-carousel-status/g) ?? []).length, carouselCount);
  assert.equal((combined.match(/aria-label="이전 사진"/g) ?? []).length, carouselCount);
  assert.equal((combined.match(/aria-label="다음 사진"/g) ?? []).length, carouselCount);
});

test('블로그 페이지가 버튼 상태와 사진 번호를 스크롤 위치에 맞춰 갱신한다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /querySelectorAll\('\[data-image-carousel\]'\)/);
  assert.match(page, /data-carousel-prev/);
  assert.match(page, /data-carousel-next/);
  assert.match(page, /data-carousel-status/);
  assert.match(page, /previous\.disabled/);
  assert.match(page, /next\.disabled/);
  assert.match(page, /scrollTo\(\{\s*left:/);
  assert.match(page, /addEventListener\('scroll'/);
});
