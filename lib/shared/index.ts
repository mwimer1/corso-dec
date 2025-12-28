/**
 * @fileoverview Shared library barrel - client-safe exports only
 * @description Exports only client-safe utilities to maintain runtime boundary safety.
 *              Server-only helpers must be imported directly from @/lib/server/* modules.
 *              Re-exports were reduced to prevent accidental server-only imports in client code.
 */

/**
 * Exports all shared cache utilities (shared, server/client-safe).
 */
export * from './cache/lru-cache';
export * from './cache/simple-cache';
/**
 * NOTE: `metricsCfg` is server-only and must not be re-exported from the
 * shared barrel. Import `metricsCfg` directly from `lib/shared/config/runtime`
 * within server-only code paths to avoid bundling `server-only` modules into
 * client/edge bundles.
 */
/**
 * Exports all shared constants (shared, server/client-safe).
 */
export * from './constants/links';
// Environment types
export type { ValidatedEnv } from '@/types/shared/config/base/types';
// Removed: Env alias - unused per dead code audit
/**
 * Exports all shared error classes and utilities (shared, server/client-safe).
 */
export * from './errors/application-error';
export * from './errors/error-utils';
export * from './errors/reporting';
export * from './errors/security-validation-error';
export { ErrorCategory, ErrorSeverity } from './errors/types';
// Removed: ErrorCode - unused per dead code audit
export type { AppError, ErrorContext } from './errors/types';
// Server-only performance module moved to lib/server/performance
// (Removed) Event bus utilities were deprecated and removed.
/**
 * Server-only feature flag utilities moved to @/lib/server/feature-flags
 * Import buildFeatureFlags, isEnabled, getVariant from @/lib/server in server-only code
 * Type guards and branded type helpers moved to @/lib/security/guards in v2.0.0
 */
export * from './feature-flags/feature-flags';
/**
 * Exports all shared helper functions (shared, server/client-safe).
 */
// Monitoring utilities moved to @/lib/monitoring in v2.0.0
/**
 * Exports all rate limit utilities (shared, server/client-safe).
 */
// Export removed; rate limiting lives under lib/rate-limiting now
/**
 * Exports all format utilities (shared, server/client-safe).
 */
export * from './format/numbers';
// Re-export commonly used utilities from their new locations for backward compatibility
/**
 * Re-export FilterType and FilterConfig from dashboard domain (shared, server/client-safe).
 */
// Cross-domain types should be imported from their domains directly to avoid boundary leakage
/**
 * Re-export createSafeSqlBuilder from integrations domain (shared, server-only).
 */
// Server-only builders must not be exported from shared to keep edge/client bundles safe
/**
 * Re-export logger from monitoring domain (shared, server-only).
 */
// Logger is server-only; import from monitoring within server code paths
/**
 * Exports all shared utility functions (shared, server/client-safe).
 */
// Removed: export * from './utils/layout'; - all exports were unused per dead code audit
/**
 * Exports client-safe validation helpers and schemas only.
 * Server-only validation utilities are available via @/lib/shared/server
 */
export { assertZodSchema } from './validation/assert';
// NOTE: primitive-schemas and client.ts re-exports removed to eliminate unused exports

/**
 * Facade re-exports for marketing pricing UI (allowed cross-domain import).
 */
// Marketing pricing facades should be imported from marketing domain directly

// Align shared types consumed by lib/index.ts re-exports

// Note: For backwards compatibility with direct file imports,
// compatibility stubs are available in the deprecated/ directory.
// These will be removed in a future version - use the barrel exports above instead.

/** Misc config helpers */

// Additional public surface (edge/client-safe)
// Analytics client-safe facade removed; import dashboard types directly if needed

// Asset resolver exports (Supabase-only canonical resolver)
export * from './assets/cdn';

// Analytics exports (client-safe)
export { trackEvent, trackNavClick } from './analytics/track';

// Re-export public client env to avoid deep imports
// Re-export client-safe env and logger to avoid deep imports from callers
export { logger, publicEnv } from './config/client';
// Removed: httpFetch - unused per dead code audit


