// Node.js required: ClickHouse database operations
import { http } from '@/lib/api';
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit } from '@/lib/middleware';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (_req: NextRequest, _ctx: { params: { entity: string } }): Promise<Response> => {
  // AuthN
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Export functionality has been removed during entity grid migration
  // TODO: Re-implement export functionality if needed
  return http.error(501, 'Export functionality was removed during the entity grid migration', {
    code: 'NOT_IMPLEMENTED',
    details: 'Export functionality was removed during the entity grid migration. Contact development team if this feature is needed.',
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
      { windowMs: 60_000, maxRequests: 30 }
    )
  );
};

// Next.js dynamic route signature: (req, { params }) => Response
export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<Response> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req) as Promise<Response>;
}
