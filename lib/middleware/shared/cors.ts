// lib/middleware/shared/cors.ts
// Edge-safe; no Node-only deps.

import { getEnvEdge } from '@/lib/api/edge';

/** Normalize allowed origins from env into a Set */
function getAllowedOrigins(): Set<string> | null {
  const env = getEnvEdge();
  const raw =
    (env as any).CORS_ALLOWED_ORIGINS ??
    (env as any).CORS_ORIGINS ??
    '';

  const s = typeof raw === 'string' ? raw.trim() : raw;
  if (!s) return null; // null = unconfigured (open by default)

  const list = Array.isArray(s) ? s : s.split(',').map((x: string) => x.trim()).filter(Boolean);
  return new Set(list);
}

function isOriginAllowed(origin: string): boolean {
  const allowed = getAllowedOrigins();
  if (!allowed) return true; // open when unconfigured (dev-friendly)
  return allowed.has(origin);
}

/**
 * Generate CORS headers.
 * - Omits Access-Control-Allow-Origin when no origin is present (undefined)
 * - Echoes Access-Control-Request-Method when provided; otherwise uses a safe default
 */
export function corsHeaders(origin?: string | null, requestedMethod?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': requestedMethod || 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/**
 * Preflight handler:
 * - OPTIONS with invalid Origin => 403
 * - OPTIONS with valid/missing Origin => 204
 * - Non-OPTIONS => null (caller should attach CORS headers on final response)
 */
export function handleCors(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;

  const origin = req.headers.get('origin');
  const requestedMethod = req.headers.get('Access-Control-Request-Method');

  if (origin && !isOriginAllowed(origin)) {
    return new Response(null, {
      status: 403,
      headers: corsHeaders(undefined, requestedMethod),
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, requestedMethod),
  });
}
