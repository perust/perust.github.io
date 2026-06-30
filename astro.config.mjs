import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 블로그 글의 frontmatter date/updated를 읽어 sitemap의 lastmod로 쓴다.
// 파싱이 실패해도 빌드를 막지 않도록 모든 과정을 try/catch로 감싸고,
// 값을 못 구한 항목은 lastmod 없이 그대로 둔다.
const lastmodBySlug = new Map();
try {
  const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));
  for (const file of readdirSync(blogDir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(`${blogDir}/${file}`, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const block = fm[1];
    const pick = (key) =>
      block.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'))?.[1]?.trim();
    const value = pick('updated') || pick('date');
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) lastmodBySlug.set(slug, parsed.toISOString());
  }
} catch {
  // 무시: lastmod 없이 진행한다.
}

export default defineConfig({
  site: 'https://perust.github.io',
  integrations: [
    sitemap({
      serialize(item) {
        // /blog/<slug>/ 형태의 글 상세 URL에만 frontmatter 기반 lastmod를 붙인다.
        // (카테고리 /blog/category/.../, 태그 /blog/tag/.../ 는 한 단계 더 깊어 매칭되지 않는다.)
        const match = item.url.match(/\/blog\/([^/]+)\/$/);
        if (match) {
          const slug = decodeURIComponent(match[1]);
          const lastmod = lastmodBySlug.get(slug);
          if (lastmod) item.lastmod = lastmod;
        }
        return item;
      },
    }),
  ],
});
