// Canonical health endpoint - Edge runtime for fast responses
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getEnvEdge, http } from '@/lib/api';

export async function GET(_req: Request) {
  const env = getEnvEdge();

  return http.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: typeof process !== 'undefined' && process.uptime ? Math.floor(process.uptime()) : null,
    version: '1.0.0', // Use hardcoded version for Edge runtime
    nodeVersion: typeof process !== 'undefined' && process.version || 'unknown',
    environment: env.NODE_ENV || 'development',
    platform: typeof process !== 'undefined' && process.platform || 'unknown',
    arch: typeof process !== 'undefined' && process.arch || 'unknown',
  });
}

export async function HEAD() {
  return http.noContent();
}

export async function OPTIONS() {
  return http.noContent();
}

