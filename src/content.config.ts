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
  }),
});

export const collections = { blog };
