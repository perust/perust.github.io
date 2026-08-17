import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PUBLISH_PACING_EXCEPTIONS, VALUE_TYPES } from './config/taxonomy.ts';
import { wikiBookSchema, wikiPageSchema } from './config/wiki-schema.mjs';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // 글을 실제로 고친 날. 없으면 JSON-LD dateModified는 date로 대체된다.
    updated: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    // 발행 전에 사람이 개별 검토를 마쳤다는 표시. 기존 글은 선택이지만,
    // NEW_POST_POLICY_BASELINE(2026-07-21) 이후 새 글은 check-content-quality 가 true 명시를 강제한다.
    editorialReview: z.boolean().optional(),
    // 이 글이 제공하는 독자적 가치 유형(VALUE_TYPES SSOT). 기준일 이후 새 글은 반드시 하나를 명시해야 한다.
    // experience: 직접 경험 / original-analysis: 독자적 분석 / verified-guide: 실제 검증한 가이드 / review: 서평·리뷰.
    valueType: z.enum(VALUE_TYPES).optional(),
    // 기한이 지난 도서 학습 챌린지를 같은 날 추가 발행해야 할 때만 사용하는 좁은 예외.
    publishPacingException: z.enum(PUBLISH_PACING_EXCEPTIONS).optional(),
    // 실제 본문에 FAQ 섹션이 있는 글에만 사용한다. 있으면 FAQPage JSON-LD를 함께 출력한다.
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    // OG 이미지를 글마다 직접 지정할 때만 사용. 없으면 카테고리 기본 이미지로 대체된다.
    image: z.string().optional(),
  }),
});

// 위키는 블로그와 별도로 관리한다. 책 메타데이터와 장 본문을 분리해,
// 한 권의 목차 아래 지식을 순서대로 추가하면서도 각 장의 출처와 검증일을 강제한다.
const wikiBooks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/wiki-books' }),
  schema: wikiBookSchema,
});

const wikiPages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki-pages' }),
  schema: wikiPageSchema,
});

export const collections = { blog, wikiBooks, wikiPages };
