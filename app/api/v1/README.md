---
title: "V1"
description: "Documentation and resources for documentation functionality. Located in api/v1/."
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
---
# API v1 — Routes, Runtime & Limits

This README reflects the _current_ implementation. If code changes, update this file in the same PR.

## Runtime & Caching
All v1 routes run on **Node.js** for uniform server-side capabilities and DB access:
```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

## Auth & RBAC
- **security**: bearerAuth (see OpenAPI)
- **Member-level RBAC** is enforced
- **Error shape**: `{ success: false, error: { code, message, details? } }`

## Routes (8)

| Domain | Method | Path | Purpose | Runtime | Rate limit |
|--------|--------|------|---------|---------|------------|
| Entity | POST | `/api/v1/entity/[entity]/query` | Entity queries (pagination/filtering/sorting) | Node.js | 60/min |
| Entity | GET | `/api/v1/entity/[entity]/export` | Entity exports (CSV/XLSX) | Node.js | 30/min |
| Entity | GET | `/api/v1/entity/[entity]` | Entity base operations | Node.js | 60/min |
| AI | POST | `/api/v1/ai/chat` | AI chat processing (streaming NDJSON) | Node.js | 30/min |
| AI | POST | `/api/v1/ai/generate-sql` | AI SQL generation | Node.js | 30/min |
| User | POST | `/api/v1/user` | User profile operations | Node.js | 30/min |
| Security | POST | `/api/v1/csp-report` | CSP violation reports | Edge | 100/min |

## AI Chat Endpoint (`/api/v1/ai/chat`)

### Tool Call Limits & Behavior

**Tool Call Limits:**
- Maximum tool calls per conversation turn: **3** (configurable via `AI_MAX_TOOL_CALLS`, default: 3)
- Tool calls include `execute_sql` and `describe_schema` functions
- When limit is reached, the assistant message includes a note explaining the limit was reached

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
- **Runtime Strategy**: All routes use Node.js runtime for consistency and ClickHouse integration capabilities.
- **Removed non-existent billing/ and subscription/ mentions**.
