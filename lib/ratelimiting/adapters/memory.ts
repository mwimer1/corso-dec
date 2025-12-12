/**
 * @fileoverview In-memory store adapter for rate limiting
 * @module lib/rate-limiting/adapters/memory
 */

import type { StoreAdapter } from '../types';

interface MemoryEntry {
  count: number;
  reset: number; // epoch ms
}

/**
 * In-memory store adapter for development/testing environments
 */
export function createMemoryStore(): StoreAdapter {
  const memoryStore: Map<string, MemoryEntry> = new Map();

  return {
    async incr(key) {
      const now = Date.now();
      const entry = memoryStore.get(key);
      if (!entry || now > entry.reset) {
        memoryStore.set(key, { count: 1, reset: now });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },
    async expire(key, ttlSeconds) {
      const entry = memoryStore.get(key);
      if (entry) {
        entry.reset = Date.now() + ttlSeconds * 1000;
      }
    },
    async ttl(key) {
      const entry = memoryStore.get(key);
      if (!entry) return null;
      const ttl = Math.ceil((entry.reset - Date.now()) / 1000);
      return ttl > 0 ? ttl : 0;
    },
  };
}

