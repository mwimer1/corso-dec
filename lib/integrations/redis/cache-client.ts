// lib/integrations/redis/cache-client.ts
// Enhanced Redis client for query result caching

import { logger } from '@/lib/monitoring';
import { getEnv } from '@/lib/server/env';
import type { Redis as UpstashRedis } from '@upstash/redis';

let redis: UpstashRedis | undefined;

/**
 * Get Redis client instance using Upstash Redis
 * Falls back to in-memory cache if Redis is not available
 */
async function getRedisClient() {
  if (redis) return redis;

  try {
    if (getEnv().UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      redis = Redis.fromEnv() as UpstashRedis;
      return redis;
    }
  } catch (error) {
    logger.warn('Failed to initialize Redis client, falling back to memory cache', { error });
  }

  // Fallback to in-memory cache
  return createMemoryCache();
}

/**
 * In-memory cache fallback for development/testing
 */
interface CacheEntry {
  value: unknown;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry>();

function createMemoryCache() {
  return {
    async get(key: string) {
      const entry = memoryCache.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiry) {
        memoryCache.delete(key);
        return null;
      }

      return JSON.stringify(entry.value);
    },
    async setex(key: string, ttl: number, value: unknown) {
      memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
      return 'OK';
    },
    async del(key: string) {
      memoryCache.delete(key);
      return 1;
    }
  };
}

/**
 * Redis cache interface for query results
 */
interface QueryCache {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  del(key: string): Promise<number>;
}

/**
 * Get the query cache client
 */
export async function getQueryCache(): Promise<QueryCache> {
  const client = await getRedisClient();

  return {
    async get(key: string): Promise<string | null> {
      try {
        return await (client as any).get(key);
      } catch (error) {
        logger.error('Redis GET failed', { key, error });
        return null;
      }
    },

    async setex(key: string, ttl: number, value: string): Promise<string> {
      try {
        return await (client as any).setex(key, ttl, value);
      } catch (error) {
        logger.error('Redis SETEX failed', { key, ttl, error });
        return 'ERROR';
      }
    },

    async del(key: string): Promise<number> {
      try {
        return await (client as any).del(key);
      } catch (error) {
        logger.error('Redis DEL failed', { key, error });
        return 0;
      }
    }
  };
}

