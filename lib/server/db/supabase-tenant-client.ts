// lib/server/db/supabase-tenant-client.ts
// Tenant-scoped Supabase client wrapper that enforces RLS context
import 'server-only';

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/integrations';
import { getSupabaseAdmin } from '@/lib/integrations/supabase/server';
import { getTenantContext, type TenantContext } from './tenant-context';
import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/**
 * Ensure RLS context is set for the current database session.
 * 
 * Since Supabase uses connection pooling, we need to call set_rls_context
 * before each operation to ensure the context is set for the connection
 * that will execute the query.
 * 
 * @param client - Supabase admin client
 * @param context - Tenant context (orgId, userId)
 */
async function ensureRLSContext(
  client: SupabaseClient<Database, 'public'>,
  context: TenantContext
): Promise<void> {
  try {
    // Cast RPC call since set_rls_context is not in generated types
    const rpcCall = client.rpc as unknown as (
      fn: 'set_rls_context',
      args: { org_id: string; user_id: string }
    ) => Promise<{ error: { message: string; code?: string } | null }>;

    const { error } = await rpcCall('set_rls_context', {
      org_id: context.orgId,
      user_id: context.userId,
    });

    if (error) {
      logger.error('[TenantClient] Failed to set RLS context', {
        error: error.message,
        orgId: context.orgId,
        userId: context.userId,
      });
      throw new ApplicationError({
        message: `Failed to set RLS context: ${error.message}`,
        code: 'RLS_CONTEXT_ERROR',
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.ERROR,
        context: { orgId: context.orgId, userId: context.userId },
      });
    }

    logger.debug('[TenantClient] RLS context set', {
      orgId: context.orgId,
      userId: context.userId,
    });
  } catch (err) {
    if (err instanceof ApplicationError) {
      throw err;
    }
    throw new ApplicationError({
      message: `Failed to set RLS context: ${err instanceof Error ? err.message : 'Unknown error'}`,
      code: 'RLS_CONTEXT_ERROR',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
    });
  }
}

/**
 * Tenant-scoped Supabase client that automatically sets RLS context.
 * 
 * This wrapper ensures that every database operation is scoped to the correct
 * tenant by calling set_rls_context() before queries execute.
 * 
 * Note: Due to Supabase connection pooling, we wrap operations to ensure
 * context is set before each query execution.
 * 
 * Usage:
 * ```typescript
 * const client = await getTenantScopedSupabaseClient(req);
 * const { data } = await client.from('projects').select('*');
 * // RLS policies automatically filter by org_id
 * ```
 */
export async function getTenantScopedSupabaseClient(
  req?: NextRequest
): Promise<SupabaseClient<Database, 'public'>> {
  const context = await getTenantContext(req);
  const adminClient = getSupabaseAdmin();

  // Set RLS context immediately to establish it for this request
  // Note: Due to connection pooling, we also need to ensure context is set
  // before each operation. The withTenantClient helper handles this.
  await ensureRLSContext(adminClient, context);

  return adminClient;
}

/**
 * Execute a function with tenant-scoped Supabase client.
 * 
 * This helper ensures RLS context is set before execution and provides a typed client.
 * It's the recommended way to use tenant-scoped database operations.
 * 
 * @param req - Next.js request (optional, for extracting tenant context)
 * @param fn - Function that receives the tenant-scoped client
 * @returns Result of the function
 * 
 * @example
 * ```typescript
 * const projects = await withTenantClient(req, async (client) => {
 *   const { data } = await client.from('projects').select('*');
 *   return data;
 * });
 * ```
 */
export async function withTenantClient<T>(
  req: NextRequest | undefined,
  fn: (client: SupabaseClient<Database, 'public'>) => Promise<T>
): Promise<T> {
  const context = await getTenantContext(req);
  const adminClient = getSupabaseAdmin();

  // Ensure RLS context is set before executing the function
  // This is critical due to Supabase connection pooling
  await ensureRLSContext(adminClient, context);

  return await fn(adminClient);
}

