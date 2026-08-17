import { getCollection, type CollectionEntry } from 'astro:content';
import { assertWikiIntegrity } from './wiki-integrity.mjs';

export type WikiBook = CollectionEntry<'wikiBooks'>;
export type WikiPage = CollectionEntry<'wikiPages'>;

export async function getWikiBooks(): Promise<WikiBook[]> {
  return (await getCollection('wikiBooks')).sort((a, b) =>
    a.data.title.localeCompare(b.data.title, 'ko'),
  );
}

export async function getWikiPages(): Promise<WikiPage[]> {
  const [books, pages] = await Promise.all([
    getCollection('wikiBooks'),
    getCollection('wikiPages'),
  ]);
  assertWikiIntegrity(books, pages);
  return pages.sort((a, b) =>
    a.data.book.localeCompare(b.data.book) ||
    a.data.order - b.data.order ||
    a.data.title.localeCompare(b.data.title, 'ko'),
  );
}

export function pagesForBook(pages: WikiPage[], bookId: string): WikiPage[] {
  return pages
    .filter((page) => page.data.book === bookId)
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ko'));
}

export function groupPagesByPart(pages: WikiPage[]): Array<{ part: string; pages: WikiPage[] }> {
  const groups = new Map<string, WikiPage[]>();
  for (const page of pages) {
    const group = groups.get(page.data.part) ?? [];
    group.push(page);
    groups.set(page.data.part, group);
  }
  return Array.from(groups, ([part, groupedPages]) => ({ part, pages: groupedPages }));
}

export function wikiBookPath(bookId: string): string {
  return `/wiki/${bookId}/`;
}

export function wikiPagePath(page: WikiPage): string {
  return `/wiki/${page.data.book}/${page.data.slug}/`;
}

export function formatWikiDate(value: Date): string {
  return value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });
}
