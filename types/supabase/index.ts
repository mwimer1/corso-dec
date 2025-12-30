// types/supabase/index.ts
// Supabase types barrel - explicit exports for better tooling support

// API types
export type {
    SQLExecutionOptions,
    SupabaseApiJwtExchangeResponse
} from './api/types';

// Core database schema types
export type {
    Database
} from './core/types';

// Narrow surface: do not barrel re-export unused generated types.
// Import generated shapes directly at call sites only when needed.

