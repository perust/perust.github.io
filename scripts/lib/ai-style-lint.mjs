// 한국어 블로그 원고에서 결정론적인 편집 잔재와 검토 신호를 찾는 보수적인 Markdown 검사기.
// 외부 패키지 없이 동작한다. blocker text 검사는 frontmatter·코드·URL·HTML 속성을 제외하고,
// 문맥 warning은 독자에게 보이는 외부 anchor와 body media만 제한적으로 관찰한다.

const CHATBOT_RESIDUE = [
  {
    id: 'chatbot-preface',
    pattern: /^(?:네[,.!！]?\s*)?물론입니다[.!！]?(?:\s|$)/,
    message: '챗봇 답변형 서두가 남아 있습니다',
  },
  {
    id: 'chatbot-summary-offer',
    pattern: /^다음과 같이 정리해\s*드리겠습니다[.!！]?(?:\s|$)/,
    message: '챗봇 답변형 정리 문구가 남아 있습니다',
  },
  {
    id: 'chatbot-closing-wish',
    pattern: /^(?:이 (?:답변|글|내용)이 )?도움이 되었기를 (?:바랍니다|바랄게요)[.!！]?$/,
    message: '챗봇 답변형 맺음말이 남아 있습니다',
  },
  {
    id: 'chatbot-followup-offer',
    pattern: /^원하시면\s+.{0,80}(?:(?:정리|작성|설명)해|도와)\s*드(?:리겠습니다|릴게요)[.!！]?$/,
    message: '챗봇의 후속 작업 제안이 남아 있습니다',
  },
  {
    id: 'chatbot-followup-request',
    pattern: /^원하시면\s+.{0,80}(?:말씀해|알려)\s*주세요[.!！]?$/,
    message: '챗봇의 후속 요청 문구가 남아 있습니다',
  },
];

// 사용자가 실제로 관용적이라고 교정한 제목만 경고한다.
// "핵심 요약", "투자자로서의 관점"처럼 의도적으로 쓰는 정보 구조는 제외한다.
const GENERIC_HEADINGS = [
  /총정리$/,
  /한눈에 (?:보기|정리)$/,
  /초보 추천도/,
  /^어떤 글인가$/,
  /^핵심 포인트$/,
  /^미래 전망$/,
  /^앞으로의 과제$/,
];

const CLICHE_PHRASES = [
  /(?:이 글에서는|지금부터) .{0,80}(?:알아보겠습니다|살펴보겠습니다)/,
  /(?:결론적으로|요약하자면|정리하자면)[, ]/,
  /한마디로 말하면/,
];

// ©·™처럼 텍스트로도 흔히 쓰는 기호는 제외하고, 기본 emoji 또는 VS16으로 emoji 표시를
// 명시한 문자만 제목 장식으로 본다.
const DECORATIVE_EMOJI = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)/u;

const issue = (severity, ruleId, line, message, excerpt) => ({
  severity,
  ruleId,
  line,
  message,
  excerpt: excerpt.trim().slice(0, 140),
});

const ABSTRACT_EVALUATION_TERM = /좋은|중요한|필요한/g;
const PRE_READING_CATEGORY = '미리 알아보는 책 정보';
const NUMERIC_DETAIL = /\d/;

function normalizeReferenceLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * frontmatter·fence·comment·quote·code를 제외하되, source/media 신호를 읽을 수 있도록
 * Markdown/HTML markup은 보존한 body line을 만든다.
 */
function scanMarkdownBody(markdown) {
  const source = markdown.replace(/^\uFEFF/, '');
  const sourceLines = source.split(/\r?\n/);
  const bodyLines = [];
  let index = 0;
  let inFence = false;
  let fenceMarker = '';
  let fenceLength = 0;
  let fenceHasContent = false;
  let inComment = false;
  let codeFenceCount = 0;
  let frontmatterLines = [];
  const referenceDefinitions = new Map();

  if (sourceLines[0]?.trim() === '---') {
    index = 1;
    const frontmatterStart = index;
    while (index < sourceLines.length && sourceLines[index].trim() !== '---') index += 1;
    frontmatterLines = sourceLines.slice(frontmatterStart, index);
    if (index < sourceLines.length) index += 1;
  }

  for (; index < sourceLines.length; index += 1) {
    const raw = sourceLines[index];
    if (inFence) {
      const closingFence = raw.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (closingFence && closingFence[1][0] === fenceMarker && closingFence[1].length >= fenceLength) {
        if (fenceHasContent) codeFenceCount += 1;
        inFence = false;
        fenceMarker = '';
        fenceLength = 0;
        fenceHasContent = false;
      } else if (raw.trim()) {
        fenceHasContent = true;
      }
      continue;
    }

    // Markdown block syntax는 원본 줄 시작 위치에서만 성립한다. 주석을 먼저 제거하면
    // `<!-- ... -->```/`> `/4-space marker가 새로 줄 시작에 나타나 blocker를 숨길 수 있다.
    const openingFence = raw.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (openingFence && (openingFence[1][0] === '~' || !openingFence[2].includes('`'))) {
      inFence = true;
      fenceMarker = openingFence[1][0];
      fenceLength = openingFence[1].length;
      fenceHasContent = false;
      continue;
    }
    if (/^(?: {4}|\t)/.test(raw) || /^\s*>/.test(raw)) continue;

    // 주석 조각만 제거한다. 인라인 주석 앞뒤의 독자에게 보이는 본문은 계속 검사한다.
    let uncommented = '';
    let cursor = 0;
    while (cursor < raw.length) {
      if (inComment) {
        const end = raw.indexOf('-->', cursor);
        if (end === -1) {
          cursor = raw.length;
        } else {
          inComment = false;
          cursor = end + 3;
        }
        continue;
      }
      const start = raw.indexOf('<!--', cursor);
      if (start === -1) {
        uncommented += raw.slice(cursor);
        break;
      }
      uncommented += raw.slice(cursor, start);
      inComment = true;
      cursor = start + 4;
    }

    const referenceDefinition = uncommented.match(/^\s*\[([^\]]+)\]:\s*(?:<([^>\s]+)>|(\S+))/);
    if (referenceDefinition) {
      const [, label, angleDestination, bareDestination] = referenceDefinition;
      referenceDefinitions.set(normalizeReferenceLabel(label), angleDestination ?? bareDestination);
      continue;
    }

    bodyLines.push({
      line: index + 1,
      raw,
      uncommented,
      markupText: uncommented.replace(/`+[^`]*`+/g, ''),
    });
  }

  return { bodyLines, codeFenceCount, frontmatterLines, referenceDefinitions };
}

function proseTextFromMarkup(markupText) {
  return markupText
    // 링크 목적지는 제외하되 독자에게 보이는 label은 편집 잔재 검사에 남긴다.
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replace(/<https?:\/\/[^>]+>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/gi, '');
}

const EDITORIAL_EXCLUDED_HTML_ELEMENTS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu',
  'button', 'figure', 'figcaption', 'picture', 'img', 'video', 'source',
  'form', 'input', 'select', 'textarea',
]);
const EDITORIAL_EXCLUDED_HTML_CLASS = /\bclass=["'][^"']*(?:cta|button|control|figure|actions?)[^"']*["']/i;

/**
 * HTML heading/list/control container의 내용만 줄 경계를 넘어 제외한다. 제거된 구간의
 * 개행은 보존해 원본 line mapping과 같은 줄의 앞뒤 visible prose를 유지한다.
 */
function editorialBodyMarkupLines(bodyLines) {
  const markup = bodyLines.map(({ markupText }) => markupText).join('\n');
  const stack = [];
  let cursor = 0;
  let excludedDepth = 0;
  let editorialMarkup = '';
  const append = (value, include) => {
    editorialMarkup += include ? value : value.replace(/[^\n]/g, '');
  };

  for (const match of markup.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const rawTag = match[0];
    // Markdown autolink는 HTML element가 아니므로 visible prose로 그대로 보존한다.
    if (/^<https?:\/\//i.test(rawTag)) continue;

    append(markup.slice(cursor, match.index), excludedDepth === 0);
    const tagName = match[1].toLowerCase();
    const isClosing = /^<\//.test(rawTag);

    if (isClosing) {
      const openedExcluded = stack.pop();
      if (openedExcluded) excludedDepth -= 1;
    } else {
      const isExcluded = EDITORIAL_EXCLUDED_HTML_ELEMENTS.has(tagName)
        || EDITORIAL_EXCLUDED_HTML_CLASS.test(rawTag);
      const isVoid = VOID_HTML_ELEMENTS.has(tagName) || /\/\s*>$/.test(rawTag);
      if (!isVoid) {
        stack.push(isExcluded);
        if (isExcluded) excludedDepth += 1;
      }
    }

    append(rawTag, false);
    cursor = match.index + rawTag.length;
  }

  append(markup.slice(cursor), excludedDepth === 0);
  return editorialMarkup.split('\n');
}

function proseLinesFromScan(bodyLines) {
  const result = [];
  const editorialMarkupLines = editorialBodyMarkupLines(bodyLines);
  for (const [index, entry] of bodyLines.entries()) {
    const text = proseTextFromMarkup(entry.markupText);
    const editorialText = proseTextFromMarkup(editorialMarkupLines[index] ?? '');
    const punctuationText = entry.markupText
      // 외부 원문 URL에 직접 연결된 기사 원제·직접 인용의 문장부호만 그대로 둔다.
      .replace(/!?\[[^\]]*\]\(https?:\/\/[^)]*\)/gi, '')
      .replace(/<a\b(?=[^>]*\bhref=["']https?:\/\/)[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/<https?:\/\/[^>]+>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/\S+/gi, '');
    if (!text.trim()) continue;
    result.push({
      line: entry.line,
      raw: entry.raw,
      text,
      editorialText,
      markupText: entry.markupText,
      punctuationText,
      isHtmlHeading: /^\s*<h[1-6]\b/i.test(entry.uncommented),
    });
  }
  return result;
}

function visibleAnchorLabel(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\s*\[[^\]]*\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NON_RENDERED_HTML_ELEMENTS = new Set(['template', 'script', 'style', 'noscript']);
const VOID_HTML_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);
const HIDDEN_HTML_ATTRIBUTE = /(?:\s+hidden(?=\s|=|\/?>)|\s+style\s*=\s*(?:"[^"]*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"]*"|'[^']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^']*'))/i;

function visibleBodyMarkup(bodyLines) {
  const markup = bodyLines.map(({ markupText }) => markupText).join('\n');
  const stack = [];
  let cursor = 0;
  let hiddenDepth = 0;
  let visible = '';

  for (const match of markup.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const rawTag = match[0];
    // Markdown autolink는 HTML element가 아니므로 그대로 보존한다.
    if (/^<https?:\/\//i.test(rawTag)) continue;

    if (hiddenDepth === 0) visible += markup.slice(cursor, match.index);
    const tagName = match[1].toLowerCase();
    const isClosing = /^<\//.test(rawTag);

    if (isClosing) {
      const openedHidden = stack.pop();
      if (openedHidden) hiddenDepth -= 1;
      if (openedHidden === false && hiddenDepth === 0) visible += rawTag;
    } else {
      const isHidden = NON_RENDERED_HTML_ELEMENTS.has(tagName) || HIDDEN_HTML_ATTRIBUTE.test(rawTag);
      if (hiddenDepth === 0 && !isHidden) visible += rawTag;
      const isVoid = VOID_HTML_ELEMENTS.has(tagName) || /\/\s*>$/.test(rawTag);
      if (!isVoid) {
        stack.push(isHidden);
        if (isHidden) hiddenDepth += 1;
      }
    }
    cursor = match.index + rawTag.length;
  }

  if (hiddenDepth === 0) visible += markup.slice(cursor);
  return visible;
}

function externalBodySources(bodyLines, referenceDefinitions) {
  const sources = new Set();
  const markupText = visibleBodyMarkup(bodyLines);
  const markdownWithoutImages = markupText
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\s*\[[^\]]*\]/g, '');
  for (const match of markdownWithoutImages.matchAll(/(?<!!)\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+)(?:\s+["'][^)]*["'])?\s*\)/gi)) {
    if (visibleAnchorLabel(match[1])) sources.add(match[2]);
  }
  for (const match of markdownWithoutImages.matchAll(/(?<!!)\[([^\]]*)\]\s*\[([^\]]*)\]/g)) {
    const destination = referenceDefinitions.get(normalizeReferenceLabel(match[2] || match[1]));
    if (destination && /^https?:\/\//i.test(destination) && visibleAnchorLabel(match[1])) {
      sources.add(destination);
    }
  }
  for (const match of markupText.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"(https?:\/\/[^"]+)"|'(https?:\/\/[^']+)'|(https?:\/\/[^\s"'`=<>]+))[^>]*>([\s\S]*?)<\/a>/gi)) {
    const destination = match[1] ?? match[2] ?? match[3];
    if (visibleAnchorLabel(match[4])) sources.add(destination);
  }
  for (const match of markupText.matchAll(/<(https?:\/\/[^<>\s]+)>/gi)) sources.add(match[1]);
  return sources;
}

function bodyMediaCount(bodyLines, referenceDefinitions) {
  const markupText = visibleBodyMarkup(bodyLines);
  const inlineImages = [...markupText.matchAll(/!\[[^\]]*\]\([^)]*\)/g)].length;
  const referenceImages = [...markupText.matchAll(/!\[([^\]]*)\]\s*\[([^\]]*)\]/g)]
    .filter((match) => referenceDefinitions.has(normalizeReferenceLabel(match[2] || match[1])))
    .length;
  const htmlMedia = [...markupText.matchAll(/<(?:img|video)\b[^>]*>/gi)].length;
  return inlineImages + referenceImages + htmlMedia;
}

function isStandaloneEditorialProse(entry) {
  const raw = entry.raw.trim();
  const htmlMarkup = entry.markupText;
  if (!entry.editorialText.trim()) return false;
  if (/^#{1,6}(?:\s|$)/.test(raw)) return false;
  if (/^(?:[-*+] |\d+[.)] )/.test(raw)) return false;
  if (/^!?\[[^\]]*\](?:\([^)]*\)|\[[^\]]*\])\s*[.!?]?$/s.test(raw)) return false;
  if (/^\s*<a\b[\s\S]*<\/a>\s*$/i.test(htmlMarkup)) return false;
  return true;
}

function normalizedProseBlocks(lines) {
  const blocks = [];
  let current = [];
  const finish = () => {
    if (!current.length) return;
    const normalized = current
      .map(({ editorialText }) => editorialText)
      .join(' ')
      .normalize('NFC')
      .replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    blocks.push({ line: current[0].line, raw: current[0].raw, normalized });
    current = [];
  };

  for (const entry of lines.filter(isStandaloneEditorialProse)) {
    if (current.length && entry.line !== current[current.length - 1].line + 1) finish();
    current.push(entry);
  }
  finish();
  return blocks;
}

/**
 * 검사 대상 줄을 만든다. 렌더링용 데이터를 편집 잔재로 오인하지 않도록 다음은 제외한다.
 * - 문서 맨 앞 YAML frontmatter
 * - fenced code, 들여쓴 code, 인용문, HTML comment, reference link 정의
 * - inline code, 링크 목적지, autolink와 HTML tag/속성
 * 링크 표시 문구와 HTML의 가시 텍스트는 검사하되, 원제 링크의 문장부호는 보존한다.
 */
export function markdownProseLines(markdown) {
  return proseLinesFromScan(scanMarkdownBody(markdown).bodyLines)
    .map(({ editorialText, ...entry }) => entry);
}

export function lintMarkdownEditorialQuality(markdown, { valueType, category } = {}) {
  const scan = scanMarkdownBody(markdown);
  const lines = proseLinesFromScan(scan.bodyLines);
  const failures = [];
  const warnings = [];
  const genericHeadings = [];
  const cliches = [];
  const repeatedOpeners = new Map();
  let repeatedDirectiveEndings = 0;
  let boldCount = 0;
  const boldLabelLines = [];

  for (const entry of lines) {
    const trimmed = entry.text.trim();
    const heading = trimmed.match(/^#{1,6}\s+(.+?)\s*#*$/)?.[1]?.trim()
      ?? (entry.isHtmlHeading ? trimmed : undefined);

    if (entry.punctuationText.includes('—')) {
      failures.push(issue('failure', 'em-dash', entry.line, '본문에는 em dash(U+2014) 대신 하이픈이나 한국어 문장부호를 사용하세요', entry.raw));
    }
    if (entry.punctuationText.includes('…')) {
      failures.push(issue('failure', 'typographic-ellipsis', entry.line, '본문에는 특수 말줄임표(U+2026) 대신 키보드 점 세 개(...)를 사용하세요', entry.raw));
    }
    if (/\[(?:출처|링크|이미지|내용|날짜)\s*(?:필요|추가|삽입|확인)\]/.test(entry.markupText)
      || /^(?:TODO|TBD|FIXME)(?::|\s|$)/i.test(trimmed)) {
      failures.push(issue('failure', 'draft-placeholder', entry.line, '초안용 자리표시자나 미완료 표시를 제거하세요', entry.raw));
    }
    if (heading && DECORATIVE_EMOJI.test(heading)) {
      failures.push(issue('failure', 'decorative-heading-emoji', entry.line, '제목의 장식용 이모지를 제거하세요', entry.raw));
    }

    // 인용문/목록 속 실제 발언을 막지 않도록 원본 줄에서 성립한 block marker만 제외한다.
    // comment 제거 뒤 새로 선두에 드러난 `>`는 blockquote가 아니므로 잔재를 숨기지 못한다.
    if (!/^(?:\s*>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(entry.raw)) {
      const plain = trimmed
        .replace(/^>\s*/, '')
        .replace(/^#{1,6}\s+/, '')
        .replace(/[*_~]/g, '')
        .trim();
      for (const rule of CHATBOT_RESIDUE) {
        if (rule.pattern.test(plain)) {
          failures.push(issue('failure', rule.id, entry.line, rule.message, entry.raw));
          break;
        }
      }
    }

    boldCount += [...entry.text.matchAll(/\*\*[^*\n]+\*\*/g)].length;
    if (/^\s*(?:[-*+] |\d+[.)] )\*\*[^*\n]{1,40}(?:[:：]\*\*|\*\*\s*[:：-])/.test(entry.text)) {
      boldLabelLines.push(entry);
    }
    if (heading && GENERIC_HEADINGS.some((pattern) => pattern.test(heading))) genericHeadings.push(entry);
    if (CLICHE_PHRASES.some((pattern) => pattern.test(trimmed))) cliches.push(entry);
    repeatedDirectiveEndings += (entry.text.match(/(?:확인|봐|준비)해야 합니다/g) ?? []).length;

    const opener = trimmed.match(/^(결국|핵심은|중요한 것은|다만|정리하면)(?:\s|,)/)?.[1];
    if (opener) {
      const matches = repeatedOpeners.get(opener) ?? [];
      matches.push(entry);
      repeatedOpeners.set(opener, matches);
    }
  }

  // 문맥과 글 종류에 따라 정상일 수 있는 형식은 CI를 실패시키지 않고 한 글당 한 번만 알린다.
  if (boldCount >= 8) {
    warnings.push(issue('warning', 'heavy-bold', lines[0]?.line ?? 1, `굵은 글씨가 ${boldCount}개입니다. 강조가 본문을 대신하지 않는지 확인하세요`, lines[0]?.raw ?? ''));
  }
  if (boldLabelLines.length >= 4) {
    warnings.push(issue('warning', 'bold-label-list', boldLabelLines[0].line, `bold-label 목록이 ${boldLabelLines.length}개입니다. 템플릿형 나열인지 확인하세요`, boldLabelLines[0].raw));
  }
  if (genericHeadings.length >= 1) {
    warnings.push(issue('warning', 'generic-outline', genericHeadings[0].line, `관용적인 개요 제목이 ${genericHeadings.length}개입니다. 글의 내용을 드러내는 더 구체적인 제목인지 검토하세요`, genericHeadings[0].raw));
  }
  if (cliches.length >= 2) {
    warnings.push(issue('warning', 'cliche-prose', cliches[0].line, `상투적인 도입·결론 문구가 ${cliches.length}개입니다`, cliches[0].raw));
  }
  for (const [opener, matches] of repeatedOpeners) {
    if (matches.length >= 4) {
      warnings.push(issue('warning', 'repeated-opener', matches[0].line, `"${opener}" 문장 시작이 ${matches.length}회 반복됩니다`, matches[0].raw));
    }
  }
  if (repeatedDirectiveEndings >= 6) {
    warnings.push(issue('warning', 'repeated-directive-ending', lines[0]?.line ?? 1, `"확인/봐/준비해야 합니다" 계열이 ${repeatedDirectiveEndings}회 반복됩니다. 독자에게 판단을 떠넘기는 문장이 많은지 확인하세요`, lines[0]?.raw ?? ''));
  }

  const editorialLines = lines.filter(isStandaloneEditorialProse);
  const proseBlocks = normalizedProseBlocks(lines);
  const seenBlocks = new Set();
  const duplicateKeys = new Set();
  const duplicateBlocks = [];
  for (const block of proseBlocks) {
    if (block.normalized.length < 80) continue;
    if (seenBlocks.has(block.normalized) && !duplicateKeys.has(block.normalized)) {
      duplicateKeys.add(block.normalized);
      duplicateBlocks.push(block);
    }
    seenBlocks.add(block.normalized);
  }
  if (duplicateBlocks.length) {
    warnings.push(issue(
      'warning',
      'duplicate-prose-block',
      duplicateBlocks[0].line,
      `80자 이상 본문 블록 ${duplicateBlocks.length}개가 반복됩니다. 의도하지 않은 중복인지 확인하세요`,
      duplicateBlocks[0].raw,
    ));
  }

  const abstractEvaluationCount = editorialLines.reduce(
    (total, entry) => total + (entry.editorialText.match(ABSTRACT_EVALUATION_TERM) ?? []).length,
    0,
  );
  if (abstractEvaluationCount >= 8) {
    warnings.push(issue(
      'warning',
      'abstract-evaluation-density',
      editorialLines[0]?.line ?? 1,
      `"좋은/중요한/필요한" 표현이 ${abstractEvaluationCount}회입니다. 해당하는 곳은 기능, 수치, 행동, 결과로 더 구체화할 수 있는지 확인하세요`,
      editorialLines[0]?.raw ?? '',
    ));
  }

  const externalSources = externalBodySources(scan.bodyLines, scan.referenceDefinitions);
  const mediaCount = bodyMediaCount(scan.bodyLines, scan.referenceDefinitions);
  const numericDetailLines = editorialLines.filter(({ editorialText }) => NUMERIC_DETAIL.test(editorialText));
  const requiresResearchSource = valueType === 'verified-guide'
    || valueType === 'original-analysis'
    || category === PRE_READING_CATEGORY;
  if (requiresResearchSource && externalSources.size === 0) {
    warnings.push(issue(
      'warning',
      'research-source-gap',
      lines[0]?.line ?? 1,
      '본문에 직접 연결된 외부 출처가 없습니다. 해당하는 경우 공식·원문 출처를 추가하거나 직접 관찰에 근거한 내용임을 본문에서 분명히 하세요',
      lines[0]?.raw ?? '',
    ));
  }
  if (valueType === 'experience'
    && externalSources.size === 0
    && mediaCount === 0
    && scan.codeFenceCount === 0
    && numericDetailLines.length === 0) {
    warnings.push(issue(
      'warning',
      'experience-support-scarcity',
      lines[0]?.line ?? 1,
      '경험 글에 링크·미디어·실행 출력·수치나 날짜 세부 정보가 없습니다. 실제로 존재하는 구체적 예시나 결과물이 있을 때만 추가를 검토하세요',
      lines[0]?.raw ?? '',
    ));
  }

  const legacyEditorialReviewIndex = scan.frontmatterLines.findIndex(
    (line) => /^\s*(?:"editorialReview"|'editorialReview'|editorialReview)\s*:/.test(line),
  );
  if (legacyEditorialReviewIndex !== -1) {
    const legacyLine = scan.frontmatterLines[legacyEditorialReviewIndex];
    warnings.push(issue(
      'warning',
      'legacy-editorial-review-flag',
      legacyEditorialReviewIndex + 2,
      'editorialReview는 호환성을 위해 남은 legacy metadata이며 검토 증거가 아닙니다. 새 글에서는 제거하세요',
      legacyLine,
    ));
  }

  return {
    failures,
    warnings,
    stats: {
      proseLines: lines.length,
      boldCount,
      boldLabelCount: boldLabelLines.length,
      uniqueExternalSourceCount: externalSources.size,
      bodyMediaCount: mediaCount,
      codeFenceCount: scan.codeFenceCount,
      numericDetailLineCount: numericDetailLines.length,
      abstractEvaluationCount,
      duplicateProseBlockCount: duplicateBlocks.length,
    },
  };
}

// Deprecated compatibility alias. 새 호출자는 neutral API를 사용한다.
export const lintMarkdownAiStyle = lintMarkdownEditorialQuality;
