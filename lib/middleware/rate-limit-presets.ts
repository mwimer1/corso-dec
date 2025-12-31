/**
 * @fileoverview Rate limit preset configurations
 * @description Common rate limit configurations used across API routes.
 *              Edge-safe: plain objects, no server dependencies.
 */

import type { RateLimitOptions } from '@/lib/ratelimiting';

/**
 * Rate limit: 30 requests per minute
 * Used for: AI endpoints (chat, generate-sql), user operations, export, CSP reports
 */
export const RATE_LIMIT_30_PER_MIN: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 30,
};

/**
 * Rate limit: 60 requests per minute
 * Used for: Query endpoints, entity operations, insights search
 */
export const RATE_LIMIT_60_PER_MIN: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 60,
};

/**
 * Rate limit: 100 requests per minute
 * Used for: Internal webhooks (auth)
 */
export const RATE_LIMIT_100_PER_MIN: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 100,
};
