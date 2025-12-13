---
title: "Corso"
description: "Construction permit and contractor data platform for the Dallas-Fort Worth metro area"
last_updated: "2025-12-13"
category: "project"
---

# Corso

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
- **[Contributing](docs/contributing/unused-exports.md)** - Contribution guidelines

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

## 🔒 Security

- **Zero-trust architecture**: All routes require authentication
- **RBAC**: Role-based access control for all API endpoints
- **Input validation**: Comprehensive Zod schema validation
- **Rate limiting**: Protection against abuse on all endpoints

See [Security Standards](docs/security/security-policy.md) for complete security documentation.

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
