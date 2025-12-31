---
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Deprecated Files Removal - Next Steps

**Date**: 2025-12-14  
**Status**: Removals Complete, Validation Pending

## ✅ Completed Actions

### Phase 1: Low-Risk Removals
- ✅ Verified renderers barrel already removed
- ✅ Verified Sentry monitoring stubs already removed

### Phase 2: Component Barrels
- ✅ Decision: Keep `components/index.ts` (enforced by design system)
- ✅ Insights barrels don't exist (already using direct files)

### Phase 3: Lib Barrels Analysis & Removal
- ✅ Removed `lib/auth/index.ts` (unused in production)
- ✅ Removed `lib/marketing/index.ts` (unused in production)
- ✅ Updated `vitest.config.ts` (changed auth alias)
- ✅ Updated `tsconfig.base.json` (removed auth barrel mapping)
- ✅ Updated `scripts/audit/orphans.allowlist.json` (removed marketing barrel)

### Phase 4: Documentation
- ✅ Created `docs/audits/lib-barrels-analysis.md`
- ✅ Created `docs/audits/removal-summary-20251214.md`
- ✅ Updated `docs/audits/orphans-20251009.md`
- ✅ Updated `docs/audits/deprecated-files-removal-plan.md`

### Verification
- ✅ Typecheck: Passes
- ✅ Linting: Passes
- ✅ Production code: No updates needed (already uses direct paths)

---

## 🔄 Remaining Steps

### 1. Run Full Test Suite ⏳

```bash
pnpm test
```

**Purpose**: Verify no tests break due to removed barrels.

**Expected**: All tests should pass since production code already uses direct imports.

---

### 2. Run Production Build ⏳

```bash
pnpm build
```

**Purpose**: Verify the production build succeeds and bundle sizes are correct.

**Expected**: Build should succeed without errors.

---

### 3. Review Git Changes ⏳

```bash
git status
git diff --stat
git diff
```

**Purpose**: Review all changes to ensure nothing unintended was modified.

**Files Changed**:
- `lib/auth/index.ts` (deleted)
- `lib/marketing/index.ts` (deleted)
- `vitest.config.ts` (updated)
- `config/typescript/tsconfig.base.json` (updated)
- `scripts/audit/orphans.allowlist.json` (updated)
- Documentation files (updated)
- `app/README.md` (route documentation fixes)
- `tests/dashboard/a11y-skip-link.dom.test.tsx` (hex color fix)

---

### 4. Optional: Check for Other Items

From the original audit, these items still need decision:

#### `components/dashboard/server.ts`
- **Status**: Referenced by tests and AST-grep rules
- **Action**: Decide whether to keep or remove (requires test/rules update)
- **Priority**: Low (only affects test infrastructure)

#### `types/api/openapi.d.ts`
- **Status**: Generated artifact for OpenAPI tooling
- **Action**: Keep (managed by OpenAPI generation workflow)
- **Priority**: None (keep as-is)

---

### 5. Commit Changes ⏳

```bash
git add -A
git commit -m "chore: remove unused lib barrel files

- Remove lib/auth/index.ts (unused in production, code uses /server and /client directly)
- Remove lib/marketing/index.ts (unused in production, code uses /client and /server directly)
- Update vitest.config.ts to use specific auth paths
- Update tsconfig.base.json to remove auth barrel mapping
- Update orphans allowlist to reflect removals
- Fix: Replace hex color with design token in dashboard test
- Fix: Update app/README.md route documentation

Refs: docs/audits/lib-barrels-analysis.md"
```

---

### 6. Create PR (If Applicable) ⏳

If working on a branch:

```bash
git push origin <branch-name>
# Then create PR via GitHub CLI or web interface
```

**PR Description Template**:
```markdown
## Summary
Removes unused barrel files identified in App Directory Audit.

## Changes
- ✅ Removed `lib/auth/index.ts` - No production usage
- ✅ Removed `lib/marketing/index.ts` - Production code uses direct paths
- ✅ Updated config files (vitest, tsconfig, allowlist)
- ✅ Fixed dashboard test hex color
- ✅ Updated route documentation

## Verification
- ✅ Typecheck passes
- ✅ Linting passes
- ✅ Production code already uses direct imports (no breaking changes)

## Related
- Audit: `docs/audits/lib-barrels-analysis.md`
- Summary: `docs/audits/removal-summary-20251214.md`
```

---

## 📊 Summary of Changes

### Files Removed
- `lib/auth/index.ts` (~25 lines)
- `lib/marketing/index.ts` (~15 lines)

### Files Modified
- `vitest.config.ts` - Updated auth alias
- `config/typescript/tsconfig.base.json` - Removed auth barrel mapping
- `scripts/audit/orphans.allowlist.json` - Removed marketing barrel
- `app/README.md` - Fixed route documentation
- `tests/dashboard/a11y-skip-link.dom.test.tsx` - Fixed hex color

### Documentation Created/Updated
- `docs/audits/lib-barrels-analysis.md` (new)
- `docs/audits/removal-summary-20251214.md` (new)
- `docs/audits/orphans-20251009.md` (updated)
- `docs/audits/deprecated-files-removal-plan.md` (updated)

### Impact
- **Lines Removed**: ~40 lines of unused barrel code
- **Breaking Changes**: None
- **Risk Level**: Low (verified unused)

---

## ✅ Final Checklist

- [x] Phase 1: Low-risk removals (complete)
- [x] Phase 2: Component barrels (decision: keep)
- [x] Phase 3: Lib barrels analysis & removal (complete)
- [x] Phase 4: Documentation updates (complete)
- [x] Typecheck verification (passes)
- [x] Linting verification (passes)
- [ ] **Full test suite** (pending)
- [ ] **Production build** (pending)
- [ ] **Git review** (pending)
- [ ] **Commit changes** (pending)
- [ ] **Create PR** (if applicable, pending)

---

**Last Updated**: 2025-12-14
