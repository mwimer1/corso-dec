---
title: "V1"
description: "Documentation and resources for documentation functionality. Located in api/v1/."
last_updated: "2025-12-15"
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

## Routes (7)

| Domain | Method | Path | Purpose | Runtime | Rate limit |
|--------|--------|------|---------|---------|------------|
| Entity | POST | `/api/v1/entity/[entity]/query` | Entity queries (pagination/filtering/sorting) | Node.js | 60/min |
| Entity | GET | `/api/v1/entity/[entity]/export` | Entity exports (CSV/XLSX) | Node.js | 30/min |
| Entity | GET | `/api/v1/entity/[entity]` | Entity base operations | Node.js | 60/min |
| AI | POST | `/api/v1/ai/generate-chart` | AI chart configuration | Node.js | 30/min |
| AI | POST | `/api/v1/ai/generate-sql` | AI SQL generation | Node.js | 30/min |
| User | POST | `/api/v1/user` | User profile operations | Node.js | 30/min |

## Notes
- **Resource vs AI Split**: Entity routes handle data operations; AI routes handle intelligence features.
- **Runtime Strategy**: All routes use Node.js runtime for consistency and ClickHouse integration capabilities.
- **Removed non-existent billing/ and subscription/ mentions**.
