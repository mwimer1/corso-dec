# API Route Inventory

**Generated**: 2025-01-XX (Sprint 0 Baseline Verification)  
**Scope**: `app/api/**` route handlers  
**Status**: ✅ Complete - All routes verified from source code

## Summary

- **Total Routes**: 14 route handlers
- **Public Endpoints**: 2 (`/api/health`, `/api/health/clickhouse`)
- **Versioned API (v1)**: 8 endpoints
- **Internal Endpoints**: 1 (`/api/internal/auth`)
- **Alias Routes**: 2 (delegating to canonical implementations)

## Route Details

### Public Health Endpoints

#### `/api/health` (Canonical)
- **File**: `app/api/public/health/route.ts`
- **Methods**: GET, HEAD, OPTIONS
- **Runtime**: `edge`
- **Auth**: None (public endpoint, `x-public: true`)
- **Rate Limit**: None (health check endpoint)
- **Input Validation**: None (no request body)
- **Output**: `{ success: true, data: { status: "ok", timestamp: string, ... } }`
- **Notes**: Edge runtime for fast responses. Some system metrics return `null` (not available in Edge).

#### `/api/health` (Alias)
- **File**: `app/api/health/route.ts`
- **Methods**: GET, HEAD, OPTIONS (re-exported from canonical)
- **Runtime**: `edge`
- **Notes**: Delegates to `app/api/public/health/route.ts` for backward compatibility.

#### `/api/health/clickhouse` (Canonical)
- **File**: `app/api/public/health/clickhouse/route.ts`
- **Methods**: GET, HEAD, OPTIONS
- **Runtime**: `nodejs`
- **Auth**: None (public endpoint, `x-public: true`)
- **Rate Limit**: None (health check endpoint)
- **Input Validation**: None (no request body)
- **Output**: `{ success: true, data: { status: "healthy", timestamp: string, service: "clickhouse", responseTime: string } }`
- **Error Output**: `{ success: false, error: { code: "CLICKHOUSE_UNHEALTHY", message: string, details: {...} } }`
- **Notes**: Node.js runtime required for ClickHouse client operations.

#### `/api/health/clickhouse` (Alias)
- **File**: `app/api/health/clickhouse/route.ts`
- **Methods**: GET, HEAD, OPTIONS (re-exported from canonical)
- **Runtime**: `nodejs`
- **Notes**: Delegates to `app/api/public/health/clickhouse/route.ts` for backward compatibility.

### Versioned API (v1)

#### `POST /api/v1/user`
- **File**: `app/api/v1/user/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: `member` role minimum (enforced via `has({ role: 'member' })`)
- **Rate Limit**: 30 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 30`)
- **Input Validation**: `UserSchema` from `@/lib/validators` (Zod `.strict()`)
- **Output**: `{ success: true, data: { updated: true } }`
- **Error Output**: Standardized via `http.error()` / `http.badRequest()`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`

#### `POST /api/v1/ai/generate-sql`
- **File**: `app/api/v1/ai/generate-sql/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: None (authentication only, no role check)
- **Rate Limit**: 30 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 30`)
- **Input Validation**: `BodySchema` (Zod) - accepts `sql`, `prompt`, `query`, or `question` fields
- **Security**: 
  - Prompt injection sanitization (filters known attack patterns)
  - SQL validation via `validateSQLScope(generatedSQL, orgId)` after AI generation
  - Tenant isolation via `getTenantContext(req)` → `orgId`
- **Output**: `{ success: true, data: { sql: string } }`
- **Error Output**: `{ success: false, error: { code: "INVALID_SQL" | "GENERATION_FAILED" | "GENERATION_ERROR", ... } }`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`

#### `POST /api/v1/ai/chat`
- **File**: `app/api/v1/ai/chat/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: None (authentication only, no role check)
- **Rate Limit**: 30 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 30`)
- **Input Validation**: `BodySchema` (Zod) - `content` (string, 1-2000 chars), `preferredTable` (optional enum), `history` (optional array)
- **Security**:
  - Prompt injection sanitization via `sanitizeUserInput()`
  - SQL Guard validation via `guardSQL()` for all AI-generated SQL
  - Tenant isolation via `getTenantContext(req)` → `orgId`
  - Query timeout: `AI_QUERY_TIMEOUT_MS` (default: 5000ms)
  - Overall timeout: `AI_TOTAL_TIMEOUT_MS` (default: 60000ms)
  - Tool call limit: `AI_MAX_TOOL_CALLS` (default: 3)
- **Output**: NDJSON stream (`Content-Type: application/x-ndjson`)
  - Format: `{ assistantMessage: { content: string, type: "assistant" } | null, detectedTableIntent: {...} | null, error: string | null }\n`
- **Features**:
  - Streaming responses (NDJSON format)
  - Multi-step tool calling (execute_sql, describe_schema)
  - Mock DB support (`CORSO_USE_MOCK_DB=true`)
  - Responses API flag (`AI_USE_RESPONSES=true` for new OpenAI Responses API)
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`

#### `POST /api/v1/entity/[entity]/query`
- **File**: `app/api/v1/entity/[entity]/query/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: `member` role minimum (enforced via `has({ role: 'member' })`)
- **Rate Limit**: 60 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 60`)
- **Input Validation**: 
  - Path param: `EntityParamSchema` (validates entity type: projects, companies, addresses)
  - Request body: `EntityQueryRequestSchema` (filter, sort, page)
- **Output**: `{ success: true, data: { rows: [...], columns: [...], total: number, page: number, pageSize: number } }`
- **Error Output**: Standardized via `http.error()` / `http.badRequest()`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`
- **Notes**: Next.js 15+ async params support (`ctx.params` may be Promise)

#### `GET /api/v1/entity/[entity]`
- **File**: `app/api/v1/entity/[entity]/route.ts`
- **Methods**: GET, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: `org:member`, `org:admin`, `org:owner` roles (enforced via `has({ role })` or direct membership check)
- **Rate Limit**: 60 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 60`)
- **Input Validation**:
  - Path param: `EntityParamSchema` (validates entity type)
  - Query params: `EntityListQuerySchema` (page, pageSize, sortDir, sortBy, search, filters)
  - Filter validation: Validates filter fields against column config
  - Sort validation: Validates sortBy against sortable columns
- **Output**: `{ success: true, data: { data: [...], total: number, page: number, pageSize: number } }`
- **Error Output**: Standardized via `http.error()` / `http.badRequest()`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`
- **Features**:
  - Relaxed auth mode support (`isRelaxedAuthMode()`)
  - Organization context resolution (header → active org → fallback to first membership)
  - Column config validation for sort/filter fields
- **Notes**: Next.js 15+ async params support (`ctx.params` may be Promise)

#### `GET /api/v1/entity/[entity]/export`
- **File**: `app/api/v1/entity/[entity]/export/route.ts`
- **Methods**: GET, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: None (authentication only)
- **Rate Limit**: 30 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 30`)
- **Input Validation**: Path param: `EntityParamSchema` (validates entity type)
- **Output**: `{ success: false, error: { code: "EXPORT_REMOVED", message: "Gone - Export feature no longer available", ... } }` (HTTP 410 Gone)
- **Status**: **DEPRECATED** - Returns 410 Gone with deprecation headers
- **Removed Date**: 2025-01-15
- **Sunset Date**: 2025-04-15
- **Alternative**: `/api/v1/entity/{entity}/query`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`
- **Notes**: Next.js 15+ async params support (`ctx.params` may be Promise)

#### `POST /api/v1/query`
- **File**: `app/api/v1/query/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Clerk `auth()` - requires `userId`
- **RBAC**: `member` role minimum (enforced via `has({ role: 'member' })`)
- **Rate Limit**: 60 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 60`)
- **Input Validation**: `QueryRequestSchema` (Zod) - `sql` (string, 1-10000 chars), `params` (optional record), `cacheTtl` (optional number)
- **Security**: SQL validation via `validateSQLScope(sql, orgId)` before execution
- **Output**: `{ success: true, data: { data: [...] } }`
- **Error Output**: Standardized via `http.error()` / `http.badRequest()`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`

#### `GET /api/v1/insights/search`
- **File**: `app/api/v1/insights/search/route.ts`
- **Methods**: GET, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 60`)
- **Auth**: None (public endpoint)
- **RBAC**: None
- **Rate Limit**: 60 requests per minute (`withRateLimitNode`, `windowMs: 60_000, maxRequests: 60`)
- **Input Validation**: `SearchQuerySchema` (Zod) - `q` (string, 1-200 chars), `category` (optional string), `limit` (optional number, 1-50, default: 20), `offset` (optional number, default: 0)
- **Output**: `{ success: true, data: { results: [{ slug: string, title: string, description: string, categories: [...], url?: string }] } }`
- **Error Output**: Standardized via `http.error()` / `http.badRequest()`
- **Wrappers**: `withErrorHandlingNode`, `withRateLimitNode`
- **CORS**: OPTIONS handler with `handleCors()`
- **Features**: 
  - Relevance scoring (title > description > category matches)
  - Recency bonus (newer articles get slight boost)
  - ISR-friendly caching (`revalidate = 60`)

#### `POST /api/v1/csp-report`
- **File**: `app/api/v1/csp-report/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `edge`
- **Auth**: None (public endpoint, `x-public: true`)
- **RBAC**: None
- **Rate Limit**: 30 requests per minute (`withRateLimitEdge`, `windowMs: 60_000, maxRequests: 30`)
- **Input Validation**: 
  - Content-Type: `application/reports+json`, `application/csp-report`, or `application/json`
  - Schemas: `reportToBatchSchema`, `legacyCspReportSchema`, `cspViolationBodySchema`
- **Output**: HTTP 204 No Content (always, to avoid browser retries)
- **Error Output**: Standardized via `http.badRequest()` (but returns 204 for invalid JSON to avoid spam)
- **Wrappers**: `withErrorHandlingEdge`, `withRateLimitEdge`
- **CORS**: OPTIONS handler with `handleCors()`
- **Features**:
  - Optional fan-out to `CSP_FORWARD_URI` (non-blocking)
  - Dev logging with noise reduction (suppresses known dev-only sources)
  - Supports Reporting API, legacy CSP report, and permissive JSON formats

### Internal Endpoints

#### `POST /api/internal/auth`
- **File**: `app/api/internal/auth/route.ts`
- **Methods**: POST, OPTIONS
- **Runtime**: `nodejs` (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Auth**: Webhook signature verification (Svix/Clerk)
- **RBAC**: None (webhook endpoint)
- **Rate Limit**: None (not explicitly set in route, but documented as 100/min in README)
- **Input Validation**: 
  - Webhook signature: Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) or `clerk-signature`
  - Payload: `ClerkEventEnvelope` (Zod schema)
- **Output**: HTTP 204 No Content (on success)
- **Error Output**: `{ success: false, error: { code: "INVALID_WEBHOOK_SIGNATURE", ... } }`
- **Wrappers**: None (direct handler, no error/rate limit wrappers)
- **CORS**: OPTIONS handler with `handleCors()`
- **Security**: Svix `Webhook.verify()` with `CLERK_WEBHOOK_SECRET`

## Patterns & Observations

### Runtime Distribution
- **Edge Runtime**: 3 routes (`/api/health`, `/api/health` alias, `/api/v1/csp-report`)
- **Node.js Runtime**: 11 routes (all others)

### Authentication Patterns
- **Public (No Auth)**: 3 routes (health endpoints, CSP report)
- **Clerk Auth Required**: 10 routes
- **RBAC Enforced**: 4 routes (`/api/v1/user`, `/api/v1/entity/[entity]/query`, `/api/v1/entity/[entity]`, `/api/v1/query`)
- **Webhook Signature**: 1 route (`/api/internal/auth`)

### Rate Limiting
- **No Rate Limit**: 3 routes (health endpoints)
- **30/min**: 4 routes (user, AI endpoints, export, CSP report)
- **60/min**: 4 routes (entity queries, generic query, insights search)
- **Not Set**: 1 route (`/api/internal/auth` - documented as 100/min but not implemented)

### Error Handling Wrappers
- **withErrorHandlingNode**: 9 routes
- **withErrorHandlingEdge**: 1 route (`/api/v1/csp-report`)
- **No Wrapper**: 1 route (`/api/internal/auth`)

### Input Validation
- **Zod Schemas**: All routes with request bodies use Zod validation
- **Strict Mode**: Most schemas use `.strict()` to reject unknown fields
- **Path Params**: Entity routes validate path params with `EntityParamSchema`

### CORS Support
- **OPTIONS Handlers**: All routes implement OPTIONS for CORS preflight
- **handleCors()**: Used consistently across all routes

### Next.js 15+ Compatibility
- **Async Params**: 3 routes handle async `ctx.params` (`/api/v1/entity/[entity]/*`)

## Issues & Inconsistencies

1. **Missing Rate Limit**: `/api/internal/auth` has no rate limit wrapper (documented as 100/min in README but not implemented)
2. **Deprecated Endpoint**: `/api/v1/entity/[entity]/export` returns 410 Gone (should be removed or fully deprecated)
3. **Alias Routes**: `/api/health` and `/api/health/clickhouse` are aliases - consider removing if backward compatibility not needed
4. **Error Wrapper Missing**: `/api/internal/auth` has no `withErrorHandlingNode` wrapper (inconsistent with other routes)

## Verification Notes

- All route files read from source code (2025-01-XX)
- Runtime declarations verified from `export const runtime` statements
- Auth checks verified from `auth()` calls and RBAC checks
- Rate limits verified from `withRateLimitNode`/`withRateLimitEdge` calls
- Input validation verified from Zod schema usage
- Output shapes verified from `http.ok()` / `http.error()` calls
