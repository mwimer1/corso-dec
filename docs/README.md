---
title: "Docs"
last_updated: "2026-01-07"
category: "documentation"
status: "active"
description: "Documentation and resources for documentation functionality."
---
# Documentation Index

Last updated: 2026-01-07

Welcome to the Corso documentation. Below is an index of available guides and references organized by topic.

## 📚 Quick Navigation

- [Development Guides](#development-guides-docsdevelopment) - Setup, coding standards, and workflows
- [CI/CD & Quality](#cicd--quality-docsquality) - Testing, CI pipelines, and quality gates
- [Architecture & Design](#architecture--design) - System architecture and design patterns
- [Security](#security-docssecurity) - Authentication, authorization, and security patterns
- [Database](#database-docsdatabase) - ClickHouse and PostgreSQL documentation
- [Analytics](#analytics-docsanalytics) - Data warehouse queries and ClickHouse best practices
- [TypeScript](#typescript-docstypescript) - Type safety, configuration, and best practices
- [Architecture Decisions](#architecture-decisions-docsdecisions) - Architecture Decision Records (ADRs)
- [References](#references-docsreference) - Environment variables, API specs, and cheat sheets
- [Audit Reports](#audit-reports-docsaudits) - Production readiness and other audits
- [Feature Design Notes](#feature-design-notes-docsfeature-notes) - Feature implementation plans
- [Maintenance](#maintenance-docsmaintenance) - Upgrade guides and dependency management

---

## Development Guides (`docs/development/`)

Developer setup, coding standards, workflows, and best practices.

### Getting Started
- [Development Environment Setup](development/setup-guide.md) - Complete setup guide including environment configuration, prerequisites, and workflow setup
- [Dashboard Feature Setup](development/dashboard-setup.md) - Additional setup steps for dashboard module development
- [Multi-Branch Workflow Quick Start](development/multi-branch-quick-start.md) - Quick reference for working with git worktrees
- [Multi-Branch Workflow Audit](development/multi-branch-workflow-audit.md) - Detailed guide for multi-branch development

### Standards & Conventions
- [Coding Standards](development/coding-standards.md) - Code style, TypeScript conventions, and best practices
- [Commit Conventions](development/commit-conventions.md) - Git commit message guidelines and format
- [Route Configuration](development/route-config.md) - Next.js route configuration patterns

### Verification & Troubleshooting
- [Dashboard Auth Verification](development/dashboard-auth-verification.md) - Authentication verification guide
- [ESLint Runtime Boundaries](development/eslint-runtime-boundaries.md) - Runtime boundary linting rules
- [Fix Bracket Paths Verification](development/fix-bracket-paths-verification.md) - Bracketed-paste mode setup guide

## CI/CD & Quality (`docs/quality/`)

Continuous integration, quality gates, testing strategies, and QA processes.

### CI/CD Pipeline
- [CI/CD Pipeline](quality/ci-pipeline.md) - Overview of CI/CD workflows and quality gates
- [CI Workflows](quality/ci-workflows.md) - Detailed workflow documentation
- [CI/CD Enhancement Guide](quality/cicd-enhancement-guide.md) - Guide for enhancing CI/CD processes

### Quality Gates
- [Quality Gates](quality/quality-gates.md) - PR quality gate requirements and validation steps
- [Quality Gates Baseline (Jan 2026)](audits/baselines/quality-gates-2026-01.md) - *(Archived)* Snapshot of quality gate results as of January 2026

### Testing
- [Testing Guide](quality/testing-guide.md) - How to write and run tests (unit, integration, e2e)
- [Testing Strategy](quality/testing-strategy.md) - Testing approach and coverage requirements

### Audit & Analysis
- [Reference Sweep Results](quality/reference-sweep-results.md) - Code reference analysis results
- [Final Parity Sweep (Jan 2026)](quality/final-parity-sweep-2026-01.md) - CI/CD parity audit results

## Architecture & Design

### Technical Architecture (`docs/architecture/`)

System architecture, design patterns, and technical decisions.

### Core Architecture
- [Architecture Overview](architecture/architecture-overview.md) - High-level system architecture and design patterns
- [Actions vs API Routes](architecture/actions-vs-api-routes.md) - When to use Next.js Server Actions vs API routes
- [Runtime Boundaries](architecture/runtime-boundaries.md) - Edge vs Node.js runtime considerations
- [Barrels Policy](architecture/barrels-policy.md) - Import/export organization and barrel file conventions

### Security & Performance
- [Authentication](architecture/auth.md) - Authentication architecture and patterns
- [Request Storm Check Explained](architecture/request-storm-check-explained.md) - Rate limiting and abuse prevention

### Codebase Structure
- [Codebase Structure](architecture/codebase-structure.md) - Directory layout and module organization
- [Import Patterns](architecture/import-patterns.md) - Import conventions and best practices
- [Warehouse Queries](architecture/warehouse-queries.md) - Warehouse query patterns and hooks
- [Warehouse Query Hooks](analytics/warehouse-query-hooks.md) - React hooks for warehouse queries with advanced patterns and enforcement rules
- [Repository Directory Structure](architecture/repository-directory-structure.md) - *(Generated)* Complete directory structure reference
- [App Directory Structure](architecture/app-directory-structure.md) - Next.js app directory structure

### Design & UI Standards (`docs/architecture-design/`)

Design decisions, UI standards, and architectural design patterns.

- [Architecture Design & UI Standards](architecture-design/README.md) - Design decisions and UI standards documentation
- [Domain-Driven Architecture](architecture-design/domain-driven-architecture.md) - Domain-driven design guidelines and patterns
- [UI Design Guide](architecture-design/ui-design-guide.md) - UI design principles and component standards
- [Dashboard UI Standards](architecture-design/dashboard-ui-standards.md) - Dashboard UI standards and conventions

## References (`docs/reference/`)

Environment variables, API specifications, dependency information, and quick references.

### Configuration
- [Environment Variables](reference/env.md) - Comprehensive list of configuration environment variables
- [Dependencies](reference/deps.md) - Dependency information and management
- [API Specification](reference/api-specification.md) - API endpoint documentation

### Tools & Configuration
- [Edge Runtime](reference/edge-runtime.md) - Edge runtime configuration and limitations
- [Spectral Example](reference/spectral.example.yaml) - OpenAPI linting configuration example

## Audit Reports (`docs/audits/`)

Time-bound audit reports, baseline snapshots, and remediation trackers.

### Production Readiness
- [2026-01 Production Readiness Audit](audits/2026-01-production-readiness/remediation-tracker.md) - Findings and remediation tracker for production readiness audit

### Archived Reports
- [Sprint 4 QA Documentation](audits/sprint-4-qa/) - *(Archived)* Sprint 4 QA checklists and PR summary
- [Refactoring Reports](audits/refactoring/) - *(Archived)* Historical refactoring batch reports

## Feature Design Notes (`docs/feature-notes/`)

Design documents and implementation plans for major features.

- [Global Quick Search Design Sprint 8](feature-notes/global-quick-search-design-sprint-8.md) - Quick search feature design
- [Pricing Page Implementation Summary](feature-notes/pricing-page-implementation-summary.md) - Pricing page feature summary

## Maintenance (`docs/maintenance/`)

Upgrade guides, dependency management, and maintenance procedures.

### Upgrades
- [Next.js 16 Upgrade Guide](maintenance/nextjs-16-upgrade-guide.md) - Migration guide for Next.js 16 upgrade

### Dependencies
- [Dependency Management Guide](maintenance/dependency-management-guide.md) - How external dependencies are managed
- [Maintenance Plan](maintenance/maintenance-plan.md) - Dependency maintenance strategy

## Development Tooling Resources

### Development Tools (in `docs/development/`)
- [Development Tools](development/development-tools.md) - Overview of development scripts and tooling
- [Documentation Automation](development/docs-automation.md) - Automated documentation validation and generation
- [Unused Exports Audit & Remediation](development/unused-exports.md) - System for identifying and remediating unused exports

## Security (`docs/security/`)

Comprehensive security documentation covering authentication, authorization, implementation patterns, and policies.

- [Security Documentation](security/README.md) - Complete security documentation index
- [Security Policy](security/security-policy.md) - Security vulnerability reporting and response process
- [Security Implementation](security/security-implementation.md) - Comprehensive security implementation guide
- [Authentication Patterns](security/auth-patterns.md) - Clerk integration patterns and security practices
- [Dependency Policy](security/dependency-policy.md) - Dependency security management and audit policies

## Database (`docs/database/`)

Comprehensive database documentation for ClickHouse and PostgreSQL (Supabase).

- [Database Documentation](database/README.md) - Complete database documentation index
- [ClickHouse Hardening](database/clickhouse-hardening.md) - Security hardening for ClickHouse
- [Performance Monitoring](database/performance-monitoring.md) - Database performance monitoring and optimization
- [Backup & Recovery Strategy](database/backup-and-recovery.md) - Backup and recovery procedures
- [Materialized View Refresh Strategy](database/materialized-view-refresh-strategy.md) - Materialized view management
- [Audit Log Retention Policy](database/audit-log-retention-policy.md) - Audit log retention and cleanup

## Analytics (`docs/analytics/`)

Documentation for analytics functionality, data warehouse queries, and ClickHouse best practices.

- [Analytics Documentation](analytics/README.md) - Complete analytics documentation index
- [Warehouse Query Hooks](analytics/warehouse-query-hooks.md) - React hooks for ClickHouse queries with React Query integration
- [ClickHouse Recommendations](analytics/clickhouse-recommendations.md) - Best practices for keeping ClickHouse queries fast

## TypeScript (`docs/typescript/`)

Comprehensive TypeScript documentation covering type safety, best practices, and configuration.

- [TypeScript Documentation](typescript/README.md) - Complete TypeScript documentation index
- [TypeScript Guide](typescript/typescript-guide.md) - Complete guide to TypeScript usage, type safety, and best practices
- [Type Safety Audit](typescript/type-safety-audit.md) - Current state of type safety and areas for improvement

## Architecture Decisions (`docs/decisions/`)

Architecture Decision Records (ADRs) documenting key technical and architectural decisions.

- [Architecture Decision Records](decisions/README.md) - ADR documentation and format guidelines
- [Route Theme Duplication (KEEP)](decisions/route-theme-duplication.md) - Decision to keep duplicate `_theme.tsx` files

## AI Documentation (`docs/ai/`)

Extended documentation for AI agent rules and development standards.

- [AI Documentation](ai/README.md) - Extended AI rules documentation index
- [Security Standards (Extended)](ai/rules/security-standards.md) - Extended security patterns and examples
- [Component Design System (Extended)](ai/rules/component-design-system.md) - Extended component architecture patterns
- [Dashboard Components (Extended)](ai/rules/dashboard-components.md) - Extended dashboard component patterns
- [Entity Grid Architecture (Extended)](ai/rules/entity-grid-architecture.md) - Extended entity grid patterns
- [OpenAPI Vendor Extensions (Extended)](ai/rules/openapi-vendor-extensions.md) - Extended OpenAPI RBAC patterns
- [Analytics Tracking (Extended)](ai/rules/analytics-tracking.md) - Extended analytics tracking patterns

## Additional Resources

### Other Topics
- [API Design Guide](api/api-design-guide.md) - API development patterns and best practices
- [Content Authoring Guide](content/insights-authoring-guide.md) - Guide for authoring content/insights
- [Error Handling Guide](error-handling/error-handling-guide.md) - Error handling patterns
- [Performance Optimization Guide](performance/performance-optimization-guide.md) - Performance best practices
- [Production Readiness Checklist](production/production-readiness-checklist.md) - Production deployment checklist

---

## Documentation Standards

When contributing documentation:
- Follow [Documentation Standards](../.cursor/rules/documentation-standards.mdc) for formatting and structure
- Use kebab-case for filenames (all lowercase, hyphen-separated)
- Include frontmatter with `title`, `last_updated`, `category`, and `status` fields
- Link to this index when creating new major sections
- Keep documentation focused and avoid duplication (link rather than repeat)

For detailed documentation contribution guidelines, see [Contributing to Documentation](CONTRIBUTING-DOCS.md).

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active
