/**
 * @fileoverview Utility functions for error handling
 * @module lib/shared/errors/error-utils
 */
import { SecurityValidationError } from './security-validation-error';
import {
    ValidationError
} from './validation-error';

// Server-only api-error moved to lib/server/errors
// The shared layer must remain integration-agnostic. Any vendor/reporting
// functionality has been moved to `lib/integrations/errors` (server-only).
// Do NOT import from `@/lib/integrations` here to avoid cross-domain leaks.


/* ------------------------------------------------------------------ */
/* Note: API Error Serialization moved to lib/server/errors/error-utils.ts */
/* ------------------------------------------------------------------ */

// ---------------------------------------------------------------------------
// Generic helpers (centralised, pure)
// ---------------------------------------------------------------------------

// Private: unused error formatting utilities
// These functions are not imported from shared but from server/errors instead.
// Keeping for potential future use but not exported from shared barrel.
// export function formatErrorMessage(err: unknown, fallback = 'An unknown error occurred'): string {
//   return err instanceof Error ? (err.message || fallback) : String(err ?? fallback);
// }
//
// export function normalizeUnknownError(err: unknown, fallback = 'Internal error'): Error {
//   return err instanceof Error ? err : new Error(String(err ?? fallback));
// }

// Internal type for classifyError return value
type ErrorKind = 'expected' | 'unexpected';

/**
 * Classify an error as expected (validation/security/business-rule) or unexpected.
 * This is intentionally lightweight and does not import integrations.
 */
export function classifyError(error: unknown): ErrorKind {
  const e = error as any;
  if (!e) return 'unexpected';

  // Common validation indicators
  if (e?.name === 'ZodError' || e?.isValidationError === true) return 'expected';

  // Security / business rule signals
  if (e?.isSecurityError === true || e?.isBusinessRuleError === true) return 'expected';

  // Known error types by constructor
  try {
    if (error instanceof ValidationError) return 'expected';
    if (error instanceof SecurityValidationError) return 'expected';
  } catch {}

  return 'unexpected';
}

/**
 * Produce a minimal serializable payload from an error for reporting.
 */
export function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? undefined,
    } as const;
  }
  return { message: String(error ?? 'Unknown error') } as const;
}

