import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-18-vibe-coding-week6-mcp-database.md', root);
const workPagePath = new URL('src/pages/work/index.astro', root);
const globalCssPath = new URL('src/styles/global.css', root);
const imageDir = 'public/images/posts/2026-08-18-vibe-coding-week6-mcp-database/';

// 사용자 승인으로 추가한 PROJECT 10 실제 앱 화면. 순서·캡션·alt·출력 크기가 SSOT 다.
const appScreenshots = [
  {
    file: '05-mind-marble-entry.webp',
    caption: '한 줄로 하루를 적은 뒤 감정 구슬을 만드는 중인 입력 화면.',
    alt: "마음 구슬 앱의 입력 화면. '오늘 하루는 너무 재미있었다'라는 문장을 입력하고, 감정 구슬 생성 진행 중인 화면.",
    width: 1200,
    height: 1102,
  },
  {
    file: '06-mind-marble-result.webp',
    caption: '이모티콘 선택 뒤 기쁨이라는 감정과 감정 세기 9/10이 표시되어 있는 결과 화면. 현재는 글자나 이모티콘을 직접 타이핑하도록 바꾸었다.',
    alt: '마음 구슬 앱 결과 화면. 기쁨 이모티콘 선택, 감정 세기 9/10, 공감 문장이 표시된다.',
    width: 1200,
    height: 954,
  },
  {
    file: '07-mind-marble-memory-store.webp',
    caption: '날짜와 감정 기준으로 저장된 기록을 모아 보는 기억 저장소 화면. 타이핑한 내용이 구슬 안에 보인다.',
    alt: '마음 구슬 앱의 기억 저장소 화면. 감정 필터와 8월 18일에 저장된 세 개의 감정 구슬 카드가 보인다.',
    width: 1200,
    height: 424,
  },
];

// 공개 앱의 실제 CSS 애니메이션을 캡처한 GIF. reduced-motion 사용자는 같은 장면의 정지 WebP를 받는다.
const mindMarbleMotion = {
  file: '07a-mind-marble-orb-motion.gif',
  poster: '07a-mind-marble-orb-motion-still.webp',
  caption: '구슬 안에 넣은 이모티콘이 서로 다른 박자로 흔들리고, 구슬도 위아래로 움직이는 모습.',
  alt: '마음 구슬 앱의 기억 저장소. 노랑, 보라, 주황 감정 구슬 안에 웃는 얼굴, 반짝임, 꽃, 하트 이모티콘이 움직이는 애니메이션 GIF.',
  width: 960,
  height: 404,
};

// 초안(02_Claude_초안.md)의 교재 사진 주석 4개가 그대로 옮겨진 값.
const bookPhotos = [
  {
    file: '01-chapter-08-overview.webp',
    caption: '8장은 MCP로 Claude Code의 도구 범위를 넓히는 흐름으로 시작한다.',
    alt: '노트북 옆에 펼쳐 둔 책의 Chapter 08 시작면. MCP로 클로드 코드의 한계 넘어서기라는 제목과 학습 목표가 보인다.',
    width: 1200,
    height: 1600,
  },
  {
    file: '02-mcp-connection.webp',
    caption: '08-1에서는 MCP의 개념과 Claude Code 연결 방식을 다룬다.',
    alt: '08-1 MCP 이해하고 클로드 코드와 연결하기 페이지. MCP, 클라이언트 서버 모델, 로컬 MCP, 원격 MCP, 인증 핵심 키워드가 보인다.',
    width: 1200,
    height: 1600,
  },
  {
    file: '03-automation-workflow.webp',
    caption: '08-2는 테스트와 버전 관리를 자동화 흐름으로 묶는다.',
    alt: '08-2 MCP로 구현하는 완전 자동화 개발 환경 페이지. 테스트, 버전 관리, Context7, Playwright, 원격 저장소, 추가, 커밋, 푸시 키워드가 보인다.',
    width: 1200,
    height: 1600,
  },
  {
    file: '04-service-database.webp',
    caption: '08-3의 배포·저장소 주제는 서비스의 책임 범위를 생각하게 했다.',
    alt: '08-3 데이터베이스 연결해 진짜 서비스 만들기 페이지. Vercel, 배포, 로컬 스토리지, 클라우드 스토리지, Supabase, 데이터베이스, 테이블 키워드가 보인다.',
    width: 1200,
    height: 1600,
  },
];

// 사용자가 「6주차 사진만 추가」라고 승인한 두 화면. 본문·frontmatter·절 구조는 바꾸지 않는다.
const additionalScreenshots = [
  {
    file: '08-shopping-list-local.webp',
    caption: '로컬 저장 상태와 태그별 목록을 보여 주는 쇼핑 리스트 화면.',
    alt: '짙은 배경의 쇼핑 리스트 화면. 로컬 저장중 표시, 태그 입력, 다이소·이마트·CU·GS 필터와 네 개의 항목이 보인다.',
    width: 1200,
    height: 1052,
  },
  {
    file: '09-quiz-by-quiz-lobby.webp',
    caption: '카테고리와 온라인 메뉴가 보이는 quiz by quiz 시작 화면.',
    alt: 'quiz by quiz 시작 화면. 퀴즈왕 프로필 카드, 캐릭터·랭킹·온라인 카드와 한국사·과학 등 카테고리가 보인다.',
    width: 1200,
    height: 674,
  },
];

const photos = [...appScreenshots, ...bookPhotos, ...additionalScreenshots];
const renderedMedia = [...appScreenshots, mindMarbleMotion, ...bookPhotos, ...additionalScreenshots];

const launchCards = [
  {
    href: 'https://ai-empathy-diary-sigma.vercel.app/',
    ariaLabel: '마음 구슬 AI 공감 다이어리 실행 페이지로 이동',
    label: '마음 구슬 실행하기',
  },
  {
    href: 'https://perust.github.io/shopping-listapp/shopping-list/',
    ariaLabel: '쇼핑 리스트 실행 페이지로 이동',
    label: '쇼핑 리스트 실행하기',
  },
  {
    href: 'https://ai-empathy-diary-sigma.vercel.app/index_pdf.html',
    ariaLabel: 'PDF AI 요약 실행 페이지로 이동',
    label: 'PDF AI 요약 실행하기',
  },
];

test('6주차 후기는 PROJECT 10 증거와 8장의 MCP·자동화·데이터베이스 흐름 및 최종 실행 링크를 정리한다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.ok(
    post.includes(
      'title: "[혼자 공부하는 바이브 코딩 with 클로드 코드] 6주차 후기: MCP와 데이터베이스, 어디까지 연결할까"',
    ),
    'title 은 초안 frontmatter 와 글자 단위로 같아야 한다',
  );
  assert.match(post, /^date: "2026-08-16"$/m);
  assert.match(post, /^category: "도서 학습 챌린지"$/m);
  assert.match(post, /^editorialReview: true$/m);
  assert.match(post, /^valueType: "experience"$/m);
  assert.match(post, /^publishPacingException: "deadline-bound-challenge"$/m);

  // 태그는 정책 한도(NEW_POST_MAX_TAGS=5)와 통제 어휘에 맞춘 5개다.
  const tagsLine = post.match(/^tags: (\[.*\])$/m);
  assert.ok(tagsLine, 'frontmatter 에 tags 배열이 한 줄로 있어야 한다');
  assert.deepEqual(JSON.parse(tagsLine[1]), ['바이브코딩', 'ClaudeCode', 'MCP', 'AI코딩', '회고']);
  assert.equal(JSON.parse(tagsLine[1]).length, 5);

  // 7장 PROJECT 10의 실제 화면과 8장의 핵심 다섯 절 뒤에 실행 링크 절을 둔다.
  const headings = [...post.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "7장 PROJECT 10: AI 공감 다이어리, '마음 구슬'",
    'MCP가 어디와 연결되는지',
    '자동화라도 사람이 정할 일은 있다',
    '설정이 편해져도 확인은 필요',
    '붙일 수 있으니까 붙였던 데이터베이스지만..',
    '마지막으로.. ',
    '직접 사용해보기',
  ]);
  assert.ok(post.includes('6주차 프로젝트로 AI 공감 다이어리 「마음 구슬」을 만들었습니다.'));
  assert.ok(post.includes("만들어본 '마음 구슬' 서비스 화면을 간단하게 남겨보겠습니다."));
  assert.ok(
    post.includes(
      '로그인과 데이터베이스는 기능 체크리스트에서 하나 더 체크하는 항목이 아니라, 내가 얼마 동안 이걸 책임질 수 있는지에 대한 답에 가까운 것 같습니다.',
    ),
  );
  // 사실은 유지하되, 초안의 발표문 같은 연결 문구는 남기지 않는다.
  assert.doesNotMatch(post, /읽으면서 정리한 건,/);
  assert.doesNotMatch(post, /그런데 여기서 걸리는 게 있었습니다\./);
  assert.doesNotMatch(post, /그래서 요즘 생각하는 순서는 이렇습니다\./);

  // 7장 에이전트 실습의 상세 기록은 여전히 5주차 내부 링크로 이어진다.
  assert.ok(
    post.includes('[지난 5주차 후기](/blog/2026-08-11-vibe-coding-week5-api-ai-agents/)'),
    '5주차 후기 내부 링크가 있어야 한다',
  );

  // 초안의 HTML 사진 주석이나 수신 원본 파일명은 공개 글에 남지 않는다.
  assert.doesNotMatch(post, /<!--/);
  assert.doesNotMatch(post, /-->/);
  assert.doesNotMatch(post, /사진 파일명:/);
  assert.doesNotMatch(post, /img_[0-9a-f]{12}\.(?:png|webp)/);

  // 키·토큰·자격 증명 문자열은 공개 본문에 없어야 한다.
  assert.doesNotMatch(post, /sk-or-v1-|sk-ant-|nvapi-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{16,}/);
  assert.doesNotMatch(post, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
  assert.doesNotMatch(post, /service_role|SUPABASE_[A-Z_]*KEY|ANON_KEY|API_KEY\s*=/);
});

test('교재 사진 4장과 앱 화면 5장, 실제 구슬 모션 GIF는 캐러셀 제어 없이 figure/figcaption 으로 들어간다', async () => {
  const post = await readFile(postPath, 'utf8');

  const imageRefs = [...post.matchAll(/\/images\/posts\/2026-08-18-vibe-coding-week6-mcp-database\/[^"')\s]+\.(?:webp|gif)/g)]
    .map((match) => match[0]);
  assert.equal(imageRefs.length, 11);
  assert.equal(new Set(imageRefs).size, 11);
  assert.deepEqual(
    imageRefs.map((ref) => ref.split('/').at(-1)),
    [
      ...appScreenshots.map((photo) => photo.file),
      mindMarbleMotion.poster,
      mindMarbleMotion.file,
      ...bookPhotos.map((photo) => photo.file),
      ...additionalScreenshots.map((photo) => photo.file),
    ],
  );

  const imgTags = [...post.matchAll(/<img\s[^>]*>/g)].map((match) => match[0]);
  assert.equal(imgTags.length, 10);
  assert.equal((post.match(/\salt="[^"]+"/g) ?? []).length, 10);
  for (const [index, tag] of imgTags.entries()) {
    const photo = renderedMedia[index];
    assert.match(tag, new RegExp(`width="${photo.width}"`));
    assert.match(tag, new RegExp(`height="${photo.height}"`));
    assert.match(tag, /loading="lazy"/);
    assert.match(tag, /decoding="async"/);
  }

  assert.equal((post.match(/<figure class="post-media-figure">/g) ?? []).length, 10);
  assert.equal((post.match(/<\/figure>/g) ?? []).length, 10);
  assert.equal((post.match(/<figcaption>/g) ?? []).length, 10);
  assert.equal((post.match(/<\/figcaption>/g) ?? []).length, 10);

  for (const photo of photos) {
    assert.ok(post.includes(`<figcaption>${photo.caption}</figcaption>`), `${photo.file} 캡션이 있어야 한다`);
    assert.ok(post.includes(`alt="${photo.alt}"`), `${photo.file} alt 가 승인된 설명과 같아야 한다`);
  }

  const motionImage = `<img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/${mindMarbleMotion.file}" alt="${mindMarbleMotion.alt}" width="${mindMarbleMotion.width}" height="${mindMarbleMotion.height}" loading="lazy" decoding="async" />`;
  assert.ok(post.includes(motionImage), '일반 환경에는 실제 애니메이션 GIF를 제공해야 한다');
  assert.ok(
    post.includes(`<source media="(prefers-reduced-motion: reduce)" srcset="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/${mindMarbleMotion.poster}" type="image/webp" />`),
    'reduced-motion 환경에는 GIF 대신 정지 WebP를 제공해야 한다',
  );
  assert.ok(post.includes(`<figcaption>${mindMarbleMotion.caption}</figcaption>`));

  // 한 장짜리 figure 라 캐러셀 제어 버튼·상태 표시는 넣지 않는다.
  assert.doesNotMatch(post, /data-image-carousel|data-carousel-prev|data-carousel-next|data-carousel-status/);
  assert.doesNotMatch(post, /image-carousel-controls|image-carousel-status/);
});

test('구슬 모션 GIF는 기존 기억 저장소 정지 화면 직후, MCP 절 이전에 놓인다', async () => {
  const post = await readFile(postPath, 'utf8');
  assert.ok(post.indexOf('/07-mind-marble-memory-store.webp') < post.indexOf(`/${mindMarbleMotion.file}`));
  assert.ok(post.indexOf(`/${mindMarbleMotion.file}`) < post.indexOf('## MCP가 어디와 연결되는지'));
});

test('추가 사진 2장은 로컬 저장의 잠정 순서와 로그인·동기화의 미해결 문단 뒤에 각각 놓인다', async () => {
  const post = await readFile(postPath, 'utf8');
  const localStorageAnchor = '그래서 생각한 것은 로컬 스토리지와 내보내기 기능 정도로 시작해 보려고 합니다.';
  const userExpectationAnchor = '다만 꼭 맞다고 생각이 들지 않는 것은, 이용자 입장에서 로그인과 동기화가 너무 당연하게 느껴지기도 하기 때문입니다.';
  const closingAnchor = '8장을 읽으면서 생각해봐야할 질문은 생겼습니다.';
  const shoppingImage = '/08-shopping-list-local.webp';
  const quizImage = '/09-quiz-by-quiz-lobby.webp';

  assert.ok(post.indexOf(localStorageAnchor) < post.indexOf(shoppingImage));
  assert.ok(post.indexOf(shoppingImage) < post.indexOf(userExpectationAnchor));
  assert.ok(post.indexOf(userExpectationAnchor) < post.indexOf(quizImage));
  assert.ok(post.indexOf(quizImage) < post.indexOf(closingAnchor));
});

test('최종 직접 사용해보기 절은 접근 가능한 실행 카드 세 개만 승인된 순서로 제공한다', async () => {
  const post = await readFile(postPath, 'utf8');
  const closingParagraph = '8장을 읽으면서 생각해봐야할 질문은 생겼습니다. 무엇을 연결하고 만들 수 있는지보다, 연결하고 만들어낸 뒤에 제가 계속 책임질 수 있는지를 생각해봐야 할 것입니다.';
  const finalHeading = '## 직접 사용해보기';
  const cardPattern = /<a href="([^"]+)" class="app-launch-button" aria-label="([^"]+)"><span class="app-launch-button__label">([^<]+)<\/span><span class="app-launch-button__action">(바로가기) <span aria-hidden="true">(→)<\/span><\/span><\/a>/g;
  const cards = [...post.matchAll(cardPattern)].map((match) => ({
    href: match[1],
    ariaLabel: match[2],
    label: match[3],
    action: match[4],
    arrow: match[5],
  }));

  assert.equal((post.match(/class="app-launch-button"/g) ?? []).length, 3);
  assert.equal((post.match(/^## 직접 사용해보기$/gm) ?? []).length, 1);
  assert.ok(post.includes(`${closingParagraph}\n\n${finalHeading}\n\n`));
  assert.deepEqual(
    cards,
    launchCards.map((card) => ({ ...card, action: '바로가기', arrow: '→' })),
  );
  assert.equal((post.match(/<span aria-hidden="true">→<\/span>/g) ?? []).length, 3);

  const pdfCard = launchCards.at(-1);
  const finalCardMarkup = `<a href="${pdfCard.href}" class="app-launch-button" aria-label="${pdfCard.ariaLabel}"><span class="app-launch-button__label">${pdfCard.label}</span><span class="app-launch-button__action">바로가기 <span aria-hidden="true">→</span></span></a>`;
  assert.ok(post.trimEnd().endsWith(finalCardMarkup));
});

test('작업 페이지는 사용자가 OpenRouter API 키를 입력하는 외부 PDF AI 요약 항목을 한 번 제공한다', async () => {
  const workPage = await readFile(workPagePath, 'utf8');
  const mindMarbleTitle = "title: '감정 일기 마음 구슬'";
  const pdfTitle = "title: 'PDF AI 요약'";
  const digitRecognizerTitle = "title: '손글씨 숫자 인식기'";
  const pdfItem = "{ type: 'Contents', category: 'data-ai', created: '2026.02.16', updated: '2026.02.16', title: 'PDF AI 요약', desc: 'PDF 문서 업로드 · AI 핵심 내용 요약 · 사용자가 자신의 OpenRouter API 키를 직접 입력해 사용', href: 'https://ai-empathy-diary-sigma.vercel.app/index_pdf.html', external: true, status: '바로 사용' },";

  assert.equal((workPage.match(/title: 'PDF AI 요약'/g) ?? []).length, 1);
  assert.ok(workPage.includes(pdfItem));
  assert.ok(workPage.indexOf(mindMarbleTitle) < workPage.indexOf(pdfTitle));
  assert.ok(workPage.indexOf(pdfTitle) < workPage.indexOf(digitRecognizerTitle));
});

test('6주차 정지 사진 9장과 reduced-motion 포스터는 실제 WebP 파일로 저장소에 있다', async () => {
  await Promise.all(
    [...photos, { file: mindMarbleMotion.poster }].map(async (photo) => {
      const fileUrl = new URL(`${imageDir}${photo.file}`, root);
      await access(fileUrl);
      const bytes = await readFile(fileUrl);
      assert.equal(bytes.subarray(0, 4).toString('latin1'), 'RIFF', `${photo.file} 은 RIFF 컨테이너여야 한다`);
      assert.equal(bytes.subarray(8, 12).toString('latin1'), 'WEBP', `${photo.file} 은 WEBP 여야 한다`);
    }),
  );
});

test('구슬 모션 GIF가 실제 GIF89a 애니메이션 파일로 저장소에 있다', async () => {
  const fileUrl = new URL(`${imageDir}${mindMarbleMotion.file}`, root);
  await access(fileUrl);
  const bytes = await readFile(fileUrl);
  assert.equal(bytes.subarray(0, 6).toString('latin1'), 'GIF89a');
  assert.ok(bytes.length > 20_000, '빈 GIF가 아니라 실제 캡처 프레임이 있어야 한다');
});

test('global.css 에 한 장짜리 게시물 media figure 전용 규칙이 있다', async () => {
  const css = await readFile(globalCssPath, 'utf8');

  // figure 기본 좌우 들여쓰기 제거.
  assert.match(css, /\.post-article \.post-media-figure \{[^}]*margin-inline: 0;[^}]*\}/);
  // 캡션 가독성(본문보다 작고 흐린 색).
  assert.match(css, /\.post-article \.post-media-figure figcaption \{[^}]*color: var\(--muted\);[^}]*\}/);
  assert.match(css, /\.post-article \.post-media-figure figcaption \{[^}]*font-size:[^}]*\}/);
  // picture fallback 도 figure 폭을 기준으로 잡아 모바일에서 GIF/정지 이미지가 같은 크기로 보인다.
  assert.match(css, /\.post-article \.post-media-figure picture \{[^}]*display: block;[^}]*\}/);
  // 새 규칙은 이 클래스 밖의 figure 나 본문 이미지에 영향을 주지 않는다.
  assert.doesNotMatch(css, /\.post-article figure \{/);
  assert.doesNotMatch(css, /^figure \{/m);
});
