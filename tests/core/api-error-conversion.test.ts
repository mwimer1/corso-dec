/**
 * @fileoverview Tests for shared API error conversion utilities
 * @description Validates that error conversion logic works correctly and consistently.
 */

import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { normalizeErrorCode, toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

describe('normalizeErrorCode', () => {
  it('should map HTTP_400 to VALIDATION_ERROR', () => {
    expect(normalizeErrorCode('HTTP_400')).toBe('VALIDATION_ERROR');
  });

  it('should map HTTP_401 to UNAUTHORIZED', () => {
    expect(normalizeErrorCode('HTTP_401')).toBe('UNAUTHORIZED');
  });

  it('should map HTTP_403 to FORBIDDEN', () => {
    expect(normalizeErrorCode('HTTP_403')).toBe('FORBIDDEN');
  });

  it('should map HTTP_404 to NOT_FOUND', () => {
    expect(normalizeErrorCode('HTTP_404')).toBe('NOT_FOUND');
  });

  it('should map HTTP_429 to RATE_LIMITED', () => {
    expect(normalizeErrorCode('HTTP_429')).toBe('RATE_LIMITED');
  });

  it('should map other HTTP_* codes to INTERNAL_ERROR', () => {
    expect(normalizeErrorCode('HTTP_500')).toBe('INTERNAL_ERROR');
    expect(normalizeErrorCode('HTTP_503')).toBe('INTERNAL_ERROR');
  });

  it('should pass through non-HTTP codes as-is', () => {
    expect(normalizeErrorCode('VALIDATION_ERROR')).toBe('VALIDATION_ERROR');
    expect(normalizeErrorCode('CUSTOM_ERROR')).toBe('CUSTOM_ERROR');
  });
});

describe('toApiErrorBase', () => {
  it('should convert ZodError to VALIDATION_ERROR with details', () => {
    const zodError = new ZodError([
      { path: ['email'], message: 'Invalid email', code: 'invalid_string' },
    ]);

    const result = toApiErrorBase(zodError);

    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Invalid request');
    expect(result.details).toEqual(zodError.issues);
  });

  it('should convert ApplicationError preserving code/message semantics', () => {
    const appError = new ApplicationError({
      message: 'Custom error message',
      code: 'HTTP_400',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      context: { field: 'email' },
    });

    const result = toApiErrorBase(appError);

    expect(result.code).toBe('VALIDATION_ERROR'); // HTTP_400 mapped
    expect(result.message).toBe('Custom error message');
    expect(result.details).toEqual({ field: 'email' });
  });

  it('should convert ApplicationError with non-HTTP code', () => {
    const appError = new ApplicationError({
      message: 'Database error',
      code: 'DATABASE_CONNECTION_FAILED',
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
    });

    const result = toApiErrorBase(appError);

    expect(result.code).toBe('DATABASE_CONNECTION_FAILED'); // Passed through
    expect(result.message).toBe('Database error');
  });

  it('should convert plain Error to INTERNAL_ERROR', () => {
    const error = new Error('Something went wrong');

    const result = toApiErrorBase(error);

    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.message).toBe('Something went wrong');
    expect(result.details).toBeUndefined();
  });

  it('should convert Error without message to INTERNAL_ERROR with default', () => {
    const error = new Error('');

    const result = toApiErrorBase(error);

    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.message).toBe('Internal Error');
  });

  it('should convert plain object with code/message', () => {
    const errorObj = { code: 'HTTP_429', message: 'Too many requests', details: { retryAfter: 60 } };

    const result = toApiErrorBase(errorObj);

    expect(result.code).toBe('RATE_LIMITED'); // HTTP_429 mapped
    expect(result.message).toBe('Too many requests');
    expect(result.details).toEqual({ retryAfter: 60 });
  });

  it('should convert plain object with context instead of details', () => {
    const errorObj = { code: 'HTTP_400', message: 'Bad request', context: { field: 'email' } };

    const result = toApiErrorBase(errorObj);

    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Bad request');
    expect(result.details).toEqual({ field: 'email' });
  });

  it('should convert unknown throwables to INTERNAL_ERROR', () => {
    expect(toApiErrorBase('string error')).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal Error',
    });

    expect(toApiErrorBase(42)).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal Error',
    });

    expect(toApiErrorBase(null)).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal Error',
    });
  });
});

