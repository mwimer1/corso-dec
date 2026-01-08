// lib/server/env/knobs.ts
import 'server-only';

import { getEnv } from '@/lib/server/env';

export function getKnobInt(value: unknown, fallback: number): number {
  const n = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isFinite(n) ? (n as number) : fallback;
}


export function knobs() {
  const env = getEnv();
  return {
    OPENAI_TIMEOUT: getKnobInt(env.OPENAI_TIMEOUT, 120000),
    OPENAI_MAX_RETRIES: getKnobInt(env.OPENAI_MAX_RETRIES, 1),
    OPENAI_SLOW_THRESHOLD_MS: getKnobInt(env.OPENAI_SLOW_THRESHOLD_MS, 2000),
    CLICKHOUSE_TIMEOUT: getKnobInt(env.CLICKHOUSE_TIMEOUT, 120000),
    CLICKHOUSE_SLOW_QUERY_MS: getKnobInt(env.CLICKHOUSE_SLOW_QUERY_MS, 1500),
    CLICKHOUSE_CONCURRENCY_LIMIT: getKnobInt(env.CLICKHOUSE_CONCURRENCY_LIMIT, 8),
  } as const;
}

