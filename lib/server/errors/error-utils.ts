// lib/server/errors/error-utils.ts
import 'server-only';

import { ZodError } from 'zod';
import { ApplicationError } from '../../shared/errors/application-error';
import type { ApiError, ApiErrorCode } from './api-error';

// Re-export shared error utilities (none currently needed)

/**
 * Helper function to normalize error code mapping
 * Extracted to eliminate duplication in toApiError
 */
function normalizeErrorCode(code: string): ApiErrorCode {
  const httpMatch = /^HTTP_(\d{3})$/.exec(code);
  if (httpMatch) {
    const status = Number(httpMatch[1]);
    return status === 400 ? 'VALIDATION_ERROR'
      : status === 401 ? 'UNAUTHORIZED'
      : status === 403 ? 'FORBIDDEN'
      : status === 404 ? 'NOT_FOUND'
      : status === 429 ? 'RATE_LIMITED'
      : 'INTERNAL_ERROR';
  }
  return code as ApiErrorCode;
}

/* ------------------------------------------------------------------ */
/* 🚧 API Error Serialization                                         */
/* ------------------------------------------------------------------ */

/** Convert an unknown error into a serialisable `ApiError`. */
export function toApiError(err: unknown): ApiError {
  // Zod validation errors → VALIDATION_ERROR
  if (err instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: err.issues,
    };
  }

  // Structured application errors preserve their metadata; map HTTP_* to semantic codes
  if (err instanceof ApplicationError) {
    const mappedCode = normalizeErrorCode(err.code);
    return {
      code: mappedCode ?? 'INTERNAL_ERROR',
      message: err.message || 'Internal Error',
      details: err.context,
    };
  }

  // Some tests throw plain objects with { code, message }; handle those
  const asObj = err as any;
  if (asObj && typeof asObj === 'object' && typeof asObj.code === 'string') {
    const mappedCode = normalizeErrorCode(asObj.code);
    return {
      code: mappedCode ?? 'INTERNAL_ERROR',
      message: (typeof asObj.message === 'string' ? asObj.message : 'Internal Error'),
      details: asObj.details ?? asObj.context,
    };
  }

  // Generic JS Errors
  if (err instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal Error',
    };
  }

  // Fallback – unknown throwables (string, number, etc.)
  return {
    code: 'INTERNAL_ERROR',
    message: 'Internal Error',
  };
}

// ---------------------------------------------------------------------------
// Generic helpers (centralised, pure)
// ---------------------------------------------------------------------------

export function formatErrorMessage(err: unknown, fallback = 'An unknown error occurred'): string {
  return err instanceof Error ? (err.message || fallback) : String(err ?? fallback);
}

export function normalizeUnknownError(err: unknown, fallback = 'Internal error'): Error {
  return err instanceof Error ? err : new Error(String(err ?? fallback));
}

