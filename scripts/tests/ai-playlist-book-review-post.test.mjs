import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-31-ai-playlist-book-review.md', root);
const imageDir = 'public/images/posts/2026-08-31-ai-playlist-book-review/';
const officialBookUrl = 'https://www.hanbit.co.kr/books/%EC%9C%A0%ED%8A%9C%EB%B8%8C%EC%97%90%EC%84%9C-%EC%9D%8C%EC%9B%90-%EB%B0%9C%EB%A7%A4%EA%B9%8C%EC%A7%80-ai-%ED%94%8C%EB%A0%88%EC%9D%B4%EB%A6%AC%EC%8A%A4%ED%8A%B8-with-%EC%88%98%EB%85%B8-%EC%A0%9C%EB%AF%B8%EB%82%98%EC%9D%B4-%EB%A6%AC%ED%8D%BC-%EC%BA%94%EB%B0%94-%EC%BA%A1%EC%BB%B7-%EC%8A%A4%ED%8F%AC%ED%8B%B0%ED%8C%8C%EC%9D%B4?code=B3492267901';

const disclosure = '한빛미디어 서평단 &lt;나는리뷰어다&gt; 활동을 위해서 책을 협찬 받아 작성된 서평입니다.';
const images = [
  {
    file: '01-cover.webp',
    alt: '초록색과 검은색으로 구성된 유튜브에서 음원 발매까지 AI 플레이리스트 책 표지',
  },
  {
    file: '02-title-page.webp',
    alt: '유튜브에서 음원 발매까지 AI 플레이리스트라는 제목이 적힌 전자책 반표제지',
  },
  {
    file: '03-chapter-06-lyrics-prompt.webp',
    alt: '작사 프롬프트 설계 원칙을 다루는 6장 도입부와 학습 목표',
  },
  {
    file: '04-cover-detail.webp',
    alt: '초록색 제목과 문태영 지음, 한빛미디어 로고가 보이는 전자책 속표지',
  },
  {
    file: '05-chapter-12-reaper.webp',
    alt: '리퍼 시작하기를 다루는 12장 도입부와 플레이리스트 편집 학습 목표',
  },
];

function bodyOf(post) {
  const frontmatter = post.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  assert.ok(frontmatter, 'frontmatter가 있어야 한다');
  return post.slice(frontmatter[0].length).trimStart();
}

test('AI 플레이리스트 서평은 제공 도서 고지와 공식 책 정보를 첫 부분에 둔다', async () => {
  const post = await readFile(postPath, 'utf8');
  const body = bodyOf(post);

  assert.match(post, /^date: "2026-08-31"$/m);
  assert.match(post, /^category: "책 서평"$/m);
  assert.match(post, /^tags: \["AI", "AI도구", "Gemini", "생성형AI", "서평"\]$/m);
  assert.match(post, /^valueType: "review"$/m);
  assert.ok(body.startsWith('<p class="review-disclosure"'), '협찬 고지가 본문의 첫 요소여야 한다');
  assert.ok(body.indexOf(disclosure) < body.indexOf('## 책 정보'));
  assert.match(body, /font-size:\s*1\.25rem/);
  assert.match(body, /font-weight:\s*700/);
  assert.ok(post.includes(`href="${officialBookUrl}"`));
  assert.match(post, /<dt>저자<\/dt><dd>문태영<\/dd>/);
  assert.match(post, /<dt>출판사·출간일<\/dt><dd>한빛미디어 · 2026년 7월 21일<\/dd>/);
  assert.match(post, /<dt>분량·ISBN<\/dt><dd>356쪽 · 9791175790742<\/dd>/);
});

test('AI 플레이리스트 서평은 사용자가 직접 수정한 관찰과 망설임을 보존한다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.match(post, /제가 봤을 때 체감상 80% 이상이 아닐까 싶을 만큼/);
  assert.match(post, /자신이 만든 노래만 듣고 다니는 사람도 있다고 하더군요/);
  assert.match(post, /아직은 실습을 조금 해본 정도/);
  assert.match(post, /다른 차원의 일/);
  assert.match(post, /제가 AI 생성 음악으로 플레이리스트 채널을 운영하는 게 맞는가/);
  assert.match(post, /제가 이 음악을 듣는 것이 부담스러운데/);
  assert.match(post, /입맛이 까다로운 사람.*요리사/);
  assert.match(post, /이미지.*분위기.*취향|취향.*이미지.*분위기/);
  assert.match(post, /AI 플레이리스트를 만들어서 채널까지 운영할 수 있을지는 모르겠지만/);
  assert.match(post, /감사합니다\.\s*$/);
  assert.doesNotMatch(post, /제가 찾아본 범위에서는 체감상 90%/);
  assert.doesNotMatch(post, /수노 5\.5.*창의성.*줄였다/);
  assert.doesNotMatch(post, /~/);
});

test('사용자 제공 사진 5장은 순서·alt·실제 WebP 자산을 갖춘다', async () => {
  const post = await readFile(postPath, 'utf8');
  const refs = [...post.matchAll(/\/images\/posts\/2026-08-31-ai-playlist-book-review\/[^"')\s]+\.webp/g)]
    .map((match) => match[0]);

  assert.deepEqual(refs.map((ref) => ref.split('/').at(-1)), images.map((image) => image.file));

  for (const image of images) {
    const source = `/images/posts/2026-08-31-ai-playlist-book-review/${image.file}`;
    const imagePattern = new RegExp(
      `<img[^>]*src="${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"` +
        `[^>]*alt="${image.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"` +
        `[^>]*width="1400"[^>]*height="1866"[^>]*decoding="async"[^>]*>`,
    );
    assert.match(post, imagePattern, `${image.file}의 경로·alt·실제 치수·비동기 디코딩이 필요하다`);

    const assetUrl = new URL(`${imageDir}${image.file}`, root);
    const bytes = await readFile(assetUrl);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${image.file}은 RIFF WebP여야 한다`);
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${image.file}은 WebP여야 한다`);
    assert.ok(bytes.byteLength <= 300_000, `${image.file}은 300KB 성능 예산 안에 있어야 한다`);
    assert.ok(!bytes.includes(Buffer.from('EXIF')), `${image.file}은 EXIF 메타데이터를 포함하면 안 된다`);
    assert.ok(!bytes.includes(Buffer.from('XMP ')), `${image.file}은 XMP 메타데이터를 포함하면 안 된다`);
    await access(assetUrl);
  }
});
