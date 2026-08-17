import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-18-vibe-coding-week6-mcp-database.md', root);
const globalCssPath = new URL('src/styles/global.css', root);
const imageDir = 'public/images/posts/2026-08-18-vibe-coding-week6-mcp-database/';

// 사용자 승인으로 추가한 PROJECT 10 실제 앱 화면. 순서·캡션·alt·출력 크기가 SSOT 다.
const appScreenshots = [
  {
    file: '05-mind-marble-entry.webp',
    caption: '한 줄로 하루를 적은 뒤 감정 구슬을 만드는 입력 화면.',
    alt: '마음 구슬 앱의 입력 화면. 오늘 하루는 너무 재미있었다라는 문장과 감정 구슬 생성 진행 상태가 보인다.',
    width: 1200,
    height: 1102,
  },
  {
    file: '06-mind-marble-result.webp',
    caption: '이모티콘 선택 뒤 기쁨과 감정 세기 9/10이 표시된 결과 화면.',
    alt: '마음 구슬 앱 결과 화면. 기쁨 이모티콘 선택, 감정 세기 9/10, 공감 문장이 표시된다.',
    width: 1200,
    height: 954,
  },
  {
    file: '07-mind-marble-memory-store.webp',
    caption: '날짜와 감정 기준으로 저장된 기록을 모아 보는 기억 저장소 화면.',
    alt: '마음 구슬 앱의 기억 저장소 화면. 감정 필터와 8월 18일에 저장된 세 개의 감정 구슬 카드가 보인다.',
    width: 1200,
    height: 424,
  },
];

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

test('6주차 후기는 PROJECT 10 증거와 8장의 MCP·자동화·데이터베이스 흐름을 여섯 절로 정리한다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.ok(
    post.includes(
      'title: "[혼자 공부하는 바이브 코딩 with 클로드 코드] 6주차 후기: MCP와 데이터베이스, 어디까지 연결할까"',
    ),
    'title 은 초안 frontmatter 와 글자 단위로 같아야 한다',
  );
  assert.match(post, /^date: "2026-08-18"$/m);
  assert.match(post, /^category: "도서 학습 챌린지"$/m);
  assert.match(post, /^editorialReview: true$/m);
  assert.match(post, /^valueType: "experience"$/m);
  assert.match(post, /^publishPacingException: "deadline-bound-challenge"$/m);

  // 태그는 정책 한도(NEW_POST_MAX_TAGS=5)와 통제 어휘에 맞춘 5개다.
  const tagsLine = post.match(/^tags: (\[.*\])$/m);
  assert.ok(tagsLine, 'frontmatter 에 tags 배열이 한 줄로 있어야 한다');
  assert.deepEqual(JSON.parse(tagsLine[1]), ['바이브코딩', 'ClaudeCode', 'MCP', 'AI코딩', '회고']);
  assert.equal(JSON.parse(tagsLine[1]).length, 5);

  // 7장 PROJECT 10의 실제 화면은 짧게, 8장의 핵심 다섯 절은 원래 순서대로 남긴다.
  const headings = [...post.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    '7장 PROJECT 10: 마음 구슬을 만든 기록',
    'MCP가 어디와 연결되는지',
    '자동화에도 사람이 정할 일',
    '설정이 편해져도 남는 확인',
    '붙일 수 있으니까 붙였던 데이터베이스',
    '아직 결론을 못 낸 채로',
  ]);
  assert.ok(post.includes('6주차 기본 미션으로 AI 공감 다이어리 「마음 구슬」을 만들었습니다.'));
  assert.ok(post.includes('앱이 어디까지 보여 주고 저장하는지 직접 확인한 기록으로 남기고 싶었습니다.'));
  assert.ok(
    post.includes(
      '로그인과 데이터베이스는 기능 체크리스트에서 하나 더 체크하는 항목이 아니라, 내가 얼마 동안 이걸 책임질 수 있는지에 대한 답에 가깝습니다.',
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

test('교재 사진 4장과 앱 캡처 5장은 캐러셀 제어 없이 figure/figcaption 으로 들어간다', async () => {
  const post = await readFile(postPath, 'utf8');

  const imageRefs = [...post.matchAll(/\/images\/posts\/2026-08-18-vibe-coding-week6-mcp-database\/[^"')\s]+\.webp/g)]
    .map((match) => match[0]);
  assert.equal(imageRefs.length, 9);
  assert.equal(new Set(imageRefs).size, 9);
  assert.deepEqual(imageRefs.map((ref) => ref.split('/').at(-1)), photos.map((photo) => photo.file));

  const imgTags = [...post.matchAll(/<img\s[^>]*>/g)].map((match) => match[0]);
  assert.equal(imgTags.length, 9);
  assert.equal((post.match(/\salt="[^"]+"/g) ?? []).length, 9);
  for (const [index, tag] of imgTags.entries()) {
    const photo = photos[index];
    assert.match(tag, new RegExp(`width="${photo.width}"`));
    assert.match(tag, new RegExp(`height="${photo.height}"`));
    assert.match(tag, /loading="lazy"/);
    assert.match(tag, /decoding="async"/);
  }

  assert.equal((post.match(/<figure class="post-media-figure">/g) ?? []).length, 9);
  assert.equal((post.match(/<\/figure>/g) ?? []).length, 9);
  assert.equal((post.match(/<figcaption>/g) ?? []).length, 9);
  assert.equal((post.match(/<\/figcaption>/g) ?? []).length, 9);

  for (const photo of photos) {
    assert.ok(post.includes(`<figcaption>${photo.caption}</figcaption>`), `${photo.file} 캡션이 있어야 한다`);
    assert.ok(post.includes(`alt="${photo.alt}"`), `${photo.file} alt 가 승인된 설명과 같아야 한다`);
  }

  // 한 장짜리 figure 라 캐러셀 제어 버튼·상태 표시는 넣지 않는다.
  assert.doesNotMatch(post, /data-image-carousel|data-carousel-prev|data-carousel-next|data-carousel-status/);
  assert.doesNotMatch(post, /image-carousel-controls|image-carousel-status/);
});

test('추가 사진 2장은 로컬 저장의 잠정 순서와 로그인·동기화의 미해결 문단 뒤에 각각 놓인다', async () => {
  const post = await readFile(postPath, 'utf8');
  const localStorageAnchor = '지금은 로컬 스토리지와 내보내기 기능 정도로 시작해 보려고 합니다.';
  const userExpectationAnchor = '다만 이 결론이 깔끔하지 않은 건, 이용자 입장에서 로그인과 동기화가 너무 당연하기 때문입니다.';
  const closingAnchor = '8장을 읽고 나서도 답을 얻지는 못했습니다.';
  const shoppingImage = '/08-shopping-list-local.webp';
  const quizImage = '/09-quiz-by-quiz-lobby.webp';

  assert.ok(post.indexOf(localStorageAnchor) < post.indexOf(shoppingImage));
  assert.ok(post.indexOf(shoppingImage) < post.indexOf(userExpectationAnchor));
  assert.ok(post.indexOf(userExpectationAnchor) < post.indexOf(quizImage));
  assert.ok(post.indexOf(quizImage) < post.indexOf(closingAnchor));
});

test('6주차 사진 9장이 실제 WebP 파일로 저장소에 있다', async () => {
  await Promise.all(
    photos.map(async (photo) => {
      const fileUrl = new URL(`${imageDir}${photo.file}`, root);
      await access(fileUrl);
      const bytes = await readFile(fileUrl);
      assert.equal(bytes.subarray(0, 4).toString('latin1'), 'RIFF', `${photo.file} 은 RIFF 컨테이너여야 한다`);
      assert.equal(bytes.subarray(8, 12).toString('latin1'), 'WEBP', `${photo.file} 은 WEBP 여야 한다`);
    }),
  );
});

test('global.css 에 한 장짜리 게시물 media figure 전용 규칙이 있다', async () => {
  const css = await readFile(globalCssPath, 'utf8');

  // figure 기본 좌우 들여쓰기 제거.
  assert.match(css, /\.post-article \.post-media-figure \{[^}]*margin-inline: 0;[^}]*\}/);
  // 캡션 가독성(본문보다 작고 흐린 색).
  assert.match(css, /\.post-article \.post-media-figure figcaption \{[^}]*color: var\(--muted\);[^}]*\}/);
  assert.match(css, /\.post-article \.post-media-figure figcaption \{[^}]*font-size:[^}]*\}/);
  // 새 규칙은 이 클래스 밖의 figure 나 본문 이미지에 영향을 주지 않는다.
  assert.doesNotMatch(css, /\.post-article figure \{/);
  assert.doesNotMatch(css, /^figure \{/m);
});
