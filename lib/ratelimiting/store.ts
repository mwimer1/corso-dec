/**
 * @fileoverview Default store implementation for rate limiting
 * @module lib/rate-limiting/store
 */

import { getEnv } from '@/lib/server/env';
import { createMemoryStore } from './memory';
import { createRedisStore } from './redis';
import type { StoreAdapter } from './types';

let defaultStore: StoreAdapter | null = null;

/**
 * Get the default store implementation.
 * Uses Redis if available, falls back to in-memory store.
 */
export function getDefaultStore(): StoreAdapter {
  if (!defaultStore) {
    const hasRedis = !!getEnv().UPSTASH_REDIS_REST_URL;
    defaultStore = hasRedis ? createRedisStore() : createMemoryStore();
  }
  return defaultStore!;
}

/**
 * Reset the default store (useful for testing)
 */
export function resetDefaultStore(): void {
  defaultStore = null;
}

