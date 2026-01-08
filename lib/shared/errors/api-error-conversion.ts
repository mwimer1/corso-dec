/**
 * @fileoverview Shared API error conversion utilities
 * @description Pure, edge-safe error conversion logic used by both edge and server runtimes.
 *              This module must remain free of Node-only dependencies and server-only imports.
 */

import type { ApiError, ApiErrorCode } from '@/lib/api/api-error';
import { ZodError } from 'zod';
import { ApplicationError } from './application-error';

/**
 * Normalizes HTTP status codes to semantic error codes.
 * Maps HTTP_XXX patterns to standardized ApiErrorCode values.
 */
export function normalizeErrorCode(code: string): ApiErrorCode {
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

/**
 * Converts an unknown error into a standardized ApiError.
 * This is the canonical error conversion logic used by both edge and server runtimes.
 *
 * @param err - The error to convert (can be any type)
 * @returns A standardized ApiError object
 */
export function toApiErrorBase(err: unknown): ApiError {
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
  if (err !== null && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
    const errorObj = err as { code: string; message?: unknown; details?: unknown; context?: unknown };
    const mappedCode = normalizeErrorCode(errorObj.code);
    return {
      code: mappedCode ?? 'INTERNAL_ERROR',
      message: (typeof errorObj.message === 'string' ? errorObj.message : 'Internal Error'),
      details: errorObj.details ?? errorObj.context,
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

