// types/shared/config-types.ts

/**
 * @module types/shared/config-types
 * @description Pure type definitions for configuration objects
 */

/**
 * Environment variable structure after validation
 * @remarks This is the type of the parsed ENV object (flat shape used across the app)
 */
export interface ValidatedEnv {
  // Node/Next environment
  NODE_ENV?: 'development' | 'test' | 'production';
  NEXT_RUNTIME?: 'edge' | 'nodejs' | string;
  NEXT_PHASE?: string;
  VERCEL_ENV?: string;
  NEXT_TELEMETRY_DISABLED?: string | boolean;

  // Build metadata
  npm_package_version?: string;

  // Stage & public app meta
  NEXT_PUBLIC_STAGE?: 'development' | 'preview' | 'production';
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_DEMO_URL?: string;
  NEXT_PUBLIC_ASSETS_BASE?: string;
  NEXT_PUBLIC_ONBOARDING_PREVIEW?: string | boolean;

  // Public vendor keys
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  // Intercom removed for MVP
  // NEXT_PUBLIC_INTERCOM_APP_ID?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;


  // Mock DB flag (normalized; prefer CORSO_USE_MOCK_DB with legacy fallbacks)
  CORSO_USE_MOCK_DB?: 'true' | 'false';
  // Mock DB organization ID (used when mock DB enabled)
  CORSO_MOCK_ORG_ID?: string;
  
  // Mock CMS flag (mirrors CORSO_USE_MOCK_DB pattern)
  CORSO_USE_MOCK_CMS?: 'true' | 'false';
  
  // CMS provider selector
  CORSO_CMS_PROVIDER?: string;
  
  // Directus connection (used only if CORSO_CMS_PROVIDER === "directus")
  DIRECTUS_URL?: string;
  DIRECTUS_TOKEN?: string;

  // Auth / SSO
  CLERK_SECRET_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;

  // OpenAI
  OPENAI_API_KEY?: string;
  OPENAI_ORG_ID?: string;
  OPENAI_SQL_MODEL?: string;
  OPENAI_CHART_MODEL?: string;
  OPENAI_TIMEOUT?: number;
  OPENAI_MAX_RETRIES?: number;
  OPENAI_SLOW_THRESHOLD_MS?: number;
  OPENAI_RATE_LIMIT_PER_MIN?: number;
  OPENAI_TOKENS_WARN_THRESHOLD?: number;
  // OpenAI Responses API (Sprint 0: scaffolding only)
  AI_USE_RESPONSES?: boolean;
  AI_MAX_TOOL_CALLS?: number;
  AI_QUERY_TIMEOUT_MS?: number;
  AI_TOTAL_TIMEOUT_MS?: number;

  // ClickHouse
  CLICKHOUSE_URL?: string;
  CLICKHOUSE_READONLY_USER?: string;
  CLICKHOUSE_PASSWORD?: string;
  CLICKHOUSE_DATABASE?: string;
  CLICKHOUSE_TIMEOUT?: number;
  CLICKHOUSE_SLOW_QUERY_MS?: number;
  CLICKHOUSE_CONCURRENCY_LIMIT?: number;
  CLICKHOUSE_RATE_LIMIT_PER_MIN?: number;
  PG_STAT_TOP_N?: number;

  // Stripe
  STRIPE_SECRET_KEY?: string;

  // Supabase (server)
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;

  // Sentry / Intercom
  SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  INTERCOM_API_KEY?: string;

  // CORS / CSP
  CORS_ORIGINS?: string | string[];
  CSP_SCRIPT_DOMAINS?: string[];
  CSP_STYLE_DOMAINS?: string[];
  CSP_FONT_DOMAINS?: string[];
  CSP_IMG_DOMAINS?: string[];
  CSP_CONNECT_DOMAINS?: string[];
  CSP_FRAME_DOMAINS?: string[];
  CSP_REPORT_URI?: string;
  CSP_REPORT_ONLY?: string | boolean;
  CSP_FORWARD_URI?: string;
  CSP_REPORT_LOG?: string | boolean;
  CSP_REPORT_MAX_LOGS?: number;

  // Auth/session
  AUTH_IDLE_TIMEOUT_MIN?: number;
  // Webhooks / secrets
  CLERK_WEBHOOK_SECRET?: string;

  // Realtime presence cache
  PRESENCE_CACHE_TTL_MS?: number;
  PRESENCE_CACHE_CAPACITY?: number;

  // Content/Insights
  INSIGHTS_SOURCE?: string;

  // Optional metadata
  isValid?: boolean;
}

