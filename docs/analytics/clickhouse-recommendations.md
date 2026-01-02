---
title: "Analytics"
description: "Documentation and resources for documentation functionality. Located in analytics/."
last_updated: "2026-01-02"
category: "documentation"
status: "draft"
---
## Overview

This guide captures proven patterns to keep ClickHouse queries fast as data grows. It complements
runtime guards in `@/lib/server/clickhouse` and analytics wrappers in `@/lib/dashboard/analytics`
that enforce tenant scope and LIMITs.

**Critical Security Note:** All analytics queries are automatically scoped to the requesting user's organization to prevent cross-tenant data access. This tenant isolation is enforced at multiple layers:

- SQL validation rejects queries without proper `org_id` filtering
- Runtime org filtering is automatically injected if missing
- Export endpoints enforce the same tenant isolation guarantees

## Golden rules

- Always scope by organization and date range.
  - Our query wrappers enforce `org_id` and normalize with a LIMIT.
  - **Security Guarantee**: All queries are automatically scoped to the user's organization. Manual `org_id` filtering is recommended but not required.
  - Prefer `PREWHERE org_id = ? AND event_date BETWEEN ? AND ?` for early pruning.
- Avoid `SELECT *`. Project only needed columns to reduce I/O.
- Push down filters that match the sorting key; avoid functions on filtered columns when possible.
- Prefer pre-aggregations (projections or materialized views) for heavy, repetitive aggregations.

## Table design (MergeTree family)

- Engine: `MergeTree` (or `ReplacingMergeTree`/`SummingMergeTree`/`AggregatingMergeTree` where appropriate).
- Partitioning: monthly by date for time-series (good balance of partitions vs. pruning).
  - `PARTITION BY toYYYYMM(event_date)`
- Sorting key: match your most selective filters, then group/aggregate keys.
  - Example: `ORDER BY (org_id, event_date, project_type)`
- Types: use `LowCardinality(String)` for dimensions with limited unique values.
- Nullable: prefer sentinel values if sensible; otherwise `Nullable(T)` is fine.

Example DDL template (adjust names/types):

```sql
CREATE TABLE IF NOT EXISTS events
(
  org_id String,
  event_date Date,
  event_time DateTime,
  project_type LowCardinality(String),
  amount Float64,
  -- other columns...
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (org_id, event_date, project_type)
SETTINGS index_granularity = 8192;
```bash

## Data skipping indexes

ClickHouse automatically uses primary key (sorting key) for range pruning. You can add secondary data-skipping indexes for additional pruning on non-key columns.

Common patterns:

- Bloom filter for textual dimensions:

```sql
ALTER TABLE events
ADD INDEX idx_project_type_bloom project_type TYPE bloom_filter GRANULARITY 64;
```bash

- Token bloom for substring/contains searches:

```sql
ALTER TABLE events
ADD INDEX idx_notes_tokenbf notes TYPE tokenbf_v1(1024, 3, 0) GRANULARITY 64;
```bash

Indexes help only if queries routinely filter on those columns. Validate with real workload before adding many.

## Projections (ClickHouse-side pre-aggregation)

Projections store pre-aggregated data inside the same table and are maintained automatically.

Example: daily counts per org and project type

```sql
ALTER TABLE events
ADD PROJECTION proj_daily_counts
(
  SELECT org_id, event_date AS day, project_type, count() AS cnt
  GROUP BY org_id, day, project_type
);

-- Optional: explicitly use the projection in a query
SELECT day, project_type, sum(cnt) AS total
FROM events PROJECTION proj_daily_counts
WHERE org_id = {org_id:String}
  AND day BETWEEN {start:Date} AND {end:Date}
GROUP BY day, project_type
ORDER BY day;
```bash

Notes:

- Projections are chosen automatically when beneficial; forcing via `PROJECTION` is optional.
- Great for frequently used aggregations (daily/week/monthly counts, group-bys over low-cardinality dims).

## Materialized views (CH) vs Postgres MVs

- ClickHouse: for complex or multi-table aggregations, consider a materialized view targeting `SummingMergeTree`/`AggregatingMergeTree`.
- Postgres: we added `mv_projects_daily_counts` for app-side rollups. Use CH projections when your data lives in ClickHouse and needs low-latency aggregates.

## Query patterns and settings

- Use `PREWHERE` for early selective filters (typically `org_id` and `event_date`).
- Avoid functions on filtered columns in the WHERE/PREWHERE if it prevents pruning.
- Cap result size with `LIMIT` and sort only when required.
- Favor approximate functions (e.g., `uniqExact` vs `uniq` tradeoffs) based on accuracy needs.
- Consider session settings when needed (per user/query):
  - `max_execution_time` (ms)
  - `max_threads`
  - `max_result_rows`, `result_overflow_mode='break'`

Example (conceptual; via client settings):

```sql
SET max_execution_time = 2000;
SELECT ... FROM events PREWHERE org_id = 'org_123' AND event_date BETWEEN '2025-08-01' AND '2025-08-13' LIMIT 1000;
```bash

## Retention and storage

- TTL for time-based deletion or tiering:

```sql
ALTER TABLE events
MODIFY TTL event_date + INTERVAL 365 DAY DELETE;
```bash

- For very large tables, consider S3-backed `MergeTree` or tiered storage policies.

## Joins and dimensions

- Prefer denormalization for small dimensions used on hot paths.
- For medium/small lookup tables, consider dictionaries for fast key-value access.
- When joining, keep the large fact table on the left and join selective small tables on the right; ensure join keys are well-typed and selective.

## Monitoring slow queries

Built-in logs to identify hotspots:

```sql
-- Top slow queries in the last hour
SELECT
  query_id,
  user,
  round(elapsed, 3) AS seconds,
  read_rows, read_bytes,
  query
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 1 HOUR
ORDER BY seconds DESC
LIMIT 50;
```bash

What to watch:

- Full scans across many partitions (missing `org_id`/date filter)
- Large `read_rows`/`read_bytes` relative to returned rows
- Frequent queries hitting application-enforced LIMIT (candidates for pre-aggregation)

## Application integration notes

- Our wrappers enforce tenant filters and default LIMITs:
  - `lib/dashboard/analytics/query.ts` (LIMIT 1000)
  - `lib/server/clickhouse/client.ts` (normalize with LIMIT; strict validation)
- **Multi-tenant Security**: All endpoints automatically enforce tenant isolation:
  - SQL validation requires `org_id` filters or injects them automatically
  - Export endpoints use the same SafeSqlBuilder with tenant scoping
  - Zero-trust approach prevents cross-tenant data access
- The wrappers now emit warnings when queries exceed ~1s or hit the LIMIT, helping you spot heavy scans.
- Prefer Redis-cached `queryWarehouse` for repeatable analytics queries.

## Checklist for a new large table

- Define engine/partition/sorting key: `MergeTree / toYYYYMM(date) / (org_id, date, <dim>)`
- Use `LowCardinality(String)` for common dimensions
- Add projections for your top N aggregations (daily counts etc.)
- Add data-skipping indexes only when filters actually use those columns
- Add PREWHERE in query templates for `org_id` + date
- Add TTL to keep storage predictable
- Add basic monitoring dashboards over `system.query_log`

## Appendix: Example end-to-end

```sql
-- 1) Table
CREATE TABLE IF NOT EXISTS events
(
  org_id String,
  event_date Date,
  event_time DateTime,
  project_type LowCardinality(String),
  amount Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (org_id, event_date, project_type);

-- 2) Projection
ALTER TABLE events ADD PROJECTION proj_daily_counts
(
  SELECT org_id, event_date AS day, project_type, count() AS cnt
  GROUP BY org_id, day, project_type
);

-- 3) Helpful skipping index (if queries often filter by project_type)
ALTER TABLE events ADD INDEX idx_project_type_bloom project_type TYPE bloom_filter GRANULARITY 64;

-- 4) Query using pre-aggregation
SELECT day, project_type, sum(cnt) AS total
FROM events PROJECTION proj_daily_counts
PREWHERE org_id = {org_id:String} AND day BETWEEN {start:Date} AND {end:Date}
GROUP BY day, project_type
ORDER BY day
LIMIT 1000;
```
