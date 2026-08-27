import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as lintModule from '../lib/ai-style-lint.mjs';

const { lintMarkdownAiStyle, markdownProseLines } = lintModule;
const fixtureMarkdown = (body, frontmatter = []) => [
  '---',
  'title: "fixture — metadata"',
  'description: "물론입니다"',
  ...frontmatter,
  '---',
  '',
  body,
  '',
].join('\n');
const lint = (body) => lintMarkdownAiStyle(fixtureMarkdown(body));
// RED에서도 나머지 새 규칙이 실제 assertion failure로 드러나도록, neutral export가 아직 없으면
// 기존 구현을 호출한다. neutral export 자체는 별도 테스트가 명시적으로 요구한다.
const qualityLint = (body, context = {}, frontmatter = []) =>
  (lintModule.lintMarkdownEditorialQuality ?? lintMarkdownAiStyle)(fixtureMarkdown(body, frontmatter), context);
const failureIds = (body) => lint(body).failures.map(({ ruleId }) => ruleId);
const warningIds = (body) => lint(body).warnings.map(({ ruleId }) => ruleId);
const qualityWarningIds = (body, context = {}, frontmatter = []) =>
  qualityLint(body, context, frontmatter).warnings.map(({ ruleId }) => ruleId);

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

test('comment prefix 뒤 marker는 fence/quote/indent exclusion으로 재분류되지 않는다', () => {
  const blockerCases = [
    ['chatbot-preface', '물론입니다! 요청하신 글입니다.'],
    ['em-dash', '본문 — 덧붙임'],
    ['typographic-ellipsis', '본문…'],
    ['draft-placeholder', '[출처 필요]'],
  ];
  const wrappers = [
    ['fence', (payload) => ['<!-- note -->```text', payload, '```'].join('\n')],
    ['quote', (payload) => `<!-- note --> > ${payload}`],
    ['indent', (payload) => `<!-- note -->    ${payload}`],
  ];

  for (const [syntax, wrap] of wrappers) {
    for (const [ruleId, payload] of blockerCases) {
      assert.deepEqual(failureIds(wrap(payload)), [ruleId], `${syntax} / ${ruleId}`);
    }
  }
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

test('neutral editorial-quality export는 compatibility alias와 같은 결과를 낸다', () => {
  const neutral = lintModule.lintMarkdownEditorialQuality;
  assert.equal(typeof neutral, 'function');
  assert.strictEqual(lintMarkdownAiStyle, neutral);

  const markdown = fixtureMarkdown('## 초보 추천도\n\n본문입니다.');
  assert.deepEqual(
    neutral(markdown, { valueType: 'review', category: '책 서평' }),
    lintMarkdownAiStyle(markdown, { valueType: 'review', category: '책 서평' }),
  );
});

const DUPLICATE_BLOCK = [
  '실제 입력과 출력 조건을 함께 기록하고 재현 순서를 구체적으로 설명해,',
  '독자가 같은 절차를 다시 확인할 때 필수 제한 사항과 관찰 결과를 빠짐없이 비교할 수 있도록 정리했습니다.',
].join(' ');

test('80자 이상 normalized prose block이 두 번 나오면 duplicate-prose-block을 한 번 경고한다', () => {
  assert.ok(DUPLICATE_BLOCK.length >= 80, 'fixture prose block은 80자 이상이어야 한다');
  const duplicateWithWhitespace = DUPLICATE_BLOCK.replaceAll(' ', '   ');
  const result = qualityLint(`${DUPLICATE_BLOCK}\n\n  ${duplicateWithWhitespace}  `);
  assert.deepEqual(result.warnings.filter(({ ruleId }) => ruleId === 'duplicate-prose-block').map(({ ruleId }) => ruleId), [
    'duplicate-prose-block',
  ]);
  assert.equal(result.stats.duplicateProseBlockCount, 1);
});

test('duplicate-prose-block은 비본문 구조와 control/figure/CTA markup을 세지 않는다', () => {
  const excludedCases = [
    {
      name: 'frontmatter',
      frontmatter: [`noteOne: "${DUPLICATE_BLOCK}"`, `noteTwo: "${DUPLICATE_BLOCK}"`],
      body: '서로 다른 정상 본문입니다.',
    },
    { name: 'fenced code', body: `\`\`\`text\n${DUPLICATE_BLOCK}\n\`\`\`\n\n\`\`\`text\n${DUPLICATE_BLOCK}\n\`\`\`` },
    { name: 'inline code', body: `\`${DUPLICATE_BLOCK}\`\n\n\`${DUPLICATE_BLOCK}\`` },
    { name: 'HTML comment', body: `<!-- ${DUPLICATE_BLOCK} -->\n\n<!-- ${DUPLICATE_BLOCK} -->` },
    { name: 'blockquote', body: `> ${DUPLICATE_BLOCK}\n\n> ${DUPLICATE_BLOCK}` },
    { name: 'heading', body: `## ${DUPLICATE_BLOCK}\n\n## ${DUPLICATE_BLOCK}` },
    { name: 'list item/label', body: `- **${DUPLICATE_BLOCK}:**\n\n- **${DUPLICATE_BLOCK}:**` },
    { name: 'external link markup', body: `[${DUPLICATE_BLOCK}](https://example.com/one)\n\n[${DUPLICATE_BLOCK}](https://example.com/two)` },
    { name: 'image markup', body: `![${DUPLICATE_BLOCK}](/one.png)\n\n![${DUPLICATE_BLOCK}](/two.png)` },
    { name: 'internal/hash link markup', body: `[${DUPLICATE_BLOCK}](/inside)\n\n[${DUPLICATE_BLOCK}](#inside)` },
    { name: 'HTML control', body: `<button>${DUPLICATE_BLOCK}</button>\n\n<button>${DUPLICATE_BLOCK}</button>` },
    { name: 'figure markup', body: `<figure><figcaption>${DUPLICATE_BLOCK}</figcaption></figure>\n\n<figure><figcaption>${DUPLICATE_BLOCK}</figcaption></figure>` },
    { name: 'CTA markup', body: `<a class="cta-button" href="/one">${DUPLICATE_BLOCK}</a>\n\n<a class="cta-button" href="/two">${DUPLICATE_BLOCK}</a>` },
  ];

  for (const { name, body, frontmatter = [] } of excludedCases) {
    assert.ok(
      !qualityWarningIds(body, {}, frontmatter).includes('duplicate-prose-block'),
      `${name}은 duplicate prose로 세면 안 된다`,
    );
  }
});

test('abstract-evaluation-density는 visible exact term 7개는 허용하고 8개부터 한 번 경고한다', () => {
  const seven = '좋은 중요한 필요한 좋은 중요한 필요한 좋은';
  const eight = `${seven} 필요한`;
  assert.ok(!qualityWarningIds(seven).includes('abstract-evaluation-density'));

  const result = qualityLint(eight);
  assert.deepEqual(result.warnings.filter(({ ruleId }) => ruleId === 'abstract-evaluation-density').map(({ ruleId }) => ruleId), [
    'abstract-evaluation-density',
  ]);
  assert.equal(result.stats.abstractEvaluationCount, 8);
});

test('abstract-evaluation-density는 frontmatter/code/comment/quote/heading/list의 term을 세지 않는다', () => {
  const terms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const body = [
    `\`\`${terms}\`\``,
    `\`${terms}\``,
    `<!-- ${terms} -->`,
    `> ${terms}`,
    `## ${terms}`,
    `- ${terms}`,
    '일반 본문입니다.',
  ].join('\n\n');
  const result = qualityLint(body, {}, [`note: "${terms}"`]);
  assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'));
  assert.equal(result.stats.abstractEvaluationCount, 0);
});

test('nested HTML heading/list는 abstract-evaluation-density prose에서 제외한다', () => {
  const terms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const cases = [
    ['heading', `<section><h2>${terms}</h2></section>`],
    ['list', `<div><ul><li>${terms}</li></ul></div>`],
  ];
  for (const [name, body] of cases) {
    const result = qualityLint(body);
    assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'), name);
    assert.equal(result.stats.abstractEvaluationCount, 0, name);
  }
});

test('nested HTML heading/list는 duplicate-prose-block prose에서 제외한다', () => {
  const cases = [
    ['heading', `<section><h2>${DUPLICATE_BLOCK}</h2></section>`],
    ['list', `<div><ol><li>${DUPLICATE_BLOCK}</li></ol></div>`],
  ];
  for (const [name, block] of cases) {
    const result = qualityLint(`${block}\n\n${block}`);
    assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'duplicate-prose-block'), name);
    assert.equal(result.stats.duplicateProseBlockCount, 0, name);
  }
});

test('multiline HTML heading/list exclusion은 같은 줄의 인접 visible prose를 보존한다', () => {
  const eightTerms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const body = [
    '좋은 중요한 필요한 <h2>',
    eightTerms,
    '</h2> 좋은 중요한 필요한 좋은',
    '목록 앞 설명 <ul>',
    '<li>',
    eightTerms,
    '</li>',
    '</ul> 목록 뒤 설명',
  ].join('\n');
  const result = qualityLint(body);
  assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'));
  assert.equal(result.stats.abstractEvaluationCount, 7);

  const visibleCrossover = qualityLint(`<h2>제외할 제목</h2>\n${eightTerms}`);
  assert.ok(visibleCrossover.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'));
  assert.equal(visibleCrossover.stats.abstractEvaluationCount, 8);
});

test('multiline HTML control exclusion은 내부 중복만 제외하고 인접 visible prose는 보존한다', () => {
  const excludedControls = [
    '<button>',
    DUPLICATE_BLOCK,
    '</button>',
    '',
    '<button>',
    DUPLICATE_BLOCK,
    '</button>',
  ].join('\n');
  const excludedResult = qualityLint(excludedControls);
  assert.ok(!excludedResult.warnings.some(({ ruleId }) => ruleId === 'duplicate-prose-block'));
  assert.equal(excludedResult.stats.duplicateProseBlockCount, 0);

  const visibleCrossover = [
    '<button>',
    '첫 번째 제어 문구',
    `</button>${DUPLICATE_BLOCK}`,
    '',
    '<button>',
    '두 번째 제어 문구',
    `</button>${DUPLICATE_BLOCK}`,
  ].join('\n');
  const visibleResult = qualityLint(visibleCrossover);
  assert.ok(visibleResult.warnings.some(({ ruleId }) => ruleId === 'duplicate-prose-block'));
  assert.equal(visibleResult.stats.duplicateProseBlockCount, 1);
});

test('research-source-gap은 researched valueType과 pre-reading category에만 routing한다', () => {
  const body = '확인할 내용을 독자가 이해할 수 있도록 정리한 본문입니다.';
  for (const context of [
    { valueType: 'verified-guide', category: 'AI/IT 정보' },
    { valueType: 'original-analysis', category: '경제 정보' },
    { valueType: 'review', category: '미리 알아보는 책 정보' },
  ]) {
    assert.ok(qualityWarningIds(body, context).includes('research-source-gap'), JSON.stringify(context));
  }
  assert.ok(!qualityWarningIds(body, { valueType: 'review', category: '책 서평' }).includes('research-source-gap'));
  assert.ok(!qualityWarningIds(body, { valueType: 'experience', category: '도서 학습 챌린지' }).includes('research-source-gap'));
});

test('visible Markdown/HTML/autolink external body anchor만 research-source-gap을 해소한다', () => {
  const anchorCases = [
    ['Markdown', '[공식 원문](https://example.com/source)'],
    ['HTML', '<a class="source" href="https://example.com/source">공식 원문</a>'],
    ['multiline HTML', ['<a class="source"', '  href="https://example.com/source">', '  <span>공식 원문</span>', '</a>'].join('\n')],
    ['autolink', '<https://example.com/source>'],
  ];
  for (const [name, anchor] of anchorCases) {
    const result = qualityLint(`확인한 자료는 ${anchor}입니다.`, { valueType: 'verified-guide' });
    assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'), name);
    assert.equal(result.stats.uniqueExternalSourceCount, 1, name);
  }
});

test('defined visible reference-style external link만 research-source-gap을 해소한다', () => {
  const definitionOnlyTerms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const definedBody = [
    '확인한 자료는 [공식 원문][source]입니다.',
    '',
    '[source]: https://example.com/reference-source',
    `[${definitionOnlyTerms}]: https://example.com/definition-only`,
  ].join('\n');
  const definedResult = qualityLint(definedBody, { valueType: 'verified-guide' });
  assert.ok(!definedResult.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(definedResult.stats.uniqueExternalSourceCount, 1);
  assert.equal(definedResult.stats.abstractEvaluationCount, 0, 'reference definition은 prose가 아니다');

  for (const [name, anchor] of [
    ['unresolved reference', '[공식 원문][missing]'],
    ['empty visible label', '[][source]\n\n[source]: https://example.com/reference-source'],
  ]) {
    const result = qualityLint(anchor, { valueType: 'verified-guide' });
    assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'), name);
    assert.equal(result.stats.uniqueExternalSourceCount, 0, name);
  }
});

test('defined shortcut reference link는 source로 세고 기존 inline/full/collapsed form을 보존한다', () => {
  const renderedCases = [
    ['shortcut', '확인한 자료는 [공식 원문]입니다.\n\n[공식 원문]: https://example.com/shortcut-source'],
    ['inline', '확인한 자료는 [공식 원문](https://example.com/inline-source)입니다.'],
    ['full', '확인한 자료는 [공식 원문][source]입니다.\n\n[source]: https://example.com/full-source'],
    ['collapsed', '확인한 자료는 [공식 원문][]입니다.\n\n[공식 원문]: https://example.com/collapsed-source'],
  ];
  for (const [name, body] of renderedCases) {
    const result = qualityLint(body, { valueType: 'verified-guide' });
    assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'), name);
    assert.equal(result.stats.uniqueExternalSourceCount, 1, name);
  }

  const unresolved = qualityLint(
    '확인한 자료는 [공식 원문]입니다.',
    { valueType: 'verified-guide' },
  );
  assert.ok(unresolved.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(unresolved.stats.uniqueExternalSourceCount, 0);
});

test('reference definition-only line은 source/media/editorial prose로 세지 않는다', () => {
  const terms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const body = [
    `[${terms}]: https://example.com/definition-only-source`,
    '[실행 화면]: https://example.com/definition-only-image.png',
  ].join('\n');

  const research = qualityLint(body, { valueType: 'verified-guide' });
  assert.ok(research.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(research.stats.uniqueExternalSourceCount, 0);
  assert.equal(research.stats.bodyMediaCount, 0);
  assert.equal(research.stats.proseLines, 0);
  assert.equal(research.stats.abstractEvaluationCount, 0);
  assert.equal(research.stats.duplicateProseBlockCount, 0);

  const experience = qualityLint(body, { valueType: 'experience' });
  assert.ok(experience.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(experience.stats.uniqueExternalSourceCount, 0);
  assert.equal(experience.stats.bodyMediaCount, 0);
});

test('visible unquoted HTML href만 research-source-gap을 해소한다', () => {
  const visibleResult = qualityLint(
    '<a class=source href=https://example.com/unquoted-source>공식 원문</a>',
    { valueType: 'original-analysis' },
  );
  assert.ok(!visibleResult.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(visibleResult.stats.uniqueExternalSourceCount, 1);

  const emptyResult = qualityLint(
    '<a href=https://example.com/unquoted-source></a>',
    { valueType: 'original-analysis' },
  );
  assert.ok(emptyResult.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(emptyResult.stats.uniqueExternalSourceCount, 0);
});

test('hidden/non-rendered HTML anchor는 research-source-gap을 해소하지 않는다', () => {
  const hiddenCases = [
    ['hidden anchor', '<a hidden href="https://example.com/source">공식 원문</a>'],
    ['hidden container', '<div hidden><a href="https://example.com/source">공식 원문</a></div>'],
    ['display none container', '<div style="display: none"><a href="https://example.com/source">공식 원문</a></div>'],
    ['template container', '<template><a href="https://example.com/source">공식 원문</a></template>'],
  ];
  for (const [name, body] of hiddenCases) {
    const result = qualityLint(body, { valueType: 'verified-guide' });
    assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'), name);
    assert.equal(result.stats.uniqueExternalSourceCount, 0, name);
  }
});

test('숨은 URL·image·빈/internal/hash link는 research-source-gap을 해소하지 않는다', () => {
  const body = [
    '원시 주소 https://example.com/raw 는 anchor가 아닙니다.',
    '![외부 이미지](https://example.com/image.png)',
    '[](https://example.com/empty)',
    '[내부 문서](/inside)',
    '[같은 문서](#inside)',
    '<img src="https://example.com/image.png" alt="외부 이미지">',
    '<video src="https://example.com/video.mp4"></video>',
    '`[인라인 코드 링크](https://example.com/inline)`',
    '<!-- [주석 링크](https://example.com/comment) -->',
    '```markdown',
    '[코드 링크](https://example.com/code)',
    '```',
    '[정의]: https://example.com/reference',
  ].join('\n\n');
  const result = qualityLint(body, { valueType: 'original-analysis' }, ['source: "https://example.com/frontmatter"']);
  assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'));
  assert.equal(result.stats.uniqueExternalSourceCount, 0);
});

test('experience-support-scarcity는 firsthand pronoun만 있는 experience를 경고한다', () => {
  const result = qualityLint('나는 직접 써 봤고 내가 느낀 과정을 솔직하게 적었습니다.', { valueType: 'experience' });
  assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
});

test('네 experience marker class는 scarcity만 해소하고 다른 경고는 그대로 둔다', () => {
  const abstractTerms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const markerCases = [
    ['external anchor', '[실행 기록](https://example.com/run)'],
    ['Markdown image', '![실행 화면](/images/run.png)'],
    ['HTML video', '<video controls src="/videos/run.mp4"></video>'],
    ['fenced code/output', '```text\n실행 결과가 출력되었습니다.\n```'],
    ['numeric/date/unit detail', '처리 시간은 37초였고 기록일은 2026-08-27입니다.'],
  ];
  for (const [name, marker] of markerCases) {
    const ids = qualityWarningIds(`${abstractTerms}\n\n${marker}`, { valueType: 'experience' });
    assert.ok(!ids.includes('experience-support-scarcity'), name);
    assert.ok(ids.includes('abstract-evaluation-density'), `${name}은 다른 warning을 suppress하면 안 된다`);
  }
});

test('empty fence는 experience-support-scarcity를 해소하는 output이 아니다', () => {
  const result = qualityLint('```text\n\n```\n\n직접 실행한 경험을 설명한 본문입니다.', { valueType: 'experience' });
  assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(result.stats.codeFenceCount, 0);
});

test('hidden/non-rendered body media는 experience-support-scarcity를 해소하지 않는다', () => {
  const hiddenCases = [
    ['hidden image', '<img hidden src="/images/run.png" alt="실행 화면">'],
    ['hidden container', '<div hidden><img src="/images/run.png" alt="실행 화면"></div>'],
    ['display none container', '<div style="display:none"><video src="/videos/run.mp4"></video></div>'],
    ['template container', '<template><img src="/images/run.png" alt="실행 화면"></template>'],
  ];
  for (const [name, marker] of hiddenCases) {
    const result = qualityLint(`${marker}\n\n직접 실행한 경험을 설명한 본문입니다.`, { valueType: 'experience' });
    assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'), name);
    assert.equal(result.stats.bodyMediaCount, 0, name);
  }
});

test('visible reference-style image는 experience-support-scarcity를 해소한다', () => {
  const body = ['![실행 화면][run]', '', '[run]: /images/run.png', '', '직접 실행한 경험을 설명한 본문입니다.'].join('\n');
  const result = qualityLint(body, { valueType: 'experience' });
  assert.ok(!result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(result.stats.bodyMediaCount, 1);
});

test('unresolved reference image는 experience-support-scarcity를 해소하지 않는다', () => {
  const unresolved = qualityLint(
    '![실행 화면][missing]\n\n직접 실행한 경험을 설명한 본문입니다.',
    { valueType: 'experience' },
  );
  assert.ok(unresolved.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(unresolved.stats.bodyMediaCount, 0);

  const resolved = qualityLint(
    '![실행 화면][run]\n\n[run]: /images/run.png\n\n직접 실행한 경험을 설명한 본문입니다.',
    { valueType: 'experience' },
  );
  assert.ok(!resolved.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(resolved.stats.bodyMediaCount, 1);
});

test('defined shortcut reference image는 media로만 세고 기존 inline/full/collapsed form을 보존한다', () => {
  const renderedCases = [
    ['shortcut', '![실행 화면]\n\n[실행 화면]: https://example.com/shortcut-image.png'],
    ['inline', '![실행 화면](https://example.com/inline-image.png)'],
    ['full', '![실행 화면][run]\n\n[run]: https://example.com/full-image.png'],
    ['collapsed', '![실행 화면][]\n\n[실행 화면]: https://example.com/collapsed-image.png'],
  ];
  for (const [name, body] of renderedCases) {
    const experience = qualityLint(body, { valueType: 'experience' });
    assert.ok(!experience.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'), name);
    assert.equal(experience.stats.bodyMediaCount, 1, name);
    assert.equal(experience.stats.uniqueExternalSourceCount, 0, `${name} image는 source가 아니다`);

    const research = qualityLint(body, { valueType: 'verified-guide' });
    assert.ok(research.warnings.some(({ ruleId }) => ruleId === 'research-source-gap'), `${name} image는 source warning을 해소하지 않는다`);
    assert.equal(research.stats.uniqueExternalSourceCount, 0, name);
  }

  for (const [name, body] of [
    ['shortcut', '![실행 화면]'],
    ['full', '![실행 화면][missing]'],
    ['collapsed', '![실행 화면][]'],
  ]) {
    const result = qualityLint(body, { valueType: 'experience' });
    assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'), name);
    assert.equal(result.stats.bodyMediaCount, 0, name);
  }
});

test('defined shortcut token-only line은 editorial prose가 아니고 surrounding visible prose는 유지한다', () => {
  const sevenTerms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은';
  const eightTerms = `${sevenTerms} 필요한`;
  const longShortcutLabel = [
    eightTerms,
    '독자가 같은 절차를 반복할 때 입력값과 출력 결과를 비교할 수 있도록 재현 순서와 제한 조건을 빠짐없이 기록한 공식 자료',
  ].join(' ');
  assert.equal([...longShortcutLabel.matchAll(/좋은|중요한|필요한/g)].length, 8);
  assert.ok(longShortcutLabel.length >= 80);

  const shortcutCases = [
    ['link', `[${longShortcutLabel}]`, `[${longShortcutLabel}]: https://example.com/shortcut-prose-source`],
    ['image', `![${longShortcutLabel}]`, `[${longShortcutLabel}]: https://example.com/shortcut-prose-image.png`],
  ];
  for (const [name, token, definition] of shortcutCases) {
    const excluded = qualityLint([token, '', token, '', sevenTerms, '', definition].join('\n'));
    assert.ok(!excluded.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'), name);
    assert.ok(!excluded.warnings.some(({ ruleId }) => ruleId === 'duplicate-prose-block'), name);
    assert.equal(excluded.stats.abstractEvaluationCount, 7, name);
    assert.equal(excluded.stats.duplicateProseBlockCount, 0, name);

    const visibleAbstract = qualityLint([token, '', eightTerms, '', definition].join('\n'));
    assert.ok(visibleAbstract.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'), name);
    assert.equal(visibleAbstract.stats.abstractEvaluationCount, 8, name);

    const visibleDuplicate = qualityLint([token, '', DUPLICATE_BLOCK, '', DUPLICATE_BLOCK, '', definition].join('\n'));
    assert.ok(visibleDuplicate.warnings.some(({ ruleId }) => ruleId === 'duplicate-prose-block'), name);
    assert.equal(visibleDuplicate.stats.duplicateProseBlockCount, 1, name);

    const unresolved = qualityLint(token);
    assert.ok(unresolved.warnings.some(({ ruleId }) => ruleId === 'abstract-evaluation-density'), name);
    assert.equal(unresolved.stats.abstractEvaluationCount, 8, name);
  }
});

test('frontmatter/inline code/comment의 marker 모양은 experience support가 아니다', () => {
  const body = [
    '`42초 https://example.com/inline`',
    '<!-- ![실행 화면](/images/run.png) 2026-08-27 -->',
    '나는 직접 써 본 과정을 글로 적었습니다.',
  ].join('\n\n');
  const result = qualityLint(body, { valueType: 'experience' }, [
    'image: "https://example.com/frontmatter.png"',
    'metric: "42초"',
  ]);
  assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'experience-support-scarcity'));
  assert.equal(result.stats.bodyMediaCount, 0);
  assert.equal(result.stats.numericDetailLineCount, 0);
});

test('legacy editorialReview flag는 review 증거가 아니며 다른 finding을 suppress하지 않는다', () => {
  for (const value of ['true', 'false']) {
    assert.ok(
      qualityWarningIds('일반 본문입니다.', { valueType: 'review' }, [`editorialReview: ${value}`])
        .includes('legacy-editorial-review-flag'),
      value,
    );
  }

  const ids = qualityWarningIds(
    '외부 source anchor가 없는 분석 본문입니다.',
    { valueType: 'original-analysis' },
    ['editorialReview: true'],
  );
  assert.ok(ids.includes('legacy-editorial-review-flag'));
  assert.ok(ids.includes('research-source-gap'));
});

test('quoted YAML editorialReview key도 legacy field presence로 경고한다', () => {
  for (const key of ['"editorialReview"', "'editorialReview'"]) {
    const result = qualityLint('일반 본문입니다.', { valueType: 'review' }, [`${key}: true`]);
    const warning = result.warnings.find(({ ruleId }) => ruleId === 'legacy-editorial-review-flag');
    assert.ok(warning, key);
    assert.equal(warning.line, 4, key);
  }
});

test('text-only review는 research/experience warning을 받지 않는다', () => {
  const ids = qualityWarningIds('책의 논지를 읽고 느낀 점을 텍스트로 정리했습니다.', {
    valueType: 'review',
    category: '책 서평',
  });
  assert.ok(!ids.includes('research-source-gap'));
  assert.ok(!ids.includes('experience-support-scarcity'));
});

test('editorial finding message는 AI authorship을 주장하지 않는다', () => {
  const result = qualityLint('## 초보 추천도');
  assert.ok(result.warnings.some(({ ruleId }) => ruleId === 'generic-outline'));
  for (const finding of [...result.failures, ...result.warnings]) {
    assert.doesNotMatch(finding.message, /AI (?:문서|문체|작성|생성)/);
  }
});

test('editorial stats는 source/media/fence/numeric/abstract/duplicate 관찰값을 보존한다', () => {
  const terms = '좋은 중요한 필요한 좋은 중요한 필요한 좋은 필요한';
  const body = [
    terms,
    DUPLICATE_BLOCK,
    DUPLICATE_BLOCK,
    '[공식 기록](https://example.com/source)',
    '<a href="https://example.com/source">같은 공식 기록</a>',
    '![실행 화면](/images/run.png)',
    '<video controls src="/videos/run.mp4"></video>',
    '```text',
    '실행 출력',
    '```',
    '처리 시간은 37초였습니다.',
  ].join('\n\n');
  const { stats } = qualityLint(body, { valueType: 'experience' });
  assert.equal(stats.uniqueExternalSourceCount, 1);
  assert.equal(stats.bodyMediaCount, 2);
  assert.equal(stats.codeFenceCount, 1);
  assert.equal(stats.numericDetailLineCount, 1);
  assert.equal(stats.abstractEvaluationCount, 8);
  assert.equal(stats.duplicateProseBlockCount, 1);
});
