---
title: "Database"
description: "Documentation and resources for documentation functionality. Located in database/."
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# Audit Log Retention Policy

> **Comprehensive guide for managing audit log growth, retention policies, and cleanup procedures**

## 📋 Overview

This document outlines the audit log retention policy, growth management, and cleanup procedures for the Corso platform. The audit log tracks all changes to critical tables (projects, watchlists, etc.) for compliance and security auditing.

## 🎯 Retention Policy

### Default Retention

- **Retention Period**: 90 days (configurable)
- **Cleanup Schedule**: Daily (configurable: daily, weekly, monthly)
- **Archive Before Delete**: Disabled by default (can be enabled for compliance)
- **Automatic Cleanup**: Manual execution (can be scheduled via cron/GitHub Actions)

### Retention Configuration

The retention policy is managed via the `audit_log_retention_config` table:

```sql
-- View current retention configuration
SELECT * FROM public.audit_log_retention_config;

-- Update retention period to 180 days
SELECT * FROM public.update_audit_log_retention(180);

-- Update retention with archiving enabled
SELECT * FROM public.update_audit_log_retention(
  180,  -- retention_days
  true, -- archive_before_delete
  'weekly' -- cleanup_schedule
);
```

## 📊 Monitoring Audit Log Growth

### Get Audit Log Statistics

```sql
-- Get comprehensive audit log statistics
SELECT * FROM public.get_audit_log_stats();
```

**Returns:**
- `total_entries`: Total number of audit log entries
- `entries_older_than_retention`: Entries that can be deleted
- `oldest_entry`: Oldest audit log entry timestamp
- `newest_entry`: Newest audit log entry timestamp
- `entries_by_table`: JSON object with entry counts by table
- `entries_by_operation`: JSON object with entry counts by operation (INSERT, UPDATE, DELETE)
- `estimated_size_mb`: Estimated table size in megabytes
- `retention_days`: Current retention period in days

### Monitor Growth Rate

```sql
-- Get growth rate for last 7 days
SELECT * FROM public.get_audit_log_growth_rate(7);

-- Get growth rate for last 30 days
SELECT * FROM public.get_audit_log_growth_rate(30);
```

**Returns:**
- `period_days`: Number of days analyzed
- `entries_added`: Number of entries added in the period
- `entries_per_day`: Average entries added per day
- `estimated_growth_per_month`: Projected entries per month
- `current_total`: Current total entries
- `projected_size_mb_in_30_days`: Projected table size in 30 days

### Growth Analysis Queries

```sql
-- Entries by table (last 30 days)
SELECT 
  table_name,
  COUNT(*) as entry_count,
  COUNT(*) FILTER (WHERE op = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE op = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE op = 'DELETE') as deletes
FROM public.audit_log
WHERE changed_at >= NOW() - INTERVAL '30 days'
GROUP BY table_name
ORDER BY entry_count DESC;

-- Entries by operation type
SELECT 
  op,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM public.audit_log
WHERE changed_at >= NOW() - INTERVAL '30 days'
GROUP BY op
ORDER BY count DESC;

-- Daily entry count (last 30 days)
SELECT 
  DATE(changed_at) as date,
  COUNT(*) as entry_count
FROM public.audit_log
WHERE changed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(changed_at)
ORDER BY date DESC;
```

## 🧹 Cleanup Procedures

### Manual Cleanup

```sql
-- Dry run: See how many entries would be deleted
SELECT * FROM public.cleanup_audit_log(NULL, true);

-- Cleanup with default retention (90 days)
SELECT * FROM public.cleanup_audit_log();

-- Cleanup with custom retention (60 days)
SELECT * FROM public.cleanup_audit_log(60);

-- Cleanup with dry run to preview
SELECT * FROM public.cleanup_audit_log(60, true);
```

**Returns:**
- `deleted_count`: Number of entries deleted (or would be deleted in dry run)
- `retention_days_used`: Retention period used for cleanup
- `cutoff_date`: Date before which entries were deleted
- `dry_run`: Whether this was a dry run

### Automated Cleanup

**Recommended Approach:** Use GitHub Actions scheduled workflow or external cron service.

**Example GitHub Actions Workflow:**
```yaml
name: Cleanup Audit Log
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Audit Log
        run: |
          psql $DATABASE_URL -c "SELECT * FROM public.cleanup_audit_log();"
```

**Example Cron Job:**
```bash
# Daily cleanup at 2 AM
0 2 * * * psql $DATABASE_URL -c "SELECT * FROM public.cleanup_audit_log();"
```

### Cleanup Best Practices

1. **Always Dry Run First**: Test cleanup with `dry_run = true` before actual deletion
2. **Monitor Growth**: Check growth rate weekly to adjust retention if needed
3. **Schedule During Low Traffic**: Run cleanup during off-peak hours
4. **Verify After Cleanup**: Check statistics after cleanup to ensure expected results
5. **Archive if Required**: Enable archiving for compliance requirements

## 📈 Growth Management

### Estimating Storage Requirements

**Storage Calculation:**
- Average entry size: ~106 bytes
- Formula: `(entry_count * 106) / 1024 / 1024` = size in MB

**Example:**
```sql
-- Estimate storage for 1 million entries
SELECT (1000000 * 106 / 1024.0 / 1024.0)::NUMERIC(10, 2) as size_mb;
-- Result: ~101.07 MB
```

### Growth Projections

```sql
-- Project growth for next 30 days
SELECT 
  current_total,
  entries_per_day,
  estimated_growth_per_month,
  projected_size_mb_in_30_days
FROM public.get_audit_log_growth_rate(30);
```

### Managing Growth

**If Growth is High:**
1. Review which tables generate most audit entries
2. Consider reducing retention period for non-critical tables
3. Implement table-specific retention policies (future enhancement)
4. Enable archiving for long-term storage
5. Optimize triggers to reduce unnecessary logging

**If Growth is Low:**
1. Consider increasing retention period for compliance
2. Enable archiving for historical data
3. Review if additional tables should be audited

## 🔐 Compliance & Archiving

### Archiving (Future Implementation)

The `archive_audit_log()` function is a placeholder for future archive implementation. When enabled, it will:

1. Export audit entries to external storage (S3, etc.)
2. Compress archived data
3. Store archive metadata
4. Delete entries only after successful archiving

**Enable Archiving:**
```sql
-- Update config to enable archiving
SELECT * FROM public.update_audit_log_retention(
  90,   -- retention_days
  true, -- archive_before_delete
  'daily' -- cleanup_schedule
);
```

### Compliance Requirements

**Common Retention Requirements:**
- **GDPR**: Minimum 1 year for data processing records
- **SOX**: 7 years for financial records
- **HIPAA**: 6 years for healthcare records
- **General Business**: 90 days (default)

**Adjust Retention Based on Requirements:**
```sql
-- Set retention to 1 year for GDPR compliance
SELECT * FROM public.update_audit_log_retention(365);

-- Set retention to 7 years for SOX compliance
SELECT * FROM public.update_audit_log_retention(2555);
```

## 🚨 Alerting & Monitoring

### Alert Thresholds

**Recommended Alert Thresholds:**
- **Table Size**: Alert if > 1 GB
- **Growth Rate**: Alert if > 10,000 entries/day
- **Retention Coverage**: Alert if < 80% of entries within retention period
- **Cleanup Failures**: Alert if cleanup fails

### Monitoring Queries

```sql
-- Check if cleanup is needed (entries older than retention)
SELECT 
  COUNT(*) as entries_to_cleanup,
  MIN(changed_at) as oldest_entry,
  MAX(changed_at) as newest_entry
FROM public.audit_log
WHERE changed_at < (
  SELECT NOW() - (retention_days || ' days')::INTERVAL
  FROM public.audit_log_retention_config
  LIMIT 1
);

-- Check last cleanup status
SELECT 
  last_cleanup_at,
  last_cleanup_deleted_count,
  retention_days,
  cleanup_schedule
FROM public.audit_log_retention_config;
```

## 📝 Maintenance Procedures

### Weekly Maintenance

- [ ] Review audit log statistics
- [ ] Check growth rate
- [ ] Verify cleanup is running
- [ ] Review retention configuration

### Monthly Maintenance

- [ ] Review retention policy
- [ ] Adjust retention if needed
- [ ] Check storage usage
- [ ] Review compliance requirements

### Quarterly Maintenance

- [ ] Full audit log review
- [ ] Update retention policy if needed
- [ ] Review archiving requirements
- [ ] Optimize indexes if needed

## 🔧 Troubleshooting

### Cleanup Not Running

**Symptoms:**
- `last_cleanup_at` is old or NULL
- Entries older than retention period still exist

**Resolution:**
```sql
-- Check retention configuration
SELECT * FROM public.audit_log_retention_config;

-- Manually run cleanup
SELECT * FROM public.cleanup_audit_log();

-- Verify cleanup
SELECT COUNT(*) FROM public.audit_log
WHERE changed_at < (
  SELECT NOW() - (retention_days || ' days')::INTERVAL
  FROM public.audit_log_retention_config
  LIMIT 1
);
```

### High Growth Rate

**Symptoms:**
- Growth rate > 10,000 entries/day
- Table size growing rapidly

**Resolution:**
1. Identify high-volume tables:
```sql
SELECT table_name, COUNT(*) as count
FROM public.audit_log
WHERE changed_at >= NOW() - INTERVAL '7 days'
GROUP BY table_name
ORDER BY count DESC;
```

2. Review if all tables need auditing
3. Consider reducing retention for high-volume tables
4. Optimize triggers if possible

### Storage Issues

**Symptoms:**
- Table size > 1 GB
- Database storage warnings

**Resolution:**
1. Reduce retention period temporarily:
```sql
SELECT * FROM public.update_audit_log_retention(30);
```

2. Run immediate cleanup:
```sql
SELECT * FROM public.cleanup_audit_log(30);
```

3. Enable archiving for long-term storage
4. Review and optimize indexes

## 🔗 Related Documentation

- [Supabase Database Configuration](https://github.com/mwimer1/corso-dec/blob/main/supabase/README.md) - Database setup and migrations
- [Backup & Recovery Strategy](./backup-and-recovery.md) - Backup procedures
- [Performance Monitoring](./performance-monitoring.md) - Query performance monitoring
- [Security Implementation](../security/security-implementation.md) - Security procedures

## 📊 Retention Configuration Schema

### `audit_log_retention_config` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `retention_days` | INTEGER | Retention period in days (default: 90) |
| `archive_before_delete` | BOOLEAN | Archive before deletion (default: false) |
| `archive_location` | TEXT | Archive storage location (if enabled) |
| `cleanup_schedule` | TEXT | Cleanup schedule: daily, weekly, monthly |
| `last_cleanup_at` | TIMESTAMPTZ | When last cleanup ran |
| `last_cleanup_deleted_count` | INTEGER | Number of entries deleted in last cleanup |
| `created_at` | TIMESTAMPTZ | When config was created |
| `updated_at` | TIMESTAMPTZ | When config was last updated |

## 🚀 Quick Reference

### Get Statistics

```sql
-- Overall statistics
SELECT * FROM public.get_audit_log_stats();

-- Growth rate
SELECT * FROM public.get_audit_log_growth_rate(7);
```

### Cleanup

```sql
-- Dry run
SELECT * FROM public.cleanup_audit_log(NULL, true);

-- Actual cleanup
SELECT * FROM public.cleanup_audit_log();
```

### Update Retention

```sql
-- Update to 180 days
SELECT * FROM public.update_audit_log_retention(180);
```
