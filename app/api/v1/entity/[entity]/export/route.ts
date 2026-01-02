// Node.js required: ClickHouse database operations
import { http } from '@/lib/api';
import { handleCors, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_30_PER_MIN } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

/** @knipignore */
export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (_req: NextRequest, ctx: { params: { entity: string } }): Promise<Response> => {
  // AuthN
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Export functionality has been removed during entity grid migration
  // Return 410 Gone with deprecation headers
  const entity = ctx.params.entity;
  const sunsetDate = '2025-04-15'; // 90 days from 2025-01-15
  const alternativeEndpoint = `/api/v1/entity/${entity}/query`;
  
  return http.error(410, 'Gone - Export feature no longer available', {
    code: 'EXPORT_REMOVED',
    details: {
      message: 'Export functionality was removed during the entity grid migration. Use entity query endpoints for data access.',
      removedDate: '2025-01-15',
      sunsetDate: sunsetDate,
      alternativeEndpoint: alternativeEndpoint,
    },
    headers: {
      'Deprecation': 'true',
      'Sunset': new Date(sunsetDate).toUTCString(),
      'Link': `<${alternativeEndpoint}>; rel="alternate"; type="application/json"`,
    },
  });
};

// Rate limit: 30/min per OpenAPI spec
// Note: Next.js passes params as second argument, but rate limiter expects single-arg function
const createWrappedHandler = (params: { entity: string }) => {
  return withErrorHandling(
    withRateLimit(
      async (req: NextRequest) => {
        return handler(req, { params }) as any;
      },
      RATE_LIMIT_30_PER_MIN
    )
  );
};

// Next.js dynamic route signature: (req, { params }) => Response
/** @knipignore */
export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<Response> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req) as Promise<Response>;
}
