// 한국어 블로그 원고에서 AI 답변의 편집 잔재를 찾는 보수적인 Markdown 검사기.
// 외부 패키지 없이 동작하며, frontmatter·코드·URL·HTML 마크업은 검사하지 않는다.

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

// 사용자가 실제로 AI스럽다고 교정한 제목만 경고한다.
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

/**
 * 검사 대상 줄을 만든다. 렌더링용 데이터에서 AI 흔적을 오인하지 않도록 다음은 제외한다.
 * - 문서 맨 앞 YAML frontmatter
 * - fenced code, 들여쓴 code, 인용문, HTML comment, reference link 정의
 * - inline code, 링크 목적지, autolink와 HTML tag/속성
 * 링크 표시 문구와 HTML의 가시 텍스트는 검사하되, 원제 링크의 문장부호는 보존한다.
 */
export function markdownProseLines(markdown) {
  const source = markdown.replace(/^\uFEFF/, '');
  const lines = source.split(/\r?\n/);
  const result = [];
  let index = 0;
  let inFence = false;
  let fenceMarker = '';
  let fenceLength = 0;
  let inComment = false;

  if (lines[0]?.trim() === '---') {
    index = 1;
    while (index < lines.length && lines[index].trim() !== '---') index += 1;
    if (index < lines.length) index += 1;
  }

  for (; index < lines.length; index += 1) {
    const raw = lines[index];
    if (inFence) {
      const closingFence = raw.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (closingFence && closingFence[1][0] === fenceMarker && closingFence[1].length >= fenceLength) {
        inFence = false;
        fenceMarker = '';
        fenceLength = 0;
      }
      continue;
    }
    const openingFence = raw.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (openingFence && (openingFence[1][0] === '~' || !openingFence[2].includes('`'))) {
      inFence = true;
      fenceMarker = openingFence[1][0];
      fenceLength = openingFence[1].length;
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

    if (/^\s*\[[^\]]+\]:\s*\S+/.test(uncommented)) continue;

    const withoutInlineCode = uncommented.replace(/`+[^`]*`+/g, '');
    const text = withoutInlineCode
      // 링크 목적지는 제외하되 독자에게 보이는 label은 AI 잔재 검사에 남긴다.
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      .replace(/<https?:\/\/[^>]+>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/\S+/gi, '');
    const punctuationText = withoutInlineCode
      // 외부 원문 URL에 직접 연결된 기사 원제·직접 인용의 문장부호만 그대로 둔다.
      .replace(/!?\[[^\]]*\]\(https?:\/\/[^)]*\)/gi, '')
      .replace(/<a\b(?=[^>]*\bhref=["']https?:\/\/)[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/<https?:\/\/[^>]+>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/\S+/gi, '');
    if (!text.trim()) continue;
    result.push({
      line: index + 1,
      raw,
      text,
      markupText: withoutInlineCode,
      punctuationText,
      isHtmlHeading: /^\s*<h[1-6]\b/i.test(uncommented),
    });
  }
  return result;
}

export function lintMarkdownAiStyle(markdown) {
  const lines = markdownProseLines(markdown);
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

    // 인용문/목록 속 실제 발언을 막지 않도록 챗봇 잔재는 독립 문단 모양의 줄에서만 차단한다.
    if (!/^(?:>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(trimmed)) {
      const plain = trimmed.replace(/^#{1,6}\s+/, '').replace(/[*_~]/g, '').trim();
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
    warnings.push(issue('warning', 'generic-outline', genericHeadings[0].line, `AI 문서에서 자주 보이는 관용적 제목이 ${genericHeadings.length}개입니다. 더 구체적인 제목인지 검토하세요`, genericHeadings[0].raw));
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

  return { failures, warnings, stats: { proseLines: lines.length, boldCount, boldLabelCount: boldLabelLines.length } };
}
