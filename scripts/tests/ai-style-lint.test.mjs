import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lintMarkdownAiStyle, markdownProseLines } from '../lib/ai-style-lint.mjs';

const lint = (body) => lintMarkdownAiStyle(`---\ntitle: "fixture — metadata"\ndescription: "물론입니다"\n---\n\n${body}\n`);
const failureIds = (body) => lint(body).failures.map(({ ruleId }) => ruleId);
const warningIds = (body) => lint(body).warnings.map(({ ruleId }) => ruleId);

test('em dash와 제목 이모지는 high-confidence failure다', () => {
  assert.deepEqual(failureIds('평범한 문장 — 덧붙인 문장\n\n## 🚀 빠른 시작'), [
    'em-dash',
    'decorative-heading-emoji',
  ]);
});

test('독립 문단의 챗봇 답변 잔재를 차단한다', () => {
  const result = lint([
    '물론입니다! 요청하신 내용을 확인했습니다.',
    '다음과 같이 정리해 드리겠습니다.',
    '이 답변이 도움이 되었기를 바랍니다.',
    '원하시면 표로 정리해 드릴게요.',
    '원하시면 추가 조건을 알려 주세요.',
  ].join('\n\n'));
  assert.deepEqual(result.failures.map(({ ruleId }) => ruleId), [
    'chatbot-preface',
    'chatbot-summary-offer',
    'chatbot-closing-wish',
    'chatbot-followup-offer',
    'chatbot-followup-request',
  ]);
});

test('frontmatter, fenced/indented/inline code, URL, 링크 원제와 HTML 속성은 검사하지 않는다', () => {
  const body = [
    '```text',
    '물론입니다! — 코드 fixture',
    '## 🚀 코드 제목',
    '```',
    '    물론입니다! — 들여쓴 코드',
    '`물론입니다! — 인라인 코드` 뒤의 정상 문장입니다.',
    '[기사 원제 — 긴 부제](https://example.com/a—b)를 확인했습니다.',
    '<a title="물론입니다 — 🚀" href="https://example.com">정상 링크</a>',
  ].join('\n');
  assert.deepEqual(lint(body).failures, []);
});

test('raw HTML 속성은 제외하지만 독자에게 보이는 챗봇 잔재는 차단한다', () => {
  assert.deepEqual(failureIds('<p class="물론입니다 — 속성">물론입니다! 요청하신 글입니다.</p>'), ['chatbot-preface']);
});

test('인라인 HTML comment는 가시 본문의 high-confidence 흔적을 숨기지 못한다', () => {
  assert.deepEqual(failureIds('물론입니다! 요청하신 글입니다. <!-- 편집 메모 -->'), ['chatbot-preface']);
  assert.deepEqual(failureIds('본문 — 덧붙임 <!-- 편집 메모 -->'), ['em-dash']);
  assert.deepEqual(lint('정상 본문 <!-- 물론입니다! — 숨은 메모 --> 이어지는 문장').failures, []);
});

test('링크 표시 문구는 가시 흔적을 검사하되 기사 원제 문장부호는 보존한다', () => {
  const body = [
    '[물론입니다! 요청하신 글입니다.](https://example.com/chatbot)',
    '[출처 필요](https://example.com/source)',
    '## [🚀 빠른 시작](https://example.com/start)',
    '[기사 원제 — 긴 부제…](https://example.com/article)',
  ].join('\n\n');
  assert.deepEqual(failureIds(body), ['chatbot-preface', 'draft-placeholder', 'decorative-heading-emoji']);
});

test('raw HTML의 가시 본문 문장부호는 차단하고 링크 원제와 속성은 제외한다', () => {
  const body = [
    '<p title="속성 — …">본문 — 덧붙임…</p>',
    '<h3><a href="https://example.com">기사 원제 — 긴 부제…</a></h3>',
  ].join('\n');
  assert.deepEqual(failureIds(body), ['em-dash', 'typographic-ellipsis']);
});

test('외부 URL에 직접 연결된 원제만 문장부호 예외이며 issue-card나 임의 링크로 우회할 수 없다', () => {
  const officialTitle = '<li class="issue-card"><h3><a href="https://example.com/article">GitHub Copilot — June update…</a></h3></li>';
  const unlinkedTitle = '<li class="issue-card"><h3>작성한 제목 — 우회…</h3><a href="https://example.com">다른 링크</a></li>';
  const hashLinkTitle = '<h3><a href="#source">작성한 제목 — 우회…</a></h3>';
  assert.deepEqual(lint(officialTitle).failures, []);
  assert.deepEqual(failureIds(unlinkedTitle), ['em-dash', 'typographic-ellipsis']);
  assert.deepEqual(failureIds(hashLinkTitle), ['em-dash', 'typographic-ellipsis']);
  assert.deepEqual(failureIds('[작성한 제목 — 우회…](#source)'), ['em-dash', 'typographic-ellipsis']);
});

test('fenced code 종료는 같은 문자와 opening 이상 길이의 독립 fence만 허용한다', () => {
  const body = [
    '````markdown',
    '```',
    '물론입니다! — 코드 내용',
    '```not-a-close',
    '물론입니다! — 여전히 코드 내용',
    '````',
    '정상 본문입니다.',
  ].join('\n');
  assert.deepEqual(lint(body).failures, []);
});

test('기사에서 챗봇 문구를 인용하거나 목록 예시로 설명하는 것은 허용한다', () => {
  const body = [
    '챗봇이 "물론입니다"로 답을 시작하는 경우가 많다.',
    '> 물론입니다! 라는 응답은 삭제한다.',
    '- 물론입니다! 같은 문구를 검사한다.',
  ].join('\n');
  assert.deepEqual(lint(body).failures, []);
});

test('인용문의 em dash와 제목의 텍스트 기호는 장식용 emoji로 오인하지 않는다', () => {
  assert.deepEqual(lint('> 원문 인용 — 출처\n\n## 저작권 © 2026').failures, []);
});

test('특수 말줄임표와 초안 자리표시자는 high-confidence failure다', () => {
  assert.deepEqual(failureIds('설명을 이어갑니다…\n\n[출처 필요]\n\nTODO: 이미지 교체'), [
    'typographic-ellipsis',
    'draft-placeholder',
    'draft-placeholder',
  ]);
});

test('과한 bold와 bold-label 목록은 warning-only다', () => {
  const body = Array.from({ length: 8 }, (_, index) => `- **항목 ${index + 1}:** 설명`).join('\n');
  const result = lint(body);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(warningIds(body), ['heavy-bold', 'bold-label-list']);
});

test('정상 정보 구조는 허용하고 사용자 교정 대상 제목만 warning한다', () => {
  assert.deepEqual(warningIds('## 핵심 요약\n\n## 무엇이 달라지나\n\n## 투자자로서의 관점'), []);
  assert.deepEqual(warningIds('## 초보 추천도'), ['generic-outline']);
});

test('상투 문구와 동일 문장 시작 반복은 warning-only다', () => {
  const body = [
    '이 글에서는 첫 항목을 알아보겠습니다.',
    '요약하자면, 선택지는 둘이다.',
    '다만 첫째 조건이 있다.',
    '다만 둘째 조건이 있다.',
    '다만 셋째 조건이 있다.',
    '다만 넷째 조건이 있다.',
  ].join('\n\n');
  const result = lint(body);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.warnings.map(({ ruleId }) => ruleId), ['cliche-prose', 'repeated-opener']);
});

test('지시형 어미가 여섯 번 이상 반복되면 warning-only다', () => {
  const body = Array.from({ length: 6 }, (_, index) => `항목 ${index + 1}은 직접 확인해야 합니다.`).join('\n\n');
  assert.deepEqual(warningIds(body), ['repeated-directive-ending']);
});

test('prose line은 원본 줄 번호를 보존한다', () => {
  const lines = markdownProseLines('---\ntitle: test\n---\n\n첫 줄\n\n둘째 줄');
  assert.deepEqual(lines.map(({ line }) => line), [5, 7]);
});
