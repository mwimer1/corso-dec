---
title: "Docs"
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-13"
category: "documentation"
status: "draft"
---
# Documentation

> **Comprehensive documentation for the Corso platform**

This directory contains all project documentation, including architecture guides, development workflows, security policies, API references, and best practices.

## 📋 Quick Reference

**Key Documentation Areas:**
- **Architecture**: System design, domain-driven architecture, runtime boundaries
- **Development**: Setup guides, development tools, codebase structure
- **Security**: Security policies, authentication patterns, dependency policies
- **API**: API specifications, codebase APIs, warehouse queries
- **Testing**: Testing strategy and quality assurance
- **CI/CD**: Continuous integration workflows and quality gates

## 📑 Documentation Index

The complete documentation index is auto-generated in [`docs/index.ts`](./index.ts), which contains metadata for all README files and key documentation across the repository.

### Browse by Category

#### Architecture & Design
- [Domain-Driven Architecture](./architecture-design/domain-driven-architecture.md)
- [Runtime Boundaries](./architecture/runtime-boundaries.md)
- [Barrels Policy](./architecture/barrels-policy.md)
- [UI Design Guide](./architecture-design/ui-design-guide.md)

#### Development
- [Setup Guide](./development/setup-guide.md)
- [Development Tools](./tools-scripts/development-tools.md)
- [Codebase Structure](./codebase-apis/codebase-structure.md)
- [Import Patterns](./codebase-apis/import-patterns.md)
- [Route Configuration](./development/route-config.md)

#### Security
- [Security Policy](./security/security-policy.md)
- [Authentication Patterns](./security/auth-patterns.md)
- [Dependency Policy](./security/dependency-policy.md)

#### API & Data
- [API Patterns](./api-data/api-patterns.md)
- [Warehouse Queries](./codebase-apis/warehouse-queries.md)
- [API Specification](../api/README.md)

#### Testing & Quality
- [Testing Strategy](./testing-quality/testing-strategy.md)
- [Testing Guide](./testing-quality/testing-guide.md) - **Complete testing guide with examples**
- [CI Pipeline](./cicd-workflow/ci-pipeline.md)
- [Quality Gates](./cicd-workflow/quality-gates.md)

#### Performance
- [Performance Optimization Guide](./performance/performance-optimization-guide.md) - **Bundle size, database optimization, monitoring**

#### Operations
- [Operational Guide](./operations/operational-guide.md) - **Deployment, monitoring, troubleshooting**

#### Dependencies
- [Dependency Management Guide](./dependencies/dependency-management-guide.md) - **Dependency updates, vulnerabilities, maintenance**
- [Maintenance Plan](./dependencies/maintenance-plan.md) - **Routine maintenance schedule**

## 🔧 Documentation Maintenance

### Automated Maintenance Scripts

The documentation is maintained through automated scripts located in `scripts/maintenance/`:

#### Core Scripts
```bash
# Generate documentation index (updates docs/index.ts)
pnpm docs:index

# Update README counts and metrics
pnpm docs:sync

# Refresh frontmatter timestamps across all docs
pnpm docs:refresh

# Generate README files from templates
pnpm docs:generate:readme

# Validate documentation links
pnpm docs:links

# Validate documentation structure and formatting
pnpm docs:validate
```

#### Advanced Scripts
```bash
# Generate enhanced README files with export tables
pnpm docs:generate

# Enhance existing README files with rich frontmatter
pnpm docs:enhance

# Check for stale documentation
pnpm docs:stale:check

# Spell check documentation
pnpm docs:spellcheck

# Validate documentation idempotency
pnpm docs:idempotent:check
```

### Documentation CLI

The unified documentation CLI (`scripts/maintenance/docs/cli.ts`) provides three main commands:

```bash
# Generate README files
tsx scripts/maintenance/docs/cli.ts generate --write

# Enhance README files
tsx scripts/maintenance/docs/cli.ts enhance --write

# Normalize frontmatter
tsx scripts/maintenance/docs/cli.ts normalize --write --force
```

### Maintenance Workflow

1. **Index Generation**: Run `pnpm docs:index` to update the documentation index
2. **Frontmatter Refresh**: Run `pnpm docs:refresh` to normalize frontmatter
3. **Template Generation**: Run `pnpm docs:generate:readme` to update template-based READMEs
4. **Validation**: Run `pnpm docs:validate` to check for broken links and formatting issues

### Script Configuration

All documentation maintenance scripts are configured in:
- **Main Scripts**: `scripts/maintenance/manage-docs.ts` - Unified docs management
- **CLI Tool**: `scripts/maintenance/docs/cli.ts` - Command-line interface
- **Templates**: `scripts/docs/templates/` - Handlebars templates for README generation
- **Utilities**: `scripts/utils/docs-template-engine.ts` - Template rendering engine

### Frontmatter Standards

All documentation files should include frontmatter:

```yaml
---
title: "Document Title"
description: "Brief description"
last_updated: "2025-12-13"
category: "documentation"
status: "draft" | "active"
---
```

### README Template System

README files in specific directories are generated from templates:
- **Template**: `scripts/docs/templates/README.scripts.hbs`
- **Generator**: `scripts/maintenance/docs/generate-readmes.ts`
- **Pattern**: Matches `README.md` files in `scripts/`, `lib/`, `components/`, etc.

## 📊 Documentation Statistics

- **Total README Files**: 159+ (auto-indexed)
- **Documentation Categories**: Architecture, Development, Security, API, Testing
- **Auto-Generated**: Documentation index, README templates, frontmatter

## 🔍 Finding Documentation

### By Topic
- **Setup & Development**: See [Development](./development/) directory
- **Architecture**: See [Architecture](./architecture/) and [Architecture Design](./architecture-design/) directories
- **Security**: See [Security](./security/) directory
- **API**: See [API Data](./api-data/) and [Codebase APIs](./codebase-apis/) directories

### By File Type
- **README.md**: Directory-level documentation (auto-indexed)
- **\*.md**: Detailed guides and references
- **index.ts**: Auto-generated documentation index

## 📝 Contributing to Documentation

1. **Add New Documentation**: Create `.md` files in appropriate directories
2. **Update Existing Docs**: Edit files directly, frontmatter will be auto-updated
3. **Run Maintenance**: Execute `pnpm docs:index` and `pnpm docs:refresh` after changes
4. **Validate**: Run `pnpm docs:validate` to check for issues

## 🔗 Related Resources

- [Main README](../README.md) - Project overview and quick start
- [API Documentation](../api/README.md) - OpenAPI specifications
- [Development Tools](./tools-scripts/development-tools.md) - Scripts and tooling
- [Codebase Structure](./codebase-apis/codebase-structure.md) - Project organization
