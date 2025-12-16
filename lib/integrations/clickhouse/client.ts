// lib/integrations/clickhouse/client.ts
// Context-aware ClickHouse client interface and utilities
// This layer provides shared abstractions that work across client/server boundaries

import { fetchJSON, postJSON } from '@/lib/api/client';
import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import type { ClickParams } from './utils';
import { sanitizeClickParams } from './utils';

/* ------------------------------------------------------------------ */
/* Environment Detection & Context Awareness                         */
/* ------------------------------------------------------------------ */

/**
 * Detect if we're running in a server environment
 */
function isServerEnvironment(): boolean {
  // Detect absence of browser-only globals (navigator) without referencing window/document
  return typeof (globalThis as any).navigator === 'undefined';
}

/**
 * Detect if we're running in a browser environment
 */
function isClientEnvironment(): boolean {
  // Detect presence of browser runtime by navigator existence
  return typeof (globalThis as any).navigator !== 'undefined';
}

/**
 * Get the appropriate runtime context for logging and debugging
 */
function getRuntimeContext(): {
  environment: 'server' | 'client' | 'unknown';
  timestamp: string;
  userAgent?: string;
} {
  const timestamp = new Date().toISOString();

  if (isServerEnvironment()) {
    return {
      environment: 'server',
      timestamp,
    };
  }

  if (isClientEnvironment()) {
    return {
      environment: 'client',
      timestamp,
      userAgent: navigator?.userAgent,
    };
  }

  return {
    environment: 'unknown',
    timestamp,
  };
}

/* ------------------------------------------------------------------ */
/* Query Interface & Types                                           */
/* ------------------------------------------------------------------ */

interface ClickHouseQueryOptions {
  /** SQL query string with parameter placeholders */
  query: string;
  /** Query parameters (will be sanitized) */
  params?: ClickParams;
  /** Cache TTL in seconds (server-side only) */
  cacheTtl?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

interface ClickHouseQueryResult<T = unknown> {
  /** Query result data */
  data: T[];
  /** Query execution metadata */
  meta: {
    /** Execution time in milliseconds */
    executionTime: number;
    /** Number of rows returned */
    rowCount: number;
    /** Whether result came from cache */
    fromCache?: boolean;
    /** Query context information */
    context: ReturnType<typeof getRuntimeContext>;
  };
}

interface ClickHouseClientInterface {
  /** Execute a query with full result metadata */
  query<T = unknown>(options: ClickHouseQueryOptions): Promise<ClickHouseQueryResult<T>>;

  /** Execute a simple query (returns data only) */
  querySimple<T = unknown>(sql: string, params?: ClickParams): Promise<T[]>;

  /** Check if the client is available in current context */
  isAvailable(): boolean;

  /** Get client health status */
  getHealthStatus(): Promise<{ healthy: boolean; message?: string }>;
}

/* ------------------------------------------------------------------ */
/* Context-Aware Client Factory                                      */
/* ------------------------------------------------------------------ */

/**
 * Create a context-aware ClickHouse client that delegates to appropriate implementation
 */
function createContextAwareClient(): ClickHouseClientInterface {
  const context = getRuntimeContext();

  return {
    async query<T = unknown>(options: ClickHouseQueryOptions): Promise<ClickHouseQueryResult<T>> {
      if (!this.isAvailable()) {
        throw new ApplicationError({
          message: 'ClickHouse client not available in current context',
          code: 'CLICKHOUSE_NOT_AVAILABLE',
          category: ErrorCategory.INTEGRATION,
          severity: ErrorSeverity.ERROR,
          context,
        });
      }

      // Validate and sanitize parameters
      const sanitizedParams = options.params ? sanitizeClickParams(options.params) : {};

      // In server context, use direct client to avoid unnecessary HTTP calls
      if (context.environment === 'server') {
        try {
          // Dynamic import to avoid bundling server-only code in client builds
          // Import the server-side runner directly (relative path) to avoid
          // creating a circular dependency through the domain barrel.
          const { clickhouseQuery } = await import('./server');
          const startTime = performance.now();
          const data = (await clickhouseQuery(options.query, sanitizedParams)) as unknown as T[];
          const executionTime = Math.round(performance.now() - startTime);

          return {
            data,
            meta: {
              executionTime,
              rowCount: data.length,
              context,
            },
          };
        } catch (error) {
          logger.error('[ClickHouse] Server direct query failed', {
            error: error instanceof Error ? error.message : String(error),
            context,
            query: options.query.slice(0, 100),
          });
          throw error;
        }
      }

      // In client context, make API request
      // TODO: This endpoint was removed. The ClickHouse client needs to be updated to use
      // entity-specific queries (/api/v1/entity/{entity}/query) or a new generic query endpoint.
      // For now, this will fail at runtime. See: https://github.com/your-org/repo/issues/XXX
      if (context.environment === 'client') {
        try {
          const startTime = performance.now();
          const data = await postJSON<T[]>('/api/v1/dashboard/query', {
            sql: options.query,
            params: sanitizedParams,
            cacheTtl: options.cacheTtl,
          });
          const executionTime = Math.round(performance.now() - startTime);

          return {
            data,
            meta: {
              executionTime,
              rowCount: data.length,
              context,
            },
          };
        } catch (error) {
          logger.error('[ClickHouse] Client API request failed', {
            error: error instanceof Error ? error.message : String(error),
            context,
          });
          throw error;
        }
      }

      throw new ApplicationError({
        message: 'Unsupported runtime environment for ClickHouse queries',
        code: 'UNSUPPORTED_ENVIRONMENT',
        category: ErrorCategory.INTEGRATION,
        severity: ErrorSeverity.ERROR,
        context,
      });
    },

    async querySimple<T = unknown>(sql: string, params?: ClickParams): Promise<T[]> {
      const result = await this.query<T>({ query: sql, params: params || {} });
      return result.data;
    },

    isAvailable(): boolean {
      const env = context.environment;

      // Always available on server
      if (env === 'server') return true;

      // Available on client if we can make API requests
      if (env === 'client') {
        return typeof fetch !== 'undefined';
      }

      return false;
    },

    async getHealthStatus(): Promise<{ healthy: boolean; message?: string }> {
      try {
        if (context.environment === 'server') {
          // In server context, check API health endpoint
          const ok = await fetchJSON<unknown>('/api/health/clickhouse')
            .then(() => true)
            .catch(() => false);
          return ok ? { healthy: true } : { healthy: false, message: 'API health check failed' };
        }

        if (context.environment === 'client') {
          // In client context, check API endpoint
          const ok = await fetchJSON<unknown>('/api/health/clickhouse')
            .then(() => true)
            .catch(() => false);
          if (ok) {
            return { healthy: true };
          }
          return {
            healthy: false,
            message: 'API health check failed',
          };
        }

        return { healthy: false, message: 'Unsupported environment' };
      } catch (error) {
        return {
          healthy: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Singleton Instance                                                */
/* ------------------------------------------------------------------ */

let clientInstance: ClickHouseClientInterface | null = null;

/**
 * Get the singleton context-aware ClickHouse client
 */
export function getClickHouseClient(): ClickHouseClientInterface {
  if (!clientInstance) {
    clientInstance = createContextAwareClient();
  }
  return clientInstance;
}


/* ------------------------------------------------------------------ */
/* Convenience Exports                                               */
/* ------------------------------------------------------------------ */

// Ensure a named export exists for dynamic or static importers
export async function clickhouseQuery(
  sql: string,
  params?: Record<string, unknown>
): Promise<unknown[]> {
  const mod: any = await import('./server');
  const runner: any = mod.clickhouseQuery ?? mod.default;
  if (typeof runner !== 'function') {
    throw new Error('clickhouseQuery runner not found in ./server');
  }
  return runner(sql, params);
}


