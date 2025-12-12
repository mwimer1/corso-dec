/**
 * @fileoverview Core rate limiting execution logic
 * @module lib/rate-limiting/core
 */

import type { RateLimitOptions, RateLimitResult, StoreAdapter } from './types';

/**
 * Core rate limiting logic that handles:
 * - Incrementing the counter
 * - Setting expiry on first hit
 * - Checking if usage exceeds maxRequests
 * - Returning the rate limit result
 *
 * @param store - The storage adapter
 * @param bucketKey - The bucket key to use
 * @param options - Rate limiting options
 * @returns Rate limit result with limited status and optional retry time
 */
export async function executeRateLimit(
  store: StoreAdapter,
  bucketKey: string,
  { windowMs, maxRequests }: RateLimitOptions,
): Promise<RateLimitResult> {
  const usage = await store.incr(bucketKey);

  // First hit in a new window → set expiry
  if (usage === 1) {
    await store.expire(bucketKey, Math.ceil(windowMs / 1000));
  }

  if (usage > maxRequests) {
    const ttl = await store.ttl(bucketKey);
    return ttl != null ? { limited: true, retryAfter: ttl } : { limited: true };
  }

  return { limited: false };
}

/**
 * Convenience helper that throws when rate limit is exceeded.
 * Intentionally throws a generic Error to keep this module framework-agnostic.
 */
export async function rateLimit(
  store: StoreAdapter,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<void> {
  const result = await executeRateLimit(store, key, { windowMs, maxRequests });
  if (result.limited) {
    const err = new Error('Rate limit exceeded');
    (err as any).code = 'RATE_LIMIT_EXCEEDED';
    throw err;
  }
}

/**
 * Minimal compatibility wrapper used across actions.
 * Calls `rateLimit(store, key, maxRequests, windowMs)` then executes `fn()`.
 * Keeps existing imports working without mass refactors.
 */
export async function withRateLimit<T>(
  store: StoreAdapter,
  key: string,
  maxRequests: number,
  windowMs: number,
  fn: () => Promise<T> | T,
): Promise<T> {
  await rateLimit(store, key, maxRequests, windowMs);
  return await fn();
}

/**
 * Check rate limit without throwing (returns boolean)
 */
export async function checkRateLimit(
  store: StoreAdapter,
  identifier: string,
  opts: RateLimitOptions,
): Promise<boolean> {
  const result = await executeRateLimit(store, identifier, opts);
  return result.limited;
}

