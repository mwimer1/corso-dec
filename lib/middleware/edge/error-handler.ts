/**
 * @fileoverview Edge-compatible error handling wrapper
 * @description Canonical source for Edge error handling middleware.
 *              Edge-safe version that does not import Node-only modules.
 */

import { fail } from '@/lib/api/api-error';
import { logger, runWithRequestContext as runWithEdgeRequestContext } from '@/lib/monitoring/logger-edge';
import { toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import type { NextRequest, NextResponse } from 'next/server';
import { exposeHeader } from '../http/headers';
import { addRequestIdHeader, getRequestId } from '../http/request-id';

/**
 * Edge-safe error handling wrapper
 * Uses Edge-safe logger and error utilities (no Node-only dependencies)
 */
export function withErrorHandlingEdge<R extends NextResponse | Response = Response>(
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
        const error = toApiErrorBase(err);
        // Use Edge-safe logger (console-based, no async_hooks)
        logger.error('Unhandled edge route error', { requestId, error });
        // Ensure header also present on error responses
        const resp = fail(error) as R;
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }
    });
  };
}

