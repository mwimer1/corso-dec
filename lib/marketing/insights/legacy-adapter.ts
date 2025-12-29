// lib/marketing/insights/legacy-adapter.ts
// Legacy adapter wrapping existing markdown/static content logic
import 'server-only';

import { getEnv } from '@/lib/server/env';
import type { InsightItem, InsightPreview } from '@/types/marketing';
import { loadFromContentDir } from './content-loader';
import { CATEGORIES, staticInsights } from './static-data';

/**
 * Legacy content source adapter
 * Wraps existing markdown/static content logic to match the content source interface
 */
export async function getLegacyInsightsIndex(): Promise<InsightPreview[]> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms' || source === 'mock') {
    // In CMS or mock mode, return static insights (assuming no markdown content)
    return staticInsights.map((i): InsightPreview => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      ...(i.description && { description: i.description }),
      ...(i.publishDate && { publishDate: i.publishDate }),
      ...(i.imageUrl && { imageUrl: i.imageUrl }),
      ...(i.categories && { categories: i.categories }),
      ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
      ...(i.author && { author: i.author }),
    }));
  }

  // Default: try to load from local markdown files, fall back to static if none
  const contentItems = await loadFromContentDir();
  if (contentItems.length > 0) {
    return contentItems.map((i): InsightPreview => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      ...(i.description && { description: i.description }),
      ...(i.publishDate && { publishDate: i.publishDate }),
      ...(i.imageUrl && { imageUrl: i.imageUrl }),
      ...(i.categories && { categories: i.categories }),
      ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
      ...(i.author && { author: i.author }),
    }));
  }

  // No content files found, use static data as last resort
  return staticInsights.map((i): InsightPreview => ({
    id: i.id,
    slug: i.slug,
    title: i.title,
    ...(i.description && { description: i.description }),
    ...(i.publishDate && { publishDate: i.publishDate }),
    ...(i.imageUrl && { imageUrl: i.imageUrl }),
    ...(i.categories && { categories: i.categories }),
    ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
    ...(i.author && { author: i.author }),
  }));
}

export async function getLegacyInsightBySlug(slug: string): Promise<InsightItem | undefined> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms' || source === 'mock') {
    // In CMS or mock mode, look up in static insights (assuming no markdown content)
    return staticInsights.find((i) => i.slug === slug);
  }
  const contentItems = await loadFromContentDir();
  if (contentItems.length > 0) {
    return contentItems.find((i) => i.slug === slug);
  }
  return staticInsights.find((i) => i.slug === slug);
}

export async function getLegacyCategories(): Promise<Array<{ slug: string; name: string }>> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms' || source === 'mock') {
    // Use static categories in CMS or mock mode (assuming no dynamic content)
    return CATEGORIES;
  }
  const contentItems = await loadFromContentDir();
  const dataSource = contentItems.length > 0 ? contentItems : staticInsights;
  const map = new Map<string, string>();
  for (const it of dataSource) {
    for (const c of it.categories ?? []) {
      if (!map.has(c.slug)) {
        map.set(c.slug, c.name);
      }
    }
  }
  return Array.from(map, ([slug, name]) => ({ slug, name }));
}

