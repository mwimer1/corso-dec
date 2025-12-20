/**
 * @fileoverview Edge-compatible error handling wrapper
 * @description Canonical source for Edge error handling middleware.
 *              Edge-safe version that does not import Node-only modules.
 */

import { logger, runWithRequestContext as runWithEdgeRequestContext } from '@/lib/monitoring/core/logger-edge';
import type { ApiError, ApiErrorCode } from '@/lib/server/errors/api-error';
import { fail } from '@/lib/server/errors/api-error';
import { ApplicationError } from '@/lib/shared/errors/application-error';
import type { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { exposeHeader } from '../http/headers';
import { addRequestIdHeader, getRequestId } from '../http/request-id';

/**
 * Edge-safe error code normalization (duplicated from server version to avoid server-only import)
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

/**
 * Edge-safe error conversion (duplicated from server version to avoid server-only import)
 */
function toApiErrorEdge(err: unknown): ApiError {
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

/**
 * Edge-safe error handling wrapper
 * Uses Edge-safe logger and error utilities (no Node-only dependencies)
 */
export function withErrorHandlingEdge<R extends NextResponse = NextResponse>(
  handler: (req: NextRequest) => Promise<R> | R,
): (req: NextRequest) => Promise<R> | R {
  return async (req: NextRequest) => {
    // Some routes call wrapper with undefined; normalize to a minimal request
    const safeReq = (req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest));
    const requestId = getRequestId(safeReq);
    return runWithEdgeRequestContext({ requestId }, async () => {
      try {
        const res = await handler(safeReq);
        // Ensure the request ID header is present on success and exposed to browsers
        return exposeHeader(addRequestIdHeader(res, requestId), 'X-Request-ID') as R;
      } catch (err) {
        const error = toApiErrorEdge(err);
        // Use Edge-safe logger (console-based, no async_hooks)
        logger.error('Unhandled edge route error', { requestId, error });
        // Ensure header also present on error responses
        const resp = fail(error) as R;
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }
    });
  };
}

