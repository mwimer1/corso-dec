// lib/supabase/api.ts
import 'server-only';
// ✅ Strict-mode compliant under exactOptionalPropertyTypes (no implicit any casts)

import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
/** Inline Supabase helper types to remove external dep */
interface SQLExecutionOptions<T> {
  transform?: (row: any) => T;
  throwOnEmpty?: boolean;
}

interface SupabaseApiJwtExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'bearer';
}

import type { Database } from '@/types/integrations';
import type { PostgrestError } from '@supabase/postgrest-js'; // Kept as devDependency for type completeness - provides PostgrestError interface for error handling
import { getSupabaseAdmin } from './server';

/* -------------------------------------------------------------------------- */
/* 🗂️ Types                                                                   */
/* -------------------------------------------------------------------------- */

import type { SupabaseClient } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------- */
/* 🌐 Singleton (Supabase client)                                             */
/* -------------------------------------------------------------------------- */

export function getClient(): SupabaseClient {
  // Create a fresh client per call to avoid import-time env access and global caching.
  logger.debug('[Supabase] getClient invoked', { runtime: 'server' });
  return getSupabaseAdmin();
}


/** Minimal query builder surface that supports generic single<T>() and other chained methods. */
type SingleCapableQuery = any; // Simplified to avoid complex type instantiation issues

/* -------------------------------------------------------------------------- */
/* 🧠 Facade - Exported Supabase API Methods                                  */
/* -------------------------------------------------------------------------- */

const supabaseApi: {
  get client(): SupabaseClient;
  fromUser<T extends keyof Database['public']['Tables']>(table: T, userId: string): {
    select: (columns?: string) => SingleCapableQuery;
    insert: (values: Database['public']['Tables'][T]['Insert']) => any;
    update: (changes: Partial<Database['public']['Tables'][T]['Update']>) => any;
    delete: () => any;
  };
  sql<T>(sql: string, params?: Record<string, unknown>, options?: SQLExecutionOptions<T>): Promise<T[]>;
  exchangeExternalJwt(token: string): Promise<SupabaseApiJwtExchangeResponse>;
  insert<T extends keyof Database['public']['Tables']>(table: T, values: Database['public']['Tables'][T]['Insert']): Promise<Database['public']['Tables'][T]['Row'][]>;
  update<T extends keyof Database['public']['Tables']>(table: T, match: Partial<Database['public']['Tables'][T]['Row']>, changes: Partial<Database['public']['Tables'][T]['Update']>): Promise<Database['public']['Tables'][T]['Row'] | null>;
  delete<T extends keyof Database['public']['Tables']>(table: T, match: Partial<Database['public']['Tables'][T]['Row']>): Promise<Database['public']['Tables'][T]['Row'] | null>;
  withSupabaseRequest<T extends keyof Database['public']['Tables']>(table: T, match: Partial<Database['public']['Tables'][T]['Row']>, operation: (userId: string) => Promise<Database['public']['Tables'][T]['Row'] | null>): Promise<Database['public']['Tables'][T]['Row'] | null>;
} = {
  /* Low-level client getter */
  get client(): SupabaseClient {
    return getClient();
  },

  // fromOrg removed - organization scoping no longer supported

  /**
   * Convenience wrapper scoped by user_id with action-specific methods.
   * For user-owned tables like saved_searches, saved_views, etc.
   */
  fromUser<T extends keyof Database['public']['Tables']>(table: T, userId: string) {
    const supa = getClient();
    const tableName = table as unknown as string;
    return {
      select(columns = '*') {
        return supa.from(tableName).select(columns).eq('user_id', userId);
      },
      insert(values: Database['public']['Tables'][T]['Insert']) {
        return (supa.from(tableName) as any).insert(values).eq('user_id', userId);
      },
      update(changes: Partial<Database['public']['Tables'][T]['Update']>) {
        return (supa.from(tableName) as any).update(changes).eq('user_id', userId);
      },
      delete() {
        return supa.from(tableName).delete().eq('user_id', userId);
      },
    } as const;
  },

  /* SQL RPC (parameterized queries via secure Postgres function) */
  async sql<T = unknown>(
    sql: string,
    params: Record<string, unknown> = {},
    options?: SQLExecutionOptions<T>
  ): Promise<T[]> {
    // Cast to narrower RPC signature to avoid TS issues until types are regenerated
    const rpcExecute = getClient().rpc as unknown as (
      fn: 'execute_sql',
      args: { sql_text: string; params: Record<string, unknown> }
    ) => Promise<{ data: unknown[] | null; error: PostgrestError | null }>;

    const { data, error } = await rpcExecute('execute_sql', { sql_text: sql, params });
    if (error) {
      throw new ApplicationError({
        message: error.message,
        code: error.code,
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.ERROR,
      });
    }
    let rows: T[] = (data ?? []) as unknown as T[];
    if (options?.transform) {
      rows = rows.map(options.transform);
    }
    if (options?.throwOnEmpty && rows.length === 0) {
      throw new ApplicationError({
        message: 'No rows returned from SQL query',
        code: 'NO_ROWS',
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.ERROR,
      });
    }
    return rows;
  },

  /* Exchange an external JWT for a Supabase session (SSO placeholder) */
  async exchangeExternalJwt(_token: string): Promise<SupabaseApiJwtExchangeResponse> {
    // … (omitted for brevity, unchanged)
    throw new ApplicationError({
      message: 'SSO is not yet implemented on this deployment.',
      code: 'SSO_NOT_IMPLEMENTED',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
    });
  },

  /** Insert a row into a table with strict type safety and tenant scoping. */
  async insert<T extends keyof Database['public']['Tables']>(
    table: T,
    values: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    // Check if values contains a user_id for scoping
    if (values && typeof values === 'object' && 'user_id' in values) {
      const userId = (values as Database['public']['Tables'][T]['Insert'] & { user_id: string }).user_id;
      if (typeof userId === 'string') {
        const { data, error } = await this.fromUser(table, userId)
          .insert(values)
          .select();
        if (error) {
          throw new ApplicationError({
            message: error.message,
            code: error.code,
            category: ErrorCategory.DATABASE,
            severity: ErrorSeverity.ERROR,
          });
        }
        return (data ?? []) as Database['public']['Tables'][T]['Row'][];
      }
    }
    throw new ApplicationError({
      message: 'Supabase insert requires user_id for scoping',
      code: 'SCOPE_REQUIRED',
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.ERROR,
    });
  },

  /** Update rows in a table with strict type safety. */
  async update<T extends keyof Database['public']['Tables']>(
    table: T,
    match: Partial<Database['public']['Tables'][T]['Row']>,
    changes: Partial<Database['public']['Tables'][T]['Update']>
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    return this.withSupabaseRequest(table, match, async (userId) => {
      const { data, error } = await this.fromUser(table, userId)
        .update(changes)
        .match(match)
        .single();
      if (error) {
        throw new ApplicationError({
          message: error.message,
          code: error.code,
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.ERROR,
        });
      }
      return data as Database['public']['Tables'][T]['Row'] | null;
    });
  },

  /** Delete rows from a table with strict type safety. */
  async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    match: Partial<Database['public']['Tables'][T]['Row']>
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    return this.withSupabaseRequest(table, match, async (userId) => {
      const { data, error } = await this.fromUser(table, userId)
        .delete()
        .match(match)
        .single();
      if (error) {
        throw new ApplicationError({
          message: error.message,
          code: error.code,
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.ERROR,
        });
      }
      return data ?? null;
    });
  },

  /** Helper function to handle user scoping and error handling for Supabase operations */
  async withSupabaseRequest<T extends keyof Database['public']['Tables']>(
    table: T,
    match: Partial<Database['public']['Tables'][T]['Row']>,
    operation: (userId: string) => Promise<Database['public']['Tables'][T]['Row'] | null>
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    // Check if match contains a user_id for scoping
    if (match && typeof match === 'object' && 'user_id' in match) {
      const userId = (match as Partial<Database['public']['Tables'][T]['Row']> & { user_id: string }).user_id;
      if (typeof userId === 'string') {
        return await operation(userId);
      }
    }
    throw new ApplicationError({
      message: `Supabase ${table} operation requires user_id in match for scoping`,
      code: 'SCOPE_REQUIRED',
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.ERROR,
    });
  },

};

// Export the API facade
export { supabaseApi };


