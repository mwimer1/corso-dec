---
title: "Corso"
description: "Next.js monorepo for Corso platform - data analytics and insights platform with AI-powered SQL generation and visualization."
last_updated: "2025-12-15"
category: "project"
---

# Corso

> **Modern data analytics platform built with Next.js 15, TypeScript, and ClickHouse**

Corso is a comprehensive data analytics and insights platform that provides AI-powered SQL generation, interactive data visualization, and secure multi-tenant data warehouse access. Built with Next.js 15 App Router, TypeScript, and modern web technologies.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >=20.19.4 <25
- **pnpm**: >=10.17.1
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd corso-code

# Install dependencies
pnpm install

# Verify required tools
pnpm run verify:ai-tools

# Set up git hooks and branch configuration
pnpm run setup:branch

# Validate environment variables
pnpm validate:env
```

### Development

```bash
# Start development server
pnpm dev

# Run type checking (fast feedback)
pnpm typecheck

# Run quality gates locally
pnpm quality:local
```

The application will be available at `http://localhost:3000`.

## 📚 Documentation

### Getting Started
- [Architecture Overview](docs/architecture/architecture-overview.md) - System architecture and design patterns
- [Development Tools & Scripts](docs/tools-scripts/development-tools.md) - Development workflow and commands
- [Codebase Structure](docs/codebase-apis/codebase-structure.md) - Directory organization and conventions

### Core Guides
- [API Documentation](app/api/README.md) - API routes and endpoints
- [OpenAPI Specification](api/README.md) - API specification and tooling
- [Testing Strategy](docs/testing-quality/testing-strategy.md) - Testing patterns and best practices
- [Security Standards](.cursor/rules/security-standards.mdc) - Security practices and patterns

### Operations
- [Operational Guide](docs/operations/operational-guide.md) - Deployment and day-to-day operations
- [Production Readiness](docs/production/production-readiness-checklist.md) - Production deployment checklist
- [Monitoring Guide](docs/monitoring/monitoring-guide.md) - Application monitoring and observability

### Full Documentation Index
See [docs/README.md](docs/README.md) for the complete documentation index.

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.9.3 (strict mode)
- **Authentication**: Clerk v6.36.2
- **Database**:
  - ClickHouse (analytics/data warehouse)
  - Supabase (relational data)
- **Package Manager**: pnpm 10.17.1
- **Testing**: Vitest 3.2.4

## 📁 Project Structure

```
corso-code/
├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/             # Authentication routes
│   ├── (marketing)/        # Public marketing pages
│   ├── (protected)/        # Authenticated application
│   └── api/                # API routes (versioned under /api/v1/)
├── components/             # React components (UI library)
│   ├── ui/                 # Atomic design system
│   ├── dashboard/          # Dashboard-specific components
│   └── marketing/          # Marketing components
├── lib/                    # Business logic, utilities, configurations
│   ├── api/                # API utilities (Edge-safe)
│   ├── server/             # Server-only utilities
│   └── shared/             # Shared utilities (client-safe)
├── docs/                   # Documentation
├── api/                    # OpenAPI specifications
├── scripts/                # Development and maintenance scripts
└── tests/                  # Test files and utilities
```

For detailed structure, see [Codebase Structure](docs/codebase-apis/codebase-structure.md).

## 🔧 Common Commands

### Development Commands
```bash
pnpm dev                    # Start development server
pnpm typecheck              # TypeScript validation (fast)
pnpm lint                   # ESLint validation
pnpm test                   # Run test suite
```

### Quality Gates
```bash
pnpm quality:local          # Full local validation
pnpm quality:ci              # CI-grade validation
```

### Documentation
```bash
pnpm docs:links             # Validate documentation links
pnpm docs:validate          # Documentation quality checks
```

### Maintenance
```bash
pnpm maintenance:audit      # Security audit
pnpm maintenance:deps       # Update dependencies
```

For complete command reference, see [Development Tools & Scripts](docs/tools-scripts/development-tools.md).

## 🏗️ Architecture Principles

1. **Zero-Trust Security**: All routes require authentication and authorization
2. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
3. **Type Safety**: Strict TypeScript with comprehensive type coverage
4. **Runtime Boundaries**: Strict client/server separation with Edge compatibility
5. **Domain-Driven Design**: Organized by business domains with clear boundaries

For detailed architecture information, see [Architecture Overview](docs/architecture/architecture-overview.md).

## 🔐 Security

- **Authentication**: Clerk-based authentication with RBAC
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Configurable rate limits per endpoint
- **Security Headers**: Comprehensive security headers configured
- **SQL Injection Prevention**: Validated SQL queries with tenant scoping

For security standards and practices, see [Security Standards](.cursor/rules/security-standards.mdc).

## 🧪 Testing

- **Test Framework**: Vitest
- **Coverage Thresholds**:
  - Lines: ≥ 80%
  - Branches: ≥ 70%
  - Functions: ≥ 75%
- **Test Organization**: Domain-driven test structure

For testing patterns and best practices, see [Testing Strategy](docs/testing-quality/testing-strategy.md).

## 📖 Contributing

1. Create a feature branch: `feat/<scope>/<description>`
2. Make your changes
3. Run quality gates: `pnpm quality:local`
4. Commit using conventional commits
5. Open a pull request

For detailed contributing guidelines, see [Contributing Guide](docs/contributing/contributing.md).

## 📝 License

[Add license information here]

## 🔗 Links

- **Documentation**: [docs/README.md](docs/README.md)
- **API Reference**: [app/api/README.md](app/api/README.md)
- **OpenAPI Spec**: [api/openapi.yml](api/openapi.yml)

---

**Last Updated**: 2025-12-15
