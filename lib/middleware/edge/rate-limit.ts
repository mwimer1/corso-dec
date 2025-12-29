/**
 * @fileoverview Edge-compatible rate limiting wrapper
 * @description Canonical source for Edge rate limiting middleware.
 *              Do NOT re-export from other modules like @/lib/ratelimiting.
 *              Import via @/lib/middleware/edge/rate-limit or @/lib/api.
 */

// Edge-safe logger (no server dependencies)
import { runWithRequestContext as runWithEdgeRequestContext } from '@/lib/monitoring/core/logger-edge';
// Edge-safe env access
import { getEnvEdge } from '@/lib/api/edge';
// Use consolidated rate limiting domain
import { exposeHeader } from '@/lib/middleware/http/headers';
import { addRequestIdHeader, getRequestId } from '@/lib/middleware/http/request-id';
import type { RateLimitOptions as RateLimitEdgeOptions } from '@/lib/ratelimiting';
import { checkRateLimit } from '@/lib/ratelimiting';
import { createMemoryStore } from '@/lib/ratelimiting/adapters/memory';
import { buildCompositeKey } from '@/lib/ratelimiting/key';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Edge-safe in-memory store (no server dependencies)
const edgeMemoryStore = createMemoryStore();

// Edge-safe error response (no server dependencies)
function createRateLimitResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({ success: false, error: { code: 'RATE_LIMITED', message: 'Too Many Requests' } }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}

export function withRateLimitEdge<R extends NextResponse | Response = NextResponse>(
  _handler: (_req: NextRequest) => Promise<R> | R,
  opts: RateLimitEdgeOptions & { onKey?: (_key: string) => void },
) {
  return async function rateLimited(req: NextRequest): Promise<R> {
    // Disable rate limiting in development (not test) or when explicitly disabled
    const { NODE_ENV, DISABLE_RATE_LIMIT } = getEnvEdge();
    const disableRateLimit = DISABLE_RATE_LIMIT === 'true';
    
    // Only bypass in development mode (not test or production)
    if (NODE_ENV === 'development' || disableRateLimit) {
      // Bypass rate limiting and call handler directly
      const response = await _handler(req);
      return response as R;
    }
    
    // Fallback for routes that invoke without a request object (rare but present)
    const safeReq = req ?? ({ headers: new Headers(), url: 'http://internal/unknown' } as unknown as NextRequest);
    const requestId = getRequestId(safeReq);

    return runWithEdgeRequestContext({ requestId }, async () => {
      /* Build key */
      const uid = safeReq.headers.get('x-clerk-user-id') ?? 'anon';
      const ip = safeReq.headers.get('cf-connecting-ip') ?? safeReq.headers.get('x-forwarded-for') ?? 'unknown';
      const path = new URL(safeReq.url).pathname;
      const key = buildCompositeKey(uid, ip, path);

      opts.onKey?.(key); // <- key IS used

      /* Check quota - use Edge-safe in-memory store */
      const limited = await checkRateLimit(edgeMemoryStore, key, opts);
      if (limited) {
        console.warn('RateLimitExceeded', { key, ip, userId: uid, path, requestId });
        if (opts.onKey) {
          opts.onKey(key);
        }

        // Return Edge-safe response
        const resp = createRateLimitResponse() as R;
        return exposeHeader(addRequestIdHeader(resp, requestId), 'X-Request-ID') as R;
      }

      /* Pass through */
      const res = await _handler(safeReq);
      return exposeHeader(addRequestIdHeader(res, requestId), 'X-Request-ID') as R;
    });
  };
}

