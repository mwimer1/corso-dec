---
title: "Database"
description: "Documentation and resources for documentation functionality. Located in database/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
---
# ClickHouse Security Hardening

> **Comprehensive security guide for ClickHouse database configuration, query validation, and hardening practices**

## 📋 Overview

This document outlines the security hardening measures implemented for ClickHouse, including query validation, connection security, tenant isolation, and best practices for secure ClickHouse operations.

## 🛡️ Security Architecture

### Multi-Layer Security

The ClickHouse security implementation uses multiple layers of protection:

1. **Connection Security**: TLS encryption, read-only user, connection pooling limits
2. **Query Validation**: SQL injection prevention, dangerous pattern detection
3. **Parameter Sanitization**: Input validation and sanitization
4. **Tenant Isolation**: Automatic org_id filtering and validation
5. **Resource Limits**: Query timeouts, result size limits, connection limits

## 🔐 Connection Security

### TLS Encryption

**Current Configuration:**
- All connections use HTTPS/TLS (port 8443)
- Certificate validation enabled
- No plaintext connections allowed

**Configuration:**
```typescript
// lib/integrations/clickhouse/server.ts
const config: ClickHouseClientConfigOptions = {
  host: env.CLICKHOUSE_URL!, // HTTPS URL
  username: env.CLICKHOUSE_READONLY_USER!,
  password: env.CLICKHOUSE_PASSWORD!,
  database: env.CLICKHOUSE_DATABASE!,
  request_timeout: env.CLICKHOUSE_TIMEOUT ?? 30_000,
  max_open_connections: env.CLICKHOUSE_CONCURRENCY_LIMIT ?? 10,
};
```

### Read-Only User

**Security Principle:** Use least-privilege access model

**Current Implementation:**
- Dedicated read-only user (`CLICKHOUSE_READONLY_USER`)
- No write permissions (INSERT, UPDATE, DELETE, DROP, ALTER)
- No system table access
- No administrative privileges

**Best Practices:**
- Never use admin/root user for application queries
- Rotate credentials regularly
- Use separate users for different environments
- Monitor user activity for anomalies

### Connection Pooling

**Configuration:**
- Maximum open connections: 10 (configurable via `CLICKHOUSE_CONCURRENCY_LIMIT`)
- Request timeout: 30 seconds (configurable via `CLICKHOUSE_TIMEOUT`)
- Singleton client pattern to avoid connection pool exhaustion

**Security Benefits:**
- Prevents connection exhaustion attacks
- Limits resource consumption
- Enables connection monitoring

## 🔍 Query Security

### SQL Injection Prevention

**Multi-Layer Validation:**

1. **Parameter Sanitization:**
```typescript
// lib/integrations/clickhouse/utils.ts
export function sanitizeClickParams(params: Record<string, unknown>): ClickParams {
  // Validates parameter names (alphanumeric + underscore only)
  // Validates parameter values (no dangerous characters)
  // Blocks: <, >, ;, null bytes, SQL comments, script tags
}
```

2. **SQL Pattern Validation:**
```typescript
// lib/integrations/clickhouse/server.ts
// Blocks dangerous patterns:
// - SQL comments (--, /* */)
// - DML/DDL operations (DROP, INSERT, UPDATE, DELETE)
// - UNION injection attempts
// - Script tags
```

3. **Query Type Restriction:**
- Only SELECT queries allowed
- WITH clauses allowed (for CTEs)
- All other query types blocked

### Dangerous Pattern Detection

**Blocked Patterns:**
- `DROP`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE`
- SQL comments: `--`, `/* */`
- UNION operations
- Script tags: `<script>`
- System table access: `system.*`, `information_schema.*`
- Multiple statements: `;` followed by dangerous operations

**Validation Function:**
```typescript
// lib/integrations/database/scope.ts
import { validateSQLScope } from '@/lib/integrations/database/scope';

// Throws SecurityError if validation fails
validateSQLScope(sql: string, expectedOrgId?: string): void
```

### Tenant Isolation

**Automatic Org Filtering:**
- All queries automatically scoped to user's organization
- SQL validation enforces `org_id` filtering
- Runtime injection of org filter if missing

**Security Guarantee:**
- Cross-tenant data access prevented
- Manual `org_id` filtering recommended but not required
- Validation rejects queries without proper tenant scope

## 📊 Resource Limits

### Query Timeouts

**Configuration:**
- Default timeout: 30 seconds (`CLICKHOUSE_TIMEOUT`)
- Configurable per environment
- Prevents long-running queries from consuming resources

**Best Practices:**
- Set appropriate timeouts based on query complexity
- Monitor timeout frequency
- Optimize queries that frequently timeout

### Result Size Limits

**Automatic Limits:**
- Default LIMIT: 1000 rows (via `normalizeSql`)
- Configurable per query
- Prevents large result sets from consuming memory

**Configuration:**
```typescript
// lib/server/shared/query-utils.ts
export function normalizeSql(
  sql: string,
  options?: { limit?: number; ensureFormat?: boolean }
): string
```

### Connection Limits

**Configuration:**
- Maximum connections: 10 (configurable)
- Singleton client pattern
- Connection pool monitoring

## 🚨 Security Monitoring

### Query Logging

**Current Implementation:**
- All queries logged with execution time
- Error logging for failed queries
- Security violation logging

**Log Format:**
```typescript
logger.error('[ClickHouse] Query failed', {
  error: error.message,
  sql: sql.slice(0, 100), // Truncated for security
});
```

### Security Event Tracking

**Tracked Events:**
- SQL injection attempts
- Dangerous pattern detection
- System table access attempts
- Query validation failures
- Parameter sanitization failures

**Recommended Monitoring:**
- Alert on repeated security violations
- Monitor query patterns for anomalies
- Track failed query rates
- Monitor connection pool usage

## 🔄 Backup & Recovery

### ClickHouse Backup Strategy

**Current Status:**
- ClickHouse backups managed separately from Supabase
- Manual backup procedures recommended
- No automated backup system currently configured

**Recommended Approach:**
```bash
# Backup ClickHouse data
clickhouse-client --query "BACKUP DATABASE default TO Disk('backups', 'backup_$(date +%Y%m%d_%H%M%S)')"

# Restore from backup
clickhouse-client --query "RESTORE DATABASE default FROM Disk('backups', 'backup_20251214_120000')"
```

**Backup Frequency:**
- Daily backups for production
- Weekly backups for development/staging
- Retention: 30 days for production, 7 days for development

**See:** [Backup & Recovery Strategy](./backup-and-recovery.md) for detailed procedures

## 📝 Security Best Practices

### Query Development

**✅ DO:**
- Use parameterized queries with `sanitizeClickParams()`
- Always include `org_id` filtering
- Use `PREWHERE` for selective filters
- Limit result sets with `LIMIT`
- Project only needed columns (avoid `SELECT *`)

**❌ DON'T:**
- Construct SQL with string concatenation
- Include user input directly in SQL
- Access system tables
- Use UNION operations
- Include SQL comments in queries

### Parameter Handling

**✅ CORRECT:**
```typescript
const { data } = await clickhouseQuery(
  'SELECT * FROM events WHERE org_id = {orgId:String} AND event_date >= {startDate:Date}',
  {
    orgId: 'org_123',
    startDate: new Date('2025-01-01'),
  }
);
```

**❌ INCORRECT:**
```typescript
// NEVER do this - SQL injection vulnerability
const sql = `SELECT * FROM events WHERE org_id = '${orgId}'`;
const { data } = await clickhouseQuery(sql);
```

### Tenant Isolation Best Practices

**✅ CORRECT:**
```typescript
// Automatic org filtering (recommended)
const { data } = await clickhouseQuery(
  'SELECT * FROM events WHERE event_date >= {startDate:Date}',
  { startDate: new Date('2025-01-01') }
);
// org_id filter automatically injected
```

**✅ ALSO CORRECT:**
```typescript
// Explicit org filtering (also safe)
const { data } = await clickhouseQuery(
  'SELECT * FROM events WHERE org_id = {orgId:String} AND event_date >= {startDate:Date}',
  {
    orgId: 'org_123',
    startDate: new Date('2025-01-01'),
  }
);
```

## 🔧 Configuration

### Environment Variables

**Required:**
- `CLICKHOUSE_URL`: ClickHouse instance URL (HTTPS)
- `CLICKHOUSE_DATABASE`: Database name
- `CLICKHOUSE_READONLY_USER`: Read-only user credentials
- `CLICKHOUSE_PASSWORD`: User password

**Optional:**
- `CLICKHOUSE_TIMEOUT`: Query timeout in milliseconds (default: 30000)
- `CLICKHOUSE_CONCURRENCY_LIMIT`: Max connections (default: 10)
- `CLICKHOUSE_RATE_LIMIT_PER_MIN`: Rate limit per minute (default: 1000)
- `CLICKHOUSE_SLOW_QUERY_MS`: Slow query threshold (default: 5000)

### Security Configuration Checklist

- [ ] TLS/HTTPS enabled for all connections
- [ ] Read-only user configured
- [ ] Strong password policy enforced
- [ ] Connection limits configured
- [ ] Query timeouts set appropriately
- [ ] Result size limits enforced
- [ ] SQL validation enabled
- [ ] Parameter sanitization enabled
- [ ] Tenant isolation enforced
- [ ] Security logging enabled

## 🚨 Security Incident Response

### Detecting Security Violations

**Indicators:**
- Repeated SQL injection attempts
- Unusual query patterns
- System table access attempts
- Parameter sanitization failures
- Query validation failures

### Response Procedures

1. **Immediate Actions:**
   - Review security logs
   - Identify source of violations
   - Block suspicious IPs/users if needed
   - Escalate to security team

2. **Investigation:**
   - Analyze query patterns
   - Review parameter values
   - Check for data exfiltration
   - Review access logs

3. **Remediation:**
   - Update security rules if needed
   - Rotate credentials if compromised
   - Patch vulnerabilities
   - Update documentation

## 📊 Security Metrics

### Key Metrics to Monitor

- **Security Violations**: Count of blocked queries
- **SQL Injection Attempts**: Pattern detection frequency
- **Query Failures**: Error rate and types
- **Connection Pool Usage**: Peak connections
- **Query Performance**: Execution times
- **Tenant Isolation**: Missing org_id filter frequency

### Monitoring Queries

```sql
-- Security violations (requires application logs)
-- Review application logs for security events

-- Query performance monitoring
SELECT
  query_id,
  user,
  round(elapsed, 3) AS seconds,
  read_rows,
  read_bytes,
  query
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 1 HOUR
ORDER BY seconds DESC
LIMIT 50;
```

## 🔗 Related Documentation

- [ClickHouse Performance Recommendations](../analytics/clickhouse-recommendations.md) - Performance optimization
- [Backup & Recovery Strategy](./backup-and-recovery.md) - Backup procedures
- [Performance Monitoring](./performance-monitoring.md) - Query performance monitoring
- [Security Standards](../../.cursor/rules/security-standards.mdc) - General security practices

## 🚀 Quick Reference

### Secure Query Execution

```typescript
import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';

// ✅ CORRECT: Parameterized query
const { data } = await clickhouseQuery(
  'SELECT * FROM events WHERE org_id = {orgId:String} AND event_date >= {date:Date}',
  {
    orgId: 'org_123',
    date: new Date('2025-01-01'),
  }
);
```

### Security Validation

```typescript
import { validateSQLScope } from '@/lib/integrations/database/scope';

try {
  validateSQLScope(sql, orgId);
  // SQL is valid and tenant-scoped
} catch (error) {
  // SecurityError thrown if validation fails
  return http.badRequest(
    error instanceof Error ? error.message : 'SQL validation failed',
    { code: 'INVALID_SQL' }
  );
}
```

### Parameter Sanitization

```typescript
import { sanitizeClickParams } from '@/lib/integrations/clickhouse/utils';

const safeParams = sanitizeClickParams({
  orgId: 'org_123',
  date: new Date('2025-01-01'),
});
```

## 📋 Security Checklist

### Pre-Production

- [ ] TLS/HTTPS enabled
- [ ] Read-only user configured
- [ ] Strong passwords set
- [ ] Connection limits configured
- [ ] Query timeouts set
- [ ] SQL validation enabled
- [ ] Parameter sanitization enabled
- [ ] Tenant isolation tested
- [ ] Security logging enabled
- [ ] Backup strategy implemented

### Ongoing Maintenance

- [ ] Review security logs weekly
- [ ] Monitor query patterns monthly
- [ ] Rotate credentials quarterly
- [ ] Review and update security rules
- [ ] Test backup and recovery procedures
- [ ] Update security documentation
