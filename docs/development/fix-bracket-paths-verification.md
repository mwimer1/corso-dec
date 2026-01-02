---
status: "draft"
last_updated: "2026-01-02"
category: "documentation"
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
---
# Verification Checklist: Bracket Path Fix

This document outlines verification steps for the fix that prevents Windows from escaping brackets in Next.js dynamic route paths (e.g., `[entity]` → `\[entity\]`) when processing git commands.

## Root Cause Summary

**Problem**: File paths containing brackets (e.g., `app/api/v1/entity/[entity]/route.ts`) were being escaped to `\[entity\]` when passed to git commands via shell string interpolation, causing "pathspec did not match any files" errors.

**Solution**: Replaced `execSync` with shell strings with `execFileSync` using argument arrays and `--` separators to prevent pathspec interpretation.

## Files Changed

1. `scripts/utils/git.ts` - Core git utility functions (3 functions fixed)
2. `scripts/maintenance/validate-docs-on-commit.ts` - Documentation validation script
3. `scripts/assert-no-colocated-tests.cjs` - Test location validation script
4. `scripts/utils/__tests__/git.test.ts` - New regression test

## Verification Steps

### 1. Test Git Utilities Directly (Manual)

Run the regression test:

```bash
pnpm tsx scripts/utils/__tests__/git.test.ts
```

**Expected**: All tests pass, no escaped brackets in output.

### 2. Test with Actual Bracket Paths

Test git utilities with real bracket paths:

```bash
# PowerShell
pnpm tsx -e "import { getGitStatus } from './scripts/utils/git.ts'; console.log(getGitStatus('app/api/v1/entity/[entity]/route.ts'))"

# Git Bash
pnpm tsx -e 'import { getGitStatus } from "./scripts/utils/git.ts"; console.log(getGitStatus("app/api/v1/entity/[entity]/route.ts"))'
```

**Expected**: No errors, status returned (may be empty if file doesn't exist, which is fine).

### 3. Test Pre-commit Hook

Stage a file with brackets and verify pre-commit passes:

```bash
# Create/verify the file exists
git add "app/api/v1/entity/[entity]/route.ts"

# Run pre-commit hook manually
bash .husky/pre-commit
```

**Expected**: Hook completes successfully, no "pathspec" errors.

### 4. Test Pre-push Hook Chain

Run the commands that pre-push executes:

```bash
# Run each command in the pre-push chain
pnpm check:styles
pnpm test:fast
```

**Expected**: All commands complete successfully, no escaped bracket errors.

### 5. End-to-End Push Test

Perform a real push with bracket paths:

```bash
# Ensure you have staged/committed files with bracket paths
git status

# Attempt push (hooks will run automatically)
git push origin main
```

**Expected**: Push succeeds, no "fatal: pathspec ... \[entity\] ... did not match any files" error.

### 6. Cross-Platform Verification

Test on both Windows shells:

#### PowerShell
```powershell
cd C:\path\to\repo
pnpm check:styles
pnpm tsx scripts/utils/__tests__/git.test.ts
```

#### Git Bash
```bash
cd /c/path/to/repo
pnpm check:styles
pnpm tsx scripts/utils/__tests__/git.test.ts
```

**Expected**: Both shells produce identical results, no escaping differences.

### 7. Verify No Regression

Ensure existing functionality still works:

```bash
# Test with regular paths (no brackets)
pnpm tsx -e "import { getGitStatus } from './scripts/utils/git.ts'; console.log(getGitStatus('package.json'))"

# Test with patterns
pnpm tsx -e "import { listTrackedFiles } from './scripts/utils/git.ts'; console.log(listTrackedFiles('app/**/*.ts').length)"
```

**Expected**: Normal paths and patterns still work correctly.

## CI/CD Integration (Recommended)

Add to `.github/workflows/pr-checks.yml` or create a Windows-specific job:

```yaml
jobs:
  test-windows-hooks:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm check:styles
      - run: pnpm tsx scripts/utils/__tests__/git.test.ts
      - run: pnpm test:fast
```

## Success Criteria

✅ All verification steps pass on Windows (PowerShell and Git Bash)  
✅ No `\[entity\]` or escaped brackets appear in any error messages  
✅ No "pathspec did not match any files" errors  
✅ Pre-commit and pre-push hooks complete normally  
✅ Regression test passes  
✅ Existing functionality (non-bracket paths) unaffected  

## Troubleshooting

If verification fails:

1. **Check for remaining shell string interpolation**:
   ```bash
   rg "execSync.*git|execSync.*\`" scripts/
   ```

2. **Verify argument arrays are used**:
   ```bash
   rg "execFileSync.*git" scripts/
   ```

3. **Check for shell escaping helpers**:
   ```bash
   rg "shell.*escape|quote\(|escape\(" scripts/
   ```

4. **Test git command directly** (to isolate the issue):
   ```bash
   git status --porcelain -- "app/api/v1/entity/[entity]/route.ts"
   ```

If the direct git command works but scripts fail, the issue is in argument passing. If the direct command fails, it may be a git configuration issue.

## Related Files

- `.husky/pre-commit` - Pre-commit hook (calls scripts that use git utilities)
- `.husky/pre-push` - Pre-push hook (runs quality checks)
- `scripts/utils/git.ts` - Core git utility functions (fixed)
- `scripts/lint/check-forbidden-files.ts` - Uses `listTrackedFiles` (benefits from fix)
- `scripts/ci/check-temp-directories.ts` - Uses git utilities (benefits from fix)

## 📚 Related Documentation

- [Development Setup Guide](./setup-guide.md) - Development environment setup
- [Coding Standards](./coding-standards.md) - Code quality and style guidelines
- [Tools & Scripts](../tools-scripts/development-tools.md) - Development tools reference
