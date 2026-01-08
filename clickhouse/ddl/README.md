# ClickHouse Schema DDL Files

This directory contains ClickHouse database schema definitions (DDL files) for version control and schema management.

## Purpose

- **Version Control**: Track ClickHouse schema changes over time
- **Documentation**: Document table structures, indexes, and configurations
- **Recovery**: Enable schema recreation from DDL files
- **Migration**: Support schema evolution and deployment

## Schema Structure

ClickHouse tables follow these patterns:

### Table Design Principles

- **Engine**: `MergeTree` (or variants: `ReplacingMergeTree`, `SummingMergeTree`, `AggregatingMergeTree`)
- **Partitioning**: Monthly by date for time-series data (`PARTITION BY toYYYYMM(event_date)`)
- **Sorting Key**: Match most selective filters (`ORDER BY (org_id, event_date, project_type)`)
- **Types**: Use `LowCardinality(String)` for dimensions with limited unique values
- **Nullable**: Prefer sentinel values when sensible; otherwise `Nullable(T)`

### Security & Tenant Isolation

- All tables include `org_id` column for tenant isolation
- Queries are automatically scoped to user's organization
- SQL validation enforces `org_id` filtering

## Files

- `schema.sql` - Main schema definitions (tables, engines, partitioning)
- `indexes.sql` - Index definitions (if applicable)
- `README.md` - This file

## Exporting Schema

Use the export script to generate DDL files from a live ClickHouse instance:

```bash
pnpm tsx scripts/clickhouse/export-schema.ts
```

This script will:
1. Connect to ClickHouse using environment variables
2. Export table definitions to `schema.sql`
3. Export index definitions to `indexes.sql`
4. Validate schema consistency

## Environment Variables

The export script requires:
- `CLICKHOUSE_URL` - ClickHouse instance URL (HTTPS)
- `CLICKHOUSE_DATABASE` - Database name
- `CLICKHOUSE_READONLY_USER` - Read-only user credentials
- `CLICKHOUSE_PASSWORD` - User password

## Example Table DDL

```sql
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
```

## Best Practices

1. **Always include `org_id`** in table definitions for tenant isolation
2. **Use appropriate partitioning** for time-series data
3. **Optimize sorting keys** for common query patterns
4. **Use `LowCardinality`** for dimensions with limited cardinality
5. **Document table purpose** in comments

## Related Documentation

- [ClickHouse Hardening Guide](../../docs/database/clickhouse-hardening.md)
- [ClickHouse Recommendations](../../docs/analytics/clickhouse-recommendations.md)
