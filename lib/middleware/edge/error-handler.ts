/**
 * @fileoverview Edge-compatible error handling wrapper
 * @description Canonical source for Edge error handling middleware.
 *              Edge-safe version that does not import Node-only modules.
 */

import { fail } from '@/lib/api/api-error';
import { normalizeToNextResponse, type ResponseLike } from '../shared/response-types';
import { logger, runWithRequestContext as runWithEdgeRequestContext } from '@/lib/monitoring/logger-edge';
import { toApiErrorBase } from '@/lib/shared/errors/api-error-conversion';
import type { NextRequest, NextResponse } from 'next/server';
import { exposeHeader } from '../shared/headers';
import { addRequestIdHeader, getRequestId } from '../shared/request-id';

/**
 * Edge-safe error handling wrapper
 * Uses Edge-safe logger and error utilities (no Node-only dependencies)
 * 
 * Handles both Response and NextResponse return types from handlers.
 * After header manipulation, always returns NextResponse.
 */
export function withErrorHandlingEdge(
  handler: (req: NextRequest) => Promise<ResponseLike> | ResponseLike,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    // Some routes call wrapper with undefined; normalize to a minimal request
    const safeReq = (req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest));
    const requestId = getRequestId(safeReq);
    return runWithEdgeRequestContext({ requestId }, async () => {
      try {
        const res = await handler(safeReq);
        // addRequestIdHeader normalizes Response to NextResponse, so result is always NextResponse
        const nextRes = addRequestIdHeader(res, requestId);
        // Ensure the request ID header is exposed to browsers
        return exposeHeader(nextRes, 'X-Request-ID');
      } catch (err) {
        const error = toApiErrorBase(err);
        // Use Edge-safe logger (console-based, no async_hooks)
        logger.error('Unhandled edge route error', { requestId, error });
        // fail() returns NextResponse, so normalize is already NextResponse
        const resp = fail(error);
        const nextResp = addRequestIdHeader(resp, requestId);
        // Ensure header also present on error responses
        return exposeHeader(nextResp, 'X-Request-ID');
      }
    });
  };
}

