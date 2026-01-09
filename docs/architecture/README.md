---
title: "Architecture"
last_updated: "2026-01-09"
category: "documentation"
status: "draft"
---
# Architecture & Technical Patterns

Last updated: 2026-01-07

This folder contains documentation for **technical architecture, implementation patterns, and key technical decisions**. For design decisions and UI standards, see [`docs/architecture-design/`](../architecture-design/).

## 📋 Purpose

**`docs/architecture/`** focuses on **technical architecture and implementation**:
- System architecture and runtime boundaries
- Codebase structure and organization
- Technical patterns (actions vs API routes, barrels, etc.)
- Implementation details and technical decisions

**`docs/architecture-design/`** focuses on **design decisions and UI standards**:
- Domain-driven design guidelines
- UI design principles and component standards
- Dashboard UI standards and conventions

## 🏗️ Core Architecture

- [Architecture Overview](architecture-overview.md) - High-level system architecture and design patterns
- [Actions vs API Routes](actions-vs-api-routes.md) - When to use Next.js Server Actions vs API routes
- [Runtime Boundaries](runtime-boundaries.md) - Edge vs Node.js runtime considerations
- [Barrels Policy](barrels-policy.md) - Import/export organization and barrel file conventions

## 🔒 Security & Performance

- [Authentication](auth.md) - Authentication architecture and patterns
- [Request Storm Check Explained](request-storm-check-explained.md) - Rate limiting and abuse prevention

## 📁 Codebase Structure

For detailed codebase structure documentation, see:
- [Codebase Structure](codebase-structure.md) - Directory layout and module organization
- [Import Patterns](import-patterns.md) - Import conventions and best practices
- [Warehouse Queries](warehouse-queries.md) - Warehouse query patterns and hooks
- [Repository Directory Structure](repository-directory-structure.md) - *(Generated)* Complete directory structure reference
- [App Directory Structure](app-directory-structure.md) - Next.js app directory structure

---

**See Also**: [Documentation Index](../README.md)
