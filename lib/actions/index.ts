/**
 * @fileoverview Actions Domain Barrel Export
 * @description Server-only utilities for server actions: authentication, validation, and error handling.
 * @runtime Server-only (Node.js runtime required)
 */

export { ApplicationError, ErrorCategory, ErrorSeverity, type ErrorContext } from '@/lib/shared';
// export * from './auth'; // Removed - auth.ts is now empty
export * from './error-handling';
export * from './validation';

// Rate limiting utilities (re-exported from @/lib/ratelimiting for convenience)
export {
    ACTION_RATE_LIMITS,
    checkRateLimit
    // NOTE: removed — '@/lib/ratelimiting' no longer exports getDefaultStore.
    // If callers still import this symbol from the actions barrel, replace their usage
    // or re-export a valid symbol from '@/lib/ratelimiting' here.
} from '@/lib/ratelimiting';


