/**
 * @fileoverview Node.js-compatible error handling wrapper
 * @description Canonical source for Node.js error handling middleware.
 *              Node-only version that uses AsyncLocalStorage for proper request context.
 */

import 'server-only';

import { fail } from '@/lib/api/api-error';
import type { ResponseLike } from '../shared/response-types';
import { logger, runWithRequestContext } from '@/lib/monitoring';
import { toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import type { NextRequest, NextResponse } from 'next/server';
import { exposeHeader } from '../shared/headers';
import { addRequestIdHeader, getRequestId } from '../shared/request-id';

/**
 * Node.js error handling wrapper
 * Uses Node.js logger with AsyncLocalStorage for proper request context propagation
 * 
 * Handles both Response and NextResponse return types from handlers.
 * After header manipulation, always returns NextResponse.
 */
export function withErrorHandlingNode(
  handler: (req: NextRequest) => Promise<ResponseLike> | ResponseLike,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    // Some routes call wrapper with undefined; normalize to a minimal request
    const safeReq = (req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest));
    const requestId = getRequestId(safeReq);
    return runWithRequestContext({ requestId }, async () => {
      try {
        const res = await handler(safeReq);
        // addRequestIdHeader normalizes Response to NextResponse, so result is always NextResponse
        const nextRes = addRequestIdHeader(res, requestId);
        // Ensure the request ID header is exposed to browsers
        return exposeHeader(nextRes, 'X-Request-ID');
      } catch (err) {
        const error = toApiErrorBase(err);
        // Use Node.js logger (AsyncLocalStorage-based, proper context propagation)
        logger.error('Unhandled node route error', { requestId, error });
        // fail() returns NextResponse, so normalize is already NextResponse
        const resp = fail(error);
        const nextResp = addRequestIdHeader(resp, requestId);
        // Ensure header also present on error responses
        return exposeHeader(nextResp, 'X-Request-ID');
      }
    });
  };
}
