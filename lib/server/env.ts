// lib/server/env.ts
// Canonical server-only environment utilities.
import type { ValidatedEnv } from '@/types/shared/config/base/types';
import 'server-only';

const toNum = (v?: string) =>
  v == null || v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Number(v);
const toArr = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

let _cache: ValidatedEnv | null = null;

/** Server-only getter: fully typed, with light coercions. */
export function getEnv(): ValidatedEnv {
  if (_cache) return _cache;
  const e = process.env as Record<string, string | undefined>;
  const g = (k: keyof ValidatedEnv) => e[k as string];

  _cache = {
    NODE_ENV: g('NODE_ENV') as ValidatedEnv['NODE_ENV'],
    NEXT_RUNTIME: g('NEXT_RUNTIME'),
    NEXT_PHASE: g('NEXT_PHASE'),
    VERCEL_ENV: g('VERCEL_ENV'),
    NEXT_TELEMETRY_DISABLED: g('NEXT_TELEMETRY_DISABLED'),

    NEXT_PUBLIC_STAGE: g('NEXT_PUBLIC_STAGE') as ValidatedEnv['NEXT_PUBLIC_STAGE'],
    NEXT_PUBLIC_APP_NAME: g('NEXT_PUBLIC_APP_NAME'),
    NEXT_PUBLIC_APP_VERSION: g('NEXT_PUBLIC_APP_VERSION'),
    NEXT_PUBLIC_SITE_URL: g('NEXT_PUBLIC_SITE_URL'),
    NEXT_PUBLIC_APP_URL: g('NEXT_PUBLIC_APP_URL'),
    NEXT_PUBLIC_API_URL: g('NEXT_PUBLIC_API_URL'),
    NEXT_PUBLIC_DEMO_URL: g('NEXT_PUBLIC_DEMO_URL'),
    NEXT_PUBLIC_ASSETS_BASE: g('NEXT_PUBLIC_ASSETS_BASE'),
    NEXT_PUBLIC_ONBOARDING_PREVIEW: g('NEXT_PUBLIC_ONBOARDING_PREVIEW'),

    NEXT_PUBLIC_SUPABASE_URL: g('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: g('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: g('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SENTRY_DSN: g('NEXT_PUBLIC_SENTRY_DSN'),
    // Intercom removed for MVP
    NEXT_PUBLIC_INTERCOM_APP_ID: undefined,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: g('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),


    // Normalize mock DB flag: prefer CORSO_USE_MOCK_DB, fallback to USE_MOCK_DB (legacy)
    CORSO_USE_MOCK_DB: (() => {
      const v = (g('CORSO_USE_MOCK_DB') ?? (g as any)('USE_MOCK_DB')) as string | undefined;
      if (!v) return undefined;
      const s = String(v).trim().toLowerCase();
      return (s === '1' || s === 'true') ? 'true' : 'false';
    })(),

    CLERK_SECRET_KEY: g('CLERK_SECRET_KEY'),
    TURNSTILE_SECRET_KEY: g('TURNSTILE_SECRET_KEY'),

    OPENAI_API_KEY: g('OPENAI_API_KEY'),
    OPENAI_ORG_ID: g('OPENAI_ORG_ID'),
    OPENAI_SQL_MODEL: g('OPENAI_SQL_MODEL'),
    OPENAI_CHART_MODEL: g('OPENAI_CHART_MODEL'),
    OPENAI_TIMEOUT: toNum(g('OPENAI_TIMEOUT')),
    OPENAI_MAX_RETRIES: toNum(g('OPENAI_MAX_RETRIES')),
    OPENAI_SLOW_THRESHOLD_MS: toNum(g('OPENAI_SLOW_THRESHOLD_MS')),
    OPENAI_RATE_LIMIT_PER_MIN: toNum(g('OPENAI_RATE_LIMIT_PER_MIN')),
    OPENAI_TOKENS_WARN_THRESHOLD: toNum(g('OPENAI_TOKENS_WARN_THRESHOLD')),

    CLICKHOUSE_URL: g('CLICKHOUSE_URL'),
    CLICKHOUSE_READONLY_USER: g('CLICKHOUSE_READONLY_USER'),
    CLICKHOUSE_PASSWORD: g('CLICKHOUSE_PASSWORD'),
    CLICKHOUSE_DATABASE: g('CLICKHOUSE_DATABASE'),
    CLICKHOUSE_TIMEOUT: toNum(g('CLICKHOUSE_TIMEOUT')),
    CLICKHOUSE_SLOW_QUERY_MS: toNum(g('CLICKHOUSE_SLOW_QUERY_MS')),
    CLICKHOUSE_CONCURRENCY_LIMIT: toNum(g('CLICKHOUSE_CONCURRENCY_LIMIT')),
    CLICKHOUSE_RATE_LIMIT_PER_MIN: toNum(g('CLICKHOUSE_RATE_LIMIT_PER_MIN')),
    PG_STAT_TOP_N: toNum(g('PG_STAT_TOP_N')),

    STRIPE_SECRET_KEY: g('STRIPE_SECRET_KEY'),

    SUPABASE_URL: g('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: g('SUPABASE_SERVICE_ROLE_KEY'),

    UPSTASH_REDIS_REST_URL: g('UPSTASH_REDIS_REST_URL'),
    UPSTASH_REDIS_REST_TOKEN: g('UPSTASH_REDIS_REST_TOKEN'),

    SENTRY_DSN: g('SENTRY_DSN'),
    SENTRY_ORG: g('SENTRY_ORG'),
    SENTRY_PROJECT: g('SENTRY_PROJECT'),
    INTERCOM_API_KEY: g('INTERCOM_API_KEY'),

    CORS_ORIGINS: (() => {
      const v = g('CORS_ORIGINS');
      if (!v) return undefined;
      return v.includes(',') ? toArr(v) : v;
    })(),
    CSP_SCRIPT_DOMAINS: toArr(g('CSP_SCRIPT_DOMAINS')),
    CSP_STYLE_DOMAINS: toArr(g('CSP_STYLE_DOMAINS')),
    CSP_FONT_DOMAINS: toArr(g('CSP_FONT_DOMAINS')),
    CSP_IMG_DOMAINS: toArr(g('CSP_IMG_DOMAINS')),
    CSP_CONNECT_DOMAINS: toArr(g('CSP_CONNECT_DOMAINS')),
    CSP_FRAME_DOMAINS: toArr(g('CSP_FRAME_DOMAINS')),
    CSP_REPORT_URI: g('CSP_REPORT_URI'),
    CSP_REPORT_ONLY: g('CSP_REPORT_ONLY'),
    CSP_FORWARD_URI: g('CSP_FORWARD_URI'),
    CSP_REPORT_LOG: g('CSP_REPORT_LOG'),
    CSP_REPORT_MAX_LOGS: toNum(g('CSP_REPORT_MAX_LOGS')),

    AUTH_IDLE_TIMEOUT_MIN: toNum(g('AUTH_IDLE_TIMEOUT_MIN')),
    PRESENCE_CACHE_TTL_MS: toNum(g('PRESENCE_CACHE_TTL_MS')),
    PRESENCE_CACHE_CAPACITY: toNum(g('PRESENCE_CACHE_CAPACITY')),
    CLERK_WEBHOOK_SECRET: g('CLERK_WEBHOOK_SECRET'),
  } as ValidatedEnv;

  return _cache!;
}

/** Require specific server-only keys to be set. */
export function requireServerEnv<K extends keyof ValidatedEnv>(
  ...keys: K[]
): Required<Pick<ValidatedEnv, K>> {
  const env = getEnv();
  const out: any = {};
  for (const k of keys) {
    const v = env[k];
    if (v == null || (typeof v === 'string' && v.trim() === '')) {
      throw new Error(`Missing required env var: ${String(k)}`);
    }
    out[k] = v;
  }
  return out;
}

// Removed: requireServerEnvVar - unused per dead code audit
// Use requireServerEnv<K>(...keys: K[]) for typed access instead

export type { ValidatedEnv };


