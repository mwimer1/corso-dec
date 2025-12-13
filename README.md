---
title: "README.md"
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-13"
category: "documentation"
status: "draft"
---
# Corso

Last updated: 2025-12-13

> **Construction permit and contractor data platform for the Dallas-Fort Worth metro area**

Corso is a modern web application for managing and analyzing construction permit data, contractor information, and property records in the Dallas-Fort Worth metropolitan area.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and pnpm
- Git
- Windows-compatible development environment

### Setup
```bash
# Install dependencies
pnpm install

# Verify required tools
pnpm run verify:ai-tools

# Set up git hooks and branch configuration
pnpm run setup:branch

# Validate environment variables
pnpm validate:env

# Run quality checks
pnpm typecheck
pnpm lint
pnpm test
```

### Development
```bash
# Start development server
pnpm dev

# Run type checking (fast feedback)
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test
```

## 📚 Documentation

- **[Development Guide](docs/development/setup-guide.md)** - Complete setup and development workflow
- **[Architecture](docs/architecture-design/domain-driven-architecture.md)** - System architecture and design patterns
- **[API Documentation](api/README.md)** - OpenAPI specification and API reference
- **[Security Standards](docs/security/security-policy.md)** - Security policies and best practices
- **[Testing Guide](docs/testing-quality/testing-guide.md)** - Complete testing guide with examples
- **[Performance Guide](docs/performance/performance-optimization-guide.md)** - Performance optimization and monitoring
- **[Operational Guide](docs/operations/operational-guide.md)** - Deployment, monitoring, and troubleshooting
- **[Dependency Management](docs/dependencies/dependency-management-guide.md)** - Dependency updates, vulnerabilities, maintenance
- **[TypeScript Guide](docs/typescript/typescript-guide.md)** - Type safety, strict mode, best practices
- **[API Design Guide](docs/api/api-design-guide.md)** - API design, OpenAPI compliance, validation
- **[Error Handling Guide](docs/error-handling/error-handling-guide.md)** - Error boundaries, logging, resilience
- **[Accessibility Guide](docs/accessibility/accessibility-guide.md)** - a11y standards, testing, best practices
- **[Monitoring Guide](docs/monitoring/monitoring-guide.md)** - Health checks, metrics, observability
- **[Production Readiness Checklist](docs/production/production-readiness-checklist.md)** - Pre-deployment verification
- **[Production Audit Report](docs/production/production-audit.md)** - Comprehensive domain audit
- **[Contributing](docs/contributing/unused-exports.md)** - Contribution guidelines

See [Documentation Index](docs/README.md) for complete documentation catalog.

## 🛠️ Documentation Maintenance

The repository includes automated scripts for maintaining documentation consistency:

### Core Maintenance Scripts
```bash
# Generate documentation index
pnpm docs:index

# Update README counts and metrics
pnpm docs:sync

# Refresh frontmatter timestamps
pnpm docs:refresh

# Generate README files from templates
pnpm docs:generate:readme

# Validate documentation links
pnpm docs:links

# Validate documentation structure
pnpm docs:validate
```

### Documentation Workflow
1. **Index Generation**: `pnpm docs:index` - Updates `docs/index.ts` with all README files
2. **Frontmatter Normalization**: `pnpm docs:refresh` - Normalizes frontmatter across all docs
3. **Template Generation**: `pnpm docs:generate:readme` - Generates README files from templates
4. **Validation**: `pnpm docs:validate` - Validates links, structure, and formatting

### Scripts Location
- **Maintenance scripts**: `scripts/maintenance/`
- **Documentation CLI**: `scripts/maintenance/docs/cli.ts`
- **Templates**: `scripts/docs/templates/`

## 📊 Project Structure

```
corso-app/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── components/             # React components (UI library)
├── lib/                    # Business logic, utilities, configurations
├── types/                  # TypeScript type definitions
├── hooks/                  # React hooks
├── actions/                # Server actions
├── docs/                   # Documentation
├── api/                    # OpenAPI specifications
├── scripts/                # Development and maintenance scripts
├── tests/                  # Test files and utilities
└── styles/                 # Styling and design tokens
```

## 🔗 Path Aliases

The project uses TypeScript path aliases for cleaner imports. All aliases are configured in `config/typescript/tsconfig.base.json`.

<!-- BEGIN:alias-table (auto-generated) -->
- **Foundational:**
  - `@/*` → `*`
  - `@/api/*` → `app/api/*`
  - `@/atoms` → `components/ui/atoms/index.ts`
  - `@/atoms/*` → `components/ui/atoms/*`
  - `@/components/*` → `components/*`
  - `@/components/ui/*` → `components/ui/*`
  - `@/contexts` → `contexts/index.ts`
  - `@/contexts/*` → `contexts/*`
  - `@/hooks/*` → `hooks/*`
  - `@/hooks/dashboard/analytics` → `hooks/dashboard/analytics/index.ts`
  - `@/hooks/dashboard/user-data` → `hooks/dashboard/user-data/index.ts`
  - `@/hooks/protected` → `hooks/index.ts`
  - `@/hooks/shared` → `hooks/shared/index.ts`
  - `@/integrations` → `lib/integrations/index.ts`
  - `@/integrations/*` → `lib/integrations/*`
  - `@/lib` → `lib/*`
  - `@/lib/*` → `lib/*`
  - `@/lib/api` → `lib/api/index.ts`
  - `@/lib/api/auth` → `lib/api/auth.ts`
  - `@/lib/api/client` → `lib/api/client.ts`
  - `@/lib/api/data/entity-data` → `lib/api/data/entity-data.ts`
  - `@/lib/api/response/http` → `lib/api/response/http.ts`
  - `@/lib/api/streaming/ndjson-route` → `lib/api/streaming/ndjson-route.ts`
  - `@/lib/auth` → `lib/auth/index.ts`
  - `@/lib/auth/authorization/constants` → `lib/auth/authorization/constants.ts`
  - `@/lib/auth/authorization/roles` → `lib/auth/authorization/roles.ts`
  - `@/lib/auth/client` → `lib/auth/client.ts`
  - `@/lib/auth/server` → `lib/auth/server.ts`
  - `@/lib/config` → `lib/config/index.ts`
  - `@/lib/dashboard` → `lib/dashboard/index.ts`
  - `@/lib/events` → `lib/shared/events/index.ts`
  - `@/lib/monitoring` → `lib/monitoring/index.ts`
  - `@/lib/monitoring/core/logger` → `lib/monitoring/core/logger.ts`
  - `@/lib/security` → `lib/security/index.ts`
  - `@/lib/server` → `lib/server/index.ts`
  - `@/lib/shared` → `lib/shared/index.ts`
  - `@/lib/shared/*` → `lib/shared/*`
  - `@/lib/shared/client` → `lib/shared/client.ts`
  - `@/lib/supabase/middleware` → `lib/supabase/middleware/index.ts`
  - `@/lib/supabase/middleware/*` → `lib/supabase/middleware/*`
  - `@/lib/validators` → `lib/validators/index.ts`
  - `@/molecules` → `components/ui/molecules/index.ts`
  - `@/molecules/*` → `components/ui/molecules/*`
  - `@/organisms` → `components/ui/organisms/index.ts`
  - `@/organisms/*` → `components/ui/organisms/*`
  - `@/shared/audit/types` → `types/shared/audit/types.ts`
  - `@/shared/config/base/types` → `types/shared/config/base/types.ts`
  - `@/shared/data` → `types/shared/data/index.ts`
  - `@/shared/performance/cache-config/types` → `types/shared/performance/cache-config/types.ts`
  - `@/shared/system/error/types` → `types/shared/system/error/types.ts`
  - `@/styles` → `styles/index.ts`
  - `@/styles/*` → `styles/*`
  - `@/styles/breakpoints` → `styles/breakpoints.ts`
  - `@/styles/shared-variants` → `styles/shared-variants.ts`
  - `@/styles/utils` → `styles/utils.ts`
  - `@/tests/*` → `tests/*`
  - `@/tests/helpers` → `tests/__setup__/helpers/index.ts`
  - `@/tests/helpers/*` → `tests/__setup__/helpers/*`
  - `@/tests/utils` → `tests/__setup__/utils/index.ts`
  - `@/tests/utils/*` → `tests/__setup__/utils/*`
  - `@/types/*` → `types/*`
  - `@/types/api` → `types/api/index.ts`
  - `@/types/api/response` → `types/api/response/types.ts`
  - `@/types/auth/authorization` → `types/auth/authorization/types.ts`
  - `@/types/auth/credential` → `types/auth/credential/types.ts`
  - `@/types/auth/member` → `types/auth/member/types.ts`
  - `@/types/auth/organization` → `types/auth/organization/types.ts`
  - `@/types/auth/session` → `types/auth/session/types.ts`
  - `@/types/auth/user` → `types/auth/user/types.ts`
  - `@/types/chat/message` → `types/chat/message/types.ts`
  - `@/types/chat/query` → `types/chat/query/types.ts`
  - `@/types/chat/response` → `types/chat/response/types.ts`
  - `@/types/chat/visualization` → `types/chat/visualization/types.ts`
  - `@/types/config/security` → `types/config/security/types.ts`
  - `@/types/config/threat` → `types/config/threat/types.ts`
  - `@/types/dashboard/analytics/clickhouse` → `types/dashboard/analytics/clickhouse/types.ts`
  - `@/types/dashboard/entity` → `types/dashboard/entity/index.ts`
  - `@/types/dashboard/table` → `types/dashboard/table/index.ts`
  - `@/types/dashboard/table/types` → `types/dashboard/table/types.ts`
  - `@/types/dashboard/user-data` → `types/dashboard/user-data/index.ts`
  - `@/types/integrations/*` → `types/integrations/*`
  - `@/types/integrations/supabase` → `types/integrations/supabase/index.ts`
  - `@/types/integrations/supabase/api` → `types/integrations/supabase/api/types.ts`
  - `@/types/integrations/supabase/core` → `types/integrations/supabase/core/types.ts`
  - `@/types/security/policy` → `types/security/policy/types.ts`
  - `@/types/security/prompt-guard` → `types/security/prompt-guard/types.ts`
  - `@/types/shared/system` → `types/shared/system/index.ts`
  - `@/types/shared/system/error` → `types/shared/system/error/types.ts`
  - `@/types/shared/system/events` → `types/shared/system/events/types.ts`
  - `@corso/eslint-plugin` → `eslint-plugin-corso/dist/index`
  - `@corso/eslint-plugin/*` → `eslint-plugin-corso/dist/*`
  - `@shared` → `types/shared/index.ts`
  - `@shared/*` → `types/shared/*`
  - `@shared/data` → `types/shared/data/index.ts`
  - `@shared/data/status` → `types/shared/data/status/types.ts`
  - `@shared/feature-flags` → `types/shared/feature-flags/types.ts`
  - `@shared/utils/dates` → `types/shared/utils/dates/types.ts`
  - `@shared/validation/sql-safety` → `types/validators/validation/sql-safety/types.ts`
  - `@tests/support/*` → `tests/support/*`
<!-- END:alias-table -->

## 🔒 Security

- **Zero-trust architecture**: All routes require authentication
- **RBAC**: Role-based access control for all API endpoints
- **Input validation**: Comprehensive Zod schema validation
- **Rate limiting**: Protection against abuse on all endpoints

See [Security Standards](docs/security/security-policy.md) for complete security documentation.

## ⚡ Performance

```bash
# Analyze bundle size
pnpm bundlesize

# Run bundle analyzer
ANALYZE=true pnpm build

# Run Lighthouse audit
pnpm dlx @lhci/cli autorun --collect.url=http://localhost:3000/
```

### Performance Targets
- **Bundle Size**: < 300KB (Brotli)
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

See [Performance Optimization Guide](docs/performance/performance-optimization-guide.md) for complete performance documentation.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

### Test Coverage

- **Test files**: 92
- **Security tests**: 7

## 📦 Quality Gates

Before committing, ensure all quality gates pass:

```bash
# Full quality validation
pnpm quality:local

# Individual checks
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:cursor-rules
```

## 🤝 Contributing

1. Create a feature branch: `feat/<scope>/<description>`
2. Make your changes
3. Run quality gates: `pnpm quality:local`
4. Commit with conventional commits format
5. Push and create a pull request

## 📄 License

[Add license information here]

## 🔗 Links

- [Documentation Index](docs/index.ts)
- [API Specification](api/openapi.yml)
- [Development Tools](docs/tools-scripts/development-tools.md)
