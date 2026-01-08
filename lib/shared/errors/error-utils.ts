/**
 * @fileoverview Utility functions for error handling
 * @module lib/shared/errors/error-utils
 */
import { hasErrorProperty, isErrorWithName } from './type-guards';
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

/**
 * Format an error message, falling back to a default if needed.
 * Pure function, edge-safe.
 */
export function formatErrorMessage(err: unknown, fallback = 'An unknown error occurred'): string {
  return err instanceof Error ? (err.message || fallback) : String(err ?? fallback);
}

/**
 * Normalize an unknown error to an Error instance.
 * Pure function, edge-safe.
 */
export function normalizeUnknownError(err: unknown, fallback = 'Internal error'): Error {
  return err instanceof Error ? err : new Error(String(err ?? fallback));
}

// Internal type for classifyError return value
type ErrorKind = 'expected' | 'unexpected';

/**
 * Classify an error as expected (validation/security/business-rule) or unexpected.
 * This is intentionally lightweight and does not import integrations.
 */
export function classifyError(error: unknown): ErrorKind {
  if (!error) return 'unexpected';

  // Check for ZodError by name
  if (isErrorWithName(error) && error.name === 'ZodError') return 'expected';

  // Check for validation/security/business rule flags using type guards
  if (hasErrorProperty(error, 'isValidationError')) {
    const val = error.isValidationError;
    if (val === true) return 'expected';
  }

  if (hasErrorProperty(error, 'isSecurityError')) {
    const val = error.isSecurityError;
    if (val === true) return 'expected';
  }

  if (hasErrorProperty(error, 'isBusinessRuleError')) {
    const val = error.isBusinessRuleError;
    if (val === true) return 'expected';
  }

  // Known error types by constructor
  try {
    if (error instanceof ValidationError) return 'expected';
    if (error instanceof SecurityValidationError) return 'expected';
  } catch {
    // Ignore constructor check errors
  }

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

