// lib/middleware/http/error-handler.ts - HTTP error handling middleware
import { logger, runWithRequestContext } from '@/lib/monitoring';
import { fail } from '@/lib/server/errors/api-error';
import { toApiError } from '@/lib/server/errors/error-utils';
import type { NextRequest, NextResponse } from 'next/server';
import { exposeHeader } from './headers';
import { addRequestIdHeader, getRequestId } from './request-id';

export function withErrorHandlingEdge<R extends NextResponse = NextResponse>(
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
        return exposeHeader(addRequestIdHeader(res, requestId), 'X-Request-ID') as R;
      } catch (err) {
        const error = toApiError(err);
        // Normalize mapped 'INTERNAL_ERROR' code to 'INTERNAL_ERROR' and allow specific HTTP_* mapping via toApiError
        logger.error('Unhandled edge route error', { requestId, error });
        // Ensure header also present on error responses
        const resp = fail(error) as R;
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }
    });
  };
}

