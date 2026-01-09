---
description: "Documentation and resources for documentation functionality."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
title: ".husky"
---
# 🤖 Husky Git Hooks Configuration

> **Fast, fail-fast, low-noise Git hooks** with high-context failures and post-commit receipts for the Corso platform.

## 📋 Quick Reference

**Active Hooks** (5/5 enabled):
- ✅ **pre-commit**: Fail-fast quality gates with staged-only checks
- ✅ **pre-commit-docs**: Auto-update documentation before commit
- ✅ **commit-msg**: Conventional commit message validation
- ✅ **pre-rebase**: Lockfile refresh during rebases
- ✅ **pre-push**: Conditional style checks and fast test suite
- ✅ **post-commit**: Receipt generation for docs/tooling changes

**Key Features:**
- ⚡ **Fast execution**: Staged-only checks, conditional gates, fast-exit on no-op
- 🎯 **Fail-fast**: Stops on first error with actionable context
- 🔇 **Low-noise**: Minimal output on success, detailed only on failure
- 📄 **Receipts**: Post-commit file lists for troubleshooting
- 📝 **Conventional commits**: Strict commit message standards enforcement
- 🔒 **Git LFS integration**: Large file storage hooks for media assets
- 🚀 **CI/CD complement**: Fast local feedback before comprehensive CI validation

---

## 🎯 Hook Status Matrix

| Hook | Status | Purpose | Execution |
|------|--------|---------|-----------|
| `pre-commit` | ✅ **Active** | Fail-fast quality gates | Staged-only checks with conditional execution |
| `pre-commit-docs` | ✅ **Active** | Auto-update documentation | Automatically updates docs when docs files staged |
| `commit-msg` | ✅ **Active** | Commit message validation | `pnpm exec commitlint --edit "$1"` |
| `pre-rebase` | ✅ **Active** | Lockfile refresh | Conditional CI-aware execution |
| `post-merge` | ⚪ **Git LFS** | Large file checkout | `git lfs post-merge` |
| `post-commit` | ✅ **Active** | Receipt generation | Auto-generates receipts for docs/tooling changes |
| `post-checkout` | ⚪ **Git LFS** | Large file checkout | `git lfs post-checkout` |
| `pre-push` | ✅ **Active** | Conditional style/tests | Fast-exit on no commits, change-based execution |

---

## 🔧 Active Hook Details

### ✅ Pre-commit Hook (`pre-commit`)

**Purpose**: Fail-fast quality gates with staged-only checks and high-context failures.

**Execution Flow** (gates run in order, fail-fast on first error):
```bash
# 0. Auto-update documentation (only if docs files staged)
.husky/pre-commit-docs

# 1. Validate package.json (only if package.json staged)
pnpm validate:package

# 2. Validate environment (only if env/config files staged)
NODE_ENV=development pnpm validate:env

# 3. Lint staged files (always runs - fast and scoped)
pnpm lint-staged

# 4. Typecheck staged files (only if TS/TSX or tsconfig staged)
pnpm typecheck:staged

# 5. Leak guard (only if types/shared/** staged)
git grep -nE "export .*Database" -- types/shared
```

**Key Scripts**:
- **`validate:package`**: Validates package.json structure (skipped if package.json not staged)
- **`validate:env`**: Validates environment variables (skipped if no env/config files changed)
- **`lint-staged`**: Runs ESLint with cache on staged .ts/.tsx files, binary font check on font files only
- **`typecheck:staged`**: Typechecks only staged TypeScript files using temporary tsconfig (avoids TS5042)
- **Leak guard**: Prevents critical types from being re-exported from `types/shared/`

**Performance Optimizations**:
- ✅ **Staged-only checks**: All checks operate on staged files only
- ✅ **Conditional execution**: Gates skip when relevant files unchanged
- ✅ **Fast lint-staged**: ESLint cache enabled, binary font check only on font files
- ✅ **Temp tsconfig**: Typecheck uses `.cache/tsc/tsconfig.staged.json` to avoid TS5042 error
- ✅ **Low-noise output**: Minimal output on success (✅ lines only)
- ✅ **High-context failures**: On failure, shows gate name, re-run command, log path, action items, and log tail

**Logging**:
- Logs written to `.git/husky-logs/pre-commit-<timestamp>.log`
- Set `HUSKY_VERBOSE=1` to stream output instead of logging

### ✅ Pre-commit Docs Hook (`pre-commit-docs`)

**Purpose**: Automatically updates documentation files before commit to prevent stale docs.

**Execution Flow**:
```bash
# 1. Detect if only docs/README files are staged (no code changes)
# 2. Update docs/index.ts (if docs files staged)
pnpm docs:index

# 3. Update scripts READMEs (if scripts READMEs staged or exist)
pnpm docs:generate:readme -- --all

# 4. Stage updated files automatically
git add docs/index.ts scripts/**/*README.md
```

**Behavior**:
- **Early exit**: Exits immediately if no docs files are staged
- **Docs-only detection**: Only runs when docs/README files are staged (no code changes)
- **Auto-staging**: Automatically stages updated documentation files
- **Non-fatal**: Errors are non-fatal (warnings only) to avoid blocking commits
- **Cross-platform**: Works on Windows (Git Bash) and Unix systems

**Updated Files**:
- `docs/index.ts`: Documentation index (auto-generated from README files)
- `scripts/**/README.md`: Scripts directory READMEs (auto-generated from templates)

**Integration**:
- Called automatically by `pre-commit` hook when docs files are staged
- Can be run independently: `.husky/pre-commit-docs`
- Skips standard quality gates (typecheck, lint) for docs-only commits

**Performance**:
- Runtime: <1 second (runs only when docs files staged)
- Conditional execution: Only runs when relevant files are staged
- Idempotent: Safe to run multiple times

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

### ✅ Pre-push Hook (`pre-push`)

**Purpose**: Optimized conditional style checks and affected tests with fast-exit on no-op.

**Execution Flow**:
```bash
# 1. Fast-exit if no commits to push
# 2. Run Git LFS pre-push (if available)
# 3. Single git diff call to determine changed files since base
# 4. Run style checks in parallel (only if style/token/theme files changed)
pnpm check:tokens & pnpm check:route-themes &  # Parallel execution

# 5. Run affected tests (only if code/test/config files changed)
#    - Changed test files: run only those test files
#    - Source code changes: vitest --changed <baseRef>
#    - Full suite: only when forced or test infrastructure changed
```

**Behavior**:
- **Fast-exit**: Immediately skips if no commits to push (checks `@{u}` or remote branch)
- **Single git diff**: One `git diff` call reused for all change detection decisions
- **Parallel style checks**: `check:tokens` and `check:route-themes` run simultaneously (50% faster)
- **Affected tests by default**: 
  - Runs only changed test files when test files are modified (fastest path)
  - Uses `vitest --changed <baseRef>` for source code changes (runs tests affected by changed files)
  - Full suite (`pnpm test:fast`) only when `HUSKY_FORCE=1` or test infrastructure changed (package.json, vitest.config, tsconfig, etc.)
- **Change-based execution**: Only runs checks relevant to changed files
- **Fallback safety**: If base cannot be determined, runs both checks with full suite
- **Logging**: Logs written to `.git/husky-logs/pre-push-<timestamp>.log`

**Environment Variables**:
- `HUSKY_FORCE=1`: Run all checks regardless of changed files (forces full test suite)
- `HUSKY_SKIP_TESTS=1`: Skip test suite
- `HUSKY_SKIP_STYLES=1`: Skip style checks
- `HUSKY_VERBOSE=1`: Stream output instead of logging

### ✅ Post-commit Hook (`post-commit`)

**Purpose**: Generate receipts for troubleshooting "docs didn't update" / "pushed nothing" scenarios.

**Execution**:
- Automatically generates receipts when commit includes changes under:
  - `.husky/`, `.cursor/`, `docs/`, `README.md`, `package.json`, `pnpm-lock.yaml`
- Can be forced for any commit: `HUSKY_RECEIPT=1`

**Receipt Contents**:
- SHA (full + short)
- Branch name
- Commit subject
- Timestamp
- Total files changed
- Insertions/deletions (from `git show --numstat`)
- Changed file list (from `git show --name-status`)

**Output**:
- Receipts saved to `.git/husky-logs/post-commit-<timestamp>-<sha>.txt`
- Terminal output: one line with receipt path

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

### Environment Variables

**Pre-commit**:
- `HUSKY_VERBOSE=1`: Stream command output instead of logging to file

**Pre-push**:
- `HUSKY_FORCE=1`: Run all checks regardless of changed files
- `HUSKY_SKIP_TESTS=1`: Skip test suite
- `HUSKY_SKIP_STYLES=1`: Skip style checks
- `HUSKY_VERBOSE=1`: Stream output instead of logging

**Post-commit**:
- `HUSKY_RECEIPT=1`: Force receipt generation for any commit

### Log Locations

All hook logs are stored in `.git/husky-logs/`:
- `pre-commit-<timestamp>.log`: Pre-commit gate execution logs
- `pre-push-<timestamp>.log`: Pre-push check execution logs
- `post-commit-<timestamp>-<sha>.txt`: Commit receipts

**Note**: `.git/husky-logs/` is automatically created by hooks and is gitignored.

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
#!/usr/bin/env sh
. "$(dirname "$0")/husky.sh"  # Load Husky utilities

# Hook logic here
command1 && command2 && command3
```

**Note**: Hooks run in POSIX `sh` for cross-platform compatibility. On Windows, Git Bash is recommended for best performance when executing hooks, as it avoids shell spawning overhead from PowerShell/CMD.

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
| `pre-commit` | 0.5-2 seconds* | Every commit |
| `commit-msg` | <1 second | Every commit |
| `pre-rebase` | 2-3 seconds | During rebases |
| `pre-push` | 5-30 seconds** | Before push |
| `post-commit` | <0.1 second | After commits (conditional) |

\* **Performance optimized** (fail-fast, staged-only):
- **Code commits** (with TS changes): 1-2 seconds (staged typecheck + lint, conditional validations)
- **Code commits** (no TS/config changes): 0.5-1 second (lint only, validations skipped)
- **Docs-only commits**: 0.5-1 second (docs auto-update + lint, other checks skipped)
- **Config-only commits**: 0.5-1 second (minimal validation, most checks skipped)
- **No-op commits**: <0.5 second (fast-exit on empty staged files)

\** **Pre-push performance** (optimized v2):
- **No commits to push**: <0.1 second (fast-exit)
- **Style-only changes**: 2-4 seconds (parallel style checks, 60-70% faster)
- **Small code changes** (1-2 files): 3-8 seconds (affected tests via vitest --changed, 60-75% faster)
- **Test file changes**: 2-5 seconds (only changed test files run, 70-85% faster)
- **Large changes** (infrastructure): 15-40 seconds (full suite when needed, unchanged)
- **Force mode**: 15-40 seconds (all checks, full suite)

**Optimization phases implemented**:
- ✅ **Staged-only checks**: All checks operate on staged files only
- ✅ **Conditional execution**: Gates skip when relevant files unchanged
- ✅ **Fast lint-staged**: ESLint cache enabled, binary font check only on font files
- ✅ **Temp tsconfig**: Typecheck uses temporary config to avoid TS5042 error
- ✅ **Fast-exit**: Pre-push immediately exits if no commits to push
- ✅ **Change-based execution**: Pre-push only runs relevant checks based on changed files
- ✅ **Single git diff**: One diff call reused for all change detection (eliminates redundant git operations)
- ✅ **Parallel style checks**: Token and route-theme checks run simultaneously (~50% faster)
- ✅ **Affected tests**: Runs only changed test files or vitest --changed instead of full suite (~60-80% faster)

### Quality Impact

**Code Quality**:
- ✅ Conventional commit enforcement
- ✅ Fail-fast pre-commit gates (package, env, lint, typecheck, leak guard)
- ✅ Conditional pre-push checks (style, tests)
- ✅ Staged-only execution (fast feedback)

**Troubleshooting**:
- ✅ Post-commit receipts for docs/tooling changes
- ✅ Detailed failure context (gate name, re-run command, log path, action items)
- ✅ Log files for debugging failed hooks

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
-- [Git Workflow Standards](../docs/architecture/import-patterns.md) - Conventional commit and branching standards

---

## 🏷️ Tags

`#git-hooks` `#husky` `#quality-gates` `#documentation` `#conventional-commits` `#ai-optimized` `#ci-cd-complement`

---

**Last Updated**: 2025-09-10 | **Next Review**: Monthly hook effectiveness audit
