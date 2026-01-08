-- ClickHouse Schema DDL
-- This file contains the current ClickHouse database schema definitions
-- 
-- IMPORTANT: This file should be updated whenever schema changes are made
-- Generated via: pnpm clickhouse:export-schema
--
-- Last Updated: 2026-01-03

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
-- 2. Run: pnpm clickhouse:export-schema
-- 3. Review and commit the generated schema files
