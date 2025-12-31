// lib/server/errors/error-utils.ts
import 'server-only';

import type { ApiError } from '@/lib/api/api-error';
import { toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import { formatErrorMessage, normalizeUnknownError } from '@/lib/shared/errors/error-utils';

// Re-export shared error utilities for backward compatibility
export { formatErrorMessage, normalizeUnknownError };

/* ------------------------------------------------------------------ */
/* 🚧 API Error Serialization                                         */
/* ------------------------------------------------------------------ */

/**
 * Convert an unknown error into a serialisable `ApiError`.
 * Delegates to shared conversion core for consistency across runtimes.
 */
export function toApiError(err: unknown): ApiError {
  return toApiErrorBase(err);
}

// ---------------------------------------------------------------------------
// Generic helpers (centralised, pure)
// ---------------------------------------------------------------------------
// formatErrorMessage and normalizeUnknownError are now imported from shared
// and re-exported above for backward compatibility

