---
description: "Documentation for analytics, data warehouse queries, and ClickHouse best practices."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Analytics Documentation

Last updated: 2026-01-07

This folder contains documentation for analytics functionality, data warehouse queries, and ClickHouse best practices. Analytics in Corso uses ClickHouse as the data warehouse with React Query integration for client-side data fetching.

## 📋 Overview

Corso's analytics system provides:
- **Secure Data Access**: Tenant-isolated queries with automatic org scoping
- **Performance Optimized**: Query patterns and best practices for ClickHouse
- **Type-Safe Hooks**: React hooks with full TypeScript support
- **Caching Strategy**: Intelligent caching with configurable stale times

## 📚 Documentation

- [Warehouse Query Hooks](warehouse-query-hooks.md) - Comprehensive guide to React hooks for ClickHouse data warehouse queries with React Query integration, type safety, and error handling
- [ClickHouse Recommendations](clickhouse-recommendations.md) - Best practices and proven patterns for keeping ClickHouse queries fast as data grows

## 🔗 Related Documentation

### Architecture & Implementation
- [Warehouse Queries](../architecture/warehouse-queries.md) - Warehouse query patterns and architecture
- [Runtime Boundaries](../architecture/runtime-boundaries.md) - Edge vs Node.js runtime considerations

### Database
- [ClickHouse Hardening](../database/clickhouse-hardening.md) - Security hardening for ClickHouse
- [Performance Monitoring](../database/performance-monitoring.md) - Database performance monitoring

### Rules & Standards
- [Warehouse Query Hooks Rule](../../.cursor/rules/warehouse-query-hooks.mdc) - Canonical rules for warehouse query hooks
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns including SQL safety

## 🎯 Key Concepts

### Tenant Isolation
All analytics queries are automatically scoped to the requesting user's organization:
- SQL validation rejects queries without proper `org_id` filtering
- Runtime org filtering is automatically injected if missing
- Export endpoints enforce the same tenant isolation guarantees

### Query Performance
- Always scope by organization and date range
- Avoid `SELECT *` - project only needed columns
- Push down filters that match the sorting key
- Prefer pre-aggregations for heavy, repetitive aggregations

### React Hooks
- `useWarehouseQuery` - Simple queries with automatic cache keys
- `useWarehouseQueryCached` - Complex queries with custom cache keys
- Full TypeScript support with generic type parameters

---

**See Also**: [Documentation Index](../README.md)
