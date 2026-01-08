# Corso

Last updated: 2026-01-07

A modern, type-safe Next.js application built with domain-driven architecture, zero-trust security, and comprehensive developer tooling.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >=20.19.4 <25
- **pnpm**: >=10 (recommended: 10.17.1)
- **Git**: Latest version

### Setup

See the [Development Environment Setup Guide](docs/development/setup-guide.md) for complete installation and environment configuration instructions, including:
- Prerequisites (Node.js, pnpm, Git)
- Sequential setup commands
- Environment variable configuration
- Quality gate validation

**Quick start**: After installing prerequisites, run:
```bash
pnpm install
pnpm run verify:ai-tools
pnpm run setup:branch
pnpm validate:env
pnpm typecheck
pnpm quality:local
```

> **Note**: Run each command sequentially (one-by-one) rather than chaining with `&&` for easier debugging.

### Development Server

```bash
# Start development server (automatically cleans ports and orphaned processes)
pnpm dev
```

The dev server runs on `http://localhost:3000` (or the port specified by `PORT` environment variable). The `predev` hook automatically:
- Cleans ports 3000 and 9323
- Kills orphaned processes older than 30 minutes

### Multi-Branch Development

Work on multiple branches simultaneously using git worktrees:

```bash
# Create a worktree for a feature branch
pnpm worktree:create feat/auth/improvements

# List all active worktrees
pnpm worktree:list

# Work in the new worktree (use different port)
cd ../corso-code-feat-auth-improvements
pnpm install
PORT=3001 pnpm dev  # Run on port 3001 to avoid conflicts

# Remove worktree when done
pnpm worktree:remove feat/auth/improvements
```

**Benefits:**
- No stashing/switching between branches
- Run multiple dev servers simultaneously (different ports)
- Each worktree has its own `node_modules` and build cache
- Cursor-friendly (Cursor uses worktrees for parallel agents)

See [Multi-Branch Workflow Audit](docs/development/multi-branch-workflow-audit.md) for detailed guidance.

## 🏗️ Technology Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.9.3 (strict mode)
- **Authentication**: Clerk v6.36.2
- **Databases**:
  - ClickHouse (analytics/data warehouse)
  - Supabase (relational data)
- **Package Manager**: pnpm 10.17.1
- **Testing**: Vitest 3.2.4
- **Styling**: Tailwind CSS with design tokens

## 📁 Project Structure

```
corso-app/
├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/             # Authentication routes
│   ├── (marketing)/        # Public marketing pages
│   ├── (protected)/        # Authenticated user routes
│   └── api/                # API routes (versioned under /api/v1/)
├── components/             # React components (atomic design system)
│   ├── ui/                 # Design system (atoms, molecules, organisms)
│   ├── dashboard/          # Dashboard components
│   ├── chat/                # Chat interface components
│   └── marketing/          # Marketing page components
├── lib/                     # Business logic, utilities, configurations
│   ├── auth/               # Authentication logic
│   ├── entities/           # Entity management (projects, companies, addresses)
│   ├── integrations/       # External service integrations
│   └── shared/             # Cross-domain utilities
├── types/                   # TypeScript type definitions
├── docs/                    # Documentation
├── api/                     # OpenAPI specifications
├── scripts/                 # Development and build scripts
├── tests/                   # Test files and test utilities
└── styles/                  # Styling and design tokens
```

For detailed structure, see [Codebase Structure](docs/architecture/codebase-structure.md).

## 🎯 Key Features

### Core Capabilities

- **AI-Powered Chat**: CorsoAI chat assistant for data insights
- **Entity Management**: Manage projects, companies, and addresses with advanced data grids
- **Analytics Dashboard**: Real-time analytics with ClickHouse integration
- **Zero-Trust Security**: Comprehensive authentication, authorization, and validation
- **Type Safety**: Strict TypeScript with full type coverage
- **Domain-Driven Design**: Scalable architecture with clear domain boundaries

### Security Features

- **Authentication**: Clerk-based authentication with session management
- **RBAC**: Role-based access control for all API endpoints
- **Rate Limiting**: Applied to all endpoints to prevent abuse
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries and validation

## 🛠️ Development Workflow

### Quality Gates (Run Sequentially)

Before committing, ensure all quality gates pass:

```bash
# 1. Type checking
pnpm typecheck

# 2. Linting
pnpm lint

# 3. Tests
pnpm test

# 4. Custom rule validation
pnpm validate:cursor-rules
```

### Common Commands

```bash
# Type checking
pnpm typecheck              # Fast development feedback
pnpm typecheck:clean        # Clean cache and rebuild

# Linting
pnpm lint                   # ESLint with cache
pnpm lint:full              # CI-grade validation (rebuilds plugin)

# Testing
pnpm test                   # Run all tests
pnpm test:coverage          # Run with coverage
pnpm test:e2e               # End-to-end tests

# Code quality
pnpm quality:local          # Full quality gates
pnpm validate:cursor-rules  # Custom rule validation

# OpenAPI
pnpm openapi:gen            # Generate OpenAPI types
pnpm openapi:rbac:check     # Validate RBAC annotations
```

### Git Workflow

- **Branching**: Feature branches use `feat/<scope>/<desc>` format
- **Commits**: Conventional commits format (enforced via commitlint)
- **Rebase**: Use `git rebase --autosquash --interactive origin/main`
- **PRs**: All PRs must pass CI before review

## 📚 Documentation

### Architecture & Design

- [Architecture Overview](docs/architecture/architecture-overview.md) - System architecture and design patterns
- [Domain-Driven Architecture](docs/architecture-design/domain-driven-architecture.md) - Domain organization principles
- [Codebase Structure](docs/architecture/codebase-structure.md) - Directory structure and conventions

### TypeScript Path Aliases

<!-- BEGIN:alias-table (auto-generated) -->
- **Foundational:**
  - `@/*` → `*`
  - `@/api/*` → `app/api/*`
  - `@/atoms` → `components/ui/atoms/index.ts`
  - `@/atoms/*` → `components/ui/atoms/*`
  - `@/components/*` → `components/*`
  - `@/components/ui/*` → `components/ui/*`
  - `@/hooks/*` → `hooks/*`
  - `@/hooks/protected` → `hooks/index.ts`
  - `@/integrations` → `lib/integrations/index.ts`
  - `@/integrations/*` → `lib/integrations/*`
  - `@/lib` → `lib/*`
  - `@/lib/*` → `lib/*`
  - `@/lib/api` → `lib/api/index.ts`
  - `@/lib/api/client` → `lib/api/client.ts`
  - `@/lib/api/data/entity-data` → `lib/api/data/entity-data.ts`
  - `@/lib/api/response/http` → `lib/api/response/http.ts`
  - `@/lib/auth/authorization/constants` → `lib/auth/authorization/constants.ts`
  - `@/lib/auth/client` → `lib/auth/client.ts`
  - `@/lib/auth/server` → `lib/auth/server.ts`
  - `@/lib/config` → `lib/config/index.ts`
  - `@/lib/events` → `lib/shared/events/index.ts`
  - `@/lib/monitoring` → `lib/monitoring/index.ts`
  - `@/lib/monitoring/core/logger` → `lib/monitoring/core/logger.ts`
  - `@/lib/security` → `lib/security/index.ts`
  - `@/lib/server` → `lib/server/index.ts`
  - `@/lib/shared` → `lib/shared/index.ts`
  - `@/lib/shared/*` → `lib/shared/*`
  - `@/lib/supabase/middleware` → `lib/supabase/middleware/index.ts`
  - `@/lib/supabase/middleware/*` → `lib/supabase/middleware/*`
  - `@/lib/validators` → `lib/validators/index.ts`
  - `@/molecules` → `components/ui/molecules/index.ts`
  - `@/molecules/*` → `components/ui/molecules/*`
  - `@/organisms` → `components/ui/organisms/index.ts`
  - `@/organisms/*` → `components/ui/organisms/*`
  - `@/shared/audit/types` → `types/shared/audit/types.ts`
  - `@/shared/config/types` → `types/shared/config/types.ts`
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
  - `@/types/chat/message` → `types/chat/message/types.ts`
  - `@/types/chat/query` → `types/chat/query/types.ts`
  - `@/types/chat/response` → `types/chat/response/types.ts`
  - `@/types/chat/visualization` → `types/chat/visualization/types.ts`
  - `@/types/config/threat` → `types/config/threat/types.ts`
  - `@/types/dashboard/entity` → `types/dashboard/entity/index.ts`
  - `@/types/dashboard/table` → `types/dashboard/table/index.ts`
  - `@/types/dashboard/table/types` → `types/dashboard/table/types.ts`
  - `@/types/dashboard/user-data` → `types/dashboard/user-data/index.ts`
  - `@/types/integrations/*` → `types/integrations/*`
  - `@/types/shared/system` → `types/shared/system/index.ts`
  - `@/types/shared/system/error` → `types/shared/system/error/types.ts`
  - `@/types/shared/system/events` → `types/shared/system/events/types.ts`
  - `@/types/supabase` → `types/supabase/index.ts`
  - `@/types/supabase/api` → `types/supabase/api/types.ts`
  - `@/types/supabase/core` → `types/supabase/core/types.ts`
  - `@corso/eslint-plugin` → `eslint-plugin-corso/dist/index`
  - `@corso/eslint-plugin/*` → `eslint-plugin-corso/dist/*`
  - `@shared` → `types/shared/index.ts`
  - `@shared/*` → `types/shared/*`
  - `@shared/data` → `types/shared/data/index.ts`
  - `@shared/data/status` → `types/shared/data/status/types.ts`
  - `@shared/dates` → `types/shared/dates/types.ts`
  - `@shared/feature-flags` → `types/shared/feature-flags/types.ts`
  - `@tests/support/*` → `tests/support/*`
<!-- END:alias-table -->

### Development Guides

- [API Design Guide](docs/api/api-design-guide.md) - API development patterns
- [Security Standards](.cursor/rules/security-standards.mdc) - Security implementation guide
- [Component Design System](.cursor/rules/component-design-system.mdc) - Component patterns

### Key Documentation

- [Development Environment](.cursor/rules/ai-agent-development-environment.mdc) - Setup and workflow
- [Quality Standards](.cursor/rules/code-quality-standards.mdc) - Testing and quality gates
- [OpenAPI RBAC](.cursor/rules/openapi-vendor-extensions.mdc) - API security patterns

## 🔒 Security

This project follows **zero-trust security principles**:

- ✅ All routes require authentication and authorization
- ✅ Input validation with Zod schemas
- ✅ Rate limiting on all endpoints
- ✅ SQL injection prevention
- ✅ RBAC for API endpoints
- ✅ Structured error handling

See [Security Standards](.cursor/rules/security-standards.mdc) for detailed security requirements and patterns.

## 🧪 Testing

- **Unit Tests**: Component and utility tests in `tests/`
- **Integration Tests**: API route and service tests
- **E2E Tests**: Full user flow tests with Playwright
- **Coverage**: Minimum 80% line coverage required

Run tests with:
```bash
pnpm test              # All tests
pnpm test:coverage     # With coverage report
pnpm test:e2e          # End-to-end tests
```

## 🚢 CI/CD

The project uses GitHub Actions for CI/CD:

- **8 Active Workflows**: Comprehensive validation, security scanning, and quality checks
- **Zero-Trust Security**: SHA-pinned actions, automated validation
- **Quality Gates**: Type checking, linting, tests, and custom rules

See [GitHub Automation](.github/README.md) for workflow details.

## 📦 Build & Deployment

```bash
# Production build
pnpm build

# Start production server
pnpm start

# Bundle analysis
ANALYZE=true pnpm build
```

## 🤝 Contributing

1. Create a feature branch: `feat/<scope>/<description>`
2. Make your changes following the [code quality standards](.cursor/rules/code-quality-standards.mdc)
3. Run quality gates: `pnpm quality:local`
4. Commit using conventional commits format
5. Push and create a PR (CI must pass)

## 📄 License

[Add license information here]

## 🔗 Links

- **Documentation**: [docs/](docs/)
- **API Spec**: [api/openapi.yml](api/openapi.yml)
- **GitHub Actions**: [.github/](.github/)

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active
