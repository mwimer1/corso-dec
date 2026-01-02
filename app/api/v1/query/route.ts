/**
 * API Route: POST /api/v1/query
 * 
 * Generic SQL query endpoint for client-side ClickHouse queries.
 * 
 * @requires Node.js runtime for ClickHouse database operations
 * @requires Authentication via Clerk (userId required)
 * @requires RBAC: 'member' role minimum
 * @requires Rate limiting: 60 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/query
 * Body: { 
 *   sql: "SELECT * FROM projects WHERE org_id = ? LIMIT 10",
 *   params: { org_id: "org_123" },
 *   cacheTtl: 300
 * }
 * Response: { success: true, data: [...] }
 * ```
 */

// Node.js required: ClickHouse database operations
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { http, validateJson } from '@/lib/api';
import { requireAuthWithRBAC } from '@/lib/api/auth-helpers';
import { mapTenantContextError } from '@/lib/api/tenant-context-helpers';
import { getTenantContext } from '@/lib/server';
import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';
import { validateSQLScope } from '@/lib/integrations/database/scope';
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_60_PER_MIN, handleOptions } from '@/lib/middleware';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/** @knipignore */
export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * Request body schema for query endpoint.
 */
const QueryRequestSchema = z.object({
  sql: z.string().min(1).max(10000),
  params: z.record(z.unknown()).optional(),
  cacheTtl: z.number().int().min(0).max(3600).optional(),
}).strict();

const handler = async (req: NextRequest): Promise<Response> => {
  // 1. Authentication and RBAC enforcement (member role required)
  const authResult = await requireAuthWithRBAC('member');
  if (authResult instanceof Response) {
    return authResult;
  }
  const { userId: _userId } = authResult;

  // 2. Get tenant context for org isolation
  let tenantContext;
  try {
    tenantContext = await getTenantContext(req);
  } catch (error) {
    return mapTenantContextError(error);
  }
  const { orgId } = tenantContext;

  // 4. Request body validation
  const parsed = await validateJson(req, QueryRequestSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid request body', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
    });
  }

  const { sql, params = {} } = parsed.data;

  // 5. Validate SQL with tenant isolation
  try {
    validateSQLScope(sql, orgId);
  } catch (error: any) {
    return http.badRequest(
      error.message || 'SQL validation failed',
      { code: error.code || 'INVALID_SQL' }
    );
  }

  // 6. Execute query via ClickHouse integration
  try {
    const data = await clickhouseQuery(sql, params);
    return http.ok({ data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
    return http.error(500, errorMessage, { code: 'QUERY_EXECUTION_ERROR' });
  }
};

// Rate limit: 60/min (same as entity queries)
export const POST = withErrorHandling(
  withRateLimit(
    async (req: NextRequest) => handler(req) as any,
    RATE_LIMIT_60_PER_MIN
  )
);
