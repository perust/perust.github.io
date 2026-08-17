import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-18-vibe-coding-week6-mcp-database.md', root);
const globalCssPath = new URL('src/styles/global.css', root);
const imageDir = 'public/images/posts/2026-08-18-vibe-coding-week6-mcp-database/';

// 초안(02_Claude_초안.md)의 사진 주석 4개가 그대로 옮겨진 값. 순서·캡션·alt 가 SSOT 다.
const photos = [
  {
    file: '01-chapter-08-overview.webp',
    caption: '8장은 MCP로 Claude Code의 도구 범위를 넓히는 흐름으로 시작한다.',
    alt: '노트북 옆에 펼쳐 둔 책의 Chapter 08 시작면. MCP로 클로드 코드의 한계 넘어서기라는 제목과 학습 목표가 보인다.',
  },
  {
    file: '02-mcp-connection.webp',
    caption: '08-1에서는 MCP의 개념과 Claude Code 연결 방식을 다룬다.',
    alt: '08-1 MCP 이해하고 클로드 코드와 연결하기 페이지. MCP, 클라이언트 서버 모델, 로컬 MCP, 원격 MCP, 인증 핵심 키워드가 보인다.',
  },
  {
    file: '03-automation-workflow.webp',
    caption: '08-2는 테스트와 버전 관리를 자동화 흐름으로 묶는다.',
    alt: '08-2 MCP로 구현하는 완전 자동화 개발 환경 페이지. 테스트, 버전 관리, Context7, Playwright, 원격 저장소, 추가, 커밋, 푸시 키워드가 보인다.',
  },
  {
    file: '04-service-database.webp',
    caption: '08-3의 배포·저장소 주제는 서비스의 책임 범위를 생각하게 했다.',
    alt: '08-3 데이터베이스 연결해 진짜 서비스 만들기 페이지. Vercel, 배포, 로컬 스토리지, 클라우드 스토리지, Supabase, 데이터베이스, 테이블 키워드가 보인다.',
  },
];

test('6주차 후기는 8장의 MCP·자동화·데이터베이스 흐름을 다섯 절로 정리한다', async () => {
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

  // 초안의 핵심 5개 절이 순서대로 남아 있고, 그 밖의 절은 추가하지 않는다.
  const headings = [...post.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    '설치를 맡길 수 있다는 것과, 안다는 것',
    "'자동화'라는 말이 실제로 요구한 것",
    '편해진 설정과, 그래도 남는 확인',
    '로그인과 데이터베이스는 기능이 아니었습니다',
    '아직 정리되지 않은 채로',
  ]);

  // 7장 실습을 귀속시키는 문장은 5주차 후기로 가는 내부 링크를 단다.
  assert.ok(
    post.includes('[지난 5주차 후기](/blog/2026-08-11-vibe-coding-week5-api-ai-agents/)'),
    '5주차 후기 내부 링크가 있어야 한다',
  );

  // 초안의 HTML 사진 주석은 하나도 남지 않는다.
  assert.doesNotMatch(post, /<!--/);
  assert.doesNotMatch(post, /-->/);
  assert.doesNotMatch(post, /사진 파일명:/);
  assert.doesNotMatch(post, /img_[0-9a-f]{12}\.png/);

  // 키·토큰·자격 증명 문자열은 공개 본문에 없어야 한다.
  assert.doesNotMatch(post, /sk-or-v1-|sk-ant-|nvapi-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{16,}/);
  assert.doesNotMatch(post, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
  assert.doesNotMatch(post, /service_role|SUPABASE_[A-Z_]*KEY|ANON_KEY|API_KEY\s*=/);
});

test('6주차 책 사진 4장은 캐러셀 제어 없이 figure/figcaption 으로 들어간다', async () => {
  const post = await readFile(postPath, 'utf8');

  const imageRefs = [...post.matchAll(/\/images\/posts\/2026-08-18-vibe-coding-week6-mcp-database\/[^"')\s]+\.webp/g)]
    .map((match) => match[0]);
  assert.equal(imageRefs.length, 4);
  assert.equal(new Set(imageRefs).size, 4);
  assert.deepEqual(imageRefs.map((ref) => ref.split('/').at(-1)), photos.map((photo) => photo.file));

  const imgTags = [...post.matchAll(/<img\s[^>]*>/g)].map((match) => match[0]);
  assert.equal(imgTags.length, 4);
  assert.equal((post.match(/\salt="[^"]+"/g) ?? []).length, 4);
  for (const tag of imgTags) {
    assert.match(tag, /width="1200"/);
    assert.match(tag, /height="1600"/);
    assert.match(tag, /loading="lazy"/);
    assert.match(tag, /decoding="async"/);
  }

  assert.equal((post.match(/<figure class="book-page-figure">/g) ?? []).length, 4);
  assert.equal((post.match(/<\/figure>/g) ?? []).length, 4);
  assert.equal((post.match(/<figcaption>/g) ?? []).length, 4);
  assert.equal((post.match(/<\/figcaption>/g) ?? []).length, 4);

  for (const photo of photos) {
    assert.ok(post.includes(`<figcaption>${photo.caption}</figcaption>`), `${photo.file} 캡션이 있어야 한다`);
    assert.ok(post.includes(`alt="${photo.alt}"`), `${photo.file} alt 는 초안 주석 그대로여야 한다`);
  }

  // 한 장짜리 figure 라 캐러셀 제어 버튼·상태 표시는 넣지 않는다.
  assert.doesNotMatch(post, /data-image-carousel|data-carousel-prev|data-carousel-next|data-carousel-status/);
  assert.doesNotMatch(post, /image-carousel-controls|image-carousel-status/);
});

test('6주차 사진 4장이 WebP 파일로 저장소에 있다', async () => {
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

test('global.css 에 한 장짜리 책 사진 figure 전용 규칙이 있다', async () => {
  const css = await readFile(globalCssPath, 'utf8');

  // figure 기본 좌우 들여쓰기 제거.
  assert.match(css, /\.post-article \.book-page-figure \{[^}]*margin-inline: 0;[^}]*\}/);
  // 캡션 가독성(본문보다 작고 흐린 색).
  assert.match(css, /\.post-article \.book-page-figure figcaption \{[^}]*color: var\(--muted\);[^}]*\}/);
  assert.match(css, /\.post-article \.book-page-figure figcaption \{[^}]*font-size:[^}]*\}/);
  // 새 규칙은 이 클래스 밖의 figure 나 본문 이미지에 영향을 주지 않는다.
  assert.doesNotMatch(css, /\.post-article figure \{/);
  assert.doesNotMatch(css, /^figure \{/m);
});
