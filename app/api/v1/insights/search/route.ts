/**
 * API Route: GET /api/v1/insights/search
 * 
 * Public search endpoint for insights and articles.
 * 
 * @requires Node.js runtime (uses filesystem operations via getAllInsights)
 * @requires Rate limiting: 60 requests per minute
 * 
 * @example
 * ```typescript
 * GET /api/v1/insights/search?q=construction&category=trends
 * Response: { results: [{ slug: "...", title: "...", ... }] }
 * ```
 */

// Node.js runtime required: uses getAllInsights() which reads from filesystem
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds (public content, ISR-friendly)

import { http } from '@/lib/api';
import { getAllInsights } from '@/lib/marketing/server';
import { handleCors, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_60_PER_MIN } from '@/lib/middleware';
import { z } from 'zod';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

/**
 * Query parameter schema for search endpoint.
 */
const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).strict();

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  categories: Array<{ slug: string; name: string }>;
  url?: string;
}

/**
 * Score search results by relevance:
 * - Title matches: highest priority
 * - Description matches: medium priority
 * - Category matches: lower priority
 * - Recency: tie-breaker (newer first)
 */
function scoreResult(item: { title: string; description?: string; categories?: Array<{ name: string }>; publishDate?: string }, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = item.title.toLowerCase();
  const descLower = (item.description || '').toLowerCase();
  const categoryNames = (item.categories || []).map(c => c.name.toLowerCase()).join(' ');

  let score = 0;

  // Title matches (highest weight)
  if (titleLower.includes(queryLower)) {
    score += 100;
    // Exact title match gets bonus
    if (titleLower === queryLower) score += 50;
  }

  // Description matches (medium weight)
  if (descLower.includes(queryLower)) {
    score += 30;
  }

  // Category matches (lower weight)
  if (categoryNames.includes(queryLower)) {
    score += 10;
  }

  // Recency bonus (newer articles get slight boost)
  if (item.publishDate) {
    const daysSincePublish = (Date.now() - new Date(item.publishDate).getTime()) / (1000 * 60 * 60 * 24);
    // Articles published in last 30 days get small bonus
    if (daysSincePublish < 30) {
      score += 5;
    }
  }

  return score;
}

const handler = async (req: Request): Promise<Response> => {
  const { searchParams } = new URL(req.url);
  
  // Parse and validate query parameters
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;
  const limitParam = searchParams.get('limit') || undefined;
  const offsetParam = searchParams.get('offset') || undefined;

  const parsed = SearchQuerySchema.safeParse({ 
    q, 
    category, 
    limit: limitParam,
    offset: offsetParam,
  });
  
  if (!parsed.success) {
    return http.badRequest('Invalid query parameters', {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const { q: query, category: categoryFilter, limit, offset } = parsed.data;

  // Load all insights from the same source used by marketing pages
  const allInsights = await getAllInsights();

  // Filter and score results
  const queryLower = query.toLowerCase();
  const filtered = allInsights
    .filter((item) => {
      // Category filter
      if (categoryFilter) {
        const hasCategory = (item.categories || []).some(
          (cat) => cat.slug === categoryFilter || cat.name.toLowerCase() === categoryFilter.toLowerCase()
        );
        if (!hasCategory) return false;
      }

      // Text search: match in title, description, or categories
      const titleMatch = item.title.toLowerCase().includes(queryLower);
      const descMatch = (item.description || '').toLowerCase().includes(queryLower);
      const categoryMatch = (item.categories || []).some(
        (cat) => cat.name.toLowerCase().includes(queryLower) || cat.slug.toLowerCase().includes(queryLower)
      );

      return titleMatch || descMatch || categoryMatch;
    })
    .map((item) => ({
      item,
      score: scoreResult(item, query),
    }))
    .sort((a, b) => {
      // Sort by score (descending), then by publish date (newer first)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const dateA = a.item.publishDate ? new Date(a.item.publishDate).getTime() : 0;
      const dateB = b.item.publishDate ? new Date(b.item.publishDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(offset, offset + limit)
    .map(({ item }) => {
      const result: SearchResult = {
        slug: item.slug,
        title: item.title,
        description: item.description || '',
        categories: (item.categories || []).map((cat) => ({
          slug: cat.slug,
          name: cat.name,
        })),
      };

      // Add URL if we can construct it
      if (item.slug) {
        result.url = `/insights/${item.slug}`;
      }

      return result;
    });

  return http.ok({ results: filtered });
};

// Rate limit: 60/min for public endpoint
export const GET = withErrorHandling(
  withRateLimit(
    async (req: Request) => handler(req) as any,
    RATE_LIMIT_60_PER_MIN
  )
);
