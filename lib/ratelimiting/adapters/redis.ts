/**
 * @fileoverview Redis store adapter for rate limiting
 * @module lib/rate-limiting/adapters/redis
 */

import type { StoreAdapter } from '../types';

/**
 * Redis store adapter using Upstash Redis
 */
export function createRedisStore(): StoreAdapter {
  let redisInstance: any | undefined;

  const getRedis = async () => {
    if (redisInstance) return redisInstance;
    const { Redis } = await import('@upstash/redis');
    redisInstance = Redis.fromEnv();
    return redisInstance;
  };

  return {
    async incr(key) {
      const client = await getRedis();
      return (await (client as any).incr(key)) as number;
    },
    async expire(key, ttlSeconds) {
      const client = await getRedis();
      await (client as any).expire(key, ttlSeconds);
    },
    async ttl(key) {
      const client = await getRedis();
      return (await (client as any).ttl(key)) as number;
    },
  };
}

