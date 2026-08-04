import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-04-vibe-coding-week4-todo-quiz.md', root);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);

test('4주차 실행 링크는 화살표가 있는 버튼형 카드로 표시된다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.equal((post.match(/class="app-launch-button"/g) ?? []).length, 4);
  assert.equal((post.match(/href="\/my-what-todo\/"/g) ?? []).length, 2);
  assert.equal((post.match(/href="https:\/\/perust\.github\.io\/quiz-by-quiz\/"/g) ?? []).length, 2);
  assert.match(post, /href="\/my-what-todo\/"[^>]*class="app-launch-button"/);
  assert.match(post, /href="https:\/\/perust\.github\.io\/quiz-by-quiz\/"[^>]*class="app-launch-button"/);
  assert.equal((post.match(/바로가기 <span aria-hidden="true">→<\/span>/g) ?? []).length, 4);

  const todoButton = post.indexOf('href="/my-what-todo/"');
  const todoExplanationEnd = post.indexOf('/15.webp');
  const quizButton = post.indexOf('href="https://perust.github.io/quiz-by-quiz/"');
  const quizExplanationEnd = post.indexOf('한 번 실제로 만들어볼까 생각도 듭니다.');

  assert.ok(todoButton > todoExplanationEnd, '할 일 앱 버튼은 기능과 저장 방식 설명이 끝난 뒤에 있어야 한다');
  assert.ok(quizButton > quizExplanationEnd, '퀴즈 앱 버튼은 확장 아이디어 설명이 끝난 뒤에 있어야 한다');

  const finalSection = post.indexOf('## 앱 직접 실행하기');
  const finalTodoButton = post.lastIndexOf('href="/my-what-todo/"');
  const finalQuizButton = post.lastIndexOf('href="https://perust.github.io/quiz-by-quiz/"');
  const closingParagraph = post.indexOf('판단하는 일은 사람의 몫인 것 같습니다.');

  assert.ok(finalSection > closingParagraph, '마지막 실행 구간은 회고 본문이 끝난 뒤에 있어야 한다');
  assert.ok(finalTodoButton > finalSection && finalQuizButton > finalSection, '두 앱 실행 버튼은 마지막 실행 구간에 함께 있어야 한다');
  assert.match(post.trim(), /quiz by quiz 실행하기[\s\S]*<\/a>$/);
});

test('퀴즈 게임 모드 설명과 실제 화면이 실행 버튼보다 먼저 표시된다', async () => {
  const post = await readFile(postPath, 'utf8');
  const section = post.indexOf('## 게임 모드로 정답 고르기');
  const expansion = post.indexOf('## 퀴즈 게임에서 더 해보고 싶었던 것');
  const quizButton = post.indexOf('href="https://perust.github.io/quiz-by-quiz/"');

  assert.ok(section > expansion && section < quizButton, '게임 모드 설명은 확장 아이디어 뒤, 실행 버튼 앞에 있어야 한다');
  assert.match(post, /게임 모드가 켜져 있으면/);
  assert.match(post, /엔터나 스페이스 키로 정답을 확정/);
  assert.match(post, /\/22\.webp/);
  assert.match(post, /\/23\.webp/);
  assert.ok(quizButton > section, '실행 버튼은 게임 모드 설명 뒤에 있어야 한다');

  await Promise.all([
    access(new URL('public/images/posts/2026-08-04-vibe-coding-week4/22.webp', root)),
    access(new URL('public/images/posts/2026-08-04-vibe-coding-week4/23.webp', root)),
  ]);
});

test('버튼형 실행 링크에는 hover와 키보드 focus 스타일이 있다', async () => {
  const page = await readFile(blogPagePath, 'utf8');

  assert.match(page, /\.post-article \.app-launch-button\s*\{/);
  assert.match(page, /\.post-article \.app-launch-button:hover/);
  assert.match(page, /\.post-article \.app-launch-button:focus-visible/);
});
