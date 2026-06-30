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
    // OG 이미지를 글마다 직접 지정할 때만 사용. 없으면 카테고리 기본 이미지로 대체된다.
    image: z.string().optional(),
  }),
});

export const collections = { blog };
