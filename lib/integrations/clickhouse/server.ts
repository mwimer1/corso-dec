import 'server-only';

import { createClient, type ClickHouseClient, type ClickHouseClientConfigOptions } from '@clickhouse/client';
import { getEnv } from '@/lib/server/env';
import { createSemaphore } from './concurrency';

declare global {
  // Singleton to avoid multiple TCP pools in dev/test
  // (augments the global type; safe on server-only modules)
  var __corso_clickhouse__: ClickHouseClient | undefined;
}

/**
 * Create a new ClickHouse client from server env.
 * - No env reads at module scope.
 * - Node-only (guarded by `server-only`).
 */
export function createClickhouseClient(): ClickHouseClient {
  const env = getEnv();

  const config: ClickHouseClientConfigOptions = {
    host: env.CLICKHOUSE_URL!,
    username: env.CLICKHOUSE_READONLY_USER!,
    password: env.CLICKHOUSE_PASSWORD!,
    database: env.CLICKHOUSE_DATABASE!,
    request_timeout: env.CLICKHOUSE_TIMEOUT ?? 30_000,
    max_open_connections: env.CLICKHOUSE_CONCURRENCY_LIMIT ?? 10,
  };

  return createClient(config);
}

/**
 * Lazy, typed singleton accessor.
 */
function getClient(): ClickHouseClient {
  if (!globalThis.__corso_clickhouse__) {
    globalThis.__corso_clickhouse__ = createClickhouseClient();
  }
  return globalThis.__corso_clickhouse__!;
}

/**
 * Public accessor (barrel-safe).
 */
export function clickhouse(): ClickHouseClient {
  return getClient();
}

/**
 * Semaphore to limit concurrent ClickHouse queries
 * Uses CLICKHOUSE_CONCURRENCY_LIMIT from environment (default: 8)
 * Uses Promise-based semaphore (Turbopack-compatible, no Node.js async_hooks)
 */
let querySemaphore: ReturnType<typeof createSemaphore> | null = null;

function getQuerySemaphore(): ReturnType<typeof createSemaphore> {
  if (!querySemaphore) {
    const env = getEnv();
    const limit = env.CLICKHOUSE_CONCURRENCY_LIMIT ?? 8;
    querySemaphore = createSemaphore(limit);
  }
  return querySemaphore;
}

/**
 * Execute a ClickHouse query with security validation and parameter sanitization
 * Concurrency is limited via semaphore based on CLICKHOUSE_CONCURRENCY_LIMIT env var
 */
export async function clickhouseQuery(_sql: string): Promise<unknown[]>;
export async function clickhouseQuery<T>(_sql: string, _params?: Record<string, unknown>): Promise<T[]>;
export async function clickhouseQuery<T = unknown>(
  sql: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  if (!sql.trim()) {
    throw new ApplicationError({
      message: 'SQL query cannot be empty',
      code: 'CLICKHOUSE_EMPTY_QUERY',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  let finalSql = normalizeSql(sql, { limit: 10, ensureFormat: true });

  // Enhanced security validation using centralized SQL security validator
  const securityValidation = validateSQLSecurity(finalSql);
  if (!securityValidation.isValid) {
    throw new ApplicationError({
      message: `SQL security validation failed: ${securityValidation.reason}`,
      code: mapInternalToSecCode('DANGEROUS'),
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  // Preflight classification prior to validation/network
  const s = finalSql.trim();
  // Treat SQL comments and DML/DDL, UNION injection, or script tags as dangerous
  if (
    /--|\/\*/.test(s) ||
    /(drop|insert|update|delete)\b/i.test(s) ||
    /\bunion\b/i.test(s) ||
    /<script/i.test(s)
  ) {
    throw new ApplicationError({
      message: 'Dangerous SQL comment pattern detected',
      code: mapInternalToSecCode('DANGEROUS'),
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }
  const isSelect = /^select\b/i.test(s);
  if (!isSelect) {
    throw new ApplicationError({
      message: 'Only SELECT queries are allowed',
      code: mapInternalToSecCode('INVALID_QUERY_TYPE'),
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  const sanitizedParams = sanitizeClickParams(params);

  // Execute query through semaphore to enforce concurrency limit
  const semaphore = getQuerySemaphore();
  
  try {
    const data = await semaphore(async () => {
      const client = getClient();
      const result = await client.query({
        query: finalSql,
        query_params: sanitizedParams,
      });

      const jsonResult = (await result.json()) as T[] | { data: T[] };
      return Array.isArray(jsonResult) ? jsonResult : (jsonResult as { data: T[] }).data;
    });

    return data;
  } catch (error) {
    logger.error('[ClickHouse] Query failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    throw new ApplicationError({
      message: 'ClickHouse query execution failed',
      code: SEC.QUERY_ERROR,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      originalError: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// Consolidated server-only ClickHouse query functions

/* cspell:disable */
import { validateSQLSecurity } from '@/lib/integrations/database/scope';
import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { normalizeSql } from '@/lib/server/shared/query-utils';
import { sanitizeClickParams } from './utils';

// Error codes (copied from deleted errors.ts)
const SEC = {
  INVALID_OPERATION: 'CLICKHOUSE_INVALID_OPERATION',
  DANGEROUS_OPERATION: 'CLICKHOUSE_DANGEROUS_OPERATION',
  MISSING_TENANT_FILTER: 'CLICKHOUSE_MISSING_TENANT_FILTER',
  QUERY_ERROR: 'CLICKHOUSE_QUERY_ERROR',
} as const;

function mapInternalToSecCode(
  kind: 'INVALID_QUERY_TYPE' | 'MISSING_TENANT' | 'DANGEROUS' | 'LOWLEVEL'
): string {
  switch (kind) {
    case 'INVALID_QUERY_TYPE':
      return SEC.INVALID_OPERATION;
    case 'MISSING_TENANT':
      return SEC.MISSING_TENANT_FILTER;
    case 'DANGEROUS':
      return SEC.DANGEROUS_OPERATION;
    default:
      return SEC.QUERY_ERROR;
  }
}



