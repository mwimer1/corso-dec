-- ClickHouse Schema DDL
-- This file contains the current ClickHouse database schema definitions
-- 
-- IMPORTANT: This file should be updated whenever schema changes are made
-- Use scripts/clickhouse/export-schema.ts to regenerate this file from a live instance
--
-- Last Updated: 2026-01-03
-- Export Command: pnpm tsx scripts/clickhouse/export-schema.ts

-- NOTE: This is a template file. Run the export script to populate with actual schema.
-- The export script connects to ClickHouse and generates the current schema definitions.

-- Example table structure (replace with actual schema):
-- CREATE TABLE IF NOT EXISTS events
-- (
--   org_id String,
--   event_date Date,
--   event_time DateTime,
--   project_type LowCardinality(String),
--   amount Float64
-- )
-- ENGINE = MergeTree
-- PARTITION BY toYYYYMM(event_date)
-- ORDER BY (org_id, event_date, project_type);

-- To export current schema:
-- 1. Ensure ClickHouse environment variables are set
-- 2. Run: pnpm tsx scripts/clickhouse/export-schema.ts
-- 3. Review and commit the generated schema files
