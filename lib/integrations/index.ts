/**
 * @fileoverview Public surface for cross-domain imports.
 * Keep minimal; do NOT re-export server-only modules or internal helpers.
 */

// Intentionally minimal. Add targeted exports here ONLY if they are
// imported via `@/lib/integrations` by other domains.

// Supabase API facade (used by multiple server files)
export { getClient, supabaseApi } from './supabase/api';

// Redis query cache (used by server files)
export { getQueryCache } from './redis/cache-client';

// ClickHouse parameter types (used by server files)
export type { ClickParams } from './clickhouse/utils';

// ClickHouse client (used by health check)
export { getClickHouseClient } from './clickhouse/client';


// SQL validation (used by server files)
export { validateAIGeneratedSQL, validateSQLScope, validateSQLSecurity } from './database/scope';

// ClickHouse entity queries (used by services)
// NOTE: Do NOT re-export server-only entity-query runners from the cross-domain barrel to avoid circular imports.
export { sanitizeClickParams } from './clickhouse/utils';

// OpenAI client (used by chat integration)
export { callOpenAIJSON, createOpenAIClient } from './openai/server';

// Supabase server utilities (used by various files)
export { getSupabaseAdmin } from './supabase/server';


// Shared utilities (used by server)
export { logger } from '@/lib/monitoring';
export { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
export { mapClickhouseError } from './clickhouse/security';

// Error reporting utilities
export { reportError } from './errors/server';


