import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

async function readOrEmpty(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), 'utf8');
  } catch {
    return '';
  }
}

async function namesOrEmpty(relativePath) {
  try {
    return await readdir(new URL(relativePath, root));
  } catch {
    return [];
  }
}

test('위키는 블로그와 분리된 책·장 컬렉션이며 상단 메뉴에서 접근할 수 있다', async () => {
  const [layout, wikiLayout, contentConfig, wikiUtils, wikiSchema] = await Promise.all([
    readOrEmpty('src/layouts/BaseLayout.astro'),
    readOrEmpty('src/layouts/WikiLayout.astro'),
    readOrEmpty('src/content.config.ts'),
    readOrEmpty('src/utils/wiki.ts'),
    readOrEmpty('src/config/wiki-schema.mjs'),
  ]);

  assert.match(layout, /\['\/wiki\/',\s*'위키'\]/);
  assert.match(contentConfig, /const wikiBooks = defineCollection/);
  assert.match(contentConfig, /const wikiPages = defineCollection/);
  assert.match(contentConfig, /loader:\s*glob\(/);
  assert.match(contentConfig, /schema:\s*wikiBookSchema/);
  assert.match(contentConfig, /schema:\s*wikiPageSchema/);
  assert.match(wikiSchema, /published:\s*z\.coerce\.date\(\)/);
  assert.match(wikiSchema, /lastVerified:\s*z\.coerce\.date\(\)/);
  assert.match(wikiSchema, /sources:\s*z\.array\(wikiSourceSchema\)\.min\(1\)/);
  assert.match(wikiLayout, /import \{ getWikiPageDateMetadata \} from '\.\.\/utils\/wiki-metadata\.mjs';/);
  assert.match(wikiLayout, /const pageDates = getWikiPageDateMetadata\(page\.data\)/);
  assert.match(wikiLayout, /datePublished:\s*pageDates\.datePublished/);
  assert.match(wikiLayout, /dateModified:\s*pageDates\.dateModified/);
  assert.match(wikiLayout, /publishedTime=\{pageDates\.datePublished\}/);
  assert.match(wikiLayout, /modifiedTime=\{pageDates\.dateModified\}/);
  assert.match(
    wikiLayout,
    /<time datetime=\{pageDates\.dateModified\}>\{formatWikiDate\(page\.data\.updated\)\}<\/time>/,
  );
  assert.match(
    wikiLayout,
    /<time datetime=\{pageDates\.lastVerified\}>\{formatWikiDate\(page\.data\.lastVerified\)\}<\/time>/,
  );
  assert.match(wikiUtils, /assertWikiIntegrity\(books,\s*pages\)/);
  assert.match(contentConfig, /export const collections = \{[^}]*wikiBooks[^}]*wikiPages[^}]*\}/s);
});

test('첫 위키 책은 큰 범위 한 권 아래 검증된 소수의 장으로 시작한다', async () => {
  const bookRaw = await readOrEmpty('src/content/wiki-books/web-building.json');
  assert.ok(bookRaw, '첫 책 메타데이터가 있어야 한다');

  const book = JSON.parse(bookRaw);
  assert.equal(book.title, '웹사이트 만들기와 운영');
  assert.equal(book.status, 'growing');
  assert.match(book.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(book.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(book.description.length >= 50, '책 설명은 범위와 목적을 충분히 설명해야 한다');

  const chapterNames = (await namesOrEmpty('src/content/wiki-pages/web-building/'))
    .filter((name) => name.endsWith('.md'))
    .sort();
  assert.ok(chapterNames.length >= 3, '초기 책에는 검증 가능한 장이 세 개 이상 있어야 한다');

  for (const chapterName of chapterNames) {
    const chapter = await readOrEmpty(`src/content/wiki-pages/web-building/${chapterName}`);
    assert.match(chapter, /^---[\s\S]*?book:\s*["']?web-building["']?[\s\S]*?---/);
    assert.match(chapter, /^published:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m);
    assert.match(chapter, /^lastVerified:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m);
    assert.match(chapter, /^sources:\s*$/m);
    assert.match(chapter, /https:\/\//);
    assert.match(chapter, /^##\s+/m, `${chapterName}: 교재형 본문 소제목이 있어야 한다`);
    assert.doesNotMatch(chapter, /전자책|서재/, `${chapterName}: 위키를 전자책이나 서재로 부르지 않아야 한다`);
  }
});

test('빌드된 위키 홈과 책 표지는 책·목차 중심의 정보 구조를 제공한다', async () => {
  const [library, book] = await Promise.all([
    readOrEmpty('dist/wiki/index.html'),
    readOrEmpty('dist/wiki/web-building/index.html'),
  ]);

  assert.match(library, /Lentoludens Wiki/);
  assert.doesNotMatch(library, /무료 전자책|서재|Free e-books/);
  assert.doesNotMatch(
    library,
    /wiki-library-principles|공식 문서와 1차 자료 우선|수정일과 마지막 검증일 구분|빈 목차보다 확인한 소수의 장/,
  );
  assert.match(library, /웹사이트 만들기와 운영/);
  assert.match(library, /href="\/wiki\/web-building\/"/);
  assert.match(library, /<label[^>]*for="wiki-search"[^>]*>위키 검색<\/label>/);
  assert.doesNotMatch(library, /<input[^>]*id="wiki-search"[^>]*aria-label=/);
  assert.match(library, /data-wiki-search/);

  assert.match(book, /전체 목차/);
  assert.match(book, /정적 사이트의 기본 구조/);
  assert.match(book, /콘텐츠를 구조화해서 관리하기/);
  assert.match(book, /GitHub Pages에 자동 배포하기/);
  assert.match(book, /"@type":"Book"/);
  assert.match(book, /"@type":"BreadcrumbList"/);
});

test('장 읽기 화면은 계층형 목차·출처·이전/다음·읽기 진행 상태를 제공한다', async () => {
  const chapter = await readOrEmpty('dist/wiki/web-building/content-collections/index.html');

  assert.match(chapter, /aria-label="책 목차"/);
  assert.match(chapter, /aria-current="page"/);
  assert.match(chapter, /공식 출처/);
  assert.match(chapter, /docs\.astro\.build\/en\/guides\/content-collections/);
  assert.match(chapter, /이전 장/);
  assert.match(chapter, /다음 장/);
  assert.match(chapter, /data-reading-progress/);
  assert.match(chapter, /localStorage/);
  assert.match(chapter, /"@type":"TechArticle"/);
  assert.match(chapter, /"@type":"BreadcrumbList"/);
});

test('위키 독서 화면은 모바일 목차와 인쇄용 레이아웃을 갖는다', async () => {
  const css = await readOrEmpty('src/styles/wiki.css');
  const layout = await readOrEmpty('src/layouts/WikiLayout.astro');

  assert.match(layout, /aria-controls="wiki-toc"/);
  assert.match(layout, /data-wiki-toc-toggle/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media print/);
  assert.match(css, /\.wiki-toc/);
  assert.match(css, /\.wiki-reader/);
});
