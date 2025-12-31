// Canonical health endpoint - Edge runtime for fast responses
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getEnvEdge, http } from '@/lib/api/edge';

export async function GET(_req: Request) {
  const env = getEnvEdge();

  return http.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: null, // Not available in Edge runtime
    version: '1.0.0', // Use hardcoded version for Edge runtime
    nodeVersion: null, // Not available in Edge runtime
    environment: env.NODE_ENV || 'development',
    platform: null, // Not available in Edge runtime
    arch: null, // Not available in Edge runtime
  });
}

export async function HEAD() {
  return http.noContent();
}

export async function OPTIONS() {
  return http.noContent();
}

