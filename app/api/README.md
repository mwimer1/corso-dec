---
title: Api
description: Documentation and resources for documentation functionality. Located in api/.
last_updated: '2025-12-31'
category: documentation
status: draft
---
## Overview

This directory contains HTTP API routes for the Corso application. All public endpoints are versioned under `/api/v1/*` and documented in the OpenAPI specification.

**Related:** For server actions (form submissions), see [Actions vs API Routes](../../docs/architecture/actions-vs-api-routes.md). Server Actions are feature-colocated (not in a top-level directory).

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
│   │   └── generate-sql/route.ts # POST /api/v1/ai/generate-sql (SQL generation)
│   └── user/
│       └── route.ts             # POST /api/v1/user (User profile operations)
└── internal/                    # Internal endpoints (webhooks, privileged ops)
    ├── README.md                # Internal API documentation (webhook details)
    └── auth/
        └── route.ts             # POST /api/internal/auth (Clerk webhooks)
```

## API Reference

> **📘 Source of Truth**: The complete, authoritative API specification is in [OpenAPI format](../../api/openapi.yml). All endpoint details, request/response schemas, authentication requirements, and rate limits are documented there.

### Quick Reference

### API Versioning

All public endpoints are versioned under `/api/v1/*`:
- **Versioning strategy**: URL-based versioning (`/api/v1/...`)
- **Breaking changes**: Require a new version (`/api/v2/...`)
- **OpenAPI documented**: All `/api/v1/*` endpoints are in `api/openapi.yml`

### Public vs Internal Endpoints

**Public API (`/api/v1/*`):**
- Documented in OpenAPI specification
- Available to external clients
- Require authentication (unless marked `x-public: true`)
- Examples:
  - `/api/v1/query` - Generic SQL queries (client-side ClickHouse)
  - `/api/v1/entity/[entity]/query` - Entity queries
  - `/api/v1/ai/chat` - AI chat processing
  - `/api/v1/ai/generate-sql` - SQL generation
  - `/api/v1/user` - User operations
  - `/api/v1/csp-report` - CSP violation reports

**Internal API (`/api/internal/*`):**
- **Not** included in public OpenAPI spec
- Webhooks and privileged operations
- Require signature validation (e.g., Clerk webhooks)
- Examples:
  - `/api/internal/auth` - Clerk webhook handler
- See [Internal API README](internal/README.md) for details

**Health Endpoints (`/api/health/*`):**
- Public, unauthenticated endpoints
- Marked `x-public: true` in OpenAPI
- **Canonical paths** (documented in OpenAPI, used by CI/CD):
  - `/api/health` - Service health check (alias to `/api/public/health`)
  - `/api/health/clickhouse` - ClickHouse connectivity check (alias to `/api/public/health/clickhouse`)
- **Implementation location**: `/api/public/health/*` (internal structure, not documented in OpenAPI)
- See [Health Endpoints README](health/README.md) for details

> **Note**: Routes under `/api/v1/dashboard/**` were removed as of October 2025. Use `/api/v1/entity/**` for resource operations and `/api/v1/ai/**` for AI helpers.

### Viewing the API Specification

```bash
# Generate and view OpenAPI spec
pnpm openapi:gen

# View in browser (if using OpenAPI UI tools)
# Or use your IDE's OpenAPI viewer for api/openapi.yml
```

The OpenAPI spec includes:
- Complete endpoint definitions with methods, paths, and descriptions
- Request/response schemas with validation rules
- Authentication and RBAC requirements
- Rate limiting information
- Error response formats

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
4. **Update OpenAPI spec (`api/openapi.yml`)** - This is the source of truth
5. Add tests for new functionality
6. Run `pnpm openapi:gen` to regenerate types and validate spec

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

Some endpoints return streaming responses in NDJSON format for real-time data delivery.

### Streaming Endpoints

- **`/api/v1/ai/chat`** - Streams AI chat responses as NDJSON chunks
  - Content-Type: `application/x-ndjson`
  - Each line is a JSON object: `{ assistantMessage: {...}, detectedTableIntent: null, error: null }`
  - See `app/api/v1/ai/chat/route.ts` for implementation

### NDJSON Format

- **Content-Type**: `application/x-ndjson`
- **Format**: Each line is a complete JSON object, newline-separated
- **Example**:
  ```json
  {"data": "chunk1"}\n
  {"data": "chunk2"}\n
  {"data": "chunk3"}\n
  ```

### Client Usage

```typescript
const response = await fetch('/api/v1/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello', preferredTable: 'projects' }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      const chunk = JSON.parse(line);
      // Process chunk
    }
  }
}
```

## Quick File References

- Entity query: `app/api/v1/entity/[entity]/query/route.ts`
- Entity export: `app/api/v1/entity/[entity]/export/route.ts` (⚠️ **DEPRECATED** - returns 410 Gone, use `/api/v1/entity/{entity}/query` instead)
- Entity base operations: `app/api/v1/entity/[entity]/route.ts`
- AI generate SQL: `app/api/v1/ai/generate-sql/route.ts`
- User operations: `app/api/v1/user/route.ts`
- CSP reports: `app/api/v1/csp-report/route.ts`

## Usage Examples

```bash
# Entity query with pagination/filtering (replaces deprecated export endpoint)
curl -X POST http://localhost:3000/api/v1/entity/projects/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-Corso-Org-Id: <org-id>" \
  -d '{"page":{"index":0,"size":10},"filter":{},"sort":[]}'

# Deprecated export endpoint (returns 410 Gone with deprecation headers)
curl -X GET http://localhost:3000/api/v1/entity/projects/export?format=csv \
  -H "Authorization: Bearer <token>" \
  # Response: 410 Gone with Deprecation, Sunset, and Link headers

# AI SQL generation
curl -X POST http://localhost:3000/api/v1/ai/generate-sql \
  -H "Content-Type: application/json" \
  -d '{"question":"Top 10 cities by permits in 2024"}'

# AI chat (streaming)
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"content":"Show me active projects","preferredTable":"projects"}'
```

## OpenAPI Management

The OpenAPI specification (`api/openapi.yml`) is the **single source of truth** for all API documentation. It generates:
- `api/openapi.json` - Bundled JSON specification
- `types/api/generated/openapi.d.ts` - TypeScript types for API clients (AUTO-GENERATED)

### Commands

```bash
pnpm openapi:gen          # Complete pipeline: bundle → lint → generate types
pnpm openapi:lint         # Validate YAML with Spectral
pnpm openapi:rbac:check   # Validate RBAC annotations and security
pnpm openapi:diff         # Compare spec changes
```

### RBAC & Security

The OpenAPI spec enforces security through vendor extensions:
- `x-corso-rbac: [role...]` - Required for bearer-auth endpoints (defines minimum role)
- `x-public: true` - Marks public endpoints (no auth required)
- `OrgIdHeader` parameter - Required for tenant-scoped operations
- CI validation - `pnpm openapi:rbac:check` fails if RBAC/tenant scope missing

For complete OpenAPI documentation, see [api/README.md](../../api/README.md).

## Related Documentation

- [Actions vs API Routes](../../docs/architecture/actions-vs-api-routes.md) - Decision guide (includes Server Actions)
- [OpenAPI Specification](../../api/README.md) - Complete API specification
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns

---

**Last updated:** 2025-01-03
