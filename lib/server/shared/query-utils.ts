// lib/server/shared/query-utils.ts
import 'server-only';

/**
 * Shared query utilities for server-side query operations
 * Eliminates duplication between ClickHouse and OpenAI query patterns
 */
// Note: Avoid Node 'crypto' to support Edge/browser-compatible imports.
// Use a synchronous, deterministic hash to generate cache keys.
import type { z } from 'zod';

import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                        */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/* Validation Utilities                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Generic query validation with Zod schema
 */
export function validateQuery<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { isValid: boolean; data?: T; errors?: string[] } {
  const validation = schema.safeParse(input);

  if (!validation.success) {
    return {
      isValid: false,
      errors: validation.error.flatten().formErrors,
    };
  }

  return {
    isValid: true,
    data: validation.data,
  };
}


/* -------------------------------------------------------------------------- */
/* Error Handling Utilities                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Standardized query error handling
 */
export function handleQueryError(
  error: unknown,
  context: { userId?: string; query?: string; operation?: string; [key: string]: unknown }
): never {
  const { userId, query, operation } = context;

  logger.error(`${operation || 'Query'} failed`, {
    error: error instanceof Error ? error.message : String(error),
    userId,
    query: query?.slice(0, 100),
  });

  if (error instanceof ApplicationError) {
    throw error;
  }

  throw new ApplicationError({
    message: `Failed to execute ${operation || 'query'}.`,
    code: `${operation?.toUpperCase() || 'QUERY'}_ERROR`,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    originalError: error instanceof Error ? error : new Error(String(error)),
  });
}

/**
 * Handle cache parsing errors gracefully
 */
export function handleCacheParseError<T>(
  key: string,
  parseError: unknown,
  fallback: () => Promise<T>
): Promise<T> {
  logger.warn('Failed to parse cached result, querying fresh', {
    key: key.slice(0, 8),
    parseError
  });
  return fallback();
}

/* -------------------------------------------------------------------------- */
/* Cache Utilities                                                            */
/* -------------------------------------------------------------------------- */

// Simple FNV-1a 32-bit hash with seed; returns unsigned 32-bit integer
function fnv1a32(input: string, seed: number): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

// Create a stable 128-bit hex string (32 hex chars) by mixing four 32-bit hashes
function hashHex32(input: string): string {
  const h1 = fnv1a32(input, 0x85ebca6b);
  const h2 = fnv1a32(input, 0xc2b2ae35);
  const rev = [...input].reverse().join('');
  const h3 = fnv1a32(rev, 0x27d4eb2f);
  const h4 = fnv1a32(rev, 0x165667b1);
  const to8 = (n: number) => n.toString(16).padStart(8, '0');
  return `${to8(h1)}${to8(h2)}${to8(h3)}${to8(h4)}`;
}

/**
 * Generate cache key for SQL queries
 */
export function cacheKeyForSQL(sql: string, params: Record<string, unknown> = {}): string {
  const content = JSON.stringify({ query: sql, params });
  return hashHex32(content);
}

/* -------------------------------------------------------------------------- */
/* Performance Utilities                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Measure query execution time
 */
export function measureQueryTime<T>(
  operation: () => Promise<T>,
  context: { userId?: string; operation?: string }
): Promise<{ result: T; executionTime: number }> {
  const start = performance.now();

  return operation().then(result => {
    const executionTime = Math.round(performance.now() - start);

    logger.info(`${context.operation || 'Query'} completed`, {
      ms: executionTime,
      userId: context.userId,
    });

    return { result, executionTime };
  });
}

/* -------------------------------------------------------------------------- */
/* Logging Utilities                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Log cache hit
 */
export function logCacheHit(
  key: string,
  context: { userId?: string; operation?: string; [key: string]: unknown }
): void {
  logger.info(`${context.operation || 'cache'}.hit`, {
    key: key.slice(0, 8),
    userId: context.userId,
    ...context,
  });
}

/**
 * Log cache miss
 */
export function logCacheMiss(
  key: string,
  context: {
    userId?: string;
    operation?: string;
    executionTime?: number;
    cacheTtl?: number;
    [key: string]: unknown;
  }
): void {
  logger.info(`${context.operation || 'cache'}.miss`, {
    key: key.slice(0, 8),
    ms: context.executionTime,
    userId: context.userId,
    cacheTtl: context.cacheTtl,
    ...context,
  });
}

/* -------------------------------------------------------------------------- */
/* SQL Helpers (ClickHouse)                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Normalize SQL by squashing whitespace, ensuring LIMIT and FORMAT clauses.
 * Defaults: LIMIT 1000, FORMAT JSON
 */
export function normalizeSql(sql: string, options?: { limit?: number; ensureFormat?: boolean }): string {
  const cfg = { limit: options?.limit ?? 1000, ensureFormat: options?.ensureFormat ?? true };
  const squash = (s: string) => s.trim().replace(/\s+/g, ' ');
  const ensureLimit = (s: string) => (/\bLIMIT\s+\d+/i.test(s) ? s : `${s} LIMIT ${cfg.limit}`);
  const ensureFormat = (s: string) => (cfg.ensureFormat && !/\bFORMAT\s+JSON\b/i.test(s) ? `${s} FORMAT JSON` : s);
  return ensureFormat(ensureLimit(squash(sql)));
}

/**
 * Execute a ClickHouse query and return rows as array. Uses JSONEachRow format.
 */
export async function runClickhouse<T = unknown>(
  client: { query: (args: { query: string; query_params?: Record<string, unknown>; format?: string }) => Promise<{ json: () => Promise<T[] | { data: T[] }> }> },
  sql: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const result = await client.query({ query: sql, query_params: params, format: 'JSONEachRow' });
  const data = await result.json();
  return Array.isArray(data) ? data : (data as { data: T[] }).data;
}

/**
 * Map ClickHouse errors to legacy ApplicationError codes (server convenience wrapper).
 */
export function mapClickhouseError(err: unknown, sql?: string) {
  const { mapClickhouseError } = require('@/lib/integrations/clickhouse/security');
  return mapClickhouseError(err, sql);
}

