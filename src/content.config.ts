import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // 글을 실제로 고친 날. 없으면 JSON-LD dateModified는 date로 대체된다.
    updated: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    // 실제 본문에 FAQ 섹션이 있는 글에만 사용한다. 있으면 FAQPage JSON-LD를 함께 출력한다.
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    // OG 이미지를 글마다 직접 지정할 때만 사용. 없으면 카테고리 기본 이미지로 대체된다.
    image: z.string().optional(),
  }),
});

export const collections = { blog };
