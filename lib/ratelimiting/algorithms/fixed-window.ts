/**
 * @fileoverview Fixed-window counter algorithm for rate limiting
 * @module lib/rate-limiting/algorithms/fixed-window
 */

import { executeRateLimit } from '../core';
import type { RateLimitOptions, RateLimitResult, StoreAdapter } from '../types';

/**
 * Fixed-window counter algorithm.
 * Increments a counter for the given key and marks the window expiry on the
 * first hit. Returns `{ limited: true }` once the counter exceeds the quota.
 */
export async function fixedWindowRateLimit(
  store: StoreAdapter,
  key: string,
  { windowMs, maxRequests }: RateLimitOptions,
): Promise<RateLimitResult> {
  return executeRateLimit(store, key, { windowMs, maxRequests });
}

