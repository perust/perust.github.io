// 블로그 글 로딩과 카테고리/태그 슬러그 처리를 한곳에 모은 헬퍼.
// category/tag 정적 페이지, blog 인덱스, [slug] 상세가 이 모듈을 공유한다.

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string | Date;
  updated?: string | Date;
  category: string;
  tags?: string[];
  // 글마다 OG 이미지를 직접 지정하고 싶을 때만 사용. 없으면 카테고리 기본 이미지로 대체된다.
  image?: string;
}

export interface BlogPost extends PostFrontmatter {
  slug: string;
}

// import.meta.glob 패턴은 정적 분석 대상이라 리터럴 경로여야 한다.
const modules = import.meta.glob('../content/blog/*.md', { eager: true });

// 모든 글을 최신순(date 내림차순)으로 반환한다.
export function getAllPosts(): BlogPost[] {
  return Object.entries(modules)
    .map(([path, mod]: [string, any]) => ({
      slug: path.split('/').pop()?.replace('.md', '') ?? '',
      ...(mod.frontmatter as PostFrontmatter),
    }))
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
}

// 공백/특수문자는 하이픈으로, 영문은 소문자로, 한글 등 유니코드 글자는 그대로 둔 슬러그.
// 예: "Build Note" → "build-note", "경제·재테크" → "경제-재테크".
// 한글 슬러그는 URL에서 percent-encoding 되며, new URL()이 canonical/JSON-LD에서 자동 인코딩한다.
export function slugify(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoryPath(category: string): string {
  return `/blog/category/${slugify(category)}/`;
}

export function tagPath(tag: string): string {
  return `/blog/tag/${slugify(tag)}/`;
}

// 카테고리별 전용 OG 이미지. 매칭되는 것이 없으면 default 를 쓴다.
const CATEGORY_OG: Record<string, string> = {
  'Money Weekly': '/og/money-weekly.png',
  'AI Weekly': '/og/ai-weekly.png',
  'Book Review': '/og/book-review.png',
  'Build Note': '/og/build-note.png',
};

export const DEFAULT_OG = '/og/default.png';

// 카테고리에 맞는 OG 이미지 경로(루트 기준). BaseLayout이 절대 URL로 변환한다.
export function ogImageForCategory(category?: string): string {
  return (category && CATEGORY_OG[category]) || DEFAULT_OG;
}

// 글 전용 OG 이미지 경로(루트 기준). scripts/generate-og.py가 public/og/posts/<slug>.png 로 생성한다.
export function postOgPath(slug: string): string {
  return `/og/posts/${slug}.png`;
}

// 글의 OG 이미지 우선순위:
//   1) frontmatter image (직접 지정)
//   2) public/og/posts/<slug>.png (글별 생성 이미지)  ※ postImageExists=true 일 때만
//   3) 카테고리 기본 이미지(없으면 default)
// 글별 이미지가 아직 없는 새 글에서도 깨지지 않도록, 존재 여부는 호출부(빌드 시 fs 확인)에서 넘긴다.
export function ogImageForPost(
  post: Pick<PostFrontmatter, 'image' | 'category'> & { slug?: string },
  postImageExists = false,
): string {
  if (post.image) return post.image;
  if (postImageExists && post.slug) return postOgPath(post.slug);
  return ogImageForCategory(post.category);
}

// 현재 글과 관련 있는 글을 고른다.
//   우선순위: 같은 category → tags 교집합이 많은 순 → 최신순(date 내림차순).
// getAllPosts() 결과(최신순)를 넘기면 동점일 때 최신순이 자연스럽게 유지된다. 현재 글은 제외한다.
export function getRelatedPosts(current: BlogPost, all: BlogPost[], limit = 3): BlogPost[] {
  const currentTags = new Set(current.tags ?? []);
  return all
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      sameCategory: post.category === current.category ? 1 : 0,
      sharedTags: (post.tags ?? []).filter((tag) => currentTags.has(tag)).length,
    }))
    .sort((a, b) => {
      if (b.sameCategory !== a.sameCategory) return b.sameCategory - a.sameCategory;
      if (b.sharedTags !== a.sharedTags) return b.sharedTags - a.sharedTags;
      return new Date(b.post.date).valueOf() - new Date(a.post.date).valueOf();
    })
    .slice(0, limit)
    .map((entry) => entry.post);
}

// 최신순 목록을 기준으로 한 이전/다음 글.
//   목록이 최신순(date 내림차순)이므로, 더 오래된 글이 "이전 글", 더 최신 글이 "다음 글"이다.
export function getPrevNext(slug: string, all: BlogPost[]): { prev?: BlogPost; next?: BlogPost } {
  const index = all.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return { prev: all[index + 1], next: all[index - 1] };
}
