// lib/marketing/insights/content-service.ts
// Server-only content loader for Insights with unified source selector
import 'server-only';

import type { InsightItem, InsightPreview } from '@/types/marketing';
// Re-export loadFromContentDir for backward compatibility
export { loadFromContentDir } from './content-loader';

export async function getAllInsights(): Promise<InsightPreview[]> {
  // Delegate to unified content source selector
  const { getContentSource } = await import('./source');
  const source = await getContentSource();
  return await source.getAllInsights();
}

export async function getInsightBySlug(slug: string): Promise<InsightItem | undefined> {
  // Delegate to unified content source selector
  const { getContentSource } = await import('./source');
  const source = await getContentSource();
  return await source.getInsightBySlug(slug);
}

/**
 * Collect categories across all available content (frontmatter) or static fallback.
 */
export async function getCategories(): Promise<Array<{ slug: string; name: string }>> {
  // Delegate to unified content source selector
  const { getContentSource } = await import('./source');
  const source = await getContentSource();
  return await source.getCategories();
}

// --- Category filtering helpers (non-breaking additions) ---
// (CategoryInfo removed — not referenced)

type CategoryInput = string | { slug: string; name: string };

export const categorySlugify = (input: CategoryInput): string => {
  const name = typeof input === 'string' ? input : input.name;
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// (GetByCategoryOpts removed — not referenced)

export type GetByCategoryParams = { slug: string; page?: number; pageSize?: number };

type GetInsightsByCategoryDeps = {
  getAllInsights?: typeof getAllInsights;
  getCategories?: typeof getCategories;
};

export async function getInsightsByCategory(
  { slug, page = 1, pageSize = 10 }: GetByCategoryParams,
  deps: GetInsightsByCategoryDeps = {}
) {
  const getCategoriesFn = deps.getCategories ?? getCategories;
  const getAllInsightsFn = deps.getAllInsights ?? getAllInsights;

  // Unified selector by default; tests can inject deps for determinism
  const categories = await getCategoriesFn();
  const categorySlugLower = slug.toLowerCase();
  const category = categories.find(c => c.slug.toLowerCase() === categorySlugLower) ?? null;
  if (!category) return { items: [], total: 0, category: null };

  const allInsights = await getAllInsightsFn();
  const ts = (d?: string | number | Date) => (d ? new Date(d).getTime() : 0);
  const all = allInsights
    .filter(i => (i.categories || []).some(cat => cat?.slug?.toLowerCase() === categorySlugLower))
    .sort((a, b) => ts(b.publishDate) - ts(a.publishDate));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = all.slice(start, end);
  return { items, total: all.length, category };
}

// For internal use, allow undefined avatar when constructing

/**
 * Get related insights based on category overlap and recency.
 */
export async function getRelatedInsights(
  item: InsightItem,
  opts?: { limit?: number }
): Promise<InsightPreview[]> {
  const { limit = 3 } = opts ?? {};
  const all = await getAllInsights();

  // Remove the current item from consideration
  const others = all.filter(i => i.id !== item.id);

  // Score by category overlap and recency
  const scored = others.map(insight => {
    let score = 0;

    // Category overlap scoring
    const itemCats = (item.categories ?? []).map((c: { slug: string }) => c.slug);
    const insightCats = (insight.categories ?? []).map((c: { slug: string }) => c.slug);
    const overlap = itemCats.filter((cat: string) => insightCats.includes(cat)).length;
    score += overlap * 2; // 2 points per category overlap

    // Recency scoring (newer items get higher score)
    if (insight.publishDate) {
      const daysDiff = (Date.now() - new Date(insight.publishDate).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 30 - daysDiff); // Lose 1 point per day, max 30 days back
      score += Math.max(0, recencyScore);
    }

    return { insight, score };
  });

  // Sort by score (descending) and return top items
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ insight }) => insight);
}



