/**
 * API Route: GET /api/v1/insights/search
 * 
 * Public search endpoint for insights and articles.
 * 
 * @requires Edge runtime for low-latency public access
 * @requires Rate limiting: 60 requests per minute
 * 
 * @example
 * ```typescript
 * GET /api/v1/insights/search?q=construction&category=trends
 * Response: { results: [{ slug: "...", title: "...", ... }] }
 * ```
 */

// Edge runtime for low-latency public access
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
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
}).strict();

const handler = async (req: Request): Promise<Response> => {
  const { searchParams } = new URL(req.url);
  
  // Parse and validate query parameters
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;

  const parsed = SearchQuerySchema.safeParse({ q, category });
  if (!parsed.success) {
    return http.badRequest('Invalid query parameters', {
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  // TODO: Implement actual search logic (e.g., database or index lookup)
  // For now, return empty results to satisfy the API contract
  // When content backend is ready, query it here:
  // - Supabase table for insights/articles
  // - Elasticsearch index
  // - External CMS API
  
  const results: Array<{
    slug: string;
    title: string;
    description: string;
    categories: Array<{ slug: string; name: string }>;
  }> = [];

  return http.ok({ results });
};

// Rate limit: 60/min for public endpoint
export const GET = withErrorHandling(
  withRateLimit(
    async (req: Request) => handler(req) as any,
    { windowMs: 60_000, maxRequests: 60 }
  )
);
