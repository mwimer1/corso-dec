# Remaining Action Items - Maintenance Suite Audit

## Overview

This document lists all remaining action items from the Maintenance Suite Audit that have not yet been implemented. Items are organized by priority and category.

## ✅ Completed Items

All P0 (critical) and P1 (important) items have been completed:
- ✅ P0: Safety improvements (interactive confirmations, dry-run defaults)
- ✅ P0: Windows compatibility fixes
- ✅ P1: Dead code detection consolidation
- ✅ P1: Duplication detection consolidation
- ✅ P1: Cleanup command naming standardization
- ✅ P2: Orphaned script removal
- ✅ P2: Unified help system
- ✅ P2: Output format standardization

## 📋 Remaining Action Items

### P2 - Minor Improvements (Recommended)

#### 1. Documentation Consolidation
**Status**: Pending  
**Priority**: Medium  
**Description**: Merge overlapping documentation validation commands

**Actions**:
- [ ] Evaluate `docs:check` vs `docs:validate` - determine if they can be merged
- [ ] If `docs:check` has unique functionality, document the difference
- [ ] If redundant, deprecate one in favor of the other
- [ ] Update all references in CI and documentation

**Files to Review**:
- `scripts/maintenance/validate-docs.ts` (docs:links/docs:validate)
- `scripts/maintenance/validate-doc-links.ts` (docs:check)

---

#### 2. Barrel Check Consolidation
**Status**: Pending  
**Priority**: Medium  
**Description**: Unify barrel validation commands

**Actions**:
- [ ] Review `validate:barrels` (Vitest test) vs `barrels:policy:check` (custom script)
- [ ] Determine if they can be unified under a single `audit:barrels` command
- [ ] Consider merging `verify:no-intradomain-root-barrels` into the unified command
- [ ] Create a single entry point that runs all barrel-related checks

**Files to Review**:
- `tests/barrels/constants-barrel.node.test.ts` (validate:barrels)
- `scripts/maintenance/barrels/policy-check.ts` (barrels:policy:check)
- `scripts/validation/verify-intradomain-barrels.ts` (verify:no-intradomain-root-barrels)

---

#### 3. Quality Gate Consolidation
**Status**: Pending  
**Priority**: Medium  
**Description**: Unify quality gate commands

**Actions**:
- [ ] Review differences between `validate`, `quality:local`, and `quality:ci`
- [ ] Document why `quality:local` includes more checks (bundle size, etc.)
- [ ] Consider creating a single `quality:full` command with environment-based flags
- [ ] Ensure CI uses the appropriate subset

**Files to Review**:
- `package.json` (validate, quality:local, quality:ci definitions)
- Any scripts that orchestrate quality checks

---

#### 4. Remove Legacy Batch Commands
**Status**: Pending  
**Priority**: Low  
**Description**: Remove one-time batch cleanup commands

**Actions**:
- [ ] Verify `cleanup:atoms:trim:batch01` is no longer needed
- [ ] Check git history to confirm batch01 was a one-time operation
- [ ] Remove the command if confirmed obsolete
- [ ] Document any remaining batch operations if they're still needed

**Files to Review**:
- `package.json` (cleanup:atoms:trim:batch01)
- `scripts/analysis/trim-atoms-barrel.ts` (preset=batch01 logic)

---

#### 5. Performance Optimization
**Status**: Pending  
**Priority**: Medium  
**Description**: Optimize maintenance scripts for performance

**Actions**:
- [ ] Combine `validate:orphans` and `validate:cycles` to run Madge once
- [ ] Cache parsed ASTs between related tasks (scan + trim)
- [ ] Optimize AST-grep rule execution (batch rules together)
- [ ] Profile slow scripts and optimize bottlenecks

**Areas to Optimize**:
- `validate:orphans` + `validate:cycles` (both use Madge)
- `scan:*` + `cleanup:*` scripts (repeated file I/O)
- `validate:cursor-rules` (AST-grep performance)

---

#### 6. Report Directory Structure
**Status**: Partially Complete  
**Priority**: Low  
**Description**: Ensure all reports follow consistent structure

**Actions**:
- [x] Move orphan report to `reports/orphan/` (completed)
- [ ] Verify all reports use `reports/` subdirectories
- [ ] Document standard report locations
- [ ] Add `.gitignore` entries for report files if needed

**Current Report Locations**:
- `reports/orphan/` - Orphan file reports ✅
- `reports/duplication/` - Duplication reports ✅
- `reports/exports/` - Export audit reports ✅
- `reports/jscpd-docs/` - Documentation duplication ✅

---

### P3 - Future Enhancements (Optional)

#### 7. Unified Maintenance CLI
**Status**: Future  
**Priority**: Low  
**Description**: Create a unified CLI similar to docs CLI

**Actions**:
- [ ] Design CLI structure (similar to `scripts/maintenance/docs/cli.ts`)
- [ ] Create `scripts/maintenance/cli.ts` with subcommands:
  - `cleanup` - All cleanup operations
  - `validate` - All validation checks
  - `audit` - All audit operations
  - `scan` - All scanning operations
- [ ] Migrate existing commands to use the CLI
- [ ] Add comprehensive help system

**Example Structure**:
```bash
pnpm maintenance cleanup ui --write
pnpm maintenance validate dead-code
pnpm maintenance audit orphans --apply
pnpm maintenance scan styles
```

---

#### 8. CI Integration Improvements
**Status**: Future  
**Priority**: Low  
**Description**: Enhance CI integration for maintenance scripts

**Actions**:
- [ ] Ensure all maintenance scripts exit with proper codes in CI
- [ ] Add artifact uploads for reports in CI
- [ ] Create CI-specific variants that are quieter
- [ ] Document CI usage patterns

---

#### 9. Documentation Updates
**Status**: Future  
**Priority**: Medium  
**Description**: Update all documentation to reflect changes

**Actions**:
- [ ] Update main README with new command names
- [ ] Create maintenance command reference guide
- [ ] Update contributing guide with maintenance standards
- [ ] Document migration path from old to new commands
- [ ] Add examples for common maintenance tasks

**Files to Update**:
- `README.md`
- `docs/tools-scripts/development-tools.md`
- `CONTRIBUTING.md` (if exists)
- Any other documentation referencing maintenance commands

---

#### 10. Remove Deprecated Scripts (After Migration Period)
**Status**: Future  
**Priority**: Low  
**Description**: Remove deprecated scripts after migration period

**Actions**:
- [ ] Monitor usage of deprecated commands (`deadcode`, `lint:unused`, `validate:dup`)
- [ ] After 2-3 release cycles, remove deprecated scripts entirely
- [ ] Remove `ts-prune-allowlist.txt` if no longer needed
- [ ] Remove `scripts/maintenance/duplication/run-jscpd.ts` if fully replaced

**Deprecated Commands to Monitor**:
- `deadcode` → Use `validate:dead-code`
- `lint:unused` → Use `validate:dead-code`
- `validate:dup` → Use `validate:duplication`

---

## Implementation Priority

### High Priority (Next Sprint)
1. Documentation Consolidation (#1)
2. Barrel Check Consolidation (#2)
3. Performance Optimization (#5)

### Medium Priority (Next Quarter)
4. Quality Gate Consolidation (#3)
5. Documentation Updates (#9)
6. Report Directory Structure (#6)

### Low Priority (Future Releases)
7. Remove Legacy Batch Commands (#4)
8. Unified Maintenance CLI (#7)
9. CI Integration Improvements (#8)
10. Remove Deprecated Scripts (#10)

## Notes

- All P0 and P1 items from the audit have been completed
- P2 items are recommended improvements but not critical
- P3 items are future enhancements that would be nice to have
- Focus should be on items #1-3 for the next iteration

## Related Documentation

- [Maintenance Audit Implementation](./MAINTENANCE_AUDIT_IMPLEMENTATION.md)
- [Consolidation Summary](./CONSOLIDATION_SUMMARY.md)
- [Maintenance Standards](./MAINTENANCE_STANDARDS.md) (to be created)

