/**
 * API Route: POST /api/v1/entity/[entity]/query
 * 
 * Query entity data with filtering, sorting, and pagination.
 * 
 * @requires Node.js runtime for ClickHouse database operations
 * @requires Authentication via Clerk (userId required)
 * @requires RBAC: 'member' role minimum
 * @requires Rate limiting: 60 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/entity/projects/query
 * Body: { 
 *   filter: { status: "active" },
 *   sort: [{ field: "name", dir: "asc" }],
 *   page: { index: 0, size: 10 }
 * }
 * Response: { success: true, data: { rows: [...], columns: [...], total: 100, page: 0, pageSize: 10 } }
 * ```
 */

// Node.js required: ClickHouse database operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, validateJson } from '@/lib/api';
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit } from '@/lib/middleware';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { getEntityPage } from '@/lib/services/entity/pages';
import { getEntityConfig } from '@/lib/services/entity/config';
import { EntityParamSchema, type EntityParam } from '@/lib/validators';
import { EntityQueryRequestSchema } from '@/lib/validators/entityQuery';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<Response> => {
  // 1. Authentication
  const { userId, has } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // 2. RBAC enforcement (member role required per OpenAPI spec)
  if (!has({ role: 'member' })) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }

  // 3. Entity param validation
  const entityParsed = EntityParamSchema.safeParse((ctx.params?.entity ?? '').toLowerCase());
  if (!entityParsed.success) {
    return http.badRequest('Invalid entity type', { code: 'INVALID_ENTITY' });
  }
  const entity = entityParsed.data as EntityParam;

  // 4. Request body validation
  const parsed = await validateJson(req, EntityQueryRequestSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid request body', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
    });
  }

  const { filter, sort, page } = parsed.data;

  // 5. Transform OpenAPI format to service format
  // OpenAPI: { filter: object, sort: [{ field, dir }], page: { index, size } }
  // Service: { page: number, pageSize: number, sort: { column, direction }, filters?: array }
  
  // Transform filters from object to array format
  const filters = filter ? Object.entries(filter).map(([field, value]) => ({
    field,
    op: 'eq' as const, // Default to equality, could be enhanced
    value,
  })) : undefined;

  // Transform sort from array to single object (use first sort if multiple)
  const sortConfig = sort && sort.length > 0 && sort[0]
    ? { column: sort[0].field, direction: sort[0].dir }
    : { column: '', direction: 'asc' as const };

  // 6. Fetch entity data
  const result = await getEntityPage(entity, {
    page: page.index,
    pageSize: page.size,
    sort: sortConfig,
    ...(filters ? { filters } : {}),
  });

  // 7. Fetch column configuration
  const columns = await getEntityConfig(entity);

  // 8. Return response matching OpenAPI spec format
  return http.ok({
    rows: result.data,
    columns,
    total: result.total,
    page: page.index,
    pageSize: page.size,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
};

// Rate limit: 60/min per OpenAPI spec
// Note: Next.js passes params as second argument, but rate limiter expects single-arg function
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
export async function POST(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<Response> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req) as Promise<Response>;
}

