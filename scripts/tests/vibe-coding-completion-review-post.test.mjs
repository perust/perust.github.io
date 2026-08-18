import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-18-vibe-coding-completion-review.md', root);
const imageDir = 'public/images/posts/2026-08-18-vibe-coding-completion-review/';

const images = [
  {
    file: '01-empathy-diary-entry.png',
    width: 1556,
    height: 1430,
    alt: '마음 구슬 앱에서 오늘의 하루를 한 줄로 입력하고 감정을 읽는 중인 화면. 서버 연결 상태와 감정 구슬 생성 안내가 보인다.',
    captionPhrase: '기록에서 감정',
  },
  {
    file: '02-empathy-diary-result.png',
    width: 1414,
    height: 1124,
    alt: '마음 구슬 앱이 기쁨 이모티콘과 감정 세기 9/10, 공감 메시지를 보여주는 결과 화면.',
    captionPhrase: '감정',
  },
  {
    file: '03-empathy-diary-memory.png',
    width: 1708,
    height: 604,
    alt: '기억 저장소 3개 화면에서 전체·기쁨·슬픔 등 감정 필터와 세 개의 감정 구슬 기록을 보여주는 화면.',
    captionPhrase: '기억 저장소',
  },
  {
    file: '04-quiz-by-quiz-online-menu.png',
    width: 1774,
    height: 1172,
    alt: 'quiz by quiz 앱의 시작 화면. 캐릭터, 랭킹, 친구와 같이 풀기 온라인 메뉴와 한국사·과학 퀴즈 카테고리가 보인다.',
    captionPhrase: '퀴즈 앱',
  },
  {
    file: '05-my-what-todo-pomodoro.png',
    width: 1872,
    height: 1434,
    alt: '다크 모드의 My What Todo 앱. 24분 56초 집중 중인 원형 뽀모도로 타이머와 할 일 입력·분류 화면이 보인다.',
    captionPhrase: '할 일 앱',
  },
];

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readPngChunkTypes(bytes) {
  const types = [];
  let offset = pngSignature.length;

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    types.push(type);
    offset += length + 12;
  }

  return types;
}

test('별도 완독 후기는 새 slug와 정책 frontmatter, 1~8장 요약을 갖춘다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.ok(
    post.includes('title: "[완독 후기] 인프런 6주 챌린지, 『혼자 공부하는 바이브 코딩 with 클로드 코드』"'),
  );
  assert.match(post, /^date: "2026-08-18"$/m);
  assert.match(post, /^category: "도서 학습 챌린지"$/m);
  assert.match(post, /^tags: \["바이브코딩", "ClaudeCode", "AI코딩", "자동화", "회고"\]$/m);
  assert.match(post, /^editorialReview: true$/m);
  assert.match(post, /^valueType: "review"$/m);
  assert.match(post, /^publishPacingException: "deadline-bound-challenge"$/m);

  assert.match(post, /^## 1장부터 8장까지, 간단히 정리$/m);
  for (let chapter = 1; chapter <= 8; chapter += 1) {
    assert.match(post, new RegExp(`^### ${chapter}장`, 'm'), `${chapter}장 소제목이 있어야 한다`);
  }

  assert.match(post, /^## 챌린지를 신청한 이유$/m);
  assert.match(post, /^## 배우고 직접 해보고$/m);
  assert.match(post, /^## 모델이 좋아지고 바이브 코딩을 알아갈수록 더 생겨나는 고민들$/m);
  assert.match(post, /^## 이번에는 조금 다르게 해본 실습$/m);
  assert.match(post, /AI 감성 일기 앱/);
  assert.match(post, /방을 만들고 참여하는 흐름까지 생각해보며 구체화해봤습니다/);
  assert.doesNotMatch(post, /다른 사람과 함께 뛰어다니며 게임을 즐길 수 있도록/);

  // 기존 Ch 08 후기는 별도 글로 보존한다. 새 글이 기존 이미지 경로를 재사용하면 안 된다.
  assert.doesNotMatch(post, /\/images\/posts\/2026-08-18-vibe-coding-week6-mcp-database\//);
  assert.doesNotMatch(post, /인프런 제출 완료/);
  assert.doesNotMatch(post, /sk-or-v1-|sk-ant-|nvapi-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{16,}/);
  assert.doesNotMatch(post, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
  assert.doesNotMatch(post, /service_role|SUPABASE_[A-Z_]*KEY|ANON_KEY|API_KEY\s*=/);
});

test('별도 완독 후기의 사용자 제공 이미지 5장은 실제 PNG와 figure/alt/caption 결속을 갖춘다', async () => {
  const post = await readFile(postPath, 'utf8');
  const imageRefs = [...post.matchAll(/\/images\/posts\/2026-08-18-vibe-coding-completion-review\/[^"')\s]+\.png/g)]
    .map((match) => match[0]);

  assert.deepEqual(imageRefs.map((ref) => ref.split('/').at(-1)), images.map((image) => image.file));
  assert.equal((post.match(/<figure class="book-page-figure">/g) ?? []).length, 5);
  assert.equal((post.match(/<figcaption>/g) ?? []).length, 5);
  assert.doesNotMatch(post, /data-image-carousel|data-carousel-prev|data-carousel-next|data-carousel-status/);

  for (const image of images) {
    const figurePattern = new RegExp(
      `<figure class="book-page-figure">[\\s\\S]*?` +
        `<img[^>]*src="/images/posts/2026-08-18-vibe-coding-completion-review/${escapeRegex(image.file)}"` +
        `[^>]*alt="${escapeRegex(image.alt)}"` +
        `[^>]*width="${image.width}"` +
        `[^>]*height="${image.height}"` +
        `[^>]*loading="lazy"[^>]*decoding="async"[^>]*>[\\s\\S]*?` +
        `[^<]*${escapeRegex(image.captionPhrase)}[^<]*<\\/figcaption>\\s*<\\/figure>`,
    );
    assert.match(post, figurePattern, `${image.file} figure의 src·alt·실제 치수·caption이 결속되어야 한다`);

    const bytes = await readFile(new URL(`${imageDir}${image.file}`, root));
    assert.deepEqual(bytes.subarray(0, pngSignature.length), pngSignature, `${image.file}은 PNG 데이터여야 한다`);
    const chunkTypes = readPngChunkTypes(bytes);
    for (const forbiddenChunk of ['eXIf', 'iTXt', 'tEXt', 'zTXt']) {
      assert.ok(!chunkTypes.includes(forbiddenChunk), `${image.file}은 ${forbiddenChunk} 메타데이터를 포함하면 안 된다`);
    }
    await access(new URL(`${imageDir}${image.file}`, root));
  }
});

test('완독 후기 마지막에는 공개된 제작 프로그램 네 개의 실행 링크 카드를 둔다', async () => {
  const post = await readFile(postPath, 'utf8');
  const heading = '## 만들어본 프로그램들,';
  const headingIndex = post.indexOf(heading);
  const reflectionIndex = post.indexOf('이번에도 5-6주차');
  const cards = [
    {
      href: 'https://ai-empathy-diary-sigma.vercel.app/',
      ariaLabel: '마음 구슬, AI 공감 다이어리 실행하기',
      label: '마음 구슬, AI 공감 다이어리 실행하기',
    },
    {
      href: '/contents/digit-recognizer/',
      ariaLabel: '손글씨 숫자 인식기 실행하기',
      label: '손글씨 숫자 인식기 실행하기',
    },
    {
      href: 'https://perust.github.io/quiz-by-quiz/',
      ariaLabel: 'quiz by quiz, 퀴즈 게임 실행하기',
      label: 'quiz by quiz 실행하기',
    },
    {
      href: '/my-what-todo/',
      ariaLabel: 'My What Todo, 할 일 관리 프로그램 실행하기',
      label: 'My What Todo 실행하기',
    },
  ];

  assert.ok(headingIndex > reflectionIndex, '링크 카드 묶음은 마무리 소감 뒤에 있어야 한다');
  assert.equal((post.match(/class="app-launch-button"/g) ?? []).length, cards.length);

  for (const card of cards) {
    const cardPattern = new RegExp(
      `<a href="${escapeRegex(card.href)}" class="app-launch-button" aria-label="${escapeRegex(card.ariaLabel)}">` +
        `<span class="app-launch-button__label">${escapeRegex(card.label)}<\\/span>` +
        `<span class="app-launch-button__action">바로가기 <span aria-hidden="true">→<\\/span><\\/span><\\/a>`,
    );
    assert.match(post, cardPattern, `${card.label} 카드의 목적지·접근성 이름·행동 표기가 필요하다`);
    assert.ok(post.indexOf(`href="${card.href}"`) > headingIndex, `${card.label} 카드는 실행 섹션 안에 있어야 한다`);
  }
});
