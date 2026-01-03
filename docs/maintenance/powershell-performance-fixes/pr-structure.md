---
title: "Powershell Performance Fixes"
description: "Documentation and resources for documentation functionality. Located in maintenance/powershell-performance-fixes/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
---
# PR Structure for PowerShell Performance Fixes

This document outlines the recommended PR structure for the PowerShell performance fixes.

---

## PR #1: P0 - Remove Shell Overuse in Quality Gates

**Title**: `perf(scripts): remove shell overuse in quality-gates-local.ts`

**Branch**: `perf/quality-gates-remove-shell`

**Files Changed**:
- `scripts/ci/quality-gates-local.ts`

**Changes**:
- Replace `spawnSync` with `execa` (no shell needed)
- Remove `shell: true` (was causing PowerShell/cmd.exe overhead)
- Add `preferLocal: true` to find repo-local bins
- Convert to async/await pattern

**Before/After**:
```typescript
// BEFORE
const result = spawnSync(check.command, check.args, {
  stdio: 'pipe',
  encoding: 'utf8',
  shell: true, // Required for Windows compatibility with pnpm
  cwd: process.cwd()
});

// AFTER
const result = await execa(check.command, check.args, {
  cwd: process.cwd(),
  preferLocal: true,
  stdio: 'pipe',
  reject: false,
});
```

**Testing**:
```powershell
# Verify no shell: true
Select-String -Path "scripts/ci/quality-gates-local.ts" -Pattern "shell.*true"
# Should return nothing

# Verify execa is used
Select-String -Path "scripts/ci/quality-gates-local.ts" -Pattern "execa"
# Should show execa import and usage

# Test quality gates
pnpm quality:local
```

**Acceptance Criteria**:
- ✅ `pnpm quality:local` completes successfully from PowerShell
- ✅ No `shell: true` in quality-gates-local.ts
- ✅ Uses `execa` with `preferLocal: true`
- ✅ No new quoting regressions
- ✅ Fewer timeouts / hangs

---

## PR #2: P0 - Fix ensure-ports.ts Windows Breakage

**Title**: `fix(scripts): remove Unix grep fallback in ensure-ports.ts`

**Branch**: `fix/ensure-ports-windows`

**Files Changed**:
- `scripts/maintenance/ensure-ports.ts`

**Changes**:
- Remove Unix fallback that used shell pipeline: `netstat ... | grep ... || ss ... | grep ...`
- Simplify `getProcessesOnPortUnix` to only use `lsof` (no shell pipeline)
- Remove dependency on `grep` which isn't available in PowerShell by default

**Before/After**:
```typescript
// BEFORE (line 158)
const cmd = `netstat -tlnp 2>/dev/null | grep ":${String(port)}" || ss -tlnp 2>/dev/null | grep ":${String(port)}" || true`;
const output = execSync(cmd, {
  encoding: 'utf8',
  shell: '/bin/sh',
  maxBuffer: 1024 * 1024,
});

// AFTER
// Removed shell pipeline fallback
// Only use lsof (most reliable on Unix)
// If lsof fails, return empty array (port likely not in use)
```

**Testing**:
```powershell
# Test ensure-ports works on Windows
tsx scripts/maintenance/ensure-ports.ts --kill-only

# Should complete without errors about missing grep/ss
```

**Acceptance Criteria**:
- ✅ `tsx scripts/maintenance/ensure-ports.ts --kill-only` works in PowerShell
- ✅ No missing-tool errors (grep/ss)
- ✅ Behaves the same whether invoked from PowerShell vs Git Bash

---

## PR #3: P0 - Standardize PowerShell Invocations (if needed)

**Title**: `perf(scripts): standardize PowerShell invocations with -NoProfile`

**Branch**: `perf/powershell-noprofile`

**Status**: ⚠️ **SKIP THIS PR** - Already implemented correctly

**Note**: After audit, found that existing PowerShell invocations already use `-NoProfile`:
- `scripts/maintenance/kill-orphans.ts` ✅ Already uses `-NoProfile`
- `scripts/setup/install-gitleaks.ts` ✅ Already uses `-NoProfile`

**Action**: No changes needed. This PR can be skipped.

---

## PR #4: P1 - Fix lint:filenames Performance

**Title**: `perf(scripts): rewrite lint:filenames as single-process batch checker`

**Branch**: `perf/lint-filenames-batch`

**Files Changed**:
- `scripts/lint/check-filenames.ts` (new file)
- `package.json`

**Changes**:
- Replace per-file `tsx` process spawns with single-process batch checking
- Uses `globby` to get all files, then checks them in-memory
- Eliminates 1000+ process spawns (one per file)

**Before/After**:
```json
// BEFORE (package.json:139)
"lint:filenames": "node -e \"require('glob').globSync('**/*.*',{ignore:['**/node_modules/**','**/.next/**','**/dist/**','**/build/**']}).forEach(f=>require('child_process').spawnSync('tsx',['scripts/lint/check-filename-case.ts',f],{stdio:'inherit'}) )\""

// AFTER
"lint:filenames": "tsx scripts/lint/check-filenames.ts"
```

**New Script** (`scripts/lint/check-filenames.ts`):
- Single process
- Uses `globby` for file discovery
- Checks all files in-memory
- Reports all violations at once

**Testing**:
```powershell
# Measure performance improvement
Measure-Command { pnpm lint:filenames } | Select-Object -Property TotalSeconds

# Verify new script is used
Select-String -Path "package.json" -Pattern "check-filenames"
# Should show: "lint:filenames": "tsx scripts/lint/check-filenames.ts"
```

**Acceptance Criteria**:
- ✅ `pnpm lint:filenames` is dramatically faster (50-80% improvement expected)
- ✅ Output is still readable and stable
- ✅ It doesn't rely on shell tools
- ✅ All violations are reported (same behavior as before)

---

## PR #5: P1 - Parallelize Optional Quality Checks

**Title**: `perf(scripts): parallelize optional quality checks in quality-gates-local`

**Branch**: `perf/quality-gates-parallel`

**Files Changed**:
- `scripts/ci/quality-gates-local.ts`

**Changes**:
- Required checks run sequentially (fail fast)
- Optional checks run in parallel with concurrency limit (max 4 concurrent)
- Uses `p-limit` for controlled parallelization

**Before/After**:
```typescript
// BEFORE
for (const check of checks) {
  const result = await runCheck(check);
  // ... sequential execution
}

// AFTER
// Required checks: sequential (fail fast)
for (const check of requiredChecks) {
  const result = await runCheck(check);
  // ...
}

// Optional checks: parallel (concurrency-limited)
const limit = pLimit(4);
const optionalResults = await Promise.all(
  optionalChecks.map(check => 
    limit(async () => await runCheck(check))
  )
);
```

**Testing**:
```powershell
# Verify parallelization is implemented
Select-String -Path "scripts/ci/quality-gates-local.ts" -Pattern "pLimit"
# Should show import and usage

# Test quality gates
pnpm quality:local
# Should see "Running X optional check(s) in parallel" message
```

**Acceptance Criteria**:
- ✅ Optional checks run in parallel (max 4 concurrent)
- ✅ Required checks still run sequentially (fail fast)
- ✅ Output is still readable (no race conditions in logging)
- ✅ 20-40% faster when optional checks are present

---

## Combined PR Option (Alternative)

If you prefer fewer PRs, you can combine:

**Option A**: Combine PR #1 + PR #5 (Quality Gates improvements)
- **Title**: `perf(scripts): optimize quality-gates-local.ts (remove shell, add parallelization)`
- **Branch**: `perf/quality-gates-optimize`
- **Files**: `scripts/ci/quality-gates-local.ts`

**Option B**: Combine all P0 fixes (PR #1 + PR #2)
- **Title**: `perf(scripts): P0 PowerShell performance fixes (remove shell overuse, fix ensure-ports)`
- **Branch**: `perf/p0-powershell-fixes`
- **Files**: `scripts/ci/quality-gates-local.ts`, `scripts/maintenance/ensure-ports.ts`

**Option C**: Combine all fixes into one PR
- **Title**: `perf(scripts): PowerShell performance improvements (P0+P1 fixes)`
- **Branch**: `perf/powershell-improvements`
- **Files**: All changed files

**Recommendation**: Use separate PRs (#1, #2, #4, #5) for easier review and rollback if needed.

---

## PR Description Template

Use this template for each PR:

```markdown
## Summary
[Brief description of what this PR does]

## Changes
- [List of specific changes]

## Performance Impact
- **Before**: [baseline measurement if available]
- **After**: [expected improvement]

## Testing
- [ ] Verified in PowerShell
- [ ] Verified in Git Bash (if applicable)
- [ ] All tests pass
- [ ] No regressions

## Related
- Addresses issues identified in CURSOR_POWERSHELL_AUDIT_REPORT.md
- Part of PowerShell performance improvement initiative
```

---

## Verification Checklist (Run After Each PR)

```powershell
# 1. Verify no shell: true in quality-gates-local.ts (PR #1)
Select-String -Path "scripts/ci/quality-gates-local.ts" -Pattern "shell.*true"
# Should return nothing

# 2. Verify ensure-ports works (PR #2)
tsx scripts/maintenance/ensure-ports.ts --kill-only
# Should complete without errors

# 3. Verify lint:filenames is faster (PR #4)
Measure-Command { pnpm lint:filenames } | Select-Object -Property TotalSeconds
# Should be significantly faster than before

# 4. Verify parallelization (PR #5)
Select-String -Path "scripts/ci/quality-gates-local.ts" -Pattern "pLimit"
# Should show import and usage

# 5. Overall quality gates test
pnpm quality:local
# Should complete successfully
```

---

## Expected Performance Improvements

After all PRs are merged:

- **Quality Gates**: 20-40% faster (from removing shell overhead + parallelization)
- **Lint Filenames**: 50-80% faster (from single-process approach)
- **Ensure Ports**: No more grep errors on Windows
- **Overall**: 15-30% reduction in total script execution time

---

## Rollback Plan

If any PR causes issues:

1. **PR #1**: Revert to `spawnSync` with `shell: true` (original code)
2. **PR #2**: Revert to original Unix fallback (but note it breaks on Windows)
3. **PR #4**: Revert to original `package.json` command (slower but works)
4. **PR #5**: Remove parallelization, run all checks sequentially

All changes are backward-compatible, so rollback should be straightforward.
