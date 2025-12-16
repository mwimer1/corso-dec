// lib/server/db/performance-monitor.ts
// Performance monitoring for Supabase database queries
import 'server-only';

import { logger } from '@/lib/monitoring';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  /** Threshold in milliseconds for slow query detection (default: 100ms) */
  slowQueryThresholdMs?: number;
  /** Whether to log all queries (default: false, only slow queries) */
  logAllQueries?: boolean;
  /** Whether to track query performance metrics (default: true) */
  trackMetrics?: boolean;
}

const DEFAULT_CONFIG: Required<PerformanceMonitorConfig> = {
  slowQueryThresholdMs: 100,
  logAllQueries: false,
  trackMetrics: true,
};

/**
 * Query performance metrics
 */
export interface QueryPerformanceMetrics {
  /** Query execution time in milliseconds */
  executionTimeMs: number;
  /** Whether this query was considered slow */
  isSlow: boolean;
  /** Operation name/identifier */
  operation?: string;
  /** User ID (if available) */
  userId?: string;
  /** Organization ID (if available) */
  orgId?: string;
  /** Query type (select, insert, update, delete, etc.) */
  queryType?: string;
  /** Table name (if applicable) */
  tableName?: string;
  /** Number of rows affected/returned */
  rowCount?: number;
  /** Error message (if query failed) */
  error?: string;
}

/**
 * Monitor Supabase query execution with performance tracking
 * 
 * @param operation - Async function that executes the query
 * @param context - Context information for logging
 * @param config - Performance monitoring configuration
 * @returns Result of the operation with performance metrics
 * 
 * @example
 * ```typescript
 * const { result, metrics } = await monitorQuery(
 *   () => client.from('projects').select('*'),
 *   { operation: 'fetch_projects', userId: 'user_123', orgId: 'org_456' }
 * );
 * ```
 */
export async function monitorQuery<T>(
  operation: () => Promise<T>,
  context: {
    operation?: string;
    userId?: string;
    orgId?: string;
    queryType?: string;
    tableName?: string;
  } = {},
  config: PerformanceMonitorConfig = {}
): Promise<{ result: T; metrics: QueryPerformanceMetrics }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();

  try {
    const result = await operation();
    const executionTimeMs = Math.round(performance.now() - startTime);
    const isSlow = executionTimeMs > cfg.slowQueryThresholdMs;

    // Extract row count if result is a Supabase response
    let rowCount: number | undefined;
    if (result && typeof result === 'object' && 'data' in result) {
      const data = (result as { data: unknown[] | null }).data;
      rowCount = Array.isArray(data) ? data.length : undefined;
    }

    const metrics: QueryPerformanceMetrics = {
      executionTimeMs,
      isSlow,
      ...(context.operation && { operation: context.operation }),
      ...(context.userId && { userId: context.userId }),
      ...(context.orgId && { orgId: context.orgId }),
      ...(context.queryType && { queryType: context.queryType }),
      ...(context.tableName && { tableName: context.tableName }),
      ...(rowCount !== undefined && { rowCount }),
    };

    // Log slow queries or all queries if configured
    if (isSlow || cfg.logAllQueries) {
      const logLevel = isSlow ? 'warn' : 'info';
      logger[logLevel]('[DB Performance] Query executed', {
        ...metrics,
        threshold: cfg.slowQueryThresholdMs,
      });
    }

    // Track metrics if enabled
    if (cfg.trackMetrics && isSlow) {
      logger.warn('[DB Performance] Slow query detected', {
        ...metrics,
        threshold: cfg.slowQueryThresholdMs,
      });
    }

    return { result, metrics };
  } catch (error) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : String(error);

    const metrics: QueryPerformanceMetrics = {
      executionTimeMs,
      isSlow: true, // Failed queries are always considered slow
      ...(context.operation && { operation: context.operation }),
      ...(context.userId && { userId: context.userId }),
      ...(context.orgId && { orgId: context.orgId }),
      ...(context.queryType && { queryType: context.queryType }),
      ...(context.tableName && { tableName: context.tableName }),
      error: errorMessage,
    };

    logger.error('[DB Performance] Query failed', {
      ...metrics,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Wrap a Supabase client with performance monitoring
 * 
 * Note: This is a simplified implementation. For full monitoring,
 * use monitorQuery() to wrap individual operations.
 * 
 * @param client - Supabase client to wrap
 * @param context - Base context for all queries
 * @param config - Performance monitoring configuration
 * @returns Wrapped client with performance monitoring
 * 
 * @example
 * ```typescript
 * const client = await getTenantScopedSupabaseClient(req);
 * // Use monitorQuery for individual operations instead
 * const { result, metrics } = await monitorQuery(
 *   () => client.from('projects').select('*'),
 *   { operation: 'fetch_projects', userId: 'user_123', orgId: 'org_456' }
 * );
 * ```
 */
export function withPerformanceMonitoring<T extends SupabaseClient<any, any>>(
  client: T,
  _context: {
    userId?: string;
    orgId?: string;
  } = {},
  _config: PerformanceMonitorConfig = {}
): T {
  // For now, return the client as-is
  // Full proxy implementation would require more complex type handling
  // Use monitorQuery() for individual operations instead
  return client;
}

/**
 * Get performance statistics for recent queries
 * 
 * This function can be extended to query a performance metrics table
 * or aggregate logs to provide statistics.
 * 
 * @param timeWindowMs - Time window in milliseconds (default: 1 hour)
 * @returns Performance statistics
 */
export async function getPerformanceStats(timeWindowMs: number = 60 * 60 * 1000): Promise<{
  totalQueries: number;
  slowQueries: number;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  errorRate: number;
}> {
  // TODO: Implement query performance statistics aggregation
  // This could query a performance_metrics table or aggregate from logs
  // For now, return placeholder structure
  
  logger.info('[DB Performance] Performance stats requested', {
    timeWindowMs,
  });

  return {
    totalQueries: 0,
    slowQueries: 0,
    averageExecutionTime: 0,
    p95ExecutionTime: 0,
    p99ExecutionTime: 0,
    errorRate: 0,
  };
}

