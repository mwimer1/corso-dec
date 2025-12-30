---
status: "draft"
last_updated: "2025-12-29"
category: "documentation"
---
# Materialized View Refresh Strategy

> **Comprehensive guide for managing materialized view refreshes, monitoring health, and ensuring data freshness**

## 📋 Overview

Materialized views provide pre-aggregated data for improved query performance. This document outlines the refresh strategy, monitoring, and maintenance procedures for all materialized views in the Corso platform.

## 🎯 Current Materialized Views

### `mv_projects_daily_counts`

**Purpose:** Pre-aggregates daily project counts per organization and status for analytics queries.

**Definition:**
```sql
SELECT
  org_id,
  date_trunc('day', created_at)::date AS day,
  status,
  count(*)::bigint AS project_count
FROM public.projects
GROUP BY org_id, day, status
```

**Refresh Frequency:** Hourly (60 minutes)

**Dependencies:**
- Base table: `public.projects`
- Requires unique index: `ux_mv_projects_daily_counts_org_day_status`

## 🔄 Refresh Strategy

### Refresh Methods

#### 1. Manual Refresh (Development/Testing)

```sql
-- Refresh specific materialized view
SELECT * FROM public.refresh_mv_projects_daily_counts();

-- Refresh all materialized views
SELECT * FROM public.refresh_all_materialized_views();
```

#### 2. Scheduled Refresh (Production)

**Recommended Approach:** Use GitHub Actions scheduled workflow or external cron service.

**Refresh Schedule:**
- `mv_projects_daily_counts`: Every 60 minutes (hourly)

**Example GitHub Actions Workflow:**
```yaml
name: Refresh Materialized Views
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  refresh-mvs:
    runs-on: ubuntu-latest
    steps:
      - name: Refresh Materialized Views
        run: |
          # Call Supabase API or use psql to execute refresh
          psql $DATABASE_URL -c "SELECT * FROM public.refresh_all_materialized_views();"
```

### Refresh Types

#### Concurrent Refresh (Recommended)
- **Advantage:** Non-blocking, allows queries during refresh
- **Requirement:** Unique index on materialized view
- **Usage:** `REFRESH MATERIALIZED VIEW CONCURRENTLY`

#### Standard Refresh
- **Advantage:** Faster, no index requirement
- **Disadvantage:** Blocks queries during refresh
- **Usage:** `REFRESH MATERIALIZED VIEW`

**Current Implementation:** All refreshes use concurrent mode for zero-downtime.

## 📊 Monitoring & Health Checks

### Check Refresh Health

```sql
-- Check health status of all materialized views
SELECT * FROM public.check_mv_refresh_health();
```

**Health Criteria:**
- ✅ Last refresh status = 'success'
- ✅ Last refresh within 24 hours
- ✅ Next scheduled refresh not overdue

### Get Refresh Statistics

```sql
-- Get refresh statistics
SELECT * FROM public.get_mv_refresh_stats();
```

**Metrics:**
- Total refresh count
- Average refresh duration
- Last refresh timestamp
- Refresh frequency

### Refresh Status Table

```sql
-- View refresh status
SELECT 
  matview_name,
  last_refresh_status,
  last_refresh_completed_at,
  next_scheduled_refresh_at,
  refresh_count
FROM public.mv_refresh_status;
```

## 🚨 Alerting & Troubleshooting

### Common Issues

#### 1. Refresh Failed

**Symptoms:**
- `last_refresh_status = 'failed'`
- `last_refresh_error` contains error message

**Resolution:**
```sql
-- Check error details
SELECT matview_name, last_refresh_error, last_refresh_completed_at
FROM public.mv_refresh_status
WHERE last_refresh_status = 'failed';

-- Retry refresh
SELECT * FROM public.refresh_mv_projects_daily_counts();
```

#### 2. Refresh Overdue

**Symptoms:**
- `next_scheduled_refresh_at < NOW()`
- `is_overdue = true` in health check

**Resolution:**
```sql
-- Check overdue views
SELECT * FROM public.check_mv_refresh_health()
WHERE is_overdue = true;

-- Manually trigger refresh
SELECT * FROM public.refresh_all_materialized_views();
```

#### 3. Stale Data

**Symptoms:**
- `refresh_age_minutes > refresh_frequency_minutes * 2`
- Queries return outdated results

**Resolution:**
- Verify refresh function is executing
- Check for errors in `mv_refresh_status`
- Manually trigger refresh if needed

## 📝 Best Practices

### Refresh Frequency Guidelines

| Materialized View | Recommended Frequency | Rationale |
|-------------------|----------------------|-----------|
| `mv_projects_daily_counts` | Hourly (60 min) | Daily aggregation, acceptable 1-hour lag |

### When to Refresh

1. **Scheduled:** Regular intervals based on data update frequency
2. **After Data Loads:** After bulk imports or ETL processes
3. **On Demand:** When fresh data is immediately required
4. **Error Recovery:** After fixing refresh failures

### Performance Considerations

- **Concurrent Refresh:** Use for production to avoid blocking queries
- **Refresh Timing:** Schedule during low-traffic periods when possible
- **Monitor Duration:** Track refresh duration to detect performance issues
- **Index Maintenance:** Ensure unique indexes exist for concurrent refresh

## 🔧 Maintenance Procedures

### Adding New Materialized Views

1. **Create Materialized View:**
```sql
CREATE MATERIALIZED VIEW public.mv_new_view AS
SELECT ...;
```

2. **Create Unique Index (for concurrent refresh):**
```sql
CREATE UNIQUE INDEX ux_mv_new_view_key 
ON public.mv_new_view(key_column);
```

3. **Initialize Refresh Status:**
```sql
INSERT INTO public.mv_refresh_status (
  matview_name,
  refresh_frequency_minutes,
  next_scheduled_refresh_at
)
VALUES (
  'mv_new_view',
  60,  -- Refresh frequency in minutes
  NOW() + INTERVAL '1 hour'
);
```

4. **Create Refresh Function:**
```sql
CREATE OR REPLACE FUNCTION public.refresh_mv_new_view()
RETURNS TABLE(success BOOLEAN, duration_ms INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.refresh_materialized_view('mv_new_view', true);
END;
$$;
```

### Updating Refresh Frequency

```sql
UPDATE public.mv_refresh_status
SET 
  refresh_frequency_minutes = 30,  -- Change to 30 minutes
  next_scheduled_refresh_at = NOW() + INTERVAL '30 minutes'
WHERE matview_name = 'mv_projects_daily_counts';
```

### Removing Materialized Views

1. **Remove Refresh Status:**
```sql
DELETE FROM public.mv_refresh_status
WHERE matview_name = 'mv_old_view';
```

2. **Drop Materialized View:**
```sql
DROP MATERIALIZED VIEW IF EXISTS public.mv_old_view;
```

## 🔗 Related Documentation

- [Supabase Database Configuration](https://github.com/mwimer1/corso-dec/blob/main/supabase/README.md) - Database setup and migrations
- [Performance Optimization Guide](../performance/performance-optimization-guide.md) - Query optimization
- [Analytics Best Practices](../analytics/clickhouse-recommendations.md) - Analytics patterns

## 📊 Refresh Status Schema

### `mv_refresh_status` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `matview_name` | TEXT | Materialized view name (unique) |
| `last_refresh_started_at` | TIMESTAMPTZ | When last refresh started |
| `last_refresh_completed_at` | TIMESTAMPTZ | When last refresh completed |
| `last_refresh_duration_ms` | INTEGER | Refresh duration in milliseconds |
| `last_refresh_status` | TEXT | 'success', 'failed', or 'in_progress' |
| `last_refresh_error` | TEXT | Error message if refresh failed |
| `refresh_count` | BIGINT | Total number of refreshes |
| `next_scheduled_refresh_at` | TIMESTAMPTZ | When next refresh is due |
| `refresh_frequency_minutes` | INTEGER | Refresh frequency in minutes |
| `created_at` | TIMESTAMPTZ | When record was created |
| `updated_at` | TIMESTAMPTZ | When record was last updated |
