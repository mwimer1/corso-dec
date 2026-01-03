---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: ".husky"
description: "Documentation and resources for documentation functionality."
---
# 🤖 Husky Git Hooks Configuration

> **AI-Optimized Git hooks ecosystem** providing automated quality gates, documentation maintenance, and conventional commit validation for the Corso platform.

## 📋 Quick Reference

**Active Hooks** (3/3 enabled):
- ✅ **pre-commit**: Documentation maintenance and validation
- ✅ **commit-msg**: Conventional commit message validation
- ✅ **pre-rebase**: Lockfile refresh during rebases

**Key Features:**
- 🔄 **Documentation-first**: Automated README updates and freshness validation
- 📝 **Conventional commits**: Strict commit message standards enforcement
- 🔒 **Git LFS integration**: Large file storage hooks for media assets
- 🚀 **CI/CD complement**: Fast local feedback before comprehensive CI validation

---

## 🎯 Hook Status Matrix

| Hook | Status | Purpose | Execution |
|------|--------|---------|-----------|
| `pre-commit` | ✅ **Active** | Documentation maintenance | Multi-line script execution |
| `commit-msg` | ✅ **Active** | Commit message validation | `pnpm exec commitlint --edit "$1"` |
| `pre-rebase` | ✅ **Active** | Lockfile refresh | Conditional CI-aware execution |
| `post-merge` | ⚪ **Git LFS** | Large file checkout | `git lfs post-merge` |
| `post-commit` | ⚪ **Git LFS** | Large file commit | `git lfs post-commit` |
| `post-checkout` | ⚪ **Git LFS** | Large file checkout | `git lfs post-checkout` |
| `pre-push` | ⚪ **Git LFS** | Large file push | `git lfs pre-push` |

---

## 🔧 Active Hook Details

### ✅ Pre-commit Hook (`pre-commit`)

**Purpose**: Automated documentation maintenance and validation before commits.

**Execution Flow**:
```bash
# 1. Validate package.json (prevents duplicate scripts)
pnpm validate:package

# 2. Validate environment (prevents broken deployments)
NODE_ENV=development pnpm validate:env

# 3. Typecheck staged files only (performance optimization)
pnpm typecheck:staged

# 4. Lint staged files (ESLint --fix on .ts/.tsx and binary font validation)
pnpm lint-staged

# 5. Validate documentation freshness (skips if no docs changed)
pnpm tsx scripts/maintenance/validate-docs-on-commit.ts
```

**Key Scripts**:
- **`validate:package`**: Validates package.json structure and prevents duplicate scripts
- **`validate:env`**: Validates environment variables are properly configured
- **`typecheck:staged`**: Typechecks only staged TypeScript files (fast incremental typecheck)
- **`lint-staged`**: Runs ESLint --fix on staged .ts/.tsx files and validates binary fonts
- **`validate-docs-on-commit.ts`**: Regenerates docs index only if docs files changed (performance optimization)

**Performance Optimizations** (Phases 1-3):
- ✅ **Staged-only typecheck**: Only checks staged TypeScript files instead of full project
- ✅ **Conditional docs validation**: Skips docs index regeneration when no docs files changed
- ✅ **Removed double linting**: Removed full project lint (`pnpm lint`) - `lint-staged` already lints staged files
- ✅ **File change detection**: Skips validation checks when relevant files haven't changed:
  - `validate:package` skipped if `package.json` not staged
  - `validate:env` skipped if no env-related config files changed
- ✅ **Caching**: `validate:package` uses file hash-based caching to skip re-validation when `package.json` unchanged
- ✅ **Parallelization**: Independent checks (package/env validation) run concurrently using background jobs

### ✅ Commit Message Hook (`commit-msg`)

**Purpose**: Enforces conventional commit standards for consistent change tracking.

**Execution**:
```bash
pnpm exec commitlint --edit "$1"
```

**Validates Against**:
- Conventional commit format: `type(scope): description`
- Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- **Scopes**: Strictly enforced list of 22 allowed scopes (see `commitlint.config.cjs` for authoritative list):
  - `auth`, `dashboard`, `chat`, `components`, `hooks`, `api`, `types`, `stripe`, `openai`, `supabase`, `clickhouse`, `build`, `config`, `styles`, `docs`, `tests`, `infrastructure`, `subscription`, `organization`, `deps`, `db`, `security`
- Maximum line length and formatting standards
- Breaking change indicators and scope validation

**See**: `docs/development/commit-conventions.md` for complete commit message guidelines and scope usage.

### ✅ Pre-rebase Hook (`pre-rebase`)

**Purpose**: Ensures `pnpm-lock.yaml` stays synchronized during rebases.

**Execution**:
```bash
# Skip in CI environments to avoid conflicts
if [ -n "$CI" ]; then
  exit 0
fi

# Notify user and refresh lockfile
echo "🔄  Rebase detected – refreshing pnpm-lock.yaml"
pnpm run lock:refresh
git add pnpm-lock.yaml
echo "✅  Lockfile re-generated. Continue the rebase."
```

**Behavior**:
- Detects rebase operations automatically
- Skips execution in CI environments to avoid conflicts
- Refreshes lockfile to prevent merge conflicts
- Stages updated lockfile for commit inclusion
- Provides user feedback during execution

---

## 🔒 Git LFS Integration Hooks

**Purpose**: Seamless integration with Git Large File Storage for media assets and large files.

| Hook | Trigger | Action |
|------|---------|--------|
| `post-merge` | After merge | `git lfs post-merge` |
| `post-commit` | After commit | `git lfs post-commit` |
| `post-checkout` | After checkout | `git lfs post-checkout` |
| `pre-push` | Before push | `git lfs pre-push` |

**Note**: These hooks are managed by Git LFS and ensure proper handling of large files without manual intervention.

---

---

## 🚀 Usage & Integration

### Installation & Setup

Hooks are automatically installed via pnpm:
```bash
pnpm install  # Runs prepare script which installs Husky hooks
```

### Bypassing Hooks

**Temporary bypass** (use sparingly):
```bash
git commit --no-verify  # Skip all pre-commit hooks
git push --no-verify    # Skip pre-push hooks (tests, style checks)
```

### CI/CD Integration

**Design Philosophy**: Hooks provide fast local feedback, CI provides comprehensive validation.

| Layer | Purpose | Speed | Scope |
|-------|---------|-------|-------|
| **Local Hooks** | Fast feedback, documentation maintenance | 1-3 seconds* | Focused validation |
| **CI Pipeline** | Comprehensive testing, security scans | ~8-10 minutes | Full validation suite |

\* **Performance optimized**: Runtime varies based on changes (see Performance & Metrics section)

---

## 🛠️ Hook Development

### Hook Script Structure

All hooks follow consistent patterns:
```bash
#!/bin/sh
. "$(dirname "$0")/husky.sh"  # Load Husky utilities

# Hook logic here
command1 && command2 && command3
```

**Note**: When adding new hooks, source `.husky/husky.sh` (not `._/husky.sh`). The `_/` directory is generated by Husky and should not be referenced.

**Important**: The `_/` directory is automatically created by `husky install` (which runs via the `prepare` script on `pnpm install`). This is normal Husky v8 behavior and cannot be prevented. The directory is properly ignored in `.gitignore` and will not be committed. If you see it in your IDE, hide ignored files in your IDE settings.

### Utility Scripts

**Husky Shell (`husky.sh`)**:
- Debug logging support (`HUSKY_DEBUG=1`)
- Exit code handling and error reporting
- Cross-platform compatibility layer

**Key Features**:
- Conditional execution based on `HUSKY` environment variable
- Optional `.huskyrc` configuration loading
- Structured error messages with command exit codes

---

## 🔍 Troubleshooting

### Common Issues

**Hooks not running**:
```bash
# Verify installation
ls -la .git/hooks/

# Reinstall hooks
pnpm prepare
```

**Permission errors**:
```bash
# Fix executable permissions
chmod +x .husky/*
```

**Debug mode**:
```bash
# Enable debug logging
HUSKY_DEBUG=1 git commit -m "test"
```

### Hook Recovery

**Reset to clean state**:
```bash
# Remove all hooks
rm -rf .git/hooks/*

# Reinstall
pnpm install
```

---

## 📊 Performance & Metrics

### Hook Performance

| Hook | Typical Runtime | Frequency |
|------|-----------------|-----------|
| `pre-commit` | 1-3 seconds* | Every commit |
| `commit-msg` | <1 second | Every commit |
| `pre-rebase` | 2-3 seconds | During rebases |

\* **Performance optimized** (3 phases of optimization):
- **Code commits** (with TS changes): 2-3 seconds (staged typecheck + lint, parallel validations)
- **Code commits** (no TS/config changes): 1-2 seconds (lint only, validations skipped/cached)
- **Docs-only commits**: 1-2 seconds (docs validation only, other checks skipped)
- **Config-only commits**: 0.5-1 second (minimal validation, most checks skipped)
- **Cached commits**: <1 second (when package.json unchanged and cached)

**Optimization phases implemented**:
- Phase 1: Removed double linting, staged-only typecheck, conditional docs validation
- Phase 2: File change detection, hash-based caching for package validation
- Phase 3: Parallel execution of independent checks (package/env validations)

### Quality Impact

**Documentation Maintenance**:
- ✅ Automated timestamp updates
- ✅ Index regeneration
- ✅ Link validation
- ✅ Freshness monitoring

**Code Quality**:
- ✅ Conventional commit enforcement
- ✅ Pre-commit validation (when enabled)
- ✅ Leak detection guards

---

## 🤖 AI Agent Integration

**Programmatic Access Points**:
- **Hook Status**: Parse `Hook Status Matrix` table for automation
- **Script Dependencies**: Extract pnpm commands for dependency analysis
- **Configuration**: JSON-like structure for automated parsing
- **Error Patterns**: Consistent exit codes and error messages

**Automated Maintenance**:
- Hook validation can be automated via CI
- Script dependency checking via AST analysis
- Configuration drift detection and remediation

---

## 📚 Related Documentation

- [Scripts Directory](../scripts/README.md) - Detailed documentation of maintenance scripts used by hooks
- [CI/CD Pipeline](../.github/README.md) - How hooks complement comprehensive CI validation
-- [Development Environment](../docs/development/setup-guide.md) - Local development workflow integration
-- [Git Workflow Standards](../docs/codebase-apis/import-patterns.md) - Conventional commit and branching standards

---

## 🏷️ Tags

`#git-hooks` `#husky` `#quality-gates` `#documentation` `#conventional-commits` `#ai-optimized` `#ci-cd-complement`

---

**Last Updated**: 2025-09-10 | **Next Review**: Monthly hook effectiveness audit
