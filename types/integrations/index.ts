// types/integrations/index.ts
// Explicit exports for better tooling support

// NOTE: Clerk types are consumed directly from @clerk/nextjs/@clerk/backend

// OpenAI, Redis, and ClickHouse integration types removed - all exports were unused

// Supabase integration types
export type {
    SQLExecutionOptions,
    SupabaseApiJwtExchangeResponse
} from './supabase/api/types';

export type {
    Database
} from './supabase/core/types';

// Narrow surface: do not barrel re-export unused generated types.
// Import generated shapes directly at call sites only when needed.


