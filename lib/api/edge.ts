/**
 * Edge-safe API surface.
 * Only export helpers that do not import Node-only modules.
 */

// Re-export Edge env helpers (from separate file to avoid circular deps)
export { getEnvEdge, type EdgeEnv } from './edge-env';

// Edge-safe middleware wrappers (no Node-only dependencies)
export { withErrorHandlingEdge } from '@/lib/middleware/edge/error-handler';
export { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';

// Edge-safe HTTP helpers
export { http } from './response/http';

// Edge-safe request parsing
export async function readJsonOnce(req: Request) {
  // Use text() to ensure the body is read exactly once
  const raw = await req.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Surface a stable reason; caller maps to 400
    throw new Error('INVALID_JSON');
  }
}



