import { z } from 'astro/zod';

export const wikiSourceSchema = z.object({
  title: z.string().min(1),
  organization: z.string().min(1),
  url: z.string().url(),
  accessed: z.coerce.date(),
});

export const wikiBookSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(50),
  category: z.string().min(1),
  status: z.enum(['growing', 'complete']),
  version: z.string().min(1),
  updated: z.coerce.date(),
  lastVerified: z.coerce.date(),
  audience: z.string().min(1),
  goals: z.array(z.string().min(1)).min(1),
});

export const wikiPageSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(40),
  book: z.string().min(1),
  part: z.string().min(1),
  order: z.number().int().positive(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  published: z.coerce.date(),
  updated: z.coerce.date(),
  lastVerified: z.coerce.date(),
  sources: z.array(wikiSourceSchema).min(1),
});
