// Node.js required: ClickHouse database operations via getEntityPage()
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
import type { EntityFetchParams } from '@/lib/services/entity/contracts';
import { getEntityPage } from '@/lib/services/entity/pages';
import {
    EntityListQuerySchema,
    EntityParamSchema,
    type EntityParam,
} from '@/lib/validators';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Helper to convert Response to NextResponse for type compatibility
async function toNextResponse(response: Response): Promise<NextResponse> {
  const body = await response.json();
  return NextResponse.json(body, { status: response.status, headers: response.headers });
}

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<NextResponse> => {
  // Authentication & RBAC
  const { userId, has, orgId } = await auth();
  if (!userId) {
    return await toNextResponse(http.error(401, 'Unauthorized', { code: 'HTTP_401' }));
  }
  
  // Check for active organization (required for organization-scoped operations)
  if (!orgId) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[entity route] No active organization found for userId:', userId);
    }
    return await toNextResponse(http.error(403, 'No active organization', { code: 'NO_ORG_CONTEXT' }));
  }
  
  // Enforce org:member-or-higher role (org:viewer not allowed)
  // Clerk organization roles use the format: org:member, org:admin, etc.
  if (!has({ role: 'org:member' })) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[entity route] RBAC check failed for userId:', userId, 'orgId:', orgId);
    }
    return await toNextResponse(http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' }));
  }

  // Entity param validation
  const entityParsed = EntityParamSchema.safeParse((ctx.params?.entity ?? '').toLowerCase());
  if (!entityParsed.success) {
    return await toNextResponse(http.badRequest('Invalid entity type', { code: 'INVALID_ENTITY' }));
  }
  const entity = entityParsed.data as EntityParam;

  // Query params validation
  const sp = req.nextUrl.searchParams;
  const queryObj = Object.fromEntries(sp.entries());
  const qpParsed = EntityListQuerySchema.safeParse(queryObj);
  if (!qpParsed.success) {
    return await toNextResponse(http.badRequest('Invalid query parameters', {
      code: 'INVALID_QUERY',
      details: qpParsed.error.flatten(),
    }));
  }
  const { page, pageSize, sortBy, sortDir, search } = qpParsed.data;

  // Parse filters JSON if provided
  let filters: EntityFetchParams['filters'];
  const filtersParam = sp.get('filters');
  if (filtersParam) {
    try {
      const parsed = JSON.parse(filtersParam);
      // Validate filter structure
      if (!Array.isArray(parsed)) {
        return await toNextResponse(http.badRequest('Invalid filters format: must be an array', { code: 'INVALID_FILTERS' }));
      }
      // Type assertion with validation that op matches allowed values
      filters = parsed as EntityFetchParams['filters'];
    } catch (_e) {
      return await toNextResponse(http.badRequest('Invalid filters format', { code: 'INVALID_FILTERS' }));
    }
  }

  const result = await getEntityPage(entity, {
    page,
    pageSize,
    sort: sortBy ? { column: sortBy, direction: sortDir } : { column: '', direction: 'asc' },
    ...(search ? { search } : {}),
    ...(filters ? { filters } : {}),
  });

  // Return standardized response shape: { success: true, data: { data, total, page, pageSize } }
  // The client fetcher handles both wrapped and flat formats for backward compatibility
  const payload = {
    data: result?.data ?? [],
    total: result?.total ?? 0,
    page,
    pageSize,
  };
  return await toNextResponse(http.ok(payload));
};

// Rate limit: 60/min per OpenAPI spec
// Note: Next.js passes params as second argument, but rate limiter expects single-arg function
// We wrap the handler to extract params from URL for rate limiting, then use actual params in handler
const createWrappedHandler = (params: { entity: string }) => {
  return withErrorHandling(
    withRateLimit(
      async (req: NextRequest): Promise<NextResponse> => {
        return handler(req, { params });
      },
      { windowMs: 60_000, maxRequests: 60 }
    )
  );
};

// Next.js dynamic route signature: (req, { params }) => Response
export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<NextResponse> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req);
}
