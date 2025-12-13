---
category: "documentation"
last_updated: "2025-12-13"
status: "draft"
title: "Api"
description: "Documentation and resources for documentation functionality. Located in api/."
---
## API Structure

```text
app/api/
├── README.md                    # This overview document (canonical API guide)
├── health/                      # Service health endpoints
│   ├── route.ts                 # GET/HEAD /api/health (canonical health check)
│   └── clickhouse/
│       ├── README.md            # ClickHouse health documentation (operational details)
│       └── route.ts             # GET/HEAD /api/health/clickhouse (ClickHouse health)
├── v1/                          # Public versioned API (OpenAPI documented)
│   ├── README.md                # v1 API documentation (OpenAPI reference)
│   ├── csp-report/
│   │   └── route.ts             # POST /api/v1/csp-report (CSP violation reports)
│   ├── entity/                  # Entity resource operations
│   │   └── [entity]/
│   │       ├── route.ts         # GET /api/v1/entity/[entity] (Entity base operations)
│   │       ├── query/route.ts   # POST /api/v1/entity/[entity]/query (Entity queries)
│   │       └── export/route.ts   # GET /api/v1/entity/[entity]/export (Entity exports)
│   ├── ai/                      # AI helper endpoints
│   │   ├── generate-sql/route.ts # POST /api/v1/ai/generate-sql (SQL generation)
│   │   └── generate-chart/route.ts # POST /api/v1/ai/generate-chart (Chart generation)
│   └── user/
│       └── route.ts             # POST /api/v1/user (User profile operations)
├── internal/                    # Internal endpoints (webhooks, privileged ops)
│   ├── README.md                # Internal API documentation (webhook details)
│   └── auth/
│       └── route.ts             # POST /api/internal/auth (Clerk webhooks)
└── test/
    └── route.ts                 # Test endpoint (Edge runtime)
```

## v1 Endpoints

| Domain | Method | Path | Purpose | Runtime | Rate Limit |
|--------|--------|------|---------|---------|------------|
| Entity | POST | `/api/v1/entity/[entity]/query` | Query entity with pagination/filtering | Node.js | None |
| Entity | GET | `/api/v1/entity/[entity]/export` | Export entity data (CSV/XLSX) | Node.js | None |
| Entity | GET | `/api/v1/entity/[entity]` | Entity base operations | Node.js | 60/min |
| AI | POST | `/api/v1/ai/generate-chart` | AI chart configuration | Node.js | 30/min |
| AI | POST | `/api/v1/ai/generate-sql` | AI SQL generation | Node.js | 30/min |
| Security | POST | `/api/v1/csp-report` | CSP violation reports | Node.js | 30/min |
| User | POST | `/api/v1/user` | User profile operations | Node.js | 30/min |

> **Note**: Routes under `/api/v1/dashboard/**` were removed as of October 2025. Use `/api/v1/entity/**` for resource operations and `/api/v1/ai/**` for AI helpers.

## Internal Endpoints

| Domain | Method | Path | Purpose | Runtime | Rate Limit |
|--------|--------|------|---------|---------|------------|
| Auth | POST | `/api/internal/auth` | Clerk webhook processing | Node.js | 100/min |

## Public Endpoints

| Domain | Method | Path | Purpose | Runtime | Rate Limit |
|--------|--------|------|---------|---------|------------|
| Status | GET, HEAD | `/api/health` | Canonical health check with metadata | Edge | N/A |
| Health | GET, HEAD | `/api/health/clickhouse` | ClickHouse database connectivity | Node.js | N/A |
| Security | POST | `/api/v1/csp-report` | CSP violation reporting | Edge | 30/min |

## Architecture & Standards

### Runtime Configuration
- **Edge Runtime**: Use for public endpoints, fast responses (`runtime = 'edge'`)
- **Node.js Runtime**: Use for data operations, complex processing (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `revalidate = 0`)

### Environment Access
- **Edge routes**: Use `getEnvEdge()` only
- **Node routes**: Use `getEnv()` for server operations
- **Public routes**: Use `publicEnv` for client-accessible variables
- **Never use `process.env` directly** in route handlers

### Error Contract
All API responses follow standardized format:
```typescript
// Success
{ success: true, data: T }
// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

### CORS Policy
Browser-facing endpoints implement OPTIONS handlers with:
- Origin validation via `handleCors()`
- Standardized headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc.)
- Production-hardened origin allowlist

### Adding New Routes
1. Create route file with proper runtime declaration
2. Add Zod validation for inputs
3. Implement authentication/RBAC where needed
4. Update OpenAPI spec (`api/openapi.yml`)
5. Add tests for new functionality
6. Update this README with route details

### Development Guidelines
- **Input validation**: All request bodies use Zod `.strict()` schemas
- **Rate limiting**: Applied via `withRateLimitEdge()` wrapper
- **Error handling**: Use `http.ok()`/`http.error()` helpers
- **Logging**: Structured logging with appropriate levels
- **Testing**: Unit tests for validation, integration tests for endpoints

## Security

- **Auth:** Protected routes use Clerk; handlers call `requireUserId()`
- **Tenant isolation:** SQL validated with `validateSQLScope()`
- **Input validation:** Zod schemas for all request bodies
- **Rate limits:** AI endpoints 30/min; ClickHouse queries 60/min; entity queries 60/min; internal auth webhooks 100/min
- **Errors:** Standardized via `http.ok()` / `http.error()` or wrappers
- **Unsafe SQL:** `/api/v1/ai/generate-sql` returns `400` with `{ code: 'INVALID_SQL' }` when generated SQL fails validation
- **Env access:** Use `getEnv()`; avoid direct `process.env` in app code
- **Wrapper imports:** For readability, codebases may alias `withErrorHandlingEdge`/`withRateLimitEdge` to `withErrorHandling`/`withRateLimit` and import via the edge-safe barrel `@/lib/api`

## Runtime Boundaries

- Edge routes must not import Node-only code
- ClickHouse integrations are Node-only; dashboard query runs on Node
- Health endpoint is Edge and must stay Node-free

## Streaming (NDJSON)

- Use `makeEdgeRoute` for typed, rate-limited route composition
- Content type: `application/x-ndjson`

## Quick File References

- Entity query: `app/api/v1/entity/[entity]/query/route.ts`
- Entity export: `app/api/v1/entity/[entity]/export/route.ts`
- Entity base operations: `app/api/v1/entity/[entity]/route.ts`
- AI generate SQL: `app/api/v1/ai/generate-sql/route.ts`
- AI generate chart: `app/api/v1/ai/generate-chart/route.ts`
- User operations: `app/api/v1/user/route.ts`
- CSP reports: `app/api/v1/csp-report/route.ts`

## Usage Examples

```bash
# Entity query with pagination/filtering
curl -X POST http://localhost:3000/api/v1/entity/permits/query \
  -H "Content-Type: application/json" \
  -d '{"page":{"index":0,"size":10},"filter":[{"field":"status","op":"eq","value":"active"}]}'

# AI SQL generation
curl -X POST http://localhost:3000/api/v1/ai/generate-sql \
  -H "Content-Type: application/json" \
  -d '{"question":"Top 10 cities by permits in 2024"}'

# AI chart generation
curl -X POST http://localhost:3000/api/v1/ai/generate-chart \
  -H "Content-Type: application/json" \
  -d '{"question":"Show permits by status","results":[{"status":"active","count":100}]}'
```

## OpenAPI Management

```bash
pnpm openapi:gen      # Generate types and docs from api/openapi.yml
pnpm openapi:rbac:check # Validate RBAC annotations
```

Single source: `api/openapi.yml` → generates `api/openapi.json` + TypeScript types.

**RBAC enforcement:**
- `x-corso-rbac: [role...]` required for bearer-auth endpoints
- `x-public: true` for public endpoints (no auth required)
- Public endpoints are accessible without authentication (middleware configured)
- `OrgIdHeader` parameter for tenant-scoped operations
- CI fails if RBAC/tenant scope missing or invalid roles used

**Note:** Health endpoints (`/health`, `/api/status/health`) are public but located in `/app/api/status/` for organizational clarity, separate from `/app/api/public/` which contains browser-reporting endpoints.

---

**Last updated:** 2025-10-04

