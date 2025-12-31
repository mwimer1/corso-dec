/**
 * @fileoverview Middleware and wrapper utilities barrel export
 * @module lib/middleware
 */

// ── HTTP Middleware (Server Runtime) ──────────────────────────────
export { corsHeaders, handleCors } from './http/cors';
export { addRequestIdHeader, getRequestId } from './http/request-id';

// ── Edge Runtime Middleware ───────────────────────────────────────
export { withErrorHandlingEdge } from './edge/error-handler';
export { withRateLimitEdge } from './edge/rate-limit';

// ── Node.js Runtime Middleware ────────────────────────────────────
// Note: These are server-only and should NOT be imported in Edge routes
export { withErrorHandlingNode } from './http/with-error-handling-node';
export { withRateLimitNode } from './http/with-rate-limit-node';

// Note: Server-side rate limiting available via '@/lib/ratelimiting/middleware'
// withApiWrappers removed - use makeEdgeRoute() or individual wrapper composition

// ── Rate Limiting Presets ─────────────────────────────────────────
export {
  RATE_LIMIT_30_PER_MIN,
  RATE_LIMIT_60_PER_MIN,
  RATE_LIMIT_100_PER_MIN,
} from './rate-limit-presets';


