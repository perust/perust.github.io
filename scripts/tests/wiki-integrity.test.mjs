import assert from 'node:assert/strict';
import test from 'node:test';

import { assertWikiIntegrity } from '../../src/utils/wiki-integrity.mjs';

const books = [{ id: 'web-building', data: { title: '웹사이트 만들기와 운영' } }];

const page = (id, book, slug, order, part = '기본 부') => ({
  id,
  data: { book, slug, order, part, title: id },
});

test('서로 다른 장 경로와 순서는 위키 무결성 검사를 통과한다', () => {
  assert.doesNotThrow(() =>
    assertWikiIntegrity(books, [
      page('one', 'web-building', 'site-structure', 1),
      page('two', 'web-building', 'content-collections', 2),
    ]),
  );
});

test('같은 책에서 중복된 slug는 동일한 정적 경로가 되므로 실패한다', () => {
  assert.throws(
    () =>
      assertWikiIntegrity(books, [
        page('one', 'web-building', 'same-path', 1),
        page('two', 'web-building', 'same-path', 2),
      ]),
    /중복 위키 경로.*web-building\/same-path.*one.*two/,
  );
});

test('같은 책에서 중복된 order는 목차와 이전·다음 순서를 모호하게 하므로 실패한다', () => {
  assert.throws(
    () =>
      assertWikiIntegrity(books, [
        page('one', 'web-building', 'first', 1),
        page('two', 'web-building', 'second', 1),
      ]),
    /중복 위키 순서.*web-building.*1.*one.*two/,
  );
});

test('존재하지 않는 책을 참조하는 장은 실패한다', () => {
  assert.throws(
    () => assertWikiIntegrity(books, [page('orphan', 'missing-book', 'orphan', 1)]),
    /존재하지 않는 위키 책.*missing-book.*orphan/,
  );
});

test('한 부가 다른 부 뒤에서 재등장하면 목차와 페이저 순서가 달라지므로 실패한다', () => {
  assert.throws(
    () =>
      assertWikiIntegrity(books, [
        page('one', 'web-building', 'one', 1, 'A'),
        page('two', 'web-building', 'two', 2, 'B'),
        page('three', 'web-building', 'three', 3, 'A'),
      ]),
    /비연속 위키 부.*web-building.*A.*one.*three/,
  );
});

test('공개 책에 장이 하나도 없으면 실패한다', () => {
  assert.throws(
    () =>
      assertWikiIntegrity(
        [...books, { id: 'empty-book', data: { title: '빈 책' } }],
        [page('one', 'web-building', 'one', 1)],
      ),
    /장 없는 위키 책.*empty-book/,
  );
});

test('한 세그먼트 책 라우트로 표현할 수 없는 중첩 책 ID는 실패한다', () => {
  assert.throws(
    () => assertWikiIntegrity([{ id: 'web/nested' }], []),
    /표현할 수 없는 위키 책 ID.*web\/nested/,
  );
});
