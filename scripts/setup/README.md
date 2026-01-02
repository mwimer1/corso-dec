# Setup Scripts

This directory contains setup and validation scripts for the Corso development environment.

## Overview

These scripts help developers:
- Verify their development environment is properly configured
- Validate project structure and conventions
- Set up branches and development workflows
- Install required tools

All scripts are **cross-platform** (Windows, macOS, Linux) and follow Windows-first principles (no shell tool dependencies like `grep`, `sed`, etc.).

## Scripts Reference

| Script Name | Purpose | When to Run | How to Run | Exit Codes | Platform |
|------------|---------|-------------|------------|------------|----------|
| **env-check.ts** | Checks if required and optional development tools are installed and accessible | After cloning repo, when tools are missing | `pnpm env:check` | `0` = all required tools found<br>`1` = missing required tools | Cross-platform |
| **validate-env.ts** | Validates environment variables are properly configured | Before starting dev server, in CI | `pnpm validate:env` | `0` = validation passed<br>`1` = missing required env vars | Cross-platform |
| **validate-ai-agent-environment.ts** | Validates AI agent development tools and project structure | For AI agent development setup | `pnpm validate:ai-agent-env` | `0` = validation passed<br>`1` = validation failed | Cross-platform |
| **validate-atomic-design.ts** | Audits atomic design system structure and conventions | When working on UI components | `pnpm audit:atomic` | `0` = no issues<br>`1` = issues found | Cross-platform |
| **setup-branch.ts** | Sets up a clean branch from main (fetch, reset, install, verify) | When starting new feature work | `pnpm setup:branch` | `0` = success<br>`1` = error occurred | Cross-platform |
| **install-gitleaks.ts** | Installs gitleaks security scanning tool | When gitleaks is missing | `pnpm tools:gitleaks:install` | `0` = installed<br>`1` = installation failed | Cross-platform |
| **recommend-docs-environment.ts** | Prints VS Code settings recommendations for docs development | When setting up docs workflow | `pnpm docs:setup` | `0` = success<br>`1` = error | Cross-platform |
| **fix-windows-pnpm.ps1** | Fixes pnpm issues on Windows (store prune, reinstall) | When pnpm has issues on Windows | `powershell -File scripts/setup/fix-windows-pnpm.ps1` | N/A (PowerShell script) | Windows only |

## Key Differences

### `env-check.ts` vs `validate-env.ts`

These scripts serve different purposes:

- **`env-check.ts`** (Toolchain Check)
  - Checks if **tools are installed** (Node.js, pnpm, TypeScript, ESLint, etc.)
  - Verifies tool versions are accessible
  - Distinguishes between required and optional tools
  - Use: After cloning repo or when tools are missing

- **`validate-env.ts`** (Environment Variables Check)
  - Checks if **environment variables are set** (NODE_ENV, NEXT_PUBLIC_*, etc.)
  - Validates env var values are correct
  - Provides guidance for missing variables
  - Use: Before starting dev server or in CI

**Example workflow:**
```bash
# 1. Check tools are installed
pnpm env:check

# 2. Check environment variables are configured
pnpm validate:env

# 3. Start development
pnpm dev
```

## Detailed Script Documentation

### env-check.ts

**Purpose:** Verifies development toolchain is installed and accessible.

**Checks:**
- Required: Node.js, pnpm, TypeScript, ESLint, Vitest, Git
- Optional: ast-grep, depcheck, dependency-cruiser, tree-sitter, gitleaks, ts-prune, typedoc, GitHub CLI

**Output:**
- Lists each tool with version or "NOT FOUND" status
- Summary of found/missing tools
- Exits with code 1 if required tools are missing

**Example:**
```bash
$ pnpm env:check
✅ Node.js               v20.19.4
✅ pnpm                 10.17.1
✅ TypeScript           5.7.2
⚠️  gitleaks             NOT FOUND (OPTIONAL)
```

### validate-env.ts

**Purpose:** Validates environment variables are properly configured.

**Checks:**
- Required: `NODE_ENV`
- Recommended: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_AGGRID_ENTERPRISE`

**Output:**
- Reports missing required variables (fails)
- Warns about missing recommended variables (continues)
- Provides specific guidance for each variable

**Example:**
```bash
$ pnpm validate:env
✅ Basic environment validation passed
⚠️  Missing or incorrectly configured recommended variables: NEXT_PUBLIC_APP_URL
```

### validate-ai-agent-environment.ts

**Purpose:** Validates AI agent development environment setup.

**Checks:**
- AI agent development tools
- Project structure and required files

**Use Case:** For developers working on AI agent features or Cursor rules.

### validate-atomic-design.ts

**Purpose:** Audits atomic design system structure and conventions.

**Checks:**
- Directory structure (atoms, molecules, organisms)
- Barrel export consistency
- Design token usage (flags hardcoded styles)
- Component naming conventions (kebab-case)
- Cross-atomic import violations
- Tailwind variants usage
- TypeScript export errors

**Output:**
- Detailed report of issues found
- Summary with recommendations
- Component metrics per atomic level

**Example:**
```bash
$ pnpm audit:atomic
✅ atoms: 15 components
✅ molecules: 8 components
❌ Found 2 atomic design issue(s):
   1. Hardcoded styles detected - should use design tokens
   2. Atoms violating import hierarchy
```

### setup-branch.ts

**Purpose:** Sets up a clean branch from main for new feature work.

**Steps (sequential):**
1. Ensures git is available; switches to main (creates tracking if needed)
2. Fetches origin, prunes, resets hard to origin/main
3. Cleans workspace of build caches/reports
4. Installs dependencies with frozen lockfile
5. Verifies AI tools and environment
6. Runs typecheck and lint
7. Kicks off helpful reports in background (best-effort, non-blocking)

**Note:** Uses best-effort approach - non-fatal errors are logged but don't stop execution.

### install-gitleaks.ts

**Purpose:** Installs gitleaks security scanning tool.

**Platform-specific:**
- Windows: Prefers `winget`, falls back to `choco`
- Linux/macOS: Uses official install script

**Use Case:** When gitleaks is missing and needed for security scanning.

### recommend-docs-environment.ts

**Purpose:** Prints recommended VS Code settings and keybindings for documentation development.

**Note:** This script **does not modify files** - it only prints recommendations that you can copy into your `.vscode/settings.json` and `.vscode/keybindings.json`.

**Output:**
- VS Code settings JSON (for `.vscode/settings.json`)
- VS Code keybindings JSON (for `.vscode/keybindings.json`)
- Quick reference for documentation commands
- Available documentation scripts

### fix-windows-pnpm.ps1

**Purpose:** Fixes pnpm issues on Windows (PowerShell script).

**Steps:**
1. Stops running pnpm processes
2. Prunes pnpm store
3. Cleans local caches
4. Removes lockfile and node_modules
5. Reinstalls with `--node-linker=isolated`
6. Verifies ast-grep
7. Runs typecheck smoke test

**Use Case:** When pnpm has issues on Windows (corrupted store, binary issues, etc.).

**Note:** Windows-only script. On other platforms, use standard pnpm commands.

## Exit Code Standards

All setup scripts follow consistent exit code patterns:

- **`0`** = Success / All checks passed
- **`1`** = Failure / Errors found / Missing requirements

Scripts that use `process.exitCode` (instead of `process.exit()`) allow for composability and testing.

## Platform Assumptions

All scripts are **cross-platform** except:
- `fix-windows-pnpm.ps1` - Windows only (PowerShell)

Scripts avoid shell tool dependencies (no `grep`, `sed`, `find`, bash pipes, etc.) to ensure Windows compatibility.

## Integration with Workflows

These scripts are integrated into development workflows:

- **`setup:branch`** - Called during initial setup
- **`validate:env`** - Called in CI and pre-commit hooks
- **`env:check`** - Called during environment verification
- **`audit:atomic`** - Called during component development

See `package.json` for all available npm scripts.

## Troubleshooting

### Script fails with "command not found"
- Run `pnpm env:check` to verify tools are installed
- Ensure `node_modules/.bin` is in PATH (should be automatic with pnpm)

### Environment validation fails
- Check `.env.local` file exists in project root
- Verify required variables are set (see `validate-env.ts` output)
- Review `.env.example` for reference

### Windows-specific issues
- Use `fix-windows-pnpm.ps1` for pnpm issues
- Ensure PowerShell execution policy allows scripts
- Check that `winget` or `choco` is available for tool installation

## Related Documentation

- [Development Setup Guide](../../docs/development/setup-guide.md)
- [Environment Variables Reference](../../docs/references/env.md)
- [Repository Directory Structure](../../docs/codebase/repository-directory-structure.md)
