import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('the blog index prioritizes the current post list instead of a separate Hands-on curation block', () => {
  const page = readFileSync('src/pages/blog/index.astro', 'utf8');

  assert.match(page, /class="blog-main-list"/);
  assert.doesNotMatch(page, /FEATURED_MAKER_SLUGS/);
  assert.doesNotMatch(page, /maker-title/);
  assert.doesNotMatch(page, /Hands-on/);
  assert.doesNotMatch(page, /직접 만들어보기/);
  assert.doesNotMatch(page, /직접 만들며 남긴 기록들입니다\./);
});
