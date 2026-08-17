import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { wikiPageSchema } from '../../src/config/wiki-schema.mjs';
import { assertWikiIntegrity } from '../../src/utils/wiki-integrity.mjs';

const chapterUrl = new URL(
  '../../src/content/wiki-pages/web-building/02-content-collections.md',
  import.meta.url,
);
const contentConfigUrl = new URL('../../src/content.config.ts', import.meta.url);
const existingChapterUrls = [
  '01-site-structure.md',
  '02-content-collections.md',
  '03-github-pages-deployment.md',
].map((name) => new URL(`../../src/content/wiki-pages/web-building/${name}`, import.meta.url));

function extractFence(markdown, language) {
  const fence = '```';
  const match = markdown.match(new RegExp(`${fence}${language}\\n([\\s\\S]*?)\\n${fence}`));
  assert.ok(match, `${language} 예제 코드 블록이 있어야 한다`);
  return match[1];
}

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, '장 frontmatter가 있어야 한다');
  return match[1];
}

function quotedValue(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*["']([^"']+)["']\\s*$`, 'm'))?.[1];
}

function documentedChapterFixture(frontmatter) {
  return {
    title: quotedValue(frontmatter, 'title'),
    description: quotedValue(frontmatter, 'description'),
    book: quotedValue(frontmatter, 'book'),
    part: quotedValue(frontmatter, 'part'),
    order: Number(frontmatter.match(/^order:\s*(\d+)\s*$/m)?.[1]),
    slug: quotedValue(frontmatter, 'slug'),
    published: quotedValue(frontmatter, 'published'),
    updated: quotedValue(frontmatter, 'updated'),
    lastVerified: quotedValue(frontmatter, 'lastVerified'),
    sources: [
      {
        title: quotedValue(frontmatter, '\\s*- title'),
        organization: quotedValue(frontmatter, '\\s+organization'),
        url: quotedValue(frontmatter, '\\s+url'),
        accessed: quotedValue(frontmatter, '\\s+accessed'),
      },
    ],
  };
}

test('컬렉션 정의 예제는 운영 스키마 필드와 기존 컬렉션을 보존하는 등록문을 사용한다', async () => {
  const [markdown, contentConfig] = await Promise.all([
    readFile(chapterUrl, 'utf8'),
    readFile(contentConfigUrl, 'utf8'),
  ]);
  const example = extractFence(markdown, 'ts');
  const registrationDiff = extractFence(markdown, 'diff');

  assert.match(example, /import \{ defineCollection \} from 'astro:content';/);
  assert.match(example, /import \{ glob \} from 'astro\/loaders';/);
  assert.match(example, /import \{ z \} from 'astro\/zod';/);
  for (const field of [
    'title',
    'description',
    'book',
    'part',
    'order',
    'slug',
    'published',
    'updated',
    'lastVerified',
    'sources',
  ]) {
    assert.match(example, new RegExp(`\\b${field}:`), `${field} 필드가 예제 스키마에 있어야 한다`);
  }
  assert.doesNotMatch(
    example,
    /export const collections/,
    '축약한 wikiPages 정의가 기존 컬렉션을 제거하는 단독 export를 제시하면 안 된다',
  );

  const actualRegistration = contentConfig.match(/export const collections\s*=\s*\{[^}]+\};/)?.[0];
  const documentedRegistration = registrationDiff.match(/^\+(.+)$/m)?.[1];
  assert.ok(actualRegistration, '운영 content config에 컬렉션 등록문이 있어야 한다');
  assert.equal(
    documentedRegistration,
    actualRegistration,
    '문서의 추가 후 등록문은 운영 content config와 정확히 일치해야 한다',
  );
});

test('문서의 새 장 frontmatter 예제는 실제 운영 스키마를 통과한다', async () => {
  const markdown = await readFile(chapterUrl, 'utf8');
  const frontmatter = extractFence(markdown, 'md');
  const fixture = documentedChapterFixture(frontmatter);
  assert.ok(fixture.published, 'frontmatter 예제는 최초 발행일을 명시해야 한다');
  const result = wikiPageSchema.safeParse(fixture);

  assert.equal(
    result.success,
    true,
    result.success ? '' : JSON.stringify(result.error.issues, null, 2),
  );
});

test('문서의 새 장 예제는 현재 목차 끝에 추가되고 중간 부 재개는 차단된다', async () => {
  const [markdown, ...existingMarkdown] = await Promise.all([
    readFile(chapterUrl, 'utf8'),
    ...existingChapterUrls.map((url) => readFile(url, 'utf8')),
  ]);
  const fixture = documentedChapterFixture(extractFence(markdown, 'md'));
  const existingPages = existingMarkdown.map((chapter, index) => ({
    id: existingChapterUrls[index].pathname.split('/').at(-1),
    data: documentedChapterFixture(extractFrontmatter(chapter)),
  }));
  const books = [{ id: fixture.book }];
  const documentedPage = { id: 'documented-new-chapter', data: fixture };

  assert.doesNotThrow(() => assertWikiIntegrity(books, [...existingPages, documentedPage]));

  const reopenedMiddlePart = {
    ...documentedPage,
    data: { ...fixture, part: existingPages[1].data.part },
  };
  assert.throws(
    () => assertWikiIntegrity(books, [...existingPages, reopenedMiddlePart]),
    /비연속 위키 부/,
  );
});
