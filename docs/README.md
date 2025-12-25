---
title: "Documentation Index"
description: "Complete index of Corso platform documentation organized by category and topic."
last_updated: "2025-12-19"
category: "documentation"
status: "stable"
---

# Corso Documentation

Last updated: 2025-12-19

> **Complete documentation index for the Corso platform - data analytics and insights platform**

This directory contains comprehensive documentation covering architecture, development, operations, security, and best practices for the Corso codebase.

## 🚀 Getting Started

**New to Corso?** Start here:
- [Architecture Overview](architecture/architecture-overview.md) - System architecture and design patterns
- [Development Tools & Scripts](tools-scripts/development-tools.md) - Development workflow and commands
- [Setup Guide](development/setup-guide.md) - Development environment setup
- [Codebase Structure](codebase-apis/codebase-structure.md) - Directory organization and conventions

## 📚 Documentation by Category

### 🏗️ Architecture & Design

**Core Architecture:**
- [Architecture Overview](architecture/architecture-overview.md) - System architecture, design patterns, and decisions
- [Domain-Driven Architecture](architecture-design/domain-driven-architecture.md) - Domain organization patterns
- [Runtime Boundaries](architecture/runtime-boundaries.md) - Client/server/edge separation
- [Barrels Policy](architecture/barrels-policy.md) - Import and export patterns
- [Auth Architecture](architecture/auth.md) - Authentication and authorization patterns

**UI & Design:**
- [UI Design Guide](architecture-design/ui-design-guide.md) - Component design system
- [Pattern Library](pattern-library.md) - Reusable UI patterns

### 💻 Development

**Setup & Workflow:**
- [Development Tools & Scripts](tools-scripts/development-tools.md) - Development commands and tooling
- [Setup Guide](development/setup-guide.md) - Environment setup and configuration
- [Coding Standards](development/coding-standards.md) - Code quality and best practices
- [Route Configuration](development/route-config.md) - Next.js route patterns

**Code Organization:**
- [Codebase Structure](codebase-apis/codebase-structure.md) - Directory structure and conventions
- [Import Patterns](codebase-apis/import-patterns.md) - Import rules and patterns
- [Warehouse Queries](codebase-apis/warehouse-queries.md) - Data query patterns

**TypeScript:**
- [TypeScript Guide](typescript/typescript-guide.md) - TypeScript patterns and best practices
- [Type Safety Audit](typescript/type-safety-audit.md) - Type safety analysis

### 🧪 Testing & Quality

- [Testing Strategy](testing-quality/testing-strategy.md) - Testing patterns, coverage, and best practices
- [Quality Gates](cicd-workflow/quality-gates.md) - Quality validation standards
- [Best Practices](best-practices.md) - General development best practices

### 🔐 Security

- [Security Implementation](security/security-implementation.md) - Security architecture and practices
- [Authentication Patterns](security/auth-patterns.md) - Auth implementation details
- [Security Policy](security/security-policy.md) - Vulnerability reporting
- [Dependency Policy](security/dependency-policy.md) - Dependency management and security

### 🚀 Operations & Production

**Operations:**
- [Operational Guide](operations/operational-guide.md) - Deployment, monitoring, and troubleshooting
- [Production Readiness](production/production-readiness-checklist.md) - Pre-deployment checklist
- [Monitoring Guide](monitoring/monitoring-guide.md) - Health checks, metrics, and observability

**Performance:**
- [Performance Optimization](performance/performance-optimization-guide.md) - Performance tuning and optimization

**Database:**
- [Backup & Recovery](database/backup-and-recovery.md) - Database backup strategies
- [ClickHouse Hardening](database/clickhouse-hardening.md) - Security and optimization
- [Performance Monitoring](database/performance-monitoring.md) - Database performance tracking
- [Audit Log Retention](database/audit-log-retention-policy.md) - Log retention policies
- [Materialized View Strategy](database/materialized-view-refresh-strategy.md) - View refresh patterns

### 📊 Data & Analytics

- [Warehouse Query Hooks](analytics/warehouse-query-hooks.md) - React Query patterns for data
- [ClickHouse Recommendations](analytics/clickhouse-recommendations.md) - ClickHouse best practices

### 🔌 API & Integration

- [API Design Guide](api/api-design-guide.md) - API design patterns and standards
- [API Patterns](api-data/api-patterns.md) - API implementation patterns
- [API Specification](references/api-specification.md) - OpenAPI specification reference

### 🛠️ CI/CD & Automation

- [CI/CD Pipeline](cicd-workflow/ci-pipeline.md) - Continuous integration setup
- [CI Workflows](cicd-workflow/ci-workflows.md) - GitHub Actions workflows
- [CI/CD Enhancement Guide](cicd-workflow/cicd-enhancement-guide.md) - Pipeline improvements

### 🚨 Error Handling

- [Error Handling Guide](error-handling/error-handling-guide.md) - Error boundaries, logging, and resilience

### ♿ Accessibility

- [Accessibility Guide](accessibility/accessibility-guide.md) - WCAG compliance and a11y patterns

### 📦 Dependencies & Maintenance

- [Dependency Management](dependencies/dependency-management-guide.md) - Dependency update process
- [Maintenance Plan](dependencies/maintenance-plan.md) - Ongoing maintenance tasks

### 📖 Reference

- [Environment Variables](references/env.md) - Environment configuration reference
- [Dependencies](references/deps.md) - Dependency reference
- [Edge Runtime](reference/edge-runtime.md) - Edge runtime patterns

### 🔍 Audits & Maintenance

**Maintenance Documentation:**
- [Maintenance Audit Implementation](maintenance/MAINTENANCE_AUDIT_IMPLEMENTATION.md)
- [Remaining Action Items](maintenance/REMAINING_ACTION_ITEMS.md)
- [Consolidation Summary](maintenance/CONSOLIDATION_SUMMARY.md)
- [Data Layer Hardening Summary](maintenance/data-layer-hardening-summary.md)
- [P1 Polish Summary](maintenance/p1-polish-summary.md)
- [Refactor Implementation Plan](maintenance/refactor-implementation-plan.md)

**Audit Reports:**
- [AG Grid Implementation Audit](audits/ag-grid-implementation-audit-20250128.md) - Comprehensive AG Grid baseline audit
- [AG Grid Versions Audit](audits/ag-grid-versions-20251012.md) - Version conflict resolution (resolved)
- [Production Audit (Archived)](audits/production-audit-20250115.md)
- [Domain6 Review (Archived)](audits/domain6-review-guide-20250115.md)

### ✅ QA & Verification

Quality assurance checklists and verification guides:
- [Manual Verification Guide](qa/manual-verification-guide.md)
- [Verification Steps](qa/verification-steps.md)
- [Verification Summary](qa/verification-summary.md)
- [Pricing Page QA Checklist](qa/pricing-page-qa-checklist.md)

### 📝 Feature Notes & Design

Feature implementation summaries and design documents:
- [Global Quick Search Design (Sprint 8)](feature-notes/global-quick-search-design-sprint-8.md)
- [Pricing Page Implementation Summary](feature-notes/pricing-page-implementation-summary.md)

### 🏗️ Architecture Notes

Architecture explanations and design decisions:
- [Request Storm Check Explained](architecture/request-storm-check-explained.md)

## 🗺️ Quick Navigation

### By Role

**Developers:**
- [Setup Guide](development/setup-guide.md) → [Coding Standards](development/coding-standards.md) → [Testing Strategy](testing-quality/testing-strategy.md)

**DevOps/Operations:**
- [Operational Guide](operations/operational-guide.md) → [Monitoring Guide](monitoring/monitoring-guide.md) → [Production Readiness](production/production-readiness-checklist.md)

**Security:**
- [Security Implementation](security/security-implementation.md) → [Security Policy](security/security-policy.md) → [Dependency Policy](security/dependency-policy.md)

**Architects:**
- [Architecture Overview](architecture/architecture-overview.md) → [Domain-Driven Architecture](architecture-design/domain-driven-architecture.md) → [Runtime Boundaries](architecture/runtime-boundaries.md)

### By Task

**Setting up development:**
1. [Setup Guide](development/setup-guide.md)
2. [Development Tools](tools-scripts/development-tools.md)
3. [Coding Standards](development/coding-standards.md)

**Adding a new feature:**
1. [Codebase Structure](codebase-apis/codebase-structure.md)
2. [Import Patterns](codebase-apis/import-patterns.md)
3. [Testing Strategy](testing-quality/testing-strategy.md)

**Deploying to production:**
1. [Production Readiness](production/production-readiness-checklist.md)
2. [Operational Guide](operations/operational-guide.md)
3. [Monitoring Guide](monitoring/monitoring-guide.md)

**Optimizing performance:**
1. [Performance Optimization](performance/performance-optimization-guide.md)
2. [Monitoring Guide](monitoring/monitoring-guide.md)
3. [Database Performance](database/performance-monitoring.md)

## 📝 Documentation Standards

All documentation follows these standards:
- **Freshness**: Updated within 90 days (checked via `pnpm docs:stale-check`)
- **Format**: Markdown with frontmatter metadata
- **Structure**: Consistent sections (Overview, Usage, Examples, Related Docs)
- **Cross-links**: Related documentation linked in "Related Documentation" sections
- **Status**: `draft` (in progress) or `stable` (complete and current)

## 🔧 Documentation Maintenance

**Validation:**
```bash
pnpm docs:validate      # Full documentation validation
pnpm docs:links         # Check for broken links
pnpm docs:stale-check   # Check for outdated docs
```

**Updating:**
- Update `last_updated` when making changes
- Set `status: "stable"` when documentation is complete
- Add meaningful `description` in frontmatter
- Cross-link related documentation

## 🔗 External Resources

- **Root README**: [../README.md](../README.md) - Project overview and quick start
- **API Documentation**: [../app/api/README.md](../app/api/README.md) - API routes and endpoints
- **OpenAPI Spec**: [../api/README.md](../api/README.md) - OpenAPI specification

---

**Last Updated**: 2025-12-15  
**Maintained By**: Platform Team  
**Status**: Active
