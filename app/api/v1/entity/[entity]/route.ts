// Node.js required: ClickHouse database operations via getEntityPage()
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { getEntityPage } from '@/lib/services/entity/pages';
import {
    EntityListQuerySchema,
    EntityParamSchema,
    type EntityParam,
} from '@/lib/validators';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<Response> => {
  // AuthN
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Entity param validation
  const entityParsed = EntityParamSchema.safeParse((ctx.params?.entity ?? '').toLowerCase());
  if (!entityParsed.success) {
    return http.badRequest('Invalid entity type', { code: 'INVALID_ENTITY' });
  }
  const entity = entityParsed.data as EntityParam;

  // Query params validation
  const sp = req.nextUrl.searchParams;
  const queryObj = Object.fromEntries(sp.entries());
  const qpParsed = EntityListQuerySchema.safeParse(queryObj);
  if (!qpParsed.success) {
    return http.badRequest('Invalid query parameters', {
      code: 'INVALID_QUERY',
      details: qpParsed.error.flatten(),
    });
  }
  const { page, pageSize, sortBy, sortDir, search } = qpParsed.data;

  const result = await getEntityPage(entity, {
    page,
    pageSize,
    sort: sortBy ? { column: sortBy, direction: sortDir } : { column: '', direction: 'asc' },
    ...(search ? { search } : {}),
    // TODO: Transform filters from Record<string, any> to Filter[] array format if needed
    // For now, filters are not passed through to avoid type mismatch
  });

  // Return flat response shape: { data, total, page, pageSize }
  // Note: This route returns flat structure (not wrapped in { success: true, data: ... })
  // to match the expected API contract for entity queries
  const payload = {
    data: result?.data ?? [],
    total: result?.total ?? 0,
    page,
    pageSize,
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

// Rate limit: 60/min per OpenAPI spec
// Note: Next.js passes params as second argument, but rate limiter expects single-arg function
// We wrap the handler to extract params from URL for rate limiting, then use actual params in handler
const createWrappedHandler = (params: { entity: string }) => {
  return withErrorHandling(
    withRateLimit(
      async (req: NextRequest) => {
        return handler(req, { params }) as any;
      },
      { windowMs: 60_000, maxRequests: 60 }
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
