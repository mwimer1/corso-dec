---
title: Database
description: >-
  Documentation and resources for documentation functionality. Located in
  database/.
last_updated: '2025-12-14'
category: documentation
status: draft
---
# Database Performance Monitoring

> **Comprehensive guide for monitoring database query performance, detecting slow queries, and optimizing database operations**

## 📋 Overview

This document outlines the performance monitoring infrastructure for Supabase database queries, including slow query detection, performance metrics collection, and optimization strategies.

## 🎯 Performance Monitoring Features

### Core Capabilities

- **Query Performance Tracking**: Automatic tracking of query execution times
- **Slow Query Detection**: Automatic detection of queries exceeding threshold (default: 100ms)
- **Performance Metrics**: Collection of execution time, row counts, and error rates
- **Performance Statistics**: Aggregate statistics (p50, p95, p99, averages)
- **Table-Level Metrics**: Performance statistics grouped by table
- **Error Tracking**: Automatic tracking of query failures

## 🔧 Usage

### Basic Query Monitoring

```typescript
import { monitorQuery } from '@/lib/server/db/performance-monitor';
import { withTenantClient } from '@/lib/server/db';

// Monitor a single query
const { result, metrics } = await monitorQuery(
  async () => {
    return await withTenantClient(req, async (client) => {
      return await client.from('projects').select('*');
    });
  },
  {
    operation: 'fetch_projects',
    userId: 'user_123',
    orgId: 'org_456',
    queryType: 'select',
    tableName: 'projects',
  }
);

// Check if query was slow
if (metrics.isSlow) {
  console.warn(`Slow query detected: ${metrics.executionTimeMs}ms`);
}
```

### Custom Configuration

```typescript
import { monitorQuery } from '@/lib/server/db/performance-monitor';

// Custom slow query threshold (200ms instead of default 100ms)
const { result, metrics } = await monitorQuery(
  async () => client.from('projects').select('*'),
  {
    operation: 'fetch_projects',
    userId: 'user_123',
    orgId: 'org_456',
  },
  {
    slowQueryThresholdMs: 200,
    logAllQueries: true, // Log all queries, not just slow ones
    trackMetrics: true, // Track metrics in database
  }
);
```

### Performance Statistics

```sql
-- Get overall performance statistics (last hour)
SELECT * FROM public.get_query_performance_stats(60);

-- Get slow queries (last hour, top 100)
SELECT * FROM public.get_slow_queries(100, 60);

-- Get performance statistics by table (last hour)
SELECT * FROM public.get_table_performance_stats(60);
```

## 📊 Performance Metrics

### Metrics Collected

| Metric | Description |
|--------|-------------|
| `executionTimeMs` | Query execution time in milliseconds |
| `isSlow` | Whether query exceeded slow query threshold |
| `operation` | Operation name/identifier |
| `userId` | User ID (if available) |
| `orgId` | Organization ID (if available) |
| `queryType` | Query type (select, insert, update, delete, etc.) |
| `tableName` | Table name (if applicable) |
| `rowCount` | Number of rows affected/returned |
| `error` | Error message (if query failed) |

### Statistics Function Output

The `get_query_performance_stats()` function returns:

- **total_queries**: Total number of queries in time window
- **slow_queries**: Number of slow queries
- **avg_execution_time_ms**: Average execution time
- **p95_execution_time_ms**: 95th percentile execution time
- **p99_execution_time_ms**: 99th percentile execution time
- **error_count**: Number of failed queries
- **error_rate**: Error rate as percentage

## 🚨 Slow Query Detection

### Default Threshold

- **Default Threshold**: 100ms
- **Configurable**: Can be adjusted per query or globally
- **Automatic Logging**: Slow queries are automatically logged with `warn` level

### Identifying Slow Queries

```sql
-- Get slow queries from last hour
SELECT 
  operation,
  query_type,
  table_name,
  execution_time_ms,
  row_count,
  created_at
FROM public.get_slow_queries(100, 60)
ORDER BY execution_time_ms DESC;
```

### Common Causes of Slow Queries

1. **Missing Indexes**: Queries filtering on unindexed columns
2. **Large Result Sets**: Queries returning too many rows
3. **Complex Joins**: Queries with multiple joins or subqueries
4. **Full Table Scans**: Queries that scan entire tables
5. **Lock Contention**: Queries waiting for locks

## 📈 Performance Optimization

### Query Optimization Checklist

- [ ] Add indexes for frequently filtered columns
- [ ] Use pagination for large result sets
- [ ] Optimize JOIN operations
- [ ] Avoid SELECT * (project only needed columns)
- [ ] Use appropriate WHERE clauses
- [ ] Monitor query execution plans

### Index Optimization

```sql
-- Check existing indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM projects WHERE org_id = 'org_123';
```

### Query Performance Best Practices

1. **Use Indexes**: Ensure frequently queried columns are indexed
2. **Limit Results**: Use LIMIT clauses for large datasets
3. **Avoid N+1 Queries**: Batch related queries when possible
4. **Use Connection Pooling**: Leverage Supabase connection pooling
5. **Monitor Regularly**: Review slow queries weekly

## 🔍 Monitoring & Alerting

### Performance Monitoring Queries

```sql
-- Overall performance stats (last 24 hours)
SELECT * FROM public.get_query_performance_stats(1440);

-- Slow queries by table (last 24 hours)
SELECT 
  table_name,
  COUNT(*) as slow_query_count,
  AVG(execution_time_ms) as avg_time_ms,
  MAX(execution_time_ms) as max_time_ms
FROM public.query_performance_metrics
WHERE is_slow = true
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY table_name
ORDER BY slow_query_count DESC;

-- Error rate by operation (last 24 hours)
SELECT 
  operation,
  COUNT(*) as total_queries,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count,
  ROUND(
    COUNT(*) FILTER (WHERE error_message IS NOT NULL)::NUMERIC / 
    COUNT(*)::NUMERIC * 100, 
    2
  ) as error_rate_percent
FROM public.query_performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY operation
ORDER BY error_rate_percent DESC;
```

### Alerting Thresholds

**Recommended Alert Thresholds:**
- **Slow Query Rate**: Alert if > 10% of queries are slow
- **Error Rate**: Alert if > 1% of queries fail
- **P95 Execution Time**: Alert if > 500ms
- **P99 Execution Time**: Alert if > 1000ms

## 🧹 Maintenance

### Retention Policy

Performance metrics are retained for **30 days** by default. Clean up old metrics:

```sql
-- Clean up metrics older than 30 days
SELECT public.cleanup_old_performance_metrics(30);

-- Clean up metrics older than 7 days (more aggressive)
SELECT public.cleanup_old_performance_metrics(7);
```

### Automated Cleanup

Set up a scheduled job to clean up old metrics:

```sql
-- Example: Clean up daily (run via cron or scheduled job)
SELECT public.cleanup_old_performance_metrics(30);
```

## 📝 Integration Examples

### API Route with Performance Monitoring

```typescript
import { monitorQuery } from '@/lib/server/db/performance-monitor';
import { withTenantClient } from '@/lib/server/db';
import { http } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { result, metrics } = await monitorQuery(
    async () => {
      return await withTenantClient(req, async (client) => {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .limit(100);
        
        if (error) throw error;
        return data;
      });
    },
    {
      operation: 'api_get_projects',
      queryType: 'select',
      tableName: 'projects',
    }
  );

  // Log slow queries
  if (metrics.isSlow) {
    logger.warn('[API] Slow query in GET /api/projects', metrics);
  }

  return http.ok(result);
}
```

### Service Function with Performance Monitoring

```typescript
import { monitorQuery } from '@/lib/server/db/performance-monitor';
import { withTenantClient } from '@/lib/server/db';

export async function getProjectsByOrg(orgId: string) {
  const { result, metrics } = await monitorQuery(
    async () => {
      return await withTenantClient(undefined, async (client) => {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .eq('org_id', orgId);
        
        if (error) throw error;
        return data;
      });
    },
    {
      operation: 'get_projects_by_org',
      orgId,
      queryType: 'select',
      tableName: 'projects',
    },
    {
      slowQueryThresholdMs: 200, // Custom threshold for this operation
    }
  );

  return result;
}
```

## 🔗 Related Documentation

- [Supabase Database Configuration](../supabase/README.md) - Database setup and migrations
- [Backup & Recovery Strategy](./backup-and-recovery.md) - Backup procedures
- [Materialized View Refresh Strategy](./materialized-view-refresh-strategy.md) - MV refresh procedures
- [Performance Optimization Guide](../performance/performance-optimization-guide.md) - General performance optimization

## 📊 Performance Metrics Schema

### `query_performance_metrics` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `operation` | TEXT | Operation name/identifier |
| `query_type` | TEXT | Query type (select, insert, update, delete) |
| `table_name` | TEXT | Table name |
| `execution_time_ms` | INTEGER | Execution time in milliseconds |
| `row_count` | INTEGER | Number of rows affected/returned |
| `user_id` | UUID | User ID (if available) |
| `org_id` | TEXT | Organization ID (if available) |
| `is_slow` | BOOLEAN | Whether query exceeded threshold |
| `error_message` | TEXT | Error message (if query failed) |
| `created_at` | TIMESTAMPTZ | When metric was recorded |

## 🚀 Quick Reference

### Monitor Query

```typescript
const { result, metrics } = await monitorQuery(
  async () => client.from('table').select('*'),
  { operation: 'fetch_data', userId: 'user_123', orgId: 'org_456' },
  { slowQueryThresholdMs: 100 }
);
```

### Get Performance Stats

```sql
-- Last hour
SELECT * FROM public.get_query_performance_stats(60);

-- Last 24 hours
SELECT * FROM public.get_query_performance_stats(1440);
```

### Get Slow Queries

```sql
-- Top 100 slow queries from last hour
SELECT * FROM public.get_slow_queries(100, 60);
```

### Cleanup Old Metrics

```sql
-- Remove metrics older than 30 days
SELECT public.cleanup_old_performance_metrics(30);
```
