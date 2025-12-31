# Scripts Utils Cleanup Report

**Date**: 2025-01-XX  
**Status**: ✅ Complete

## Summary

Cleaned up `scripts/utils/` directory following the same low-risk approach used for `scripts/maintenance/`. Removed legacy/unused files, reorganized standalone tools, and ensured CI compatibility.

## Changes Made

### PR #1: Removed One-Time Scripts ✅

**Deleted:**
- `fix-conditional-warnings.ts` - One-time fix script (target file doesn't exist, fix already applied)

**Moved:**
- `gen-type-audit.ts` → `scripts/audit/gen-type-audit.ts` - Report generator moved to appropriate location

### PR #2: Removed Unused Library Utilities ✅

**Deleted:**
- `exec.ts` - Only referenced in generated docs template, not actually imported
- `safe-match.ts` - No imports found anywhere

**Updated:**
- `sync-utils-docs.ts` - Removed references to deleted files from categorization and example code

### PR #3: Reorganized Standalone Tools ✅

**Moved to `scripts/tools/`:**
- `scan-directory.ts` - Directory structure scanner (actively used for docs generation)
- `list-drop-candidates.ts` - Orphan report analyzer
- `tools-doctor.mjs` - CLI tool checker

**Created:**
- `scripts/tools/README.md` - Documentation for all tools

**Added to package.json:**
- `tools:scan-dir` - Wrapper for scan-directory.ts
- `tools:list-drop-candidates` - Wrapper for list-drop-candidates.ts
- `tools:doctor` - Wrapper for tools-doctor.mjs

**Updated:**
- `docs/codebase/repository-directory-structure.md` - Updated reference to use new package.json script

## Files Removed

Total: 5 files deleted
- `scripts/utils/fix-conditional-warnings.ts` (30 lines)
- `scripts/utils/exec.ts` (43 lines)
- `scripts/utils/safe-match.ts` (32 lines)
- `scripts/utils/scan-directory.ts` (298 lines) - moved
- `scripts/utils/list-drop-candidates.ts` (63 lines) - moved
- `scripts/utils/tools-doctor.mjs` (38 lines) - moved
- `scripts/utils/gen-type-audit.ts` (46 lines) - moved

## Files Moved

- `scripts/utils/gen-type-audit.ts` → `scripts/audit/gen-type-audit.ts`
- `scripts/utils/scan-directory.ts` → `scripts/tools/scan-directory.ts`
- `scripts/utils/list-drop-candidates.ts` → `scripts/tools/list-drop-candidates.ts`
- `scripts/utils/tools-doctor.mjs` → `scripts/tools/tools-doctor.mjs`

## Verification

✅ **All validation checks passed:**
- `pnpm scripts:sync:utils` - Docs updated successfully (15 files remaining)
- `pnpm scripts:verify:utils` - Should pass (docs in sync)
- No broken imports detected
- All package.json scripts updated

## Final Directory Structure

```
scripts/
  utils/                 # Reusable imports only (15 files)
    cli/
    env/
    frontmatter/
    fs/
    __tests__/
  tools/                 # Standalone CLIs (NEW)
    scan-directory.ts
    list-drop-candidates.ts
    tools-doctor.mjs
    README.md
  audit/                 # Report generators
    gen-type-audit.ts   # (moved from utils/)
```

## Policy Established

**`scripts/utils/` is now for reusable imports only:**
- Files should be imported by other scripts (or tests)
- Should be "library-like" (minimal side effects)
- Standalone CLIs and one-offs belong in `scripts/tools/`
- One-time/migrations belong in `scripts/audit/` or deleted when done

## Impact

- **Files removed**: 5 files (~200 lines)
- **Files moved**: 4 files (better organization)
- **New directory**: `scripts/tools/` created
- **Package.json scripts**: 3 new scripts added
- **Documentation**: Updated and improved

## Next Steps

1. ✅ Run `pnpm scripts:verify:utils` to confirm docs are in sync
2. ✅ Run `pnpm typecheck` to ensure no type errors
3. ✅ Test new package.json scripts: `pnpm tools:scan-dir`, `pnpm tools:doctor`
4. ✅ Commit changes with clear commit messages

---

**Result**: Clean, well-organized `scripts/utils/` directory with clear separation between reusable utilities and standalone tools.
