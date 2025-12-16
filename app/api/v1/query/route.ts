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
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, validateJson, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';
import { validateSQLScope } from '@/lib/integrations/database/scope';
import { handleCors } from '@/lib/middleware';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
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
  // 1. Authentication
  const { userId, has } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // 2. RBAC enforcement (member role required)
  if (!has({ role: 'member' })) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }

  // 3. Get tenant context for org isolation
  let tenantContext;
  try {
    tenantContext = await getTenantContext(req);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      if (code === 'UNAUTHENTICATED') {
        return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
      }
      if (code === 'MISSING_ORG_CONTEXT') {
        return http.error(400, 'Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.', { code: 'MISSING_ORG_CONTEXT' });
      }
    }
    return http.error(400, 'Failed to determine organization context', { code: 'MISSING_ORG_CONTEXT' });
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
    { windowMs: 60_000, maxRequests: 60 }
  )
);
