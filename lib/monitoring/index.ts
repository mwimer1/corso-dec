// lib/monitoring/index.ts
// Core monitoring utilities (edge-safe)
export { logger, runWithRequestContext } from './logger';
export { runWithRequestContext as runWithEdgeRequestContext } from './logger-edge';
export * from './metrics';

// Server-only Sentry utilities (keep client bundles clean)
// These are server-only and should not be imported in client/edge code
// Use direct imports for server code: '@/lib/monitoring/sentry/capture', '@/lib/monitoring/sentry/init', etc.


