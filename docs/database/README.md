---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# Database Documentation

Last updated: 2026-01-07

This folder contains comprehensive database documentation for the Corso platform, covering ClickHouse and PostgreSQL (Supabase) configuration, security, performance, backups, and operational procedures.

## 📋 Overview

Corso uses two primary databases:
- **ClickHouse**: Analytics data warehouse for high-performance queries
- **PostgreSQL (Supabase)**: Primary application database for transactional data

## 📚 Documentation

### Security & Hardening

- [ClickHouse Hardening](clickhouse-hardening.md) - Comprehensive security guide for ClickHouse database configuration, query validation, connection security, tenant isolation, and hardening practices

### Performance & Monitoring

- [Performance Monitoring](performance-monitoring.md) - Database performance monitoring, query optimization, and troubleshooting guides

### Operations & Maintenance

- [Backup & Recovery Strategy](backup-and-recovery.md) - Comprehensive guide for database backups, recovery procedures, and disaster recovery planning for Supabase (PostgreSQL) and ClickHouse
- [Materialized View Refresh Strategy](materialized-view-refresh-strategy.md) - Guide for managing materialized view refreshes, monitoring health, and ensuring data freshness
- [Audit Log Retention Policy](audit-log-retention-policy.md) - Audit log retention policy, growth management, and cleanup procedures

## 🔗 Related Documentation

### Architecture
- [Warehouse Queries](../architecture/warehouse-queries.md) - Warehouse query patterns and architecture
- [Runtime Boundaries](../architecture/runtime-boundaries.md) - Edge vs Node.js runtime considerations

### Analytics
- [Warehouse Query Hooks](../analytics/warehouse-query-hooks.md) - React hooks for ClickHouse queries
- [ClickHouse Recommendations](../analytics/clickhouse-recommendations.md) - Best practices for ClickHouse queries

### Security
- [Security Implementation](../security/security-implementation.md) - Security patterns and implementation
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Canonical security rules

### Operations
- [Operational Guide](../operations/operational-guide.md) - General operational procedures
- [Monitoring Guide](../monitoring/monitoring-guide.md) - System monitoring and observability

## 🎯 Key Topics

### ClickHouse
- Security hardening and query validation
- Performance optimization and monitoring
- Materialized view management
- Tenant isolation and data security

### PostgreSQL (Supabase)
- Backup and recovery procedures
- Audit log retention and cleanup
- Performance monitoring
- Operational maintenance

---

**See Also**: [Documentation Index](../README.md)
