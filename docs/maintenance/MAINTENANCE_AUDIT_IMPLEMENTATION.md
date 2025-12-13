---
title: "Maintenance"
description: "Documentation and resources for documentation functionality. Located in maintenance/."
last_updated: "2025-12-13"
category: "documentation"
status: "draft"
---
# Maintenance Suite Audit - Implementation Summary

## Overview

This document tracks the implementation of improvements identified in the Maintenance Suite Audit Report. The audit identified critical safety issues, Windows compatibility problems, and opportunities for consolidation.

## Completed Improvements (P0 - Critical)

### ✅ P0: Safety Improvements

#### 1. Interactive Confirmation for Destructive Operations
**File**: `scripts/audit/orphans.ts`
- **Change**: Added interactive confirmation prompt that requires typing "YES" (all caps) even when `--yes` flag is provided
- **Safety**: Prevents accidental deletion of database tables or files
- **CI Support**: Automatically skips prompt in CI environments (`CI=true` or `GITHUB_ACTIONS=true`)

#### 2. Windows Compatibility Fix
**File**: `scripts/lint/check-pages-runtime.ts` (new)
**File**: `package.json`
- **Change**: Replaced Bash conditional `if [ -d pages ]` with Node.js cross-platform check
- **Impact**: Script now works on Windows without requiring Bash shell
- **Pattern**: Uses `fs.existsSync()` and `fs.statSync()` for directory checks

#### 3. Cleanup Commands Default to Dry-Run
**Files**: `package.json`
- **Change**: 
  - `cleanup:styles` composite now defaults to dry-run (removed automatic `--write` flags)
  - Added `cleanup:styles:apply` for explicit application
  - Standardized `cleanup:shared:trim` naming (removed `:dry` and `:prune` variants, added `:write` and `:delete`)
- **Impact**: Prevents accidental file modifications when running cleanup commands

### ✅ P2: Orphaned Script Removal

#### Removed Unused Scripts
- **Deleted**: `scripts/maintenance/unused-styles/` (entire directory)
  - `unused-styles-detector.ts`
  - `comprehensive-styles-analyzer.ts`
  - `core.ts`
  - `README.md`
- **Deleted**: `scripts/maintenance/rename-package-scripts.ts` (one-time migration tool, no longer needed)
- **Note**: `docs/index.ts` is auto-generated and will automatically remove references on next run

## Completed Improvements (P1 - Important)

### ✅ P1: Consolidation Tasks

#### 1. Dead Code Detection Consolidation
**Status**: ✅ Completed
**Changes**:
- Deprecated `deadcode` script - now shows warning and calls `validate:dead-code` (knip)
- Deprecated `lint:unused` script - now shows warning and calls `validate:dead-code` (knip)
- `validate:dead-code` (knip) is now the canonical dead code detection tool
- **Note**: `deadcode:test-only` remains as it provides specialized functionality

**Files Modified**:
- `package.json`: Updated `deadcode` and `lint:unused` to show deprecation warnings

#### 2. Duplication Detection Consolidation
**Status**: ✅ Completed
**Changes**:
- Updated `validate:dup` to use `.jscpd.json` config directly instead of custom wrapper
- Added `validate:duplication` as alias for consistency
- Updated `.jscpd.json` to include console reporter and proper output directory
- Added deprecation notice to `scripts/maintenance/duplication/run-jscpd.ts`
- **Note**: Specialized `jscpd:*` scripts remain for specific use cases (docs, tests, SARIF output)

**Files Modified**:
- `package.json`: Updated `validate:dup` and added `validate:duplication`
- `.jscpd.json`: Enhanced config with console reporter
- `scripts/maintenance/duplication/run-jscpd.ts`: Added deprecation notice

#### 3. Naming Standardization
**Status**: ✅ Completed
**Changes**:
- Standardized `cleanup:shared:trim` naming (removed `:dry` and `:prune` variants)
- Added `cleanup:shared:trim:write` and `cleanup:shared:trim:delete` for consistency
- Added `cleanup:styles:trim:write` and `cleanup:styles:purge:write` for explicit write operations
- All cleanup commands now follow consistent pattern: `:trim` (dry-run), `:write` (apply), `:delete` (destructive)

**Files Modified**:
- `package.json`: Standardized cleanup command names

### 🔄 P2: Enhancement Tasks

#### 1. Unified Help System
**Status**: Pending
**Goal**: Add `--help` support to all major maintenance scripts
**Pattern**: Use simple manual help (like docs CLI) or yargs for complex scripts
**Scripts to Update**:
- `scripts/analysis/trim-*.ts` scripts
- `scripts/audit/orphans.ts`
- `scripts/maintenance/duplication/run-jscpd.ts`

#### 2. Output Format Standardization
**Status**: Pending
**Goal**: Consistent JSON output and report locations
**Actions Needed**:
- Move `orphan-report.json` to `reports/orphan/` directory
- Standardize JSON schema for all reports
- Add `--format=json` flag to scan commands (already partially implemented)

## Safety Patterns Established

### Dry-Run by Default
All cleanup and modification scripts now follow this pattern:
```typescript
const write = process.argv.includes('--write');
if (!write) {
  console.log('DRY RUN: No changes will be made. Use --write to apply.');
  // ... show what would change
} else {
  // ... apply changes
}
```

### Interactive Confirmation
Destructive operations require explicit confirmation:
```typescript
if (!isCI && !confirmed) {
  const answer = await prompt('Type "YES" to confirm: ');
  confirmed = answer === 'YES';
}
```

### Windows Compatibility
All scripts use Node.js APIs instead of shell-specific commands:
- ✅ `fs.existsSync()` instead of `[ -d path ]`
- ✅ `path.join()` for cross-platform paths
- ✅ No Bash conditionals in package.json scripts

## Testing Recommendations

Before considering this implementation complete, test:

1. **Windows Compatibility**:
   - Run `pnpm lint:pages-runtime` on Windows
   - Verify all cleanup commands work on Windows

2. **Safety**:
   - Test `pnpm audit:orphans:apply` prompts for confirmation
   - Verify `cleanup:styles` defaults to dry-run
   - Confirm cleanup commands don't modify files without `--write`

3. **Orphan Removal**:
   - Verify `docs:index` regenerates without unused-styles reference
   - Confirm no broken imports from deleted scripts

## Completed P2 Tasks

### ✅ P2: Unified Help System
**Status**: ✅ Completed
**Changes**:
- Added `--help` / `-h` support to all major maintenance scripts:
  - `scripts/audit/orphans.ts` - Comprehensive help with examples
  - `scripts/analysis/trim-ui-barrels.ts` - Enhanced yargs help
  - `scripts/analysis/trim-shared-types.ts` - Manual help text
  - `scripts/analysis/trim-styles-barrel.ts` - Manual help text
  - `scripts/analysis/purge-styles.ts` - Manual help text
- All help text includes:
  - Usage examples
  - Option descriptions
  - Safety notes
  - Default behavior explanations

**Files Modified**:
- `scripts/audit/orphans.ts`
- `scripts/analysis/trim-ui-barrels.ts`
- `scripts/analysis/trim-shared-types.ts`
- `scripts/analysis/trim-styles-barrel.ts`
- `scripts/analysis/purge-styles.ts`

### ✅ P2: Output Format Standardization
**Status**: ✅ Completed
**Changes**:
- Moved orphan report default location from root to `reports/orphan/orphan-report.json`
- Ensured output directories are created automatically
- Updated help text to reflect new default paths
- All reports now follow consistent structure:
  - `reports/orphan/` - Orphan file reports
  - `reports/duplication/` - Duplication reports
  - `reports/exports/` - Export audit reports
  - `reports/jscpd-docs/` - Documentation duplication

**Files Modified**:
- `scripts/audit/orphans.ts` - Updated default path and directory creation

## Next Steps

1. **Immediate**: Review remaining P2 action items (see [REMAINING_ACTION_ITEMS.md](./REMAINING_ACTION_ITEMS.md))
2. **Short-term**: Implement high-priority P2 items (documentation consolidation, barrel checks, performance)
3. **Medium-term**: Complete documentation updates and quality gate consolidation
4. **Long-term**: Consider creating a unified maintenance CLI (similar to docs CLI)

## Related Documentation

- [Maintenance Suite Audit Report](./MAINTENANCE_AUDIT_REPORT.md) - Full audit findings
- [Maintenance Standards](./MAINTENANCE_STANDARDS.md) - Proposed standards (to be created)

