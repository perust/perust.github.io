import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-04-vibe-coding-week4-todo-quiz.md', root);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);

test('4주차 실행 링크는 화살표가 있는 버튼형 카드로 표시된다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.equal((post.match(/class="app-launch-button"/g) ?? []).length, 2);
  assert.match(post, /href="\/my-what-todo\/"[^>]*class="app-launch-button"/);
  assert.match(post, /href="https:\/\/perust\.github\.io\/quiz-by-quiz\/"[^>]*class="app-launch-button"/);
  assert.equal((post.match(/바로가기 <span aria-hidden="true">→<\/span>/g) ?? []).length, 2);

  const todoButton = post.indexOf('href="/my-what-todo/"');
  const todoExplanationEnd = post.indexOf('/15.webp');
  const quizButton = post.indexOf('href="https://perust.github.io/quiz-by-quiz/"');
  const quizExplanationEnd = post.indexOf('한 번 실제로 만들어볼까 생각도 듭니다.');

  assert.ok(todoButton > todoExplanationEnd, '할 일 앱 버튼은 기능과 저장 방식 설명이 끝난 뒤에 있어야 한다');
  assert.ok(quizButton > quizExplanationEnd, '퀴즈 앱 버튼은 확장 아이디어 설명이 끝난 뒤에 있어야 한다');
});

test('버튼형 실행 링크에는 hover와 키보드 focus 스타일이 있다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /\.post-article \.app-launch-button\s*\{/);
  assert.match(page, /\.post-article \.app-launch-button:hover/);
  assert.match(page, /\.post-article \.app-launch-button:focus-visible/);
});
