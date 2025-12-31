import 'server-only';

/**
 * Server-only entrypoint re-exporting modules that must never be pulled into client bundles.
 * Keep this file minimal and guarded by the side-effect import above.
 */

// Re-export server-only action utilities
export { ACTION_RATE_LIMITS as RATE_LIMITS, checkRateLimit } from '@/lib/ratelimiting';
// Rate limiting moved to direct middleware imports

// ClickHouse exports (consolidated under lib/integrations/clickhouse/server.ts)
export { clickhouse, clickhouseQuery } from '@/lib/integrations/clickhouse';
// Tenant filter helpers removed in single-user mode; no re-export

// Note: Use context-aware client from @/lib/integrations/clickhouse/client instead of Node-specific wrapper

// SQL scope helpers (server facade)
// Note: validateSQLScope moved to direct imports from '@/lib/integrations/database/scope'

// Database (tenant-scoped Supabase client)
export { getTenantScopedSupabaseClient, withTenantClient } from './db/supabase-tenant-client';
export { getTenantContext, type TenantContext } from './db/tenant-context';

// Error types (server facade)
export { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
// Re-export api-error types from edge-safe location (for backward compatibility)
export { fail } from '@/lib/api/api-error';
export type { ApiError, ApiErrorCode } from '@/lib/api/api-error';
export * from './errors/error-utils';

// OpenAI (server) exports
// Legacy analytics chart-config bridge removed. Import chart-building utilities
// directly from their new locations if required.

// Streaming exports
// ndjson removed - was empty/unused

// Shared (server utils) exports
export * from './shared/query-utils';
export * from './shared/server';

// Logger (server facade)
export { logger } from '@/lib/monitoring';

// Auth (server facade)
// Use Clerk auth directly: import { auth } from '@clerk/nextjs/server';

// Runtime detection utilities
export { currentRuntime, isEdge, isNode, type NextRuntime } from './runtime';

// Performance monitoring
// database-metrics removed - was empty/unused

// Feature flags (server-only)
export * from './feature-flags/builder';
// feature-flag-validator removed - was empty/unused
export * from './feature-flags/feature-flags';
export * from './feature-flags/resolvers';

// Env re-exports live only here; avoid duplicate re-exports elsewhere
export * from './env';


