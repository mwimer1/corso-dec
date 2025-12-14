---
status: "draft"
title: "Codebase Apis"
description: "Documentation and resources for documentation functionality. Located in codebase-apis/."
category: "documentation"
last_updated: "2025-12-14"
---
# Warehouse Queries (Canonical)

This is the canonical reference for warehouse query patterns used across dashboard tables and charts.

## Filter operations (allowlist)
- `eq`, `contains`, `gt`, `lt`, `gte`, `lte`, `in`, `between`, `bool`

## Query rules
- Parameterized queries only (no string interpolation).
- Stable `ORDER BY` and default `LIMIT` applied when none provided.
- Explicit table and column allowlists (projects, companies, addresses).
- Null-safe comparisons; explicit casts for dates/numbers.

## Response shape
```ts
type Paged<T> = { data: T[]; total: number; page: number; pageSize: number };
```

## Chart configuration
- Charts consume the same filtered dataset.
- Prefer cached configs in `lib/dashboard/analytics/chart-config.server.ts`.

> All examples and updates belong here; other docs should link to this page to avoid duplication.

