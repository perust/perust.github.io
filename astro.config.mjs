import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATEGORY_INDEX_MIN_POSTS, LEGACY_COMPAT_SLUGS, isIndexableTag, slugify } from './src/config/taxonomy.ts';

// 블로그 글의 frontmatter date/updated를 읽어 sitemap의 lastmod로 쓰고,
// 카테고리·태그별 글 수를 계산해 색인 임계값(src/config/taxonomy.ts) 미만인 페이지는
// sitemap에서 제외한다. 레거시 카테고리 호환 페이지는 항상 noindex 라 슬러그로 바로 제외한다.
// frontmatter 형식이 정책과 다르면 조용히 잘못된 sitemap을 만들지 않고 빌드를 실패시킨다.
const lastmodBySlug = new Map();
const categoryCountBySlug = new Map();
const tagCountBySlug = new Map();
try {
  const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));
  for (const file of readdirSync(blogDir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(`${blogDir}/${file}`, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) throw new Error(`${file}: frontmatter 블록이 없음`);
    const block = fm[1];
    const pick = (key) =>
      block.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'))?.[1]?.trim();
    const value = pick('updated') || pick('date');
    if (value) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.valueOf())) throw new Error(`${file}: date/updated 형식이 유효하지 않음`);
      lastmodBySlug.set(slug, parsed.toISOString());
    }

    const category = pick('category');
    if (category) {
      const categorySlug = slugify(category);
      if (categorySlug) categoryCountBySlug.set(categorySlug, (categoryCountBySlug.get(categorySlug) || 0) + 1);
    }

    const hasTags = /^tags:/m.test(block);
    const tagsLine = block.match(/^tags:\s*(\[.*\])\s*$/m)?.[1];
    if (hasTags && !tagsLine) throw new Error(`${file}: tags 는 단일행 JSON 배열 형식이어야 함`);
    if (tagsLine) {
      const tags = JSON.parse(tagsLine);
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
        throw new TypeError(`${file}: tags 는 문자열 배열이어야 함`);
      }
      for (const tag of tags) {
        const tagSlug = slugify(tag);
        if (tagSlug) tagCountBySlug.set(tagSlug, (tagCountBySlug.get(tagSlug) || 0) + 1);
      }
    }
  }
} catch (error) {
  throw new Error(`sitemap frontmatter 집계 실패: ${error.message}`, { cause: error });
}

export default defineConfig({
  site: 'https://perust.github.io',
  // 독자 글을 키보드로 작성한 문장처럼 유지한다. Astro 기본 smartypants는
  // 직선 따옴표를 “스마트 따옴표”로 다시 바꾸므로 명시적으로 끈다.
  markdown: {
    smartypants: false,
  },
  integrations: [
    sitemap({
      filter(page) {
        const url = new URL(page);
        if (/\/(contents|homepage|study)\//.test(url.pathname)) return false;
        if (url.pathname.startsWith('/admin/')) return false;
        // 레거시 카테고리 호환 페이지는 항상 noindex, follow 이므로 sitemap 에서 제외한다.
        const legacyCategory = url.pathname.match(/^\/blog\/category\/([^/]+)\/$/)?.[1];
        if (legacyCategory && LEGACY_COMPAT_SLUGS.has(decodeURIComponent(legacyCategory))) return false;
        // 글 3개 미만 카테고리는 noindex 이므로 sitemap 에서 제외한다.
        if (legacyCategory && (categoryCountBySlug.get(decodeURIComponent(legacyCategory)) || 0) < CATEGORY_INDEX_MIN_POSTS) return false;
        // 태그 페이지는 색인 판정 SSOT(isIndexableTag: allowlist + 글 3개 이상)를 통과할 때만 sitemap 에 포함한다.
        const tag = url.pathname.match(/^\/blog\/tag\/([^/]+)\/$/)?.[1];
        if (tag) {
          const tagSlug = decodeURIComponent(tag);
          if (!isIndexableTag(tagSlug, tagCountBySlug.get(tagSlug) || 0)) return false;
        }
        return true;
      },
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
