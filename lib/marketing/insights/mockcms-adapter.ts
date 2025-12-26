// lib/marketing/insights/mockcms-adapter.ts
// Build-safe mock CMS adapter using filesystem reads (no self-HTTP fetch during build)
import 'server-only';

import type { InsightItem, InsightPreview } from '@/types/marketing';
import type { ISODateString } from '@/types/shared';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cache } from 'react';
import { z } from 'zod';

const MOCKCMS_ROOT = join(process.cwd(), 'public', '__mockcms__');
const INSIGHTS_DIR = join(MOCKCMS_ROOT, 'insights');
const CATEGORIES_DIR = join(MOCKCMS_ROOT, 'categories');

// Zod schemas for runtime validation
const CategorySchema = z
  .object({
    slug: z.string(),
    name: z.string(),
  })
  .strict();

const InsightPreviewSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.string().optional(),
    updatedDate: z.string().optional(),
    imageUrl: z.string().optional(),
    categories: z.array(CategorySchema).optional(),
    readingTime: z.number().optional(),
    author: z
      .object({
        name: z.string(),
        avatar: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const InsightItemSchema = InsightPreviewSchema.extend({
  content: z.string(),
  heroCaption: z.string().optional(),
}).strict();

// Cached file reads to avoid repeated JSON parsing
const readInsightsIndex = cache(async (): Promise<InsightPreview[]> => {
  const indexPath = join(INSIGHTS_DIR, 'index.json');
  try {
    const raw = await readFile(indexPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = z.array(InsightPreviewSchema).parse(parsed);
    // Map to InsightPreview with conditional spreading for exactOptionalPropertyTypes
    return validated.map((item): InsightPreview => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      ...(item.description && { description: item.description }),
      ...(item.publishDate && { publishDate: item.publishDate as ISODateString }),
      ...(item.updatedDate && { updatedDate: item.updatedDate as ISODateString }),
      ...(item.imageUrl && { imageUrl: item.imageUrl }),
      ...(item.categories && { categories: item.categories }),
      ...(item.readingTime !== undefined && { readingTime: item.readingTime }),
      ...(item.author && {
        author: {
          name: item.author.name,
          ...(item.author.avatar && { avatar: item.author.avatar }),
        },
      }),
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Mock CMS validation failed for ${indexPath}: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw new Error(`Failed to read mock CMS insights index from ${indexPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const readInsightBySlug = cache(async (slug: string): Promise<InsightItem | undefined> => {
  const filePath = join(INSIGHTS_DIR, `${slug}.json`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = InsightItemSchema.parse(parsed);
    // Map to InsightItem with conditional spreading for exactOptionalPropertyTypes
    return {
      id: validated.id,
      slug: validated.slug,
      title: validated.title,
      content: validated.content,
      ...(validated.description && { description: validated.description }),
      ...(validated.publishDate && { publishDate: validated.publishDate as ISODateString }),
      ...(validated.updatedDate && { updatedDate: validated.updatedDate as ISODateString }),
      ...(validated.imageUrl && { imageUrl: validated.imageUrl }),
      ...(validated.categories && { categories: validated.categories }),
      ...(validated.readingTime !== undefined && { readingTime: validated.readingTime }),
      ...(validated.author && {
        author: {
          name: validated.author.name,
          ...(validated.author.avatar && { avatar: validated.author.avatar }),
        },
      }),
      ...(validated.heroCaption && { heroCaption: validated.heroCaption }),
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined; // File doesn't exist
    }
    if (error instanceof z.ZodError) {
      throw new Error(
        `Mock CMS validation failed for ${filePath}: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw new Error(`Failed to read mock CMS insight from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const readCategories = cache(async (): Promise<Array<{ slug: string; name: string }>> => {
  const indexPath = join(CATEGORIES_DIR, 'index.json');
  try {
    const raw = await readFile(indexPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = z.array(CategorySchema).parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Mock CMS validation failed for ${indexPath}: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw new Error(`Failed to read mock CMS categories from ${indexPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

/**
 * Get all insights (previews only) from mock CMS fixtures
 */
export async function getMockInsightsIndex(): Promise<InsightPreview[]> {
  return await readInsightsIndex();
}

/**
 * Get a single insight by slug from mock CMS fixtures
 */
export async function getMockInsightBySlug(slug: string): Promise<InsightItem | undefined> {
  return await readInsightBySlug(slug);
}

/**
 * Get all categories from mock CMS fixtures
 */
export async function getMockInsightCategories(): Promise<Array<{ slug: string; name: string }>> {
  return await readCategories();
}

