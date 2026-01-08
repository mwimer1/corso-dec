/**
 * @fileoverview Middleware and wrapper utilities barrel export
 * @module lib/middleware
 */

// ── HTTP Middleware (Server Runtime) ──────────────────────────────
export { corsHeaders, handleCors } from './http/cors';
export { withErrorHandlingEdge } from './http/error-handler';
export { addRequestIdHeader, getRequestId } from './http/request-id';

// ── Edge Runtime Middleware ───────────────────────────────────────
export { withRateLimitEdge } from './edge/rate-limit';

// Note: Server-side rate limiting available via '@/lib/ratelimiting/middleware'
// withApiWrappers removed - use makeEdgeRoute() or individual wrapper composition

// ── Rate Limiting Helpers ─────────────────────────────────────────
// Server-side rate limiting available via '@/lib/ratelimiting/middleware'


