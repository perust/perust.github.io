// 블로그 RSS 2.0 피드. 외부 패키지 없이 표준 기능만으로 XML을 직접 생성한다.
// 정적 빌드 시 dist/rss.xml 로 출력된다.
// 실명은 노출하지 않으며 작성자는 브랜드명 slowave 로만 표기한다.
import type { APIRoute } from 'astro';

const FEED_TITLE = 'slowave Blog';
const FEED_DESCRIPTION = '프로젝트 제작기, AI 자동화, 투자 데이터, 회고 시스템을 다루는 개인 블로그.';
const FALLBACK_SITE = 'https://perust.github.io';

const modules = import.meta.glob('../content/blog/*.md', { eager: true });

// XML 본문에 들어갈 텍스트의 특수문자를 이스케이프한다.
const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(FALLBACK_SITE)).toString().replace(/\/$/, '');

  const posts = Object.entries(modules)
    .map(([path, post]: [string, any]) => ({
      slug: path.split('/').pop()?.replace('.md', '') ?? '',
      ...post.frontmatter,
    }))
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  const items = posts
    .map((post) => {
      const link = `${base}/blog/${post.slug}/`;
      const categories = [post.category, ...((post.tags as string[]) ?? [])]
        .filter(Boolean)
        .map((name: string) => `      <category>${escapeXml(name)}</category>`)
        .join('\n');
      return `    <item>
      <title>${escapeXml(post.title ?? '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description ?? '')}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <dc:creator>slowave</dc:creator>
${categories}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${base}/</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>ko-kr</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
