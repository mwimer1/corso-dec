/**
 * @fileoverview Node.js-compatible rate limiting wrapper
 * @description Canonical source for Node.js rate limiting middleware.
 *              Node-only version that uses AsyncLocalStorage for proper request context.
 */

import 'server-only';

import { exposeHeader } from '@/lib/middleware/http/headers';
import { addRequestIdHeader, getRequestId } from '@/lib/middleware/http/request-id';
import { logger, runWithRequestContext } from '@/lib/monitoring';
import type { RateLimitOptions } from '@/lib/ratelimiting';
import { checkRateLimit } from '@/lib/ratelimiting';
import { buildCompositeKey } from '@/lib/ratelimiting/key';
import { getDefaultStore } from '@/lib/ratelimiting/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Node.js rate limiting wrapper
 * Uses Node.js logger with AsyncLocalStorage for proper request context propagation
 * Uses server-side store (Redis if available, otherwise in-memory)
 */
export function withRateLimitNode<R extends NextResponse | Response = NextResponse>(
  handler: (req: NextRequest) => Promise<R> | R,
  opts: RateLimitOptions & { onKey?: (_key: string) => void },
): (req: NextRequest) => Promise<R> | R {
  return async function rateLimited(req: NextRequest): Promise<R> {
    // Disable rate limiting in development (not test) or when explicitly disabled
    const nodeEnv = typeof process !== 'undefined' && process.env ? process.env['NODE_ENV'] : undefined;
    const disableRateLimit = typeof process !== 'undefined' && process.env ? process.env['DISABLE_RATE_LIMIT'] === 'true' : false;
    
    // Only bypass in development mode (not test or production)
    if ((nodeEnv === 'development') || disableRateLimit) {
      // Bypass rate limiting and call handler directly
      const response = await handler(req);
      return response as R;
    }
    
    // Fallback for routes that invoke without a request object (rare but present)
    const safeReq = req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest);
    const requestId = getRequestId(safeReq);

    return runWithRequestContext({ requestId }, async () => {
      /* Build key */
      const headers = safeReq.headers;
      const uid = headers?.get('x-clerk-user-id') ?? 'anon';
      const ip = headers?.get('cf-connecting-ip') ?? headers?.get('x-forwarded-for') ?? 'unknown';
      const path = new URL(safeReq.url).pathname;
      const key = buildCompositeKey(uid, ip, path);

      opts.onKey?.(key);

      /* Check quota - use server-side store (Redis if available, otherwise memory) */
      const store = getDefaultStore();
      const limited = await checkRateLimit(store, key, opts);
      if (limited) {
        // Use Node.js logger (AsyncLocalStorage-based, proper context propagation)
        logger.warn('RateLimitExceeded', { key, ip, userId: uid, path, requestId });
        if (opts.onKey) {
          opts.onKey(key);
        }

        // Create rate limit response
        const resp = new NextResponse(
          JSON.stringify({ success: false, error: { code: 'RATE_LIMITED', message: 'Too Many Requests' } }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        ) as R;
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }

      /* Pass through */
      const res = await handler(safeReq);
      return exposeHeader(addRequestIdHeader(res, requestId), 'X-Request-ID') as R;
    });
  };
}

