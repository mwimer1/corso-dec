/**
 * @fileoverview Node.js-compatible error handling wrapper
 * @description Canonical source for Node.js error handling middleware.
 *              Node-only version that uses AsyncLocalStorage for proper request context.
 */

import 'server-only';

import { fail } from '@/lib/api/api-error';
import { logger, runWithRequestContext } from '@/lib/monitoring';
import { toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import type { NextRequest, NextResponse } from 'next/server';
import { exposeHeader } from './headers';
import { addRequestIdHeader, getRequestId } from './request-id';

/**
 * Node.js error handling wrapper
 * Uses Node.js logger with AsyncLocalStorage for proper request context propagation
 */
export function withErrorHandlingNode<R extends NextResponse | Response = Response>(
  handler: (req: NextRequest) => Promise<R> | R,
): (req: NextRequest) => Promise<R> | R {
  return async (req: NextRequest) => {
    // Some routes call wrapper with undefined; normalize to a minimal request
    const safeReq = (req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest));
    const requestId = getRequestId(safeReq);
    return runWithRequestContext({ requestId }, async () => {
      try {
        const res = await handler(safeReq);
        // Ensure the request ID header is present on success and exposed to browsers
        // Use addRequestIdHeader which handles both Response and NextResponse
        return exposeHeader(addRequestIdHeader(res, requestId), 'X-Request-ID') as R;
      } catch (err) {
        const error = toApiErrorBase(err);
        // Use Node.js logger (AsyncLocalStorage-based, proper context propagation)
        logger.error('Unhandled node route error', { requestId, error });
        // Ensure header also present on error responses
        // fail() returns NextResponse, so use addRequestIdHeader for consistency
        const resp = fail(error);
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }
    });
  };
}

