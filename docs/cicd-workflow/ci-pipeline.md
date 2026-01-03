---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: "Cicd Workflow"
description: "Documentation and resources for documentation functionality. Located in cicd-workflow/."
---
# CI/CD Pipeline & Quality Gates

This guide covers Corso's continuous integration and deployment pipeline, quality gates, and automated validation processes.

## 🚀 CI/CD Overview

### Pipeline Architecture
Corso uses GitHub Actions for continuous integration with comprehensive quality gates and automated deployment.

#### Workflow Triggers
- **Pull Requests**: All quality gates run on PR creation/update
- **Main Branch**: Full pipeline runs on merges to main
- **Scheduled**: Weekly maintenance checks
- **Manual**: On-demand validation and deployment

## 🛠️ Quality Gates

### Unified PR Quality Gate (`quality-ci`)

The primary quality gate that blocks merges runs these checks in sequence:

#### 1. Environment Setup
```yaml
- name: Setup Node.js and pnpm
  uses: ./.github/actions/setup-node-pnpm
  with:
    run-install: 'true'
```

#### 2. TypeScript Validation
```bash
pnpm typecheck          # Full TypeScript compilation
pnpm ci:prod-typecheck # Production build type check
```

#### 3. Code Quality
```bash
pnpm lint              # ESLint validation
pnpm validate:cursor-rules  # Custom security and consistency rules
```

#### 4. Testing
```bash
pnpm test:coverage     # Vitest with coverage thresholds
```

**Coverage Requirements:**
- Lines: ≥ 80%
- Branches: ≥ 70%
- Functions: ≥ 75%
- Statements: ≥ 80%

#### 5. Architecture Validation
```bash
pnpm madge:ci          # Circular dependency detection
pnpm jscpd:ci          # Code duplication check (≤ 2% threshold)
```

#### 6. Documentation
```bash
pnpm docs:validate     # Documentation quality checks
```

### Local Parity
Run the same validation locally:
```bash
pnpm quality:ci        # Mirrors CI pipeline exactly
```

### Individual Checks
For development iteration:
```bash
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm madge:ci
pnpm jscpd:ci
pnpm docs:validate
```

## 🔒 Security & Compliance

### Dependency Management
- **Renovate**: Automated dependency updates
- **Audit**: Security vulnerability scanning
- **Overrides**: Security patches for vulnerable dependencies

### Secrets Management
- **GitHub Secrets**: Environment variables and API keys
- **Vercel Integration**: Secure deployment secrets
- **Audit Logging**: Secret access monitoring

## 📊 Quality Metrics

### Code Quality Metrics
- **Test Coverage**: Maintained above thresholds
- **Duplication**: Kept below 2% across codebase
- **Circular Dependencies**: Zero allowed
- **TypeScript Errors**: Zero in CI

### Performance Metrics
- **Build Time**: < 10 minutes for full pipeline
- **Test Execution**: < 5 minutes
- **Bundle Size**: Monitored via bundle-size checks

## 🚀 Deployment Pipeline

### Automated Deployment (`deploy.yml`)

**Triggers:**
- Push to `main` branch (automatic)
- Manual workflow dispatch (with environment selection)

**Stages:**
1. **Pre-Deployment Validation**: All quality gates must pass
2. **Deployment**: Creates deployment record and tracks status
3. **Post-Deployment Health Check**: Verifies deployment success

**Environments:**
- **Production**: Automatic on push to main
- **Staging**: Manual trigger with environment selection

### Staging Deployment
- **Trigger**: Merge to main branch or manual trigger
- **Environment**: Staging (preview URL)
- **Validation**: All quality gates pass
- **Promotion**: Manual approval required

### Production Deployment
- **Trigger**: Push to main (automatic) or manual trigger
- **Environment**: Production
- **Health Check**: Automated post-deployment verification
- **Rollback**: Manual rollback via deployment platform

**See [CI/CD Enhancement Guide](./cicd-enhancement-guide.md) for detailed deployment documentation.**

## 🔧 Tooling Integration

### Node.js & pnpm Setup
All jobs use the composite action for consistent setup:
```yaml
uses: ./.github/actions/setup-node-pnpm
with:
  run-install: 'true'
```

### Caching Strategy
- **Dependencies**: pnpm store caching
- **Build Artifacts**: TypeScript compilation cache
- **Test Results**: Coverage reports retained for 30 days

## 📋 Development Workflow

### Pre-commit Validation

**Note**: Pre-commit hooks (`.husky/pre-commit`) automatically run optimized validation checks. For manual validation, see below.

**Automatic (via git hooks)**:
- Hooks run automatically on `git commit`
- **Performance optimized**: 1-3 seconds (varies by change type)
  - Code commits: 2-3 seconds (staged typecheck + lint)
  - Docs-only: 1-2 seconds (docs validation only)
  - Config-only: 0.5-1 second (minimal validation)
- See `.husky/README.md` for full hook documentation

**Manual validation** (before pushing):
```bash
# Full validation (mirrors CI)
pnpm quality:local

# Or run individually
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:cursor-rules
```

### Branch Strategy
- **Feature Branches**: `feat/domain/description`
- **Bug Fixes**: `fix/domain/description`
- **Main Branch**: Protected, requires CI pass

### PR Requirements
- **Quality Gates**: All must pass
- **Reviews**: Minimum 1 reviewer
- **Tests**: New code requires test coverage
- **Documentation**: Updated for API/feature changes

## 🐛 Troubleshooting

### Common CI Failures

#### TypeScript Errors
```bash
# Local reproduction
pnpm typecheck

# Check specific files
pnpm tsc --noEmit --skipLibCheck path/to/file.ts
```

#### Test Failures
```bash
# Run specific tests
pnpm test path/to/test.ts

# Debug mode
pnpm test --reporter=verbose
```

#### Linting Issues
```bash
# Fix automatically
pnpm lint:fix

# Check specific files
pnpm eslint path/to/file.ts
```

### Cache Issues
```bash
# Clear CI caches
# Go to Actions → Caches → Delete caches

# Local cache reset
pnpm clean:all
pnpm install
```

## 📈 Monitoring & Analytics

### Pipeline Metrics
- **Success Rate**: Tracked per workflow
- **Execution Time**: Performance monitoring
- **Failure Patterns**: Common failure analysis

### Quality Trends
- **Coverage Trends**: Historical coverage tracking
- **Duplication Growth**: Code quality monitoring
- **Build Stability**: Pipeline reliability metrics

## 🔄 Maintenance

### Regular Tasks
- **Cache Cleanup**: Monthly cache maintenance
- **Dependency Updates**: Weekly Renovate reviews
- **Performance Review**: Monthly pipeline optimization

### Emergency Procedures
- **Pipeline Bypass**: Only for critical hotfixes (requires approval)
- **Rollback Process**: Automated deployment rollback
- **Incident Response**: CI failure investigation protocol

## 📚 Related Documentation

- [Development Tools](../tools-scripts/development-tools.md) - Local development setup
- [Testing Strategy](../testing-quality/testing-strategy.md) - Test organization and patterns
- [Security Standards](../security/README.md) - Security implementation
- [Quality Gates](./quality-gates.md) - Detailed validation rules

---

**Last updated:** 2025-09-15
