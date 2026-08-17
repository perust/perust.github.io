/**
 * 책과 장 사이의 교차 필드 무결성을 검증한다.
 * Astro 스키마가 개별 필드 형식을 검사하고, 이 함수는 컬렉션 전체에서만 알 수 있는
 * 참조와 정적 경로·목차 순서 충돌을 빌드 전에 차단한다.
 *
 * @param {Array<{ id: string }>} books
 * @param {Array<{ id: string, data: { book: string, slug: string, order: number, part: string } }>} pages
 * @returns {void}
 */
export function assertWikiIntegrity(books, pages) {
  const bookIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const book of books) {
    if (!bookIdPattern.test(book.id)) {
      throw new Error(`표현할 수 없는 위키 책 ID: ${book.id}`);
    }
  }

  /** @type {Map<string, Array<(typeof pages)[number]>>} */
  const pagesByBook = new Map(books.map((book) => [book.id, []]));
  const routeOwners = new Map();
  const orderOwners = new Map();

  for (const page of pages) {
    const bookPages = pagesByBook.get(page.data.book);
    if (!bookPages) {
      throw new Error(`존재하지 않는 위키 책: ${page.data.book} (${page.id})`);
    }
    bookPages.push(page);

    const routeKey = `${page.data.book}/${page.data.slug}`;
    const routeOwner = routeOwners.get(routeKey);
    if (routeOwner) {
      throw new Error(`중복 위키 경로: ${routeKey} (${routeOwner}, ${page.id})`);
    }
    routeOwners.set(routeKey, page.id);

    const orderKey = `${page.data.book}/${page.data.order}`;
    const orderOwner = orderOwners.get(orderKey);
    if (orderOwner) {
      throw new Error(
        `중복 위키 순서: ${page.data.book} ${page.data.order} (${orderOwner}, ${page.id})`,
      );
    }
    orderOwners.set(orderKey, page.id);
  }

  for (const book of books) {
    const bookPages = pagesByBook.get(book.id) ?? [];
    if (bookPages.length === 0) {
      throw new Error(`장 없는 위키 책: ${book.id}`);
    }

    const orderedPages = [...bookPages].sort((a, b) => a.data.order - b.data.order);
    /** @type {Map<string, string>} */
    const firstPageByPart = new Map();
    /** @type {string | undefined} */
    let currentPart;
    for (const page of orderedPages) {
      if (page.data.part === currentPart) continue;
      const firstPage = firstPageByPart.get(page.data.part);
      if (firstPage) {
        throw new Error(
          `비연속 위키 부: ${book.id} ${page.data.part} (${firstPage}, ${page.id})`,
        );
      }
      firstPageByPart.set(page.data.part, page.id);
      currentPart = page.data.part;
    }
  }
}
