/**
 * @fileoverview Core types for the consolidated rate limiting domain
 * @module lib/rate-limiting/types
 */

export interface RateLimitOptions {
  /** Size of the window in milliseconds */
  windowMs: number;
  /** Maximum number of actions allowed inside the window */
  maxRequests: number;
}

// HeaderProvider interface removed as unused

/**
 * Extremely small async KV-store adapter used by the pure algorithms.
 * Purposefully mirrors the subset of Redis commands we need so it can be
 * implemented by Redis, KV, or even an in-memory `Map`.
 */
export interface StoreAdapter {
  /** Increment a key and return the new value */
  incr(key: string): Promise<number>;
  /** Set an expiry (in **seconds**) */
  expire(key: string, ttlSeconds: number): Promise<void>;
  /** Return remaining TTL in seconds (`null` when key absent) */
  ttl(key: string): Promise<number | null>;
}

/**
 * Rate limiting result with optional retry information
 */
export interface RateLimitResult {
  /** Whether the request is rate limited */
  limited: boolean;
  /** Time in seconds until the limit resets (if limited) */
  retryAfter?: number;
}

// BucketKey removed - unused in application code

/**
 * Rate limiting configuration for different domains
 */
export interface DomainRateLimits {
  [key: string]: RateLimitOptions;
}

