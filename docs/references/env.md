---
title: "References"
description: "Documentation and resources for documentation functionality. Located in references/."
last_updated: "2026-01-02"
category: "documentation"
status: "draft"
---
## Table of Contents

### Public Variables (NEXT_PUBLIC_*)

- [NEXT_PUBLIC_API_URL](#next_public_api_url)
- [NEXT_PUBLIC_APP_NAME](#next_public_app_name)
- [NEXT_PUBLIC_APP_URL](#next_public_app_url)
- [NEXT_PUBLIC_APP_VERSION](#next_public_app_version)
- [NEXT_PUBLIC_ASSETS_BASE](#next_public_assets_base)
- [NEXT_PUBLIC_DEMO_URL](#next_public_demo_url)
- [NEXT_PUBLIC_ONBOARDING_PREVIEW](#next_public_onboarding_preview)
- [NEXT_PUBLIC_SENTRY_DSN](#next_public_sentry_dsn)
- [NEXT_PUBLIC_SITE_URL](#next_public_site_url)
- [NEXT_PUBLIC_STAGE](#next_public_stage)
- [NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY](#next_public_stripe_publishable_key)
- [NEXT_PUBLIC_SUPABASE_ANON_KEY](#next_public_supabase_anon_key)
- [NEXT_PUBLIC_SUPABASE_URL](#next_public_supabase_url)
- [NEXT_PUBLIC_TURNSTILE_SITE_KEY](#next_public_turnstile_site_key)

### Server Variables

- [CORS_ORIGINS](#cors_origins)
- [CSP_CONNECT_DOMAINS](#csp_connect_domains)
- [CSP_FONT_DOMAINS](#csp_font_domains)
- [CSP_FORWARD_URI](#csp_forward_uri)
- [CSP_FRAME_DOMAINS](#csp_frame_domains)
- [CSP_IMG_DOMAINS](#csp_img_domains)
- [CSP_REPORT_LOG](#csp_report_log)
- [CSP_REPORT_MAX_LOGS](#csp_report_max_logs)
- [CSP_REPORT_ONLY](#csp_report_only)
- [CSP_REPORT_URI](#csp_report_uri)
- [CSP_SCRIPT_DOMAINS](#csp_script_domains)
- [CSP_STYLE_DOMAINS](#csp_style_domains)
- [INSIGHTS_SOURCE](#insights_source)
- [INTERCOM_API_KEY](#intercom_api_key)
- [PG_STAT_TOP_N](#pg_stat_top_n)

### Integration Variables

- [CLERK_SECRET_KEY](#clerk_secret_key)
- [CLERK_WEBHOOK_SECRET](#clerk_webhook_secret)
- [CLICKHOUSE_CONCURRENCY_LIMIT](#clickhouse_concurrency_limit)
- [CLICKHOUSE_DATABASE](#clickhouse_database)
- [CLICKHOUSE_PASSWORD](#clickhouse_password)
- [CLICKHOUSE_RATE_LIMIT_PER_MIN](#clickhouse_rate_limit_per_min)
- [CLICKHOUSE_READONLY_USER](#clickhouse_readonly_user)
- [CLICKHOUSE_SLOW_QUERY_MS](#clickhouse_slow_query_ms)
- [CLICKHOUSE_TIMEOUT](#clickhouse_timeout)
- [CLICKHOUSE_URL](#clickhouse_url)
- [DIRECTUS_TOKEN](#directus_token)
- [DIRECTUS_URL](#directus_url)
- [OPENAI_API_KEY](#openai_api_key)
- [OPENAI_CHART_MODEL](#openai_chart_model)
- [OPENAI_MAX_RETRIES](#openai_max_retries)
- [OPENAI_ORG_ID](#openai_org_id)
- [OPENAI_RATE_LIMIT_PER_MIN](#openai_rate_limit_per_min)
- [OPENAI_SLOW_THRESHOLD_MS](#openai_slow_threshold_ms)
- [OPENAI_SQL_MODEL](#openai_sql_model)
- [OPENAI_TIMEOUT](#openai_timeout)
- [OPENAI_TOKENS_WARN_THRESHOLD](#openai_tokens_warn_threshold)
- [SENTRY_DSN](#sentry_dsn)
- [SENTRY_ORG](#sentry_org)
- [SENTRY_PROJECT](#sentry_project)
- [STRIPE_SECRET_KEY](#stripe_secret_key)
- [SUPABASE_SERVICE_ROLE_KEY](#supabase_service_role_key)
- [SUPABASE_URL](#supabase_url)
- [TURNSTILE_SECRET_KEY](#turnstile_secret_key)
- [UPSTASH_REDIS_REST_TOKEN](#upstash_redis_rest_token)
- [UPSTASH_REDIS_REST_URL](#upstash_redis_rest_url)

### Feature Flags & Configuration

- [AI_MAX_TOOL_CALLS](#ai_max_tool_calls)
- [AI_QUERY_TIMEOUT_MS](#ai_query_timeout_ms)
- [AI_TOTAL_TIMEOUT_MS](#ai_total_timeout_ms)
- [AI_USE_RESPONSES](#ai_use_responses)
- [AUTH_IDLE_TIMEOUT_MIN](#auth_idle_timeout_min)
- [CORSO_CMS_PROVIDER](#corso_cms_provider)
- [CORSO_MOCK_ORG_ID](#corso_mock_org_id)
- [CORSO_USE_MOCK_CMS](#corso_use_mock_cms)
- [CORSO_USE_MOCK_DB](#corso_use_mock_db)
- [PRESENCE_CACHE_CAPACITY](#presence_cache_capacity)
- [PRESENCE_CACHE_TTL_MS](#presence_cache_ttl_ms)

## CORSO_USE_MOCK_DB

- Type: "true" | "false"
- Purpose: When set to "true" in development, entity data routes (projects, companies, addresses) read from static JSON fixtures under `public/__mockdb__/`.
- Source of truth: The JSON fixtures in `public/__mockdb__/` are checked into the repo (no CSV generation step).

- **Canonical Flag**: `CORSO_USE_MOCK_DB` is the primary environment variable for enabling mock database mode.
- **Legacy Support**: The app accepts `USE_MOCK_DB` (server-side) and `NEXT_PUBLIC_USE_MOCK_DB` (client-side) for backward compatibility in the current release, but these are deprecated and will be removed in a future version.
- **Deprecation Note**: Use `CORSO_USE_MOCK_DB` for all new code. Legacy flags are maintained only for existing configurations.
- Edge-safety: API routes run on Edge and fetch mock JSON from `/__mockdb__/...`, avoiding any Node `fs` usage.

## CORSO_USE_MOCK_CMS

- Type: "true" | "false" | undefined
- Purpose: When set to "true" in development, marketing content (insights, articles) is read from static JSON fixtures under `public/__mockcms__/` instead of markdown files or a real CMS.
- Source of truth: The JSON fixtures in `public/__mockcms__/` are checked into the repo (generated via `pnpm port:mockcms:insights`).
- Default behavior:
  - **Dev/test**: Defaults to `true` (enabled) unless explicitly set to `false`
  - **Production**: Defaults to `false` (disabled) unless explicitly set to `true`
- Build-safety: Uses filesystem reads (Node.js runtime), avoiding self-HTTP fetch during build.
- Content source precedence:
  1. If `CORSO_USE_MOCK_CMS=true` → use mock CMS fixtures
  2. Else if `CORSO_CMS_PROVIDER=directus` → use Directus adapter
  3. Else → use legacy adapter (markdown/static fallback)

## CORSO_CMS_PROVIDER

- Type: "legacy" | "directus" | undefined
- Purpose: Selects the CMS provider when not using mock CMS mode.
- Default: "legacy" (markdown/static content)
- Options:
  - `"legacy"`: Uses existing markdown files from `content/insights/articles/` or static fallback
  - `"directus"`: Uses Directus CMS (requires `DIRECTUS_URL` and `DIRECTUS_TOKEN`)

## DIRECTUS_URL

- Type: URL string
- Purpose: Directus CMS instance URL (only used when `CORSO_CMS_PROVIDER=directus`).
- Example: `https://cms.example.com`

## DIRECTUS_TOKEN

- Type: string
- Purpose: Directus authentication token (only used when `CORSO_CMS_PROVIDER=directus`).
- Security: Server-only variable, never exposed to client.

## NEXT_PUBLIC_USE_MOCK_AI

- Type: "true" | "1" | undefined
- Purpose: When set to "true" or "1" in development, chat AI responses are generated locally without calling the OpenAI API. Useful for UI/UX development and testing without backend connectivity.
- Behavior:
  - Bypasses `/api/v1/ai/chat` endpoint calls
  - Generates context-aware mock responses based on mode (projects/companies/addresses) and question keywords
  - Simulates realistic typing delay (~500ms) for natural UX
  - Returns mock data for common queries (e.g., "last 30 days", "top 10 contractors", "trending")
- Edge-safety: Mock responses are generated client-side, avoiding any API calls.

## NEXT_PUBLIC_STAGE

- Type: "development" | "staging" | "production" | undefined
- Purpose: Runtime stage identifier for environment-specific behavior and feature flags.
- Usage: Controls which features are enabled, logging levels, and development tools visibility.
- Default: "development" (if not set)
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_APP_NAME

- Type: string
- Purpose: Application name used in metadata, email templates, and UI branding.
- Example: "Corso Data Platform"
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_APP_VERSION

- Type: string
- Purpose: Application version number for versioning, debugging, and feature detection.
- Example: "1.0.0"
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_SITE_URL

- Type: URL string
- Purpose: Base URL for the public-facing site (marketing pages, SEO metadata, sitemap generation).
- Example: `http://localhost:3000` (development), `https://corso.com` (production)
- Usage: Used for absolute URLs in sitemaps, OpenGraph tags, and canonical links.
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_API_URL

- Type: URL string
- Purpose: Base URL for API endpoints used by client-side code.
- Example: `http://localhost:3000/api` (development), `https://api.corso.com` (production)
- Usage: Client-side API calls use this as the base URL.
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_DEMO_URL

- Type: URL string | undefined
- Purpose: URL for demo/preview environments (optional).
- Usage: Used for demo links and preview functionality.
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_ASSETS_BASE

- Type: URL string | undefined
- Purpose: Base URL for static assets (CDN or asset server).
- Usage: If set, static assets are served from this URL instead of relative paths.
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_ONBOARDING_PREVIEW

- Type: "1" | "true" | undefined
- Purpose: Enables onboarding preview mode for development/testing.
- Usage: When set, allows previewing onboarding flows without completing them.
- Security: Public variable, exposed to client-side code.

## NEXT_PUBLIC_SUPABASE_URL

- Type: URL string
- Purpose: Supabase project URL for client-side database access.
- Example: `https://YOUR-PROJECT.supabase.co`
- Security: Public variable, exposed to client-side code. Use with `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side database access.

## NEXT_PUBLIC_SUPABASE_ANON_KEY

- Type: string
- Purpose: Supabase anonymous (public) key for client-side database access.
- Security: Public variable, exposed to client-side code. This is the anonymous key (safe for client exposure) - never use the service role key here.

## NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

- Type: string
- Purpose: Stripe publishable key for client-side payment processing.
- Example: `pk_test_...` (test) or `pk_live_...` (production)
- Security: Public variable, exposed to client-side code. This is the publishable key (safe for client exposure) - never use the secret key here.

## NEXT_PUBLIC_SENTRY_DSN

- Type: URL string | undefined
- Purpose: Sentry DSN for client-side error tracking and monitoring.
- Example: `https://...@sentry.io/...`
- Security: Public variable, exposed to client-side code. Used for client-side error reporting.

## NEXT_PUBLIC_TURNSTILE_SITE_KEY

- Type: string
- Purpose: Cloudflare Turnstile site key for bot protection on forms.
- Example: `0x4AAAAAAABkMYinukE...`
- Security: Public variable, exposed to client-side code. Used for client-side bot verification.

## CLERK_SECRET_KEY

- Type: string
- Purpose: Clerk server-side secret key for authentication operations.
- Security: Server-only variable, never exposed to client. Required for server-side Clerk operations.

## CLERK_WEBHOOK_SECRET

- Type: string
- Purpose: Clerk webhook signing secret (Svix) for verifying incoming webhook events.
- Security: Server-only variable, never exposed to client. Used to verify webhook signatures from Clerk.

## TURNSTILE_SECRET_KEY

- Type: string
- Purpose: Cloudflare Turnstile secret key for server-side bot verification.
- Security: Server-only variable, never exposed to client. Used to verify Turnstile tokens on the server.

## OPENAI_API_KEY

- Type: string
- Purpose: OpenAI API key for AI chat and SQL generation features.
- Security: Server-only variable, never exposed to client. Required for all AI-powered features.

## OPENAI_ORG_ID

- Type: string | undefined
- Purpose: OpenAI organization ID for API usage tracking and billing.
- Usage: Optional, used for organization-level API usage tracking.
- Security: Server-only variable, never exposed to client.

## OPENAI_SQL_MODEL

- Type: string
- Purpose: OpenAI model name for SQL generation and chat features.
- Default: "gpt-4o-mini"
- Example: "gpt-4-0613", "gpt-4o-mini"
- Security: Server-only variable. Consider pinning to specific model versions for consistency.

## OPENAI_CHART_MODEL

- Type: string | undefined
- Purpose: OpenAI model name for chart generation features.
- Default: "gpt-3.5-turbo"
- Security: Server-only variable.

## OPENAI_TIMEOUT

- Type: number (milliseconds)
- Purpose: Timeout for OpenAI API requests.
- Default: 30000 (30 seconds)
- Security: Server-only variable.

## OPENAI_MAX_RETRIES

- Type: number
- Purpose: Maximum number of retry attempts for failed OpenAI API requests.
- Default: 2
- Security: Server-only variable.

## OPENAI_SLOW_THRESHOLD_MS

- Type: number (milliseconds)
- Purpose: Threshold for logging slow OpenAI API requests.
- Default: 5000 (5 seconds)
- Security: Server-only variable.

## OPENAI_RATE_LIMIT_PER_MIN

- Type: number
- Purpose: Rate limit for OpenAI API requests per minute.
- Default: 60
- Security: Server-only variable.

## OPENAI_TOKENS_WARN_THRESHOLD

- Type: number
- Purpose: Token count threshold for warning about large requests.
- Default: 1000
- Security: Server-only variable.

## AI_USE_RESPONSES

- Type: boolean
- Purpose: Enable OpenAI Responses API (newer API with multi-step tool calling).
- Default: false (uses legacy Chat Completions API)
- Usage: Set to `true` to enable Responses API, `false` for Chat Completions API.
- Security: Server-only variable.

## AI_MAX_TOOL_CALLS

- Type: number
- Purpose: Maximum number of tool calls per conversation turn in AI chat.
- Default: 3
- Security: Server-only variable.

## AI_QUERY_TIMEOUT_MS

- Type: number (milliseconds)
- Purpose: Timeout for individual SQL query execution in AI chat.
- Default: 5000 (5 seconds)
- Security: Server-only variable.

## AI_TOTAL_TIMEOUT_MS

- Type: number (milliseconds)
- Purpose: Overall timeout for entire AI chat request (including all tool calls).
- Default: 60000 (60 seconds)
- Security: Server-only variable.

## CLICKHOUSE_URL

- Type: URL string
- Purpose: ClickHouse database connection URL.
- Example: `https://your-instance.region.aws.clickhouse.cloud:8443`
- Security: Server-only variable, contains database credentials.

## CLICKHOUSE_READONLY_USER

- Type: string
- Purpose: ClickHouse read-only user for database queries.
- Security: Server-only variable, database credentials.

## CLICKHOUSE_PASSWORD

- Type: string
- Purpose: ClickHouse database password.
- Security: Server-only variable, sensitive credential.

## CLICKHOUSE_DATABASE

- Type: string
- Purpose: ClickHouse database name.
- Example: "corso_production"
- Security: Server-only variable.

## CLICKHOUSE_TIMEOUT

- Type: number (milliseconds)
- Purpose: Timeout for ClickHouse query execution.
- Default: 30000 (30 seconds)
- Security: Server-only variable.

## CLICKHOUSE_SLOW_QUERY_MS

- Type: number (milliseconds)
- Purpose: Threshold for logging slow ClickHouse queries.
- Default: 5000 (5 seconds)
- Security: Server-only variable.

## CLICKHOUSE_CONCURRENCY_LIMIT

- Type: number
- Purpose: Maximum concurrent ClickHouse connections.
- Security: Server-only variable.

## CLICKHOUSE_RATE_LIMIT_PER_MIN

- Type: number
- Purpose: Rate limit for ClickHouse queries per minute.
- Default: 1000
- Security: Server-only variable.

## STRIPE_SECRET_KEY

- Type: string
- Purpose: Stripe secret key for server-side payment processing.
- Example: `sk_test_...` (test) or `sk_live_...` (production)
- Security: Server-only variable, sensitive credential. Never expose to client.

## SUPABASE_URL

- Type: URL string
- Purpose: Supabase project URL for server-side database operations.
- Example: `https://YOUR-PROJECT.supabase.co`
- Security: Server-only variable.

## SUPABASE_SERVICE_ROLE_KEY

- Type: string
- Purpose: Supabase service role key for admin database operations.
- Security: Server-only variable, sensitive credential. Has admin privileges - never expose to client.

## UPSTASH_REDIS_REST_URL

- Type: URL string
- Purpose: Upstash Redis REST API URL for caching and rate limiting.
- Example: `https://your-redis-instance.upstash.io`
- Security: Server-only variable.

## UPSTASH_REDIS_REST_TOKEN

- Type: string
- Purpose: Upstash Redis REST API token for authentication.
- Security: Server-only variable, sensitive credential.

## SENTRY_DSN

- Type: URL string | undefined
- Purpose: Sentry DSN for server-side error tracking and monitoring.
- Example: `https://...@sentry.io/...`
- Security: Server-only variable. Used for server-side error reporting.

## SENTRY_ORG

- Type: string | undefined
- Purpose: Sentry organization identifier.
- Security: Server-only variable.

## SENTRY_PROJECT

- Type: string | undefined
- Purpose: Sentry project identifier.
- Security: Server-only variable.

## INTERCOM_API_KEY

- Type: string | undefined
- Purpose: Intercom API key for customer support integration.
- Security: Server-only variable, sensitive credential.

## CORS_ORIGINS

- Type: string | string[]
- Purpose: Allowed CORS origins for API endpoints.
- Example: `"*"` (all origins) or `"https://app.corso.com,https://staging.corso.com"`
- Security: Server-only variable. Controls which origins can access the API.

## CSP_SCRIPT_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed script sources for Content Security Policy.
- Example: `["'self'", "js.stripe.com", "js.clerk.dev"]`
- Security: Server-only variable. Controls which domains can load scripts.

## CSP_STYLE_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed stylesheet sources for Content Security Policy.
- Example: `["'self'", "fonts.googleapis.com"]`
- Security: Server-only variable. Controls which domains can load stylesheets.

## CSP_FONT_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed font sources for Content Security Policy.
- Example: `["'self'", "fonts.gstatic.com"]`
- Security: Server-only variable. Controls which domains can load fonts.

## CSP_IMG_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed image sources for Content Security Policy.
- Example: `["'self'", "images.clerk.dev", "js.stripe.com"]`
- Security: Server-only variable. Controls which domains can load images.

## CSP_CONNECT_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed connection targets for Content Security Policy (fetch, XHR, WebSocket).
- Example: `["'self'", "api.openai.com", "api.stripe.com"]`
- Security: Server-only variable. Controls which domains can be connected to.

## CSP_FRAME_DOMAINS

- Type: string[] | undefined
- Purpose: Allowed frame sources for Content Security Policy.
- Example: `["'self'", "js.stripe.com", "accounts.clerk.dev"]`
- Security: Server-only variable. Controls which domains can be embedded in frames.

## CSP_REPORT_URI

- Type: string | undefined
- Purpose: URI for CSP violation reports.
- Example: `/api/v1/csp-report`
- Security: Server-only variable. Endpoint that receives CSP violation reports.

## CSP_REPORT_ONLY

- Type: string | undefined
- Purpose: Enable CSP report-only mode (doesn't block, only reports violations).
- Example: `"false"` (enforce) or `"true"` (report-only)
- Security: Server-only variable.

## CSP_FORWARD_URI

- Type: URL string | undefined
- Purpose: Optional URI to forward CSP violation reports to external service.
- Security: Server-only variable. Used for forwarding reports to monitoring services.

## CSP_REPORT_LOG

- Type: string | undefined
- Purpose: Enable console logging of CSP violations in development.
- Example: `"false"` (no logging) or `"true"` (log violations)
- Security: Server-only variable. Development-only feature.

## CSP_REPORT_MAX_LOGS

- Type: number
- Purpose: Maximum number of CSP violation logs per request (prevents console spam).
- Default: 2
- Security: Server-only variable. Development-only feature.

## AUTH_IDLE_TIMEOUT_MIN

- Type: number (minutes)
- Purpose: Idle timeout for authentication sessions.
- Default: 30 (minutes)
- Security: Server-only variable. Controls session expiration.

## PRESENCE_CACHE_TTL_MS

- Type: number (milliseconds)
- Purpose: Time-to-live for presence cache entries.
- Security: Server-only variable. Controls how long presence data is cached.

## PRESENCE_CACHE_CAPACITY

- Type: number
- Purpose: Maximum number of entries in presence cache.
- Security: Server-only variable. Controls cache size limits.

## CORSO_MOCK_ORG_ID

- Type: string
- Purpose: Mock organization ID used when `CORSO_USE_MOCK_DB=true`.
- Default: "demo-org"
- Usage: Used for tenant validation in mock database mode.
- Security: Server-only variable. Development/testing only.

## INSIGHTS_SOURCE

- Type: string | undefined
- Purpose: Source identifier for insights/content system.
- Security: Server-only variable. Used for content source selection.

## PG_STAT_TOP_N

- Type: number
- Purpose: Number of top queries to track in PostgreSQL statistics.
- Default: 10
- Security: Server-only variable. Database monitoring configuration.

## Edge Cases & Hidden Dependencies

### Mock DB Environment Resolution

The mock database feature has complex runtime dependencies that developers must understand:

**Environment Variable Precedence:**
1. **Server-side**: `USE_MOCK_DB` (server environment variable)
2. **Client-side**: `NEXT_PUBLIC_USE_MOCK_DB` (public environment variable)
3. **Fallback**: `CORSO_USE_MOCK_DB` (canonical internal flag)

**Runtime Behavior:**
- **Edge Runtime**: Cannot access server environment variables, falls back to `NEXT_PUBLIC_USE_MOCK_DB`
- **Server-side Rendering (SSR)**: May have access to both server and public variables
- **Browser**: Only `NEXT_PUBLIC_*` variables available after hydration
- **Build Time**: Static replacement of all available environment variables
- **Test Environment**: Tests automatically use mock mode when `NODE_ENV === 'test'` (no flag needed in test setup)

**Hidden Dependencies:**
- Mock JSON files live in `public/__mockdb__/` and are served from that directory (Edge-compatible)
- Entity routes automatically detect and use mock data when flag is enabled
- No UI changes required - uses existing data fetching patterns

## NEXT_PUBLIC_APP_URL

- Type: URL string
- Purpose: Base URL for the application used for absolute links, email templates, and OAuth redirects. Required for proper functionality of features like email notifications, social sharing, and external authentication flows.
- Example: `http://localhost:3000` (development), `https://app.corso.com` (production)
- Usage: Set to your application's public URL including protocol and port (if non-standard).

### Environment Access Patterns

#### Client-Safe Environment Access
```typescript
// ✅ CORRECT: Client-safe configuration
import { publicEnv } from '@/lib/shared/config/client';

// ❌ INCORRECT: Direct environment access in client code (deprecated flag)
const mockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true';
```

#### Server-Safe Environment Access
```typescript
// ✅ CORRECT: Server-only configuration
import { getEnv } from '@/lib/server/env';
const apiKey = getEnv().OPENAI_API_KEY;

// ❌ INCORRECT: Client environment access in server code
import { publicEnv } from '@/lib/shared/config/client';
```

#### Edge-Safe Environment Access
```typescript
// ✅ CORRECT: Edge-compatible configuration
import { getEnvEdge } from '@/lib/api';
const apiKey = getEnvEdge().OPENAI_API_KEY;  // Only includes client-safe environment variables

// ❌ INCORRECT: Server environment access in Edge runtime routes
import { getEnv } from '@/lib/server/env';  // Will fail - Edge runtime cannot access server-only vars
```

#### Environment Access Layering

**Server Environment (`getEnv()`)**:
- Contains all server-side environment variables including `CORSO_USE_MOCK_DB`, `CORSO_USE_MOCK_CMS`, `CORSO_CMS_PROVIDER`, `DIRECTUS_URL`, `DIRECTUS_TOKEN`
- Available only in Node.js runtime (server components, API routes, server actions)
- Includes sensitive configuration like database URLs, API keys, secrets
- **Not available in Edge runtime or client-side code**

**Edge Environment (`getEnvEdge()`)**:
- Subset of environment variables safe for Edge runtime
- Excludes server-only variables like `CORSO_USE_MOCK_DB`, `CORSO_USE_MOCK_CMS`, `DIRECTUS_URL`, `DIRECTUS_TOKEN`
- Includes `CORSO_USE_MOCK_CMS` for Edge-compatible content source selection
- Available in Edge runtime routes, client components, and shared utilities
- Only includes `NEXT_PUBLIC_*` prefixed variables and build-time constants

**Important**: `getEnv()` will **fail at runtime** in Edge runtime routes due to missing server-only environment variables. Always use `getEnvEdge()` for Edge-compatible code.

### Build-Time vs Runtime Environment Variables

#### Static Replacement (Build Time)
- **NEXT_PUBLIC_* variables**: Replaced at build time with actual values
- **NODE_ENV**: Replaced with 'development', 'production', or 'test'
- **NEXT_PUBLIC_APP_URL**: Used for static asset generation

#### Runtime Access (Server-Side)
- **Database URLs**: Accessed at runtime for connection establishment
- **API Keys**: Retrieved at runtime for external service calls
- **Feature Flags**: Evaluated at runtime based on current context

#### Hybrid Access (SSR/Client Hydration)
- **Mock DB Flag**: Resolved during SSR, then re-evaluated on client hydration
- **User Preferences**: Server-side rendering with client-side overrides
- **Authentication State**: Server verification with client-side updates

### Environment Validation & Error Handling

#### Required Environment Variables
```typescript
// Server-side validation with detailed error messages
const env = requireServerEnv(); // Throws ApplicationError if invalid

// Client-side validation with graceful fallbacks
const mockEnabled = publicEnv.USE_MOCK_DB ?? false;
```

#### Environment-Specific Behavior
```typescript
// Development-only features
if (publicEnv.NEXT_PUBLIC_STAGE === 'development') {
  // Enable development-specific functionality
}

// Production optimizations
if (publicEnv.NEXT_PUBLIC_STAGE === 'production') {
  // Apply production-specific optimizations
}
```

### Migration from Legacy Patterns

#### Before (Legacy Direct Access)
```typescript
// ❌ OLD: Direct environment access
const mockDb = process.env.USE_MOCK_DB === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

#### After (Centralized Configuration)
```typescript
// ✅ NEW: Centralized environment access
import { getEnv } from '@/lib/server/env';
import { publicEnv } from '@/lib/shared/config/client';

const mockDb = getEnv().CORSO_USE_MOCK_DB;
const apiUrl = publicEnv.NEXT_PUBLIC_API_URL;
```

### Testing Environment Configuration

#### Test Environment Variables
- **`.env.test`**: Test-specific environment variables
- **Mock Services**: Test database, external API mocks
- **Feature Flags**: Test-specific feature toggles
- **Debug Settings**: Enhanced logging and validation for tests

#### CI/CD Environment Variables
- **Build-time variables**: Statically replaced during CI builds
- **Runtime variables**: Injected at container startup
- **Secret management**: Secure handling of sensitive configuration
- **Environment validation**: Automated checks for required variables

# Server Environment

- Canonical module: `@/lib/server/env`
- Functions:
  - `requireServerEnv()`: validates (Zod) and returns a cached, typed env object; throws if missing/invalid.
  - `getEnv(key)`: convenience accessor backed by `requireServerEnv()`.
- Notes:
  - Module is server-only and includes `import 'server-only'`.
  - Do **not** read `process.env` directly outside this module.

## Allowed Exceptions for process.env Usage

While the general rule is to use environment utilities, certain `process.env` usage is allowed with explanatory comments:

### Build-time Optimization
```typescript
// NODE_ENV check allowed for build-time optimization
process.env.NODE_ENV === 'development' && (() => {
  const Devtools = dynamic(
    () => import('@tanstack/react-query-devtools'),
    { ssr: false }
  );
  return <Devtools initialIsOpen={false} />;
})();
```

### Dev-only Logging and Validation
```typescript
// NODE_ENV check allowed for dev-only logging
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug information');
}

// NODE_ENV check allowed for dev-only validation
if (process.env.NODE_ENV !== 'production') {
  // Runtime validation logic
}
```

### Runtime Compatibility
```typescript
// NODE_ENV check allowed for runtime compatibility
const isProd = (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) === 'production';
```

### Environment Module Implementation
- `lib/server/env.ts`: Uses `process.env` internally for env access
- `lib/shared/config/client.ts`: Uses `process.env` for `NEXT_PUBLIC_*` variables
- `lib/shared/env/public.ts`: Uses `process.env` fallback for client-side access

### Configuration and Build Files
- `*.config.*`: Build and linting configuration files
- `next.config.*`: Next.js configuration
- `vitest.config.*`: Vitest configuration
- `eslint.config.*`: ESLint configuration

### Documentation and Examples
- `**/*.md`: Documentation examples
- `docs/**`: Documentation files
- `.cursor/rules/**`: Cursor rules documentation

### Scripts and Tests
- `scripts/**`: Build and utility scripts
- `tests/**`: Test files
- `tools/**`: Development tools

**Important**: All allowed `process.env` usage must include explanatory comments stating why direct access is necessary.
