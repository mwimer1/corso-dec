---
title: "Docs"
last_updated: "2026-01-03"
category: "documentation"
status: "active"
description: "Documentation and resources for documentation functionality."
---
# Corso Documentation

Last updated: 2026-01-03

Welcome to the Corso platform documentation. This directory contains comprehensive guides, references, and procedures for developing, maintaining, and operating the Corso application.

## 📚 Documentation Structure

### 🏗️ Architecture & Design
- **[Architecture Overview](./architecture/architecture-overview.md)** - System architecture and technology stack
- **[Domain-Driven Architecture](./architecture-design/domain-driven-architecture.md)** - Domain organization and patterns
- **[UI Design Guide](./architecture-design/ui-design-guide.md)** - Component design patterns
- **[Runtime Boundaries](./architecture/runtime-boundaries.md)** - Edge vs Node.js runtime patterns

### 🚀 Development
- **[Setup Guide](./development/setup-guide.md)** - Development environment setup
- **[Coding Standards](./development/coding-standards.md)** - Code quality and style guidelines
- **[Route Configuration](./development/route-config.md)** - Next.js route configuration patterns
- **[Dashboard Setup](./development/dashboard-setup.md)** - Dashboard development setup

### 🔌 API & Data
- **[API Design Guide](./api/api-design-guide.md)** - Complete API patterns, OpenAPI workflow, and implementation guide
- **[Warehouse Queries](./codebase-apis/warehouse-queries.md)** - Canonical warehouse query patterns
- **[Warehouse Query Hooks](./analytics/warehouse-query-hooks.md)** - React hook usage for warehouse queries
- **[Import Patterns](./codebase-apis/import-patterns.md)** - Import guidelines and patterns

### 🏛️ Codebase Structure
- **[Codebase Structure](./codebase-apis/codebase-structure.md)** - Directory organization and conventions
- **[Repository Directory Structure](./codebase/repository-directory-structure.md)** - Complete auto-generated directory tree
- **[App Directory Structure](./codebase/app-directory-structure.md)** - Next.js App Router organization

### 🔐 Security
- **[Security Standards](./security/README.md)** - Security implementation guide
- **[Auth Patterns](./security/auth-patterns.md)** - Authentication and authorization patterns
- **[Dependency Policy](./security/dependency-policy.md)** - Dependency security policies

### 🧪 Testing & Quality
- **[Testing Guide](./testing-quality/testing-guide.md)** - Testing patterns and examples
- **[Testing Strategy](./testing-quality/testing-strategy.md)** - Overall testing approach
- **[QA Documentation](./qa/README.md)** - Manual verification guides and checklists

### 📊 Operations
- **[Production Readiness](./production/production-readiness-checklist.md)** - Pre-deployment checklist
- **[Monitoring Guide](./monitoring/monitoring-guide.md)** - Monitoring and observability
- **[Operational Guide](./operations/operational-guide.md)** - Day-to-day operations

### 🗄️ Database
- **[ClickHouse Recommendations](./analytics/clickhouse-recommendations.md)** - ClickHouse optimization
- **[Performance Monitoring](./database/performance-monitoring.md)** - Database performance tracking
- **[Backup and Recovery](./database/backup-and-recovery.md)** - Backup procedures

### 📖 References
- **[API Specification](./references/api-specification.md)** - OpenAPI specification details
- **[Environment Variables](./references/env.md)** - Environment configuration reference
- **[Dependencies](./references/deps.md)** - Dependency management reference

## 🎯 Quick Start

### For New Developers
1. Read [Setup Guide](./development/setup-guide.md) to configure your environment
2. Review [Codebase Structure](./codebase-apis/codebase-structure.md) to understand organization
3. Check [Coding Standards](./development/coding-standards.md) for style guidelines
4. See [API Design Guide](./api/api-design-guide.md) for API development patterns

### For API Development
1. Review [API Design Guide](./api/api-design-guide.md) for complete patterns
2. Check [Security Standards](./security/README.md) for authentication and authorization
3. See [Warehouse Queries](./codebase-apis/warehouse-queries.md) for data query patterns

### For Architecture Decisions
1. Review [Architecture Overview](./architecture/architecture-overview.md)
2. Check [Domain-Driven Architecture](./architecture-design/domain-driven-architecture.md)
3. See [Runtime Boundaries](./architecture/runtime-boundaries.md) for Edge vs Node.js guidance

## 📝 Documentation Standards

All documentation follows these standards:
- **Consistency**: Standard sections and templates
- **Accuracy**: Examples match current code patterns
- **Completeness**: All public APIs documented
- **Maintainability**: Links to single sources of truth

See [Documentation Standards](../.cursor/rules/documentation-standards.mdc) for detailed guidelines.

## 🔗 Related Resources

- [Cursor Rules](../.cursor/rules/) - Development rules and standards
- [API OpenAPI Spec](../api/openapi.yml) - OpenAPI specification source
- [Component Library](../components/README.md) - Component documentation
