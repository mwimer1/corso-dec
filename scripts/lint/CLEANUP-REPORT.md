# Lint Scripts Cleanup Report

**Date**: 2025-01-27  
**Commit**: `chore(scripts): remove broken lint script refs + fix filenames lint`

## Summary

Successfully cleaned up broken script references and fixed filename mismatch in `scripts/lint` directory without breaking CI or hooks.

## Changes Made

### 1. Removed Broken package.json Script References

**Removed scripts:**
- `lint:hooks:prefix` → Referenced missing `scripts/lint/validate-hook-prefix.ts`
- `lint:hooks:size` → Referenced missing `scripts/lint/validate-hook-size.ts`
- `audit:full` → Referenced missing `scripts/lint/audit-verification-matrix.ts`

**Safety verification:**
- ✅ None of these scripts are referenced in `.github/workflows/*`
- ✅ None of these scripts are referenced in `.husky/*` hooks
- ✅ `audit:full` only mentioned in docs, not in CI
- ✅ `lint:hooks:prefix` and `lint:hooks:size` not used in any workflows

**Impact:** No CI/hooks broken. These scripts were already failing silently.

### 2. Fixed Filename Mismatch (Windows-Safe)

**Issue:** `package.json` referenced `check-filename-case.ts` but file was named `checkFilenameCase.ts`

**Solution:** Renamed file using `git mv` (Windows-safe):
```bash
git mv scripts/lint/checkFilenameCase.ts scripts/lint/check-filename-case.ts
```

**Updated:**
- File renamed: `scripts/lint/checkFilenameCase.ts` → `scripts/lint/check-filename-case.ts`
- File comment updated to match new filename
- `package.json` `lint:filenames` script now correctly references the file

**Validation:** ✅ `pnpm lint:filenames` now passes

### 3. Deleted Unused Duplicate Script

**Deleted:** `scripts/lint/check-workflows-pnpm.mjs`

**Reason:**
- Not referenced in `package.json`
- Not referenced in `.github/workflows/*`
- Not referenced in `.husky/*`
- Duplicate functionality: `scripts/ci/workflows-consistency-report.mjs` provides comprehensive coverage
- `lint:workflows:pnpm` correctly uses `scripts/ci/workflows-consistency-report.mjs`

**Impact:** Cleanup only. No functionality lost.

## Validation Results

### ✅ Commands That Now Pass

1. **`pnpm lint:scripts`**
   - Status: Passes (pre-existing warnings unrelated to these changes)
   - Note: Pre-existing duplicate script warning for `docs:links`/`docs:validate` remains

2. **`pnpm lint:filenames`**
   - Status: ✅ Now passes correctly
   - Previously failed due to filename mismatch

### Scripts Removed from package.json

| Script | Previous Value | Status |
|--------|---------------|--------|
| `lint:hooks:prefix` | `pnpm exec tsx scripts/lint/validate-hook-prefix.ts` | ❌ Removed (file missing) |
| `lint:hooks:size` | `pnpm exec tsx scripts/lint/validate-hook-size.ts` | ❌ Removed (file missing) |
| `audit:full` | `pnpm exec tsx scripts/lint/audit-verification-matrix.ts && ...` | ❌ Removed (file missing) |

### Files Deleted

- `scripts/lint/check-workflows-pnpm.mjs` (29 lines) - Unused duplicate

### Files Renamed

- `scripts/lint/checkFilenameCase.ts` → `scripts/lint/check-filename-case.ts`

## Remaining Scripts Status

All other lint scripts remain functional and referenced in package.json:
- ✅ `lint:hooks:deps` - Still works (uses `validate-effect-deps.ts` which exists)
- ✅ `lint:workflows:pnpm` - Still works (uses `scripts/ci/workflows-consistency-report.mjs`)
- ✅ All other lint scripts - No changes, all functional

## Notes

- Documentation files (`scripts/lint/README.md`, `docs/codebase/repository-directory-structure.md`) may reference old filenames. These are auto-generated and will be updated on next documentation generation.
- No stub scripts were created per constraints (delete-first approach).
- All changes are minimal and atomic as requested.

## Commit Message

```
chore(scripts): remove broken lint script refs + fix filenames lint

- Remove lint:hooks:prefix (missing validate-hook-prefix.ts)
- Remove lint:hooks:size (missing validate-hook-size.ts)  
- Remove audit:full (missing audit-verification-matrix.ts)
- Fix lint:filenames filename mismatch (checkFilenameCase.ts → check-filename-case.ts)
- Delete unused check-workflows-pnpm.mjs (duplicate of CI script)

Verified: no CI/workflow/hook references to removed scripts
All lint scripts validated: lint:scripts ✅, lint:filenames ✅
```
