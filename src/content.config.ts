import { defineCollection, z } from 'astro:content';
import { VALUE_TYPES } from './config/taxonomy.ts';

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
    // 실제 본문에 FAQ 섹션이 있는 글에만 사용한다. 있으면 FAQPage JSON-LD를 함께 출력한다.
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    // OG 이미지를 글마다 직접 지정할 때만 사용. 없으면 카테고리 기본 이미지로 대체된다.
    image: z.string().optional(),
  }),
});

export const collections = { blog };
