// Node.js required: ClickHouse client operations
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { http, noContent, ok } from '@/lib/api/http';
import { getClickHouseClient } from '@/lib/integrations/clickhouse/client';
import { logger } from '@/lib/monitoring';
import { getEnv } from '@/lib/server/env';

const handleHealthCheckError = (error: unknown, startTime: number, method?: string) => {
  const responseTime = Math.round(performance.now() - startTime);
  const errMsg = error instanceof Error ? error.message : 'Unknown error';
  const env = getEnv();
  const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined;

  logger.error(`[Health Check] ClickHouse ${method ?? ''} health check failed`, {
    service: 'clickhouse',
    ...(method && { method }),
    responseTime: `${responseTime}ms`,
    status: 'unhealthy',
    error: { message: errMsg, ...(env.NODE_ENV === 'development' && stack && { stack }), responseTime: `${responseTime}ms`, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });

  return http.error(500, 'ClickHouse health check failed', {
    code: 'CLICKHOUSE_UNHEALTHY',
    details: { message: errMsg, responseTime: `${responseTime}ms`, timestamp: new Date().toISOString() },
  });
};

export async function GET(_req: Request) {
  const startTime = performance.now();

  try {
    const client = getClickHouseClient();

    // Simple health check query with timeout context
    await client.query({
      query: 'SELECT 1',
    });

    const responseTime = Math.round(performance.now() - startTime);

    // Structured logging for successful health check
    logger.info('[Health Check] ClickHouse health check successful', {
      service: 'clickhouse',
      responseTime: `${responseTime}ms`,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });

    return ok({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'clickhouse',
      responseTime: `${responseTime}ms`,
    });
  } catch (error) {
    return handleHealthCheckError(error, startTime, 'GET');
  }
}

/** @knipignore */
export async function HEAD() {
  const startTime = performance.now();

  try {
    const client = getClickHouseClient();
    await client.query({
      query: 'SELECT 1',
    });

    const responseTime = Math.round(performance.now() - startTime);

    // Structured logging for successful health check (HEAD requests)
    logger.info('[Health Check] ClickHouse HEAD health check successful', {
      service: 'clickhouse',
      method: 'HEAD',
      responseTime: `${responseTime}ms`,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });

    return noContent();
  } catch (error) {
    return handleHealthCheckError(error, startTime, 'HEAD');
  }
}

/** @knipignore */
export async function OPTIONS() {
  return noContent();
}

