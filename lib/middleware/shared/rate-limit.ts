/**
 * @fileoverview Server-side rate limiting middleware
 * @module lib/middleware/shared/rate-limit
 * @description Node-only rate limiting for server actions (not route handlers)
 */

import { rateLimit } from '@/lib/ratelimiting/core';
import { getDefaultStore } from '@/lib/ratelimiting/server';
import type { RateLimitOptions } from '@/lib/ratelimiting/types';

/**
 * Apply rate limiting to a server action or API route
 */
export async function withRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<void> {
  const store = getDefaultStore();
  await rateLimit(store, key, opts.maxRequests, opts.windowMs);
}
