---
status: "draft"
last_updated: "2025-12-30"
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
# 1. Update documentation timestamps
pnpm tsx scripts/docs/refresh-last-updated.ts

# 2. Refresh documentation index
pnpm docs:index

# 3. Lint and validate documentation
pnpm docs:lint && pnpm docs:check
```

**Key Scripts**:
- **`update-dates.ts`**: Updates `last_updated` frontmatter in documentation files
- **`docs:index`**: Regenerates documentation table of contents and indexes
- **`docs:lint`**: Validates documentation structure and formatting
- **`docs:check`**: Comprehensive documentation freshness and link validation

### ✅ Commit Message Hook (`commit-msg`)

**Purpose**: Enforces conventional commit standards for consistent change tracking.

**Execution**:
```bash
pnpm exec commitlint --edit "$1"
```

**Validates Against**:
- Conventional commit format: `type(scope): description`
- Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Maximum line length and formatting standards
- Breaking change indicators and scope validation

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
```

### CI/CD Integration

**Design Philosophy**: Hooks provide fast local feedback, CI provides comprehensive validation.

| Layer | Purpose | Speed | Scope |
|-------|---------|-------|-------|
| **Local Hooks** | Fast feedback, documentation maintenance | ~5-10 seconds | Focused validation |
| **CI Pipeline** | Comprehensive testing, security scans | ~8-10 minutes | Full validation suite |

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
| `pre-commit` | 5-10 seconds | Every commit |
| `commit-msg` | <1 second | Every commit |
| `pre-rebase` | 2-3 seconds | During rebases |

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
