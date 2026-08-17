/**
 * 위키 장의 서로 다른 날짜 의미를 SEO와 화면 메타데이터에 사용할 ISO 문자열로 변환한다.
 *
 * @param {{ published: Date, updated: Date, lastVerified: Date }} dates
 * @returns {{ datePublished: string, dateModified: string, lastVerified: string }}
 */
export function getWikiPageDateMetadata(dates) {
  return {
    datePublished: dates.published.toISOString(),
    dateModified: dates.updated.toISOString(),
    lastVerified: dates.lastVerified.toISOString(),
  };
}
