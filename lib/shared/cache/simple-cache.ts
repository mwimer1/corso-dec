// lib/shared/cache/simple-cache.ts
// Note: Using console.log instead of logger to avoid circular dependencies in shared layer
import { isProduction } from '@/lib/shared/config/client';

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * A generic, in-memory cache manager with TTL support.
 *
 * For more advanced caching needs (LRU eviction, capacity limits),
 * use the LRUCache from './lru-cache.ts' instead.
 */
class SimpleCacheManager {
  private cache = new Map<string, CacheEntry>();

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number): void {
    this.cache.set(key, { value, timestamp: Date.now(), ttl });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    // Allowed: dev-only debug logging in non-production
    if (!isProduction()) {
      console.log('Simple cache cleared');
    }
  }

  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  /**
   * Get all cache entries
   */
  entries(): IterableIterator<[string, CacheEntry]> {
    return this.cache.entries();
  }
}

// Export a singleton instance for configuration caching
export const simpleCacheManager = new SimpleCacheManager();

