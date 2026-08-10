import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const postPath = new URL('src/content/blog/2026-08-11-vibe-coding-week5-api-ai-agents.md', root);
const blogPagePath = new URL('src/pages/blog/[slug].astro', root);
const imageDir = 'public/images/posts/2026-08-11-vibe-coding-week5/';

test('5주차 후기는 API 한도와 에이전트 협업의 실제 경험을 중심으로 구성된다', async () => {
  const post = await readFile(postPath, 'utf8');

  assert.match(post, /## Ch 06\. 클로드 코드에 API 날개 달기/);
  assert.match(post, /## Ch 07\. AI 에이전트로 개발팀 구성하기/);
  assert.match(post, /무료 모델은 하루 50회/);
  assert.match(post, /테스트 완료라는 보고만 믿을 수는 없었습니다/);
  assert.match(post, /하나의 작은 회사처럼/);
  assert.match(post, /냉장고 앱은 기존의 재료 인식과 레시피 생성 흐름을 유지하고/);
  assert.match(post, /일기 앱은 감정 분석과 공감 메시지를 유지하면서 기억 저장소 화면을 더했습니다/);
  assert.match(post, /## 같은 역할의 에이전트가 있으면 기존 설정부터 살펴봤다/);
  assert.match(post, /대화형 생성 위저드가 사라지고 자연어 요청으로 바뀐 모습/);
  assert.doesNotMatch(post, /명령어가 사라지고 자연어 요청으로 바뀐 모습/);
  assert.match(post, /https:\/\/openrouter\.ai\/docs\/api-reference\/limits/);
  assert.match(post, /https:\/\/code\.claude\.com\/docs\/en\/sub-agents/);
  assert.match(post, /https:\/\/github\.com\/perust\/fridge-recipe-nim/);
  assert.doesNotMatch(post, /sk-or-v1-|nvapi-[A-Za-z0-9_-]{12,}/);
});

test('5주차 후기에는 받은 사진 22장과 접근 가능한 캐러셀 제어가 모두 들어간다', async () => {
  const [post, blogPage] = await Promise.all([
    readFile(postPath, 'utf8'),
    readFile(blogPagePath, 'utf8'),
  ]);
  const imageRefs = [...post.matchAll(/\/images\/posts\/2026-08-11-vibe-coding-week5\/[^"')\s]+\.webp/g)];
  const alts = [...post.matchAll(/<img\s+[^>]*alt="[^"]+"[^>]*>/g)];

  assert.equal(new Set(imageRefs.map((match) => match[0])).size, 22);
  assert.equal(alts.length, 22);
  assert.equal((post.match(/data-image-carousel/g) ?? []).length, 6);
  assert.equal((post.match(/data-carousel-prev/g) ?? []).length, 6);
  assert.equal((post.match(/data-carousel-next/g) ?? []).length, 6);
  assert.equal((post.match(/data-carousel-status/g) ?? []).length, 6);
  assert.match(post, /image-carousel-track image-carousel-track--contained-slides/);
  assert.match(
    blogPage,
    /\.image-carousel-track--contained-slides img\s*\{[\s\S]*?width: min\(82vw, 620px\);[\s\S]*?height: 390px;/,
  );

  await Promise.all(
    Array.from({ length: 22 }, (_, index) => {
      const prefix = String(index + 1).padStart(2, '0');
      const ref = imageRefs.find((match) => match[0].includes(`/${prefix}-`));
      assert.ok(ref, `${prefix}번 이미지 참조가 있어야 한다`);
      return access(new URL(`${imageDir}${ref[0].split('/').at(-1)}`, root));
    }),
  );
});
