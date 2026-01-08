---
title: "API v1"
description: "Public API v1 routes, runtime configuration, and rate limits."
last_updated: "2026-01-07"
category: "documentation"
status: "active"
---
# API v1 — Routes, Runtime & Limits

This README reflects the _current_ implementation. If code changes, update this file in the same PR.

## Runtime & Caching
Most v1 routes run on **Node.js** for uniform server-side capabilities and DB access:
```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Exceptions:**
- `/api/v1/csp-report` uses Edge runtime for low-latency CSP violation reporting

## Auth & RBAC
- **Protected routes**: bearerAuth (see OpenAPI)
- **RBAC enforcement**: Protected routes require `member`, `admin`, or `owner` roles (see `x-corso-rbac` in OpenAPI)
- **AI endpoints** (`/api/v1/ai/chat`, `/api/v1/ai/generate-sql`): Require `member` or higher role (member/admin/owner)
  - Returns `401` for unauthenticated requests
  - Returns `403` for authenticated users without required role
  - Can be bypassed via `ENFORCE_AI_RBAC=false` (emergency rollback only)
- **Public routes**: `/api/v1/csp-report` and `/api/v1/insights/search` are public (no auth required)
- **Error shape**: `{ success: false, error: { code, message, details? } }`

## Routes (8)

| Domain | Method | Path | Purpose | Runtime | Auth | Rate limit |
|--------|--------|------|---------|---------|------|------------|
| Entity | POST | `/api/v1/entity/[entity]/query` | Entity queries (pagination/filtering/sorting) | Node.js | Bearer | 60/min |
| Entity | GET | `/api/v1/entity/[entity]/export` | Entity exports (permanently removed - 410 Gone stub) | Node.js | Bearer | 30/min |
| Entity | GET | `/api/v1/entity/[entity]` | Entity base operations | Node.js | Bearer | 60/min |
| AI | POST | `/api/v1/ai/chat` | AI chat processing (streaming NDJSON) | Node.js | Bearer | 30/min |
| AI | POST | `/api/v1/ai/generate-sql` | AI SQL generation | Node.js | Bearer | 30/min |
| User | POST | `/api/v1/user` | User profile operations | Node.js | Bearer | 30/min |
| Security | POST | `/api/v1/csp-report` | CSP violation reports | Edge | Public | 30/min |
| Content | GET | `/api/v1/insights/search` | Public insights search | Node.js | Public | 60/min |

## AI Chat Endpoint (`/api/v1/ai/chat`)

Streams chat processing responses using OpenAI with NDJSON format. Supports tool calling for data-backed answers via SQL execution.

### Tool Call Limits & Behavior

**Tool Call Limits:**
- Maximum tool calls per conversation turn: **3** (configurable via `AI_MAX_TOOL_CALLS`, default: 3)
- Tool calls include `execute_sql` and `describe_schema` functions
- When limit is reached, the assistant message includes a note explaining the limit was reached
- Multi-step analysis: Assistant can make multiple tool calls for complex queries (e.g., query schema → refine query → final analysis)

**Tool Functions:**
- **`execute_sql`**: Executes a SQL SELECT query to retrieve data from the database
  - Only SELECT queries allowed (enforced by SQL Guard)
  - Results limited to 100 rows (enforced by SQL Guard)
  - Tenant scoping automatically enforced (orgId from auth session, not user input)
  - SQL validation uses SQL Guard for AST-based security checks
- **`describe_schema`**: Returns database schema (available tables and columns) to help model understand data structure

**SQL Security & Validation:**
- **SQL Guard validation**: AST-based validation blocks dangerous operations:
  - Blocks DROP, ALTER, INSERT, UPDATE, DELETE statements
  - Blocks multi-statement queries
  - Blocks UNION injection patterns
  - Blocks SQL comments (`--`, `/* */`)
  - Enforces SELECT-only queries
- **Tenant isolation**: All queries automatically scoped to user's organization (orgId from auth session)
- **Input sanitization**: User input sanitized to prevent prompt injection attacks
- **Row limit**: Maximum 100 rows per query (enforced by SQL Guard)

**Mock DB Behavior:**
- Mock DB mode enabled when `CORSO_USE_MOCK_DB=true` OR when `NODE_ENV !== 'production'` and `CORSO_USE_MOCK_DB !== 'false'`
- Mock mode uses `CORSO_MOCK_ORG_ID` (default: `'demo-org'`) for tenant validation
- Recommended for CI/dev environments for deterministic behavior without ClickHouse

**Responses API Flag:**
- `AI_USE_RESPONSES=true` enables the new OpenAI Responses API path with multi-step tool calling
- `AI_USE_RESPONSES=false` (default) uses the legacy Chat Completions API path
- Both paths support the same tools and produce identical NDJSON output format

**Timeouts & Limits:**
- Overall request timeout: `AI_TOTAL_TIMEOUT_MS` (default: 60 seconds)
- Individual query timeout: `AI_QUERY_TIMEOUT_MS` (default: 5 seconds)
- Query result limit: 100 rows (enforced by SQL Guard)
- Chat endpoint never hangs due to missing timeouts (abort signals enforced)

**Error Handling:**
- SQL Guard errors return safe, user-friendly messages (no SQL internals leaked)
- Database errors are sanitized in streamed NDJSON (generic error messages to users, detailed errors in logs)
- Tool loop termination reasons logged: `max_tool_calls`, `timeout`, `openai_error`, `validation_error`, `completed`, `aborted`
- Users can retry failed queries via retry button in chat UI

**Logging & Observability:**
- Structured logging for each tool call: request_id, hashed orgId (not raw), tool name, normalized SQL (truncated + PII redacted), allow/deny reason, rows returned, duration_ms
- Loop termination events logged with reason and context
- No raw PII or raw orgId in logs (orgId hashed, SQL PII patterns redacted)

### Recommended CI Environment Variables

```bash
# Enable mock DB for deterministic CI behavior (no ClickHouse required)
CORSO_USE_MOCK_DB=true

# Use legacy Chat Completions API (stable) or Responses API (if stabilized)
AI_USE_RESPONSES=false  # or true if Responses API is stabilized

# Optional: Set mock org ID for consistent test behavior
CORSO_MOCK_ORG_ID=demo-org

# Optional: Adjust timeouts for CI environment
AI_QUERY_TIMEOUT_MS=5000
AI_TOTAL_TIMEOUT_MS=60000
AI_MAX_TOOL_CALLS=3
```

## Notes
- **Resource vs AI Split**: Entity routes handle data operations; AI routes handle intelligence features.
- **Runtime Strategy**: Most routes use Node.js runtime for consistency and ClickHouse integration capabilities. CSP report uses Edge for low-latency responses.
- **Public Endpoints**: CSP report and insights search are public (no authentication required).
- **Deprecated Endpoints**: 
  - `/api/v1/entity/[entity]/export` — **PERMANENTLY REMOVED** (returns 410 Gone as permanent stub)
    - **Removed**: 2025-01-15 (permanently removed during entity grid migration)
    - **Status**: Kept as permanent stub to provide guidance to external clients
    - **Alternative**: Use `POST /api/v1/entity/{entity}/query` for data access
    - **Example**: `POST /api/v1/entity/projects/query` with pagination/filtering

## Related Documentation

- [API Overview](../README.md) - Complete API documentation
- [OpenAPI Specification](../../../api/README.md) - OpenAPI specification and types
- [Security Standards](../../../.cursor/rules/security-standards.mdc) - Security patterns
- [Internal API](../internal/README.md) - Internal endpoints documentation

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active
