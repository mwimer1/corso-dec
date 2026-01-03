---
title: "Tools Scripts"
description: "Documentation and resources for documentation functionality. Located in tools-scripts/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
---
# Development Tools & Scripts

This guide covers the development tooling, scripts, and automation patterns used in Corso development.

## 🛠️ Core Development Tools

### Package Management
- **pnpm**: Primary package manager with workspace support
- **Commands**: `pnpm install`, `pnpm add`, `pnpm run`
- **Workspaces**: Monorepo structure with filtered package management

### Code Quality Tools
- **ESLint**: Code linting and style enforcement
- **TypeScript**: Type checking and compilation
- **Prettier**: Code formatting
- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing

### Development Scripts

#### Setup Scripts
```bash
# Initial setup (run in order)
pnpm install                    # Install dependencies
pnpm run verify:ai-tools       # Verify required CLI tools
pnpm run setup:branch          # Set up git hooks and branch config
                               # Note: Pre-commit hooks are performance-optimized (1-3 seconds)
pnpm validate:env             # Validate environment variables
```

#### Quality Gates

**Canonical Commands** (use these):
```bash
# Full local validation (recommended for pre-commit)
pnpm quality:local             # Includes: typecheck + lint + test + bundle size + AST-Grep + more

# CI-grade validation (optimized for speed)
pnpm quality:ci                # Essential checks only: lint + typecheck + test + docs

# Comprehensive validation suite
pnpm validate                  # Includes dead-code check, full validation pipeline
```

**When to use each:**
- **`quality:local`** - Use before committing locally. Most comprehensive check including bundle size validation, full linting, and all quality gates.
- **`quality:ci`** - Used by CI pipeline. Faster execution with essential checks only (excludes bundle size for speed).
- **`validate`** - Comprehensive validation including dead-code detection. Good for thorough pre-commit checks.

**Individual Quality Checks:**
```bash
pnpm typecheck                 # TypeScript validation (fast feedback)
pnpm lint                      # ESLint validation (uses cache for faster reruns)
pnpm lint:full                 # Full lint (rebuilds plugin + lint scripts + lint) - use for CI/pre-commit
pnpm test                      # Vitest test suite
pnpm validate:cursor-rules     # Custom security rules
pnpm docs:validate            # Documentation quality checks
```

**Deprecated Commands** (migrate to canonical):

| Old Command | New Command | Notes |
|------------|------------|-------|
| `deadcode` | `validate:dead-code` | Use canonical command |
| `lint:unused` | `validate:dead-code` | Use canonical command |
| `validate:dup` | `validate:duplication` | Use canonical command |
| `docs:check` | `docs:validate` | Use canonical command |
| `validate:barrels` | `audit:barrels --only constants` | Use canonical command |
| `barrels:policy:check` | `audit:barrels --only policy` | Use canonical command |
| `verify:no-intradomain-root-barrels` | `audit:barrels --only intradomain` | Use canonical command |

#### Development Workflow
```bash
# Development server
pnpm dev                       # Start development server (auto-cleans ports & orphans)

# Build commands
pnpm build                     # Production build

# Documentation
pnpm docs:links                # Validate internal links
pnpm docs:lint                 # Lint documentation
pnpm docs:validate             # Full documentation validation
pnpm docs:readmes:check        # Check README consistency
```

## 📊 Specialized Tools

### Code Analysis
- **ESLint**: Primary code quality enforcement (40+ migrated rules from AST-Grep)
- **AST-Grep**: Remaining structural code patterns (~4 rules)
- **dependency-cruiser**: Dependency analysis and circular import detection
- **jscpd**: Code duplication detection
- **knip**: Unused dependency detection

### API & Schema Tools
- **OpenAPI**: API specification management (`api/openapi.yml`)
- **Spectral**: OpenAPI linting and validation
- **openapi-typescript**: TypeScript type generation from OpenAPI spec
- **Redocly**: OpenAPI bundling and documentation

**OpenAPI Commands:**
```bash
pnpm openapi:gen              # Complete pipeline: bundle → lint → generate types
pnpm openapi:bundle           # Bundle YAML to JSON
pnpm openapi:lint             # Validate with Spectral
pnpm openapi:types            # Generate TypeScript types
pnpm openapi:rbac:check       # Validate RBAC annotations
```

### Version Control
- **Git**: Distributed version control
- **Conventional Commits**: Structured commit messages
- **Branch Naming**: Feature branches with domain prefixes

## 🔧 Custom Scripts

### Scaffold Scripts
```bash
# Generate new components/modules
pnpm scaffold:component        # Create new UI component
pnpm scaffold:domain           # Create new business domain
pnpm scaffold:hook             # Create new React hook
```

### Validation Scripts
```bash
# Code quality validation (98% ESLint-based)
pnpm lint                        # Primary ESLint validation (40+ migrated rules)
pnpm ast-grep:scan               # Remaining AST-Grep patterns (~4 rules)
pnpm validate:cursor-rules       # Security and consistency rules

# Documentation validation
pnpm docs:validate              # Full documentation validation (links, structure, etc.)
pnpm docs:links                 # Validate cross-references
pnpm docs:lint                  # Documentation formatting
pnpm docs:readmes:check         # Check README consistency
```

### Maintenance Scripts
```bash
# Code maintenance
pnpm fix:single-child           # Fix React single-child issues
pnpm fix:imports               # Auto-fix import issues
pnpm codemod:transform         # Apply code transformations

# Process & port cleanup
pnpm cleanup:ports             # Kill processes on ports 3000, 9323 (manual)
pnpm dev:clean:orphans         # Kill orphaned dev processes > 4 hours old (manual)
# Note: Port and orphan cleanup runs automatically before `pnpm dev` via predev hook

# Repository maintenance
pnpm maintenance:deps           # Update dependencies
pnpm maintenance:audit          # Security audit
pnpm maintenance:clean          # Clean build artifacts
```

## 🚀 CI/CD Pipeline

### CI/CD Quality Validation
The CI pipeline runs comprehensive validation:

1. **Setup**: Node.js, pnpm, dependencies
2. **Linting**: ESLint configuration validation
3. **Type Checking**: Full TypeScript compilation
4. **Testing**: Unit, integration, component tests
5. **Security**: Custom security rules and dependency audit
6. **Documentation**: Link validation and formatting checks

### Automated Checks
- **Pull Request Validation**: All quality gates must pass
- **Branch Protection**: Main branch requires successful CI
- **Automated Fixes**: Bot-assisted code formatting and import fixes
- **Security Scanning**: Dependency vulnerability detection

## 📋 Development Workflow

### Daily Development
```bash
# Start development
pnpm dev                       # Development server
pnpm typecheck                 # Fast feedback loop

# Make changes
# ... edit code ...
pnpm typecheck                 # Validate changes
pnpm lint                      # Check code style
pnpm test                      # Run relevant tests
```

### Before Commit
```bash
# Quality assurance (recommended)
pnpm quality:local             # Full validation (includes bundle size, all checks)

# Alternative: comprehensive validation
pnpm validate                  # Includes dead-code detection

# Individual checks (if needed)
pnpm typecheck                 # Fast TypeScript check
pnpm lint                      # Code quality check
pnpm test                      # Run tests
pnpm validate:cursor-rules     # Security checks

# Documentation
pnpm docs:validate            # Full documentation validation
```

### Code Review
```bash
# Validate PR changes
pnpm typecheck
pnpm lint
pnpm test --coverage
pnpm validate:cursor-rules
```

## 🐛 Troubleshooting

### Common Issues

#### Tool Installation
```bash
# Verify tool versions
pnpm run verify:ai-tools

# Update tools
pnpm add -D <tool-name>
```

#### Cache Issues
```bash
# Clear caches
pnpm cleanup:all
pnpm install

# Clear ESLint cache (if rules/config changed)
pnpm lint:clear-cache

# Reset TypeScript cache
pnpm typecheck:clean
```

#### Port & Process Conflicts
```bash
# Manual cleanup (usually not needed - runs automatically before `pnpm dev`)
pnpm cleanup:ports             # Kill processes on dev ports
pnpm dev:clean:orphans         # Kill orphaned dev processes

# The predev hook automatically runs cleanup before starting dev server:
# - Clears ports 3000 and 9323
# - Kills orphaned Node.js dev processes older than 30 minutes
```

#### Permission Issues
```bash
# Fix permissions
chmod +x scripts/**/*.sh
```

### Performance Optimization
- **Incremental Builds**: TypeScript and Vite use caching
- **ESLint Cache**: `pnpm lint` uses ESLint cache (`node_modules/.cache/eslint/.eslintcache`) for faster reruns
- **Selective Testing**: Run only affected tests with `pnpm test --run`
- **Parallel Execution**: CI runs checks in parallel when possible

## 📚 Related Documentation

- [Codebase Structure](../codebase-apis/codebase-structure.md) - Code organization patterns
- [Testing Strategy](../testing-quality/testing-strategy.md) - Testing patterns and coverage
- [CI/CD Pipeline](../cicd-workflow/ci-pipeline.md) - Continuous integration setup
- [Quality Gates](../cicd-workflow/quality-gates.md) - Validation standards

## 🔄 Tool Updates

### Staying Current
- **Automated Updates**: Renovate manages dependency updates
- **Manual Updates**: Check for tool updates quarterly
- **Compatibility**: Test tool updates in feature branches

### Migration Guides
- **Tool Migration**: Update guides for major tool changes
- **Breaking Changes**: Document migration paths for tool updates
- **Deprecation**: Plan for deprecated tool removal

---

**Last updated:** 2025-12-25
