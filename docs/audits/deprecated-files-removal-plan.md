---
status: "draft"
last_updated: "2025-12-15"
category: "documentation"
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
---
# Deprecated Files Removal Plan

**Status**: Ready for Implementation  
**Estimated Effort**: Medium (2-4 hours)  
**Risk Level**: Low (most files are test-only or have documented alternatives)

This document provides a comprehensive, step-by-step plan for removing deprecated and unused barrel files identified in the App Directory Audit. Each file section includes dependencies, migration steps, and validation procedures.

## Overview

The audit identified several categories of deprecated files:
1. **Component barrels** - Unused barrel files that can be removed after import path updates
2. **Lib barrels** - Some marked as deprecated but may still be in use (need verification)
3. **Sentry monitoring** - Unused monitoring utilities superseded by custom logger
4. **Test-only files** - Files only referenced by tests that can be removed with test updates

## Removal Strategy

### Phase 1: Low-Risk Removals (Test-Only References)
Files that are only referenced by tests or tooling can be safely removed first.

### Phase 2: Import Path Migrations
**⚠️ DECISION: Skip Phase 2**

After investigation:
- `components/index.ts` is **actively enforced** by linting rules in `sgconfig.yml` and is in the allowlist. It should be kept as part of the design system architecture.
- Insights barrel files (`constants/index.ts`, `widgets/index.ts`) don't exist - they are direct files. No action needed.

**Note**: The audit finding about removing `components/index.ts` contradicts the codebase architecture which enforces its use. This barrel should remain.

### Phase 3: Verification & Documentation
Update documentation and remove references from allowlists.

---

## Phase 1: Low-Risk Removals

### 1.1 Components - Dashboard Entity Renderers Barrel

**File**: `components/dashboard/entity/shared/renderers/index.ts`

**Status**: ✅ Already removed - File does not exist

**Current State**:
- The barrel file does not exist
- Only `value-formatter.ts` exists in the renderers directory
- Imports use direct file paths (e.g., `@/components/dashboard/entity/shared/renderers/value-formatter`)
- No action needed - already cleaned up

---

### 1.2 Sentry Monitoring Stubs

**Files**:
- `lib/monitoring/sentry/capture.ts`
- `lib/monitoring/sentry/init.ts`
- `lib/monitoring/sentry/init-client.ts`

**Status**: ✅ Already removed (verified via file search)

**Note**: These files have already been cleaned up. No action needed.

---

## Phase 2: Import Path Migrations

### 2.1 Components Root Barrel

**File**: `components/index.ts`

**Status**: ⚠️ **SHOULD BE KEPT** - Actively enforced by linting rules

**Important Note**: The codebase has active enforcement rules in `sgconfig.yml` that **require** using `@/components` instead of deeper imports. The barrel is part of the design system architecture and should **NOT be removed**. This contradicts the audit finding - the barrel serves an important architectural purpose.

**Decision**: Skip removal of `components/index.ts`. Update audit documentation to reflect it should be kept.

**Current Usage**:
The file is imported in 14 component files:
- `components/auth/layout/auth-navbar.tsx`
- `components/insights/layout/nav.config.ts`
- `components/ui/organisms/footer.tsx`
- `components/ui/organisms/navbar/navbar.tsx`
- `components/ui/organisms/footer-system/*` (3 files)
- `components/landing/layout/nav.config.ts`
- `components/landing/sections/hero/hero.tsx`
- `components/landing/widgets/animated-pill/animated-pill.tsx`
- `components/landing/sections/roi/roi-calculator.tsx`
- `components/ui/organisms/public-layout.tsx`
- `components/chat/sections/chat-composer.client.tsx`
- Plus app routes: `app/(marketing)/page.tsx`, `app/(marketing)/insights/page.tsx`, etc.

**Removal Strategy**:
Since `components/index.ts` exports from domain barrels (`./ui/atoms`, `./ui/molecules`, etc.), we should update imports to use specific domain barrels instead.

**Migration Steps**:
1. Identify what each file imports from `@/components`:
   ```bash
   rg "from ['\"]@/components['\"]" --type ts --type tsx -A 2
   ```
2. For each file, replace `@/components` imports with specific domain imports:
   - `@/components/ui/atoms` → keep as is or import from specific file
   - `@/components/ui/molecules` → keep as is or import from specific file
   - `@/components/ui/organisms` → keep as is or import from specific file
   - `APP_LINKS` → import from `@/lib/shared`
   - Pricing plan UI → import from `@/components/marketing/pricing/plan-ui`
3. Delete `components/index.ts`
4. Update `scripts/audit/orphans.allowlist.json` to remove `components/index.ts`
5. Update any ESLint config or codemod scripts that reference it

**Example Migration**:
```typescript
// Before
import { RouteLoading, ErrorFallback } from '@/components';

// After
import { RouteLoading } from '@/components/ui/atoms';
import { ErrorFallback } from '@/components/ui/organisms';
```

**Validation**:
```bash
pnpm typecheck
pnpm lint
pnpm test
# Verify no broken imports
rg "from ['\"]@/components['\"]" --type ts --type tsx
```

---

### 2.2 Insights Component Barrels

**Files**:
- ~~`components/insights/constants/index.ts`~~ - **Does not exist** (constants are in `constants.ts` directly)
- ~~`components/insights/widgets/index.ts`~~ - **Does not exist** (widgets import directly)

**Status**: ✅ No action needed - These barrels don't exist

**Current Usage**:
- `components/insights/sections/insight-detail.tsx` imports from `@/components/insights/constants` (which is `constants.ts`, not a barrel)
- `RelatedArticles` is imported directly from `@/components/insights/widgets/related-articles`

**Note**: The audit referenced these as if they were barrels, but they are actually direct files. No barrel removal needed here.

---

## Phase 3: Lib Barrels (Requires Careful Verification)

These barrels are marked in the audit but the context audit shows they may still be in active use. **Do not remove without thorough verification**.

### 3.1 Lib Barrels Status Check

**Files to Verify**:
- `lib/api/server/index.ts` - May be in active use (many dependents)
- `lib/auth/index.ts` - In active use (public barrel)
- `lib/config/index.ts` - In active use
- `lib/core/index.ts` - In active use (client-safe barrel - DO NOT REMOVE)
- `lib/marketing/index.ts` - In active use (widely used)
- `lib/server/config/index.ts` - Some usage
- `lib/server/dashboard/index.ts` - Server barrel in use
- `lib/server/errors/index.ts` - Verify usage
- `lib/server/security/index.ts` - Verify usage

**Verification Process**:
1. For each file, check actual runtime imports:
   ```bash
   # Example for lib/api/server/index.ts
   rg "from ['\"]@/lib/api/server['\"]" --type ts --type tsx --type js
   ```
2. Distinguish between:
   - **Runtime app code usage** → Keep the barrel
   - **Test-only usage** → Can consolidate tests
   - **Documentation-only references** → Can update docs
3. If truly unused in runtime code:
   - Update tests/docs to import directly
   - Remove barrel file
   - Update allowlists

**⚠️ Important**: `lib/core/index.ts` is a **client-safe barrel** and should **NOT be removed** per the codebase architecture. It provides a controlled client-safe API surface.

---

## Phase 4: Test and Tooling Updates

### 4.1 Update Orphan Allowlist

**File**: `scripts/audit/orphans.allowlist.json`

**Updates Needed**:
- Remove entries for deleted files
- Keep entries for files we're retaining

### 4.2 Update ESLint Config

**File**: `eslint.config.mjs`

Check for any deprecated import rules that reference deleted files and remove them.

### 4.3 Update Barrel Integrity Tests

**Files**: `tests/lib/barrels.integrity*.test.ts`

If any barrels are removed, update these tests to reflect the new structure.

### 4.4 Update Documentation

**Files to Update**:
- `docs/audits/orphans-20251009.md` - Mark items as completed
- `docs/codebase-apis/import-patterns.md` - Update examples if needed
- Any README files that reference deleted barrels

---

## Implementation Checklist

### Pre-Implementation
- [ ] Create a feature branch: `chore/remove-deprecated-barrels`
- [ ] Backup current state: `git stash` or commit current work
- [ ] Run full test suite to establish baseline: `pnpm test`

### Phase 1: Low-Risk Removals ✅
- [x] Verify renderers barrel status - **Already removed, no file exists**
- [x] Verify Sentry files status - **Already removed, no files exist**
- [x] **Phase 1 Complete** - All items already cleaned up

### Phase 2: Import Migrations ⚠️ SKIPPED
- [x] **Decision**: Keep `components/index.ts` - it's actively enforced by linting rules and part of the design system
- [x] Insights barrels don't exist - already using direct files
- [x] **Phase 2 Skipped** - No action needed

### Phase 3: Lib Barrels (If Applicable)
- [ ] Verify each lib barrel's actual usage
- [ ] Only remove barrels confirmed unused in runtime code
- [ ] Update tests/docs for removed barrels
- [ ] Run: `pnpm typecheck && pnpm lint && pnpm test`

### Phase 4: Cleanup
- [ ] Update `scripts/audit/orphans.allowlist.json`
- [ ] Update ESLint config if needed
- [ ] Update barrel integrity tests
- [ ] Update documentation files
- [ ] Update `docs/audits/orphans-20251009.md` with completion status

### Final Validation
- [ ] `pnpm typecheck` - No type errors
- [ ] `pnpm lint` - No lint errors
- [ ] `pnpm test` - All tests pass
- [ ] `pnpm build` - Production build succeeds
- [ ] Manual smoke test of key features
- [ ] Review git diff for unintended changes

### Commit & PR
- [ ] Commit with message: `chore: remove deprecated barrel files and update imports`
- [ ] Create PR with description of changes
- [ ] Request review

---

## Rollback Plan

If issues are discovered after removal:

1. **Immediate Rollback**:
   ```bash
   git revert <commit-hash>
   ```

2. **Partial Rollback**: Restore specific files from git history:
   ```bash
   git checkout <previous-commit> -- <file-path>
   ```

3. **Import Fixes**: If only import paths are broken, create a quick fix PR with corrected imports.

---

## Estimated Impact

- **Lines of Code Removed**: ~500-800 lines (barrel files + test updates)
- **Import Updates Required**: ~15-20 files (component imports)
- **Test Files Affected**: 3-5 test files
- **Documentation Updates**: 2-3 documentation files

---

## Notes

1. **Component Index Barrel**: The `components/index.ts` file is actively used. Consider keeping it if the migration effort is too high, or prioritize it for a dedicated refactoring sprint.

2. **Lib Barrels**: Most lib barrels appear to be in active use. The audit context document shows they have many dependents. Only remove if confirmed unused in runtime code.

3. **Incremental Approach**: Consider doing this in multiple PRs:
   - PR 1: Phase 1 (low-risk removals)
   - PR 2: Phase 2 (component barrel migrations)
   - PR 3: Phase 3 (lib barrel verification/removal if needed)

4. **Testing**: After each phase, run the full test suite and do a manual smoke test to catch any runtime issues.

---

**Last Updated**: 2025-12-14  
**Next Review**: After implementation completion

