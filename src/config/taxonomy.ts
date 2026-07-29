// 블로그 카테고리 통합, 태그 색인 기준, 주제 허브(topic hub)를 관리하는 단일 진실 소스(SSOT).
// astro.config.mjs(sitemap 필터), scripts/*.mjs(검증 스크립트), src/pages/**, src/utils/blog.ts 가
// 이 파일의 값을 그대로 참조한다. Node 22는 타입 표기가 지워질 수 있는(erasable) TS 문법을
// 별도 로더 없이 바로 import 할 수 있어(enum/namespace/decorator 금지), astro.config.mjs 같은
// 순수 Node 실행 파일에서도 이 파일을 직접 import 한다.
//
// 카테고리를 새로 추가/변경할 때는 이 파일만 고치면 된다:
//   1) CANONICAL_CATEGORIES 에 추가
//   2) 과거 라벨이 있다면 LEGACY_CATEGORY_MAP 에 매핑 추가
//   3) 허브에 속해야 하면 TOPIC_HUBS 의 categories 에 이름 추가

export interface CanonicalCategory {
  /** frontmatter category 값이자 화면에 노출되는 정식 카테고리명. */
  name: string;
  /** URL 슬러그. slugify(name) 과 항상 일치해야 한다(테스트로 보장). */
  slug: string;
  /** 카테고리 아카이브 페이지 소개 문구. */
  description: string;
}

// blog.ts, astro.config.mjs, 검증 스크립트가 이 함수를 직접 import한다.
export function slugify(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// 1) 정식(canonical) 카테고리 — 독자에게 약속한 아래 5개를 유지한다.
//    글이 아직 없는 카테고리도 아카이브 URL 과 블로그 UI 노출을 유지한다
//    (색인은 CATEGORY_INDEX_MIN_POSTS 기준을 그대로 따른다).
// ---------------------------------------------------------------------------
export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  {
    name: '책 서평',
    slug: slugify('책 서평'),
    description: '읽은 책을 정리하고 실제 업무·생활에 적용한 부분을 남기는 서평입니다.',
  },
  {
    name: '미리 알아보는 책 정보',
    slug: slugify('미리 알아보는 책 정보'),
    description: '읽기 전에 미리 살펴본 책 소개와 출간 정보를 정리합니다.',
  },
  {
    name: '도서 학습 챌린지',
    slug: slugify('도서 학습 챌린지'),
    description: '책·강의 완독 챌린지를 따라가며 남기는 주차별 학습 기록과 회고입니다.',
  },
  {
    name: 'AI/IT 정보',
    slug: slugify('AI/IT 정보'),
    description: 'AI 모델·코딩 도구, 소프트웨어, 자동화, 보안 등 IT 전반의 소식과 사용 기록을 다룹니다.',
  },
  {
    name: '경제 정보',
    slug: slugify('경제 정보'),
    description: '금리·환율 같은 경제 흐름과 세금·연금·결제·생활비 등 생활 금융 정보를 다룹니다.',
  },
];

export const CANONICAL_CATEGORY_NAMES: ReadonlySet<string> = new Set(
  CANONICAL_CATEGORIES.map((category) => category.name),
);

export const CANONICAL_CATEGORY_BY_SLUG: ReadonlyMap<string, CanonicalCategory> = new Map(
  CANONICAL_CATEGORIES.map((category) => [category.slug, category]),
);

// ---------------------------------------------------------------------------
// 2) 레거시(과거) 카테고리 라벨 → 정식 카테고리명 매핑.
//    frontmatter 일괄 이전과 호환 페이지 생성에 함께 쓰는 결정론적 매핑이다.
//    모든 과거 라벨은 정확히 하나의 정식 카테고리로만 귀속된다(다대일).
// ---------------------------------------------------------------------------
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // 1차 통합(2026-07) 이전의 원래 라벨들.
  AI: 'AI/IT 정보',
  'AI Weekly': 'AI/IT 정보',
  Science: 'AI/IT 정보',

  Money: '경제 정보',
  'Money Weekly': '경제 정보',
  Economy: '경제 정보',
  Finance: '경제 정보',
  금융: '경제 정보',

  Product: 'AI/IT 정보',
  Tech: 'AI/IT 정보',
  Automation: 'AI/IT 정보',
  'Build Note': 'AI/IT 정보',
  'Content Strategy': 'AI/IT 정보',
  'Maker Log': 'AI/IT 정보',

  'Book Review': '책 서평',

  Retrospective: '도서 학습 챌린지',

  Life: '경제 정보',
  생활: '경제 정보',
  Travel: '경제 정보',
  Food: '경제 정보',

  // 1차 통합에서 정식이었다가 2차 개편(2026-07-22)으로 레거시가 된 라벨들.
  // 제작·자동화 글은 AI/IT 정보로, 일상 글 다수는 생활비·결제 성격이라 경제 정보로 귀속한다.
  '생활금융·경제': '경제 정보',
  '자동화·만들기': 'AI/IT 정보',
  서평: '책 서평',
  회고: '도서 학습 챌린지',
  일상: '경제 정보',
};

// 과거 라벨의 일괄 매핑만으로는 글의 실제 주제를 표현하지 못하는 결정론적 개별 분류.
// 소비자 IT·게임 플랫폼 글은 AI/IT 정보로, 결제·금융 서비스 점검 글은 경제 정보로,
// 책·강의 완독 챌린지 기록은 도서 학습 챌린지로 귀속한다.
// 앞의 두 서평·챌린지 글은 개편의 기준 분류라 예외가 아니어도 명시적으로 고정한다.
export const POST_CATEGORY_OVERRIDES: Record<string, string> = {
  '2026-06-28-this-is-multi-agent-review': '책 서평',
  '2026-07-22-vibe-engineering-week1-review': '도서 학습 챌린지',
  '2026-07-09-vibe-coding-week1-claude-code': '도서 학습 챌린지',
  '2026-07-04-lock-in-challenge-routine': '도서 학습 챌린지',
  '2026-07-11-financial-ai-security-network-separation': '경제 정보',
  '2026-07-11-kakaopay-privacy-payment-checklist': '경제 정보',
  '2026-07-03-playstation-disc-digital-only-2028': 'AI/IT 정보',
};

/** 과거 라벨이든 이미 정식 이름이든, 정식 카테고리명으로 변환한다. 매핑에 없으면 에러로 막는다. */
export function canonicalCategoryFor(rawCategory: string): string {
  const trimmed = rawCategory.trim();
  if (CANONICAL_CATEGORY_NAMES.has(trimmed)) return trimmed;
  const mapped = LEGACY_CATEGORY_MAP[trimmed];
  if (mapped) return mapped;
  throw new Error(
    `taxonomy: 매핑되지 않은 카테고리 "${rawCategory}". src/config/taxonomy.ts 의 LEGACY_CATEGORY_MAP 에 추가하세요.`,
  );
}

export interface LegacyCompatEntry {
  /** 과거 카테고리 URL 슬러그: /blog/category/<legacySlug>/ */
  legacySlug: string;
  /** 대표로 쓰는 과거 라벨 표기(안내 문구용). 같은 슬러그에 여러 라벨이 있으면 첫 번째를 쓴다. */
  legacyLabel: string;
  /** 이 레거시 슬러그가 귀속되는 정식 카테고리. */
  canonical: CanonicalCategory;
}

// 정식 카테고리와 슬러그가 같은 라벨(예: "AI")은 그대로 같은 페이지이므로 호환 페이지가 필요 없다.
// 슬러그가 달라지는 나머지 레거시 라벨만 호환 페이지 대상으로 남긴다.
export const LEGACY_COMPAT_ENTRIES: LegacyCompatEntry[] = (() => {
  const bySlug = new Map<string, LegacyCompatEntry>();
  for (const [legacyLabel, canonicalName] of Object.entries(LEGACY_CATEGORY_MAP)) {
    const legacySlug = slugify(legacyLabel);
    const canonical = CANONICAL_CATEGORIES.find((c) => c.name === canonicalName);
    if (!canonical) throw new Error(`taxonomy: "${canonicalName}" 은 CANONICAL_CATEGORIES 에 없습니다.`);
    if (legacySlug === canonical.slug) continue; // 이미 정식 슬러그와 같음 → 호환 페이지 불필요
    if (!bySlug.has(legacySlug)) bySlug.set(legacySlug, { legacySlug, legacyLabel, canonical });
  }
  return Array.from(bySlug.values()).sort((a, b) => a.legacySlug.localeCompare(b.legacySlug));
})();

export const LEGACY_COMPAT_SLUGS: ReadonlySet<string> = new Set(
  LEGACY_COMPAT_ENTRIES.map((entry) => entry.legacySlug),
);

// ---------------------------------------------------------------------------
// 3) 색인 기준 — 카테고리/태그 아카이브 모두 이 임계값을 그대로 쓴다(astro.config.mjs 포함).
// ---------------------------------------------------------------------------
export const CATEGORY_INDEX_MIN_POSTS = 3;
export const TAG_INDEX_MIN_POSTS = 3;

// 색인 허용 태그 allowlist — 태그 아카이브 중 검색 색인을 열어줄 핵심 주제만 엄선한다(약 10개).
// 이 목록에 있어도 글 수가 TAG_INDEX_MIN_POSTS(3) 미만이면 색인하지 않는다(isIndexableTag 참고).
// 나머지 태그 페이지는 URL·접근은 그대로 유지하되 noindex, follow 로 남는다.
export const INDEXABLE_TAGS: string[] = [
  'AI',
  'AI코딩',
  '개발도구',
  '자동화',
  '개인정보',
  '반도체',
  '부동산',
  '투자관점',
  '재테크',
  '생산성',
];

export const INDEXABLE_TAG_SLUGS: ReadonlySet<string> = new Set(INDEXABLE_TAGS.map(slugify));

/**
 * 태그 페이지 색인 판정의 SSOT. 태그 표기 원문이든 URL 슬러그든 받아 슬러그로 비교한다.
 * astro.config.mjs(sitemap 필터), blog/tag/[tag].astro(robots), 인기 태그 노출,
 * scripts/check-content-quality.mjs·check-taxonomy.mjs 의 기대값이 전부 이 함수를 쓴다.
 */
export function isIndexableTag(tagOrSlug: string, count: number): boolean {
  return count >= TAG_INDEX_MIN_POSTS && INDEXABLE_TAG_SLUGS.has(slugify(tagOrSlug));
}

// ---------------------------------------------------------------------------
// 4) 주제 허브(topic hub) — 에디터가 하위 주제별 대표 글을 직접 큐레이션한 페이지.
//    2차 카테고리 개편 이후 허브는 카테고리와 독립적으로 슬러그 기준으로 큐레이션하고,
//    categories 는 허브의 대표(CTA·전체 글 수·카테고리 아카이브 역링크) 카테고리만 나타낸다.
//    책 서평·미리 알아보는 책 정보·도서 학습 챌린지는 허브 없이 카테고리 아카이브만 유지한다.
// ---------------------------------------------------------------------------
export interface TopicSubtopic {
  label: string;
  description: string;
  /** 이 하위 주제를 대표하는 기존 글 슬러그(에디터가 직접 고른 것, 새 글 생성 아님). */
  slugs: string[];
}

export interface TopicHub {
  slug: string;
  title: string;
  /** 목록/카드에서 쓰는 짧은 소개. */
  tagline: string;
  /** 허브 페이지 본문 인트로(1~2문장, 과장 없는 사실 기반 소개). */
  description: string;
  /** 이 허브에 속하는 정식 카테고리 이름들. */
  categories: string[];
  subtopics: TopicSubtopic[];
}

export const TOPIC_HUBS: TopicHub[] = [
  {
    slug: slugify('AI'),
    title: 'AI',
    tagline: 'AI 모델, 코딩 도구, 에이전트, 국내외 정책 이슈',
    description:
      'AI 모델·코딩 도구의 업데이트, 에이전트·MCP 같은 실무 이슈, 소버린 AI·모두의 AI 같은 국내 정책까지 확인한 사실 기준으로 정리합니다.',
    categories: ['AI/IT 정보'],
    subtopics: [
      {
        label: 'AI 코딩 도구',
        description: 'Claude Code, GitHub Copilot 등 실제로 쓰는 AI 코딩 도구의 업데이트와 이슈.',
        slugs: [
          '2026-07-16-claude-code-2-1-211-stream-json-permission-security',
          '2026-07-15-github-copilot-security-review-public-preview',
          '2026-07-14-xcode-without-opening-ai-coding',
        ],
      },
      {
        label: 'AI 모델·서비스',
        description: '새로 나온 AI 모델과 서비스의 공식 발표·가격 정리.',
        slugs: ['2026-07-14-openai-gpt-5-6-sol-terra-luna-api-pricing'],
      },
      {
        label: 'AI 에이전트·보안',
        description: 'MCP 연결, 에이전트 서버 설치 등 AI 도구를 실무에 붙일 때 확인할 것.',
        slugs: ['2026-07-07-mcp-security-ai-tools', '2026-07-08-hostinger-vps-hermes-agent-install-guide'],
      },
      {
        label: '국내 AI 정책',
        description: '소버린 AI, 모두의 AI 같은 국내 AI 정책의 실제 내용.',
        slugs: ['2026-07-09-sovereign-ai-meaning-korea', '2026-07-18-modu-ai-korea-free-ai-agent'],
      },
    ],
  },
  {
    slug: slugify('생활금융·경제'),
    title: '생활금융·경제',
    tagline: '금리·환율 같은 거시경제와 가계대출·연금·세금 체크리스트',
    description:
      '금리·환율·수출 같은 거시경제 지표와, 가계대출·연금·세금처럼 생활에 바로 영향을 주는 금융 체크리스트를 함께 정리합니다.',
    categories: ['경제 정보'],
    subtopics: [
      {
        label: '금리·환율·거시경제',
        description: 'FOMC, 한국 경제동향 등 거시경제 흐름 정리.',
        slugs: ['2026-07-21-july-fomc-rate-inflation-ai-demand', '2026-07-20-july-recent-economic-trends-2026'],
      },
      {
        label: '가계대출·부동산',
        description: '가계대출 증가, 규제지역 지정 등 부동산·대출 체크리스트.',
        slugs: ['2026-07-10-household-loan-june-checklist', '2026-06-30-regulated-housing-areas-dongtan-giheung-guri'],
      },
      {
        label: '연금·복지 체크리스트',
        description: '국민연금, 청년미래적금 같은 제도 변경 사항.',
        slugs: ['2026-07-06-national-pension-july-paycheck-checklist', '2026-06-30-national-pension-reduction-rule-change'],
      },
      {
        label: '투자·반도체',
        description: '반도체 비중이 큰 한국 증시와 관련 투자 이슈.',
        slugs: ['2026-07-20-semiconductor-leverage-etf-policy-risk', '2026-07-08-sk-hynix-adr-listing-investor-guide'],
      },
    ],
  },
  {
    slug: slugify('자동화·만들기'),
    title: '자동화·만들기',
    tagline: '업무 자동화, 개인 시스템 제작기, 보안·개인정보 체크리스트',
    description:
      'n8n으로 업무를 자동화한 과정, 개인 서비스를 직접 만든 제작기, 그리고 카카오페이·인스타그램 같은 서비스의 보안·개인정보 설정 체크리스트를 모읍니다.',
    categories: ['AI/IT 정보'],
    subtopics: [
      {
        label: '직접 만들기',
        description: '블로그 댓글 기능처럼 직접 설계하고 구현한 제작기.',
        slugs: ['2026-07-01-static-blog-anonymous-comments'],
      },
      {
        label: '업무 자동화',
        description: 'n8n으로 반복 업무를 자동화하며 정리한 기록.',
        slugs: ['2026-07-03-n8n-first-confusing-points', '2026-07-03-personal-retrospective-system'],
      },
      {
        label: '보안·개인정보 체크리스트',
        description: '금융·SNS 서비스의 보안·개인정보 설정을 점검한 글.',
        slugs: ['2026-07-11-financial-ai-security-network-separation', '2026-07-11-kakaopay-privacy-payment-checklist'],
      },
      {
        label: '생산성 루틴',
        description: '무리하지 않고 유지하는 자기계발·생산성 루틴.',
        slugs: ['2026-07-04-lock-in-challenge-routine'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 5) 발행 운영 정책 — 대량 자동 발행 재발 방지 게이트의 SSOT.
//    scripts/check-content-quality.mjs 와 scripts/check-taxonomy.mjs 가 빌드 검증에서 그대로 쓴다.
//    값을 바꾸려면 이 파일을 고치는 커밋이 필요하므로, 상한 완화 자체가 의도된 편집 행위가 된다.
// ---------------------------------------------------------------------------

/**
 * 신규 글 게이트 기준일. 두 겹의 게이트가 이 값을 공유한다:
 * - 날짜 게이트(check-content-quality·check-taxonomy): 기준일 다음날(초과) date 의 글부터
 *   커밋 여부와 무관하게 모든 글에 적용한다. 기준일(포함) 이전 date 의 기존 글은
 *   공개 URL·태그 보존을 위해 제외한다(grandfathering).
 * - Git 신규 파일 게이트(check-publish-policy): date 를 기준일 이전으로 적어도(backdate)
 *   Git 기준 새로 추가된 글이면 품질 게이트(editorialReview/valueType/통제 태그/최소 분량)를
 *   그대로 적용하고, 하루 발행 상한은 신규 파일 중 date 가 기준일 당일(포함) 이후인 글에
 *   날짜별로 적용한다. CI는 POLICY_GIT_BASELINE을 fail-closed로 명시하고
 *   POLICY_REQUIRE_COMMITTED_DIFF=true를 함께 사용한다. 로컬 checkout만 upstream/origin merge-base,
 *   마지막으로 HEAD 작업 트리 모드로 해석한다.
 */
export const NEW_POST_POLICY_BASELINE = '2026-07-21';

/**
 * 기준일 이후 같은 날짜로 발행할 수 있는 최대 글 수. 초과는 대량 자동 발행 신호로 보고 빌드를 실패시킨다.
 * check-publish-policy 는 Git 신규 파일 집합에 대해 기준일 당일(포함)부터 같은 상한을 적용한다.
 */
export const MAX_NEW_POSTS_PER_DAY = 1;

/**
 * 기준일 이후 새 글이 명시해야 하는 독자적 가치 유형(SSOT).
 * src/content.config.ts 의 zod enum, check-content-quality, check-publish-policy 가 이 값을 공유한다.
 * experience: 직접 경험 / original-analysis: 독자적 분석 / verified-guide: 실제 검증 / review: 서평·리뷰.
 */
export const VALUE_TYPES = ['experience', 'original-analysis', 'verified-guide', 'review'] as const;

/** 모든 공개 글의 본문 최소 분량(공백 제외 문자 수). 얇은(thin) 글 발행을 막는다. 현재 최단 글은 약 2,800자. */
export const MIN_POST_BODY_CHARS = 2000;

/** 기준일 이후 새 글 한 편에 붙일 수 있는 최대 태그 수. */
export const NEW_POST_MAX_TAGS = 5;

/** frontmatter date 문자열("2026-07-21" 또는 ISO+09:00)에서 발행일(YYYY-MM-DD, 작성 시각대 기준)을 뽑는다. */
export function postDayOf(rawDate: string): string {
  const day = rawDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`taxonomy: date "${rawDate}" 에서 발행일(YYYY-MM-DD)을 읽을 수 없습니다.`);
  }
  return day;
}

// 통제 태그 어휘(controlled vocabulary).
// - 글 3개 이상 쌓여 색인 대상인 태그 전부('Automation' 은 '자동화' 의 영문 중복이라 제외)와,
//    책·학습·일상 성격의 글을 커버하는 소수의 상시 태그로 구성한다.
// - 기준일 이후 새 글은 이 목록의 태그만 쓸 수 있다. 새 태그가 필요하면 이 목록에 추가하는
//   커밋이 함께 있어야 하므로, 태그 아카이브 URL 표면이 글 발행만으로 무분별하게 늘지 않는다.
// - 기준일 이전 글과 그 태그 URL 은 그대로 보존한다(이 목록의 제약을 받지 않는다).
export const CONTROLLED_TAGS: string[] = [
  // 글 3개 이상(색인 대상) 태그
  'AI',
  'AI검색',
  'AI도구',
  'AI에이전트',
  'AI코딩',
  'ChatGPT',
  'Claude',
  'ClaudeCode',
  'Gemini',
  'MCP',
  'SK하이닉스',
  '가계대출',
  '개발도구',
  '개인정보',
  '금리',
  '반도체',
  '보안',
  '부동산',
  '바이브코딩',
  '생산성',
  '생성형AI',
  '생활비',
  '생활체크',
  '자동화',
  '재테크',
  '체크리스트',
  '투자',
  '투자관점',
  '릴리스노트',
  '환율',
  // 반복 주제·카테고리 커버용 상시 태그
  'n8n',
  'OpenAI',
  'AI모델',
  '국민연금',
  '세금',
  '블로그',
  '회고',
  '서평',
  '일상',
  '여행',
];

export const CONTROLLED_TAG_SLUGS: ReadonlySet<string> = new Set(CONTROLLED_TAGS.map(slugify));

// ---------------------------------------------------------------------------
// 6) 홈·블로그 큐레이션 — 직접 만들고 자동화하며 겪은 기록을 뉴스·정책 정리 글보다 먼저 노출한다.
//    배열 순서가 노출 순서다. 존재하지 않는 슬러그는 check-taxonomy 가 빌드에서 잡는다.
// ---------------------------------------------------------------------------
export const FEATURED_MAKER_SLUGS: string[] = [
  '2026-07-01-static-blog-anonymous-comments',
  '2026-06-28-inflearn-n8n-challenge-retrospective',
  '2026-07-09-vibe-coding-week1-claude-code',
];

// 한 카테고리를 여러 허브가 대표할 수 있으므로(예: AI/IT 정보 ← AI 허브·자동화·만들기 허브),
// TOPIC_HUBS 배열에서 먼저 나오는 허브를 그 카테고리의 대표 허브로 쓴다(first-wins).
export const CATEGORY_TO_HUB: ReadonlyMap<string, TopicHub> = (() => {
  const byCategory = new Map<string, TopicHub>();
  for (const hub of TOPIC_HUBS) {
    for (const categoryName of hub.categories) {
      if (!byCategory.has(categoryName)) byCategory.set(categoryName, hub);
    }
  }
  return byCategory;
})();

export function hubForCategory(categoryName: string): TopicHub | undefined {
  return CATEGORY_TO_HUB.get(categoryName);
}

/** 허브 안에서 이 글이 속한 하위 주제(있으면). 큐레이션된 slugs 목록 기준이라 일부 글만 매칭된다. */
export function subtopicForSlug(hub: TopicHub, slug: string): TopicSubtopic | undefined {
  return hub.subtopics.find((subtopic) => subtopic.slugs.includes(slug));
}
