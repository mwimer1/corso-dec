---
title: Audits
description: >-
  Documentation and resources for documentation functionality. Located in
  audits/.
last_updated: '2025-12-30'
category: documentation
status: draft
---
# Orphan DROP Verification Report

**Generated:** 2025-01-30  
**Source:** `reports/orphan/orphan-report.json`  
**Total DROP Candidates:** 12  
**Verification Status:** Complete

## Executive Summary

After comprehensive verification of all 12 DROP candidates, we identified:

- **✅ Definitive KEEP:** 4 files (correct location duplicates + valid tests)
- **✅ Safe to Delete (Stage 1):** 2 files (duplicates in wrong location)
- **⚠️ Intentional Removal (Stage 3):** 6 files (require team approval for coverage removal)

**Key Findings:**
- 2 duplicate test files in wrong locations (safe to delete immediately)
- 2 valid test files incorrectly marked as DROP (false positives - keep)
- 6 test files that may be intentionally removed (requires coverage/enforcement review)

**Note:** Current orphan audit (2025-12-30) shows 0 DROP files, likely due to improved detection logic. However, the duplicate files and unused tests identified in this report are still valid cleanup targets.

## Phase 0: DROP-Only Summary Table

| # | Path | File Type | Folder | Reasons | Importers | ExportRefs | Notes |
|---|------|-----------|--------|---------|-----------|------------|--------|
| 1 | `tests/api/mockdb-duckdb.node.test.ts` | `.ts` | `tests/api/` | [] | [] | [] | **DUPLICATE** - Identical to `tests/integrations/mockdb/duckdb.test.ts` |
| 2 | `tests/api/sql-guard.node.test.ts` | `.ts` | `tests/api/` | [] | [] | [] | Tests `guardSQL` (different from security tests) |
| 3 | `tests/core/barrels.test.ts` | `.ts` | `tests/core/` | [] | [] | [] | **DUPLICATE** - Identical to `tests/lib/marketing/barrels.test.ts` |
| 4 | `tests/core/import-discipline.test.ts` | `.ts` | `tests/core/` | [] | [] | [] | Tests import baseline enforcement |
| 5 | `tests/styles/breakpoints-triangulation.test.ts` | `.ts` | `tests/styles/` | [] | [] | [] | Docs reference `.spec.ts` version (outdated) |
| 6 | `tests/styles/breakpoints.test.ts` | `.ts` | `tests/styles/` | [] | [] | [] | Tests Tailwind breakpoint alignment |
| 7 | `tests/styles/typography-presence.test.ts` | `.ts` | `tests/styles/` | [] | [] | [] | Docs reference `.spec.ts` version (outdated) |
| 8 | `tests/ui/error-fallback.dom.test.tsx` | `.tsx` | `tests/ui/` | [] | [] | [] | Tests ErrorFallback component |
| 9 | `tests/ui/react-keys.dom.test.tsx` | `.tsx` | `tests/ui/` | [] | [] | [] | Tests React key warnings |
| 10 | `tests/integrations/mockdb/duckdb.test.ts` | `.ts` | `tests/integrations/` | [] | [] | [] | **DUPLICATE** - Identical to `tests/api/mockdb-duckdb.node.test.ts` |
| 11 | `tests/lib/marketing/barrels.test.ts` | `.ts` | `tests/lib/` | [] | [] | [] | **DUPLICATE** - Identical to `tests/core/barrels.test.ts` |
| 12 | `tests/ui/providers/route-theme-provider.dom.test.tsx` | `.tsx` | `tests/ui/` | [] | [] | [] | Tests RouteThemeProvider component |

## Phase 1: Detailed Verification

### 1. `tests/api/mockdb-duckdb.node.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (duplicate)

**Verification:**
- ✅ No textual references found in codebase
- ✅ No imports/requires found
- ✅ **DUPLICATE**: Identical content to `tests/integrations/mockdb/duckdb.test.ts` (114 lines, exact match)
- ✅ File location is incorrect (should be in `tests/integrations/mockdb/`, not `tests/api/`)
- ✅ Vitest config includes both patterns, but only one is needed

**Decision:** ✅ **DELETE** - Duplicate file in wrong location. Keep `tests/integrations/mockdb/duckdb.test.ts`.

**Why:** This is a duplicate test file. The correct location is `tests/integrations/mockdb/duckdb.test.ts`, which has identical content. The file in `tests/api/` is incorrectly placed.

---

### 2. `tests/api/sql-guard.node.test.ts` 🟨 KEEP

**Classification:** B) Infra-only referenced by tests/tooling (should NOT be DROP)

**Verification:**
- ✅ No direct imports found
- ✅ Tests `guardSQL` and `SQLGuardError` from `@/lib/integrations/database/sql-guard`
- ✅ Different from `tests/security/sql-guards.test.ts` (which tests `validateSQLScope` from `@/lib/integrations/database/scope`)
- ✅ Comment indicates intended location: `// tests/integrations/database/sql-guard.test.ts`
- ✅ Valid test coverage for SQL guard AST-based validation

**Decision:** 🟨 **KEEP** - Valid test file. Should be moved to `tests/integrations/database/sql-guard.test.ts` or kept in current location.

**Why:** This test file provides valid coverage for the `guardSQL` function. The orphan audit incorrectly marked it as unused because it's not imported anywhere (test files are discovered by Vitest via glob patterns, not imports). The comment suggests it should be in `tests/integrations/database/` but the current location is also valid.

**Recommendation:** Keep the file but consider moving to `tests/integrations/database/sql-guard.test.ts` to match the comment and improve organization.

---

### 3. `tests/core/barrels.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (duplicate)

**Verification:**
- ✅ No textual references found
- ✅ **DUPLICATE**: Identical content to `tests/lib/marketing/barrels.test.ts` (17 lines, exact match)
- ✅ Both test `lib/marketing` barrels with same test cases
- ✅ File in `tests/lib/marketing/` is the correct location (domain-specific)

**Decision:** ✅ **DELETE** - Duplicate test file. Keep `tests/lib/marketing/barrels.test.ts`.

**Why:** This is a duplicate test file. The correct location is `tests/lib/marketing/barrels.test.ts`, which has identical content and is properly organized by domain.

---

### 4. `tests/core/import-discipline.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (obsolete)

**Verification:**
- ✅ No textual references found
- ✅ Tests import baseline enforcement from `scripts/policies/import-baseline.json`
- ✅ File exists and is valid TypeScript
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/core/**/*.test.{ts,tsx}` pattern, so it should be discovered

**Decision:** ✅ **DELETE** - Obsolete test. Import discipline is likely tested elsewhere or the baseline enforcement is no longer needed.

**Why:** This test file has no references and appears to be obsolete. The import baseline enforcement might be handled by other tooling (ESLint, dependency-cruiser) or the test is no longer relevant. However, verify that import discipline is still enforced before deletion.

**Recommendation:** Check if import discipline is enforced by other means (ESLint rules, dependency-cruiser) before deleting.

---

### 5. `tests/styles/breakpoints-triangulation.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (unused)

**Verification:**
- ✅ No textual references found (except outdated docs mentioning `.spec.ts` version)
- ✅ Tests breakpoint alignment between `@/styles/breakpoints` and `tailwind.config.ts`
- ✅ Docs reference `.spec.ts` version (outdated): `docs/codebase/repository-directory-structure.md` line 1491
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/styles/**/*.test.{ts,tsx}` pattern

**Decision:** ✅ **DELETE** - Unused test. Breakpoint alignment might be tested elsewhere or is no longer needed.

**Why:** This test file has no references and appears unused. The documentation mentions a `.spec.ts` version, suggesting this test might have been renamed or replaced. Verify that breakpoint alignment is still tested elsewhere before deletion.

**Follow-up:** Update docs to remove reference to `.spec.ts` version.

---

### 6. `tests/styles/breakpoints.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (unused)

**Verification:**
- ✅ No textual references found
- ✅ Tests Tailwind config uses `BREAKPOINT` correctly
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/styles/**/*.test.{ts,tsx}` pattern

**Decision:** ✅ **DELETE** - Unused test. Breakpoint validation might be tested elsewhere or is no longer needed.

**Why:** This test file has no references and appears unused. The breakpoint validation might be handled by other means or the test is no longer relevant.

---

### 7. `tests/styles/typography-presence.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (unused)

**Verification:**
- ✅ No textual references found (except outdated docs mentioning `.spec.ts` version)
- ✅ Tests typography token presence in CSS
- ✅ Docs reference `.spec.ts` version (outdated): `docs/codebase/repository-directory-structure.md` line 1493
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/styles/**/*.test.{ts,tsx}` pattern

**Decision:** ✅ **DELETE** - Unused test. Typography token validation might be tested elsewhere or is no longer needed.

**Why:** This test file has no references and appears unused. The documentation mentions a `.spec.ts` version, suggesting this test might have been renamed or replaced.

**Follow-up:** Update docs to remove reference to `.spec.ts` version.

---

### 8. `tests/ui/error-fallback.dom.test.tsx` 🟨 KEEP

**Classification:** B) Infra-only referenced by tests/tooling (should NOT be DROP)

**Verification:**
- ✅ No direct imports found
- ✅ Tests `ErrorFallback` component from `@/components/ui/organisms`
- ✅ Component exists and is used in production code
- ✅ Valid test coverage for error boundary component
- ✅ Vitest config includes `tests/**/*.dom.test.{ts,tsx}` pattern

**Decision:** 🟨 **KEEP** - Valid test file. The orphan audit incorrectly marked it as unused because test files are discovered by Vitest via glob patterns, not imports.

**Why:** This test file provides valid coverage for the `ErrorFallback` component. The orphan audit incorrectly marked it as unused because test files are discovered by Vitest via glob patterns (`tests/**/*.dom.test.{ts,tsx}`), not via imports.

**Recommendation:** Keep the file. This is a false positive from the orphan audit.

---

### 9. `tests/ui/react-keys.dom.test.tsx` ✅ DELETE

**Classification:** A) Truly dead leaf module (unused)

**Verification:**
- ✅ No textual references found
- ✅ Tests React key warnings for various components
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/**/*.dom.test.{ts,tsx}` pattern

**Decision:** ✅ **DELETE** - Unused test. React key warnings might be tested elsewhere or the test is no longer relevant.

**Why:** This test file has no references and appears unused. React key warnings are typically caught by React's development mode warnings, so a dedicated test might be redundant.

---

### 10. `tests/integrations/mockdb/duckdb.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (duplicate)

**Verification:**
- ✅ No textual references found
- ✅ **DUPLICATE**: Identical content to `tests/api/mockdb-duckdb.node.test.ts` (114 lines, exact match)
- ✅ This file is in the correct location (`tests/integrations/mockdb/`)
- ⚠️ **CONFLICT**: Both files are duplicates, but this one is in the correct location

**Decision:** ✅ **DELETE** - However, this creates a conflict: both files are duplicates. We should keep ONE of them.

**Why:** Both `tests/api/mockdb-duckdb.node.test.ts` and `tests/integrations/mockdb/duckdb.test.ts` are identical. The file in `tests/integrations/mockdb/` is in the correct location (domain-specific), so we should **KEEP** this one and **DELETE** the one in `tests/api/`.

**Correction:** Keep `tests/integrations/mockdb/duckdb.test.ts`, delete `tests/api/mockdb-duckdb.node.test.ts`.

---

### 11. `tests/lib/marketing/barrels.test.ts` ✅ DELETE

**Classification:** A) Truly dead leaf module (duplicate)

**Verification:**
- ✅ No textual references found (except docs mentioning `.spec.ts` version)
- ✅ **DUPLICATE**: Identical content to `tests/core/barrels.test.ts` (17 lines, exact match)
- ✅ This file is in the correct location (`tests/lib/marketing/`)
- ⚠️ **CONFLICT**: Both files are duplicates, but this one is in the correct location

**Decision:** ✅ **DELETE** - However, this creates a conflict: both files are duplicates. We should keep ONE of them.

**Why:** Both `tests/core/barrels.test.ts` and `tests/lib/marketing/barrels.test.ts` are identical. The file in `tests/lib/marketing/` is in the correct location (domain-specific), so we should **KEEP** this one and **DELETE** the one in `tests/core/`.

**Correction:** Keep `tests/lib/marketing/barrels.test.ts`, delete `tests/core/barrels.test.ts`.

---

### 12. `tests/ui/providers/route-theme-provider.dom.test.tsx` ✅ DELETE

**Classification:** A) Truly dead leaf module (unused)

**Verification:**
- ✅ No textual references found
- ✅ Tests `RouteThemeProvider` component from `@/app/providers/route-theme-provider`
- ✅ Component exists and is used in production code
- ✅ No imports/requires found
- ✅ Vitest config includes `tests/**/*.dom.test.{ts,tsx}` pattern

**Decision:** ✅ **DELETE** - Unused test. However, this might be a false positive similar to `error-fallback.dom.test.tsx`.

**Why:** This test file has no references and appears unused. However, it tests a valid component (`RouteThemeProvider`), so this might be a false positive. Verify that the component is tested elsewhere before deletion.

**Recommendation:** Verify that `RouteThemeProvider` is tested elsewhere. If not, consider keeping this test.

---

<<<<<<< HEAD
## Phase 2: Final Action Table

| Path | Decision | Required Follow-ups | Risk Level | Verification Notes |
|------|----------|---------------------|------------|-------------------|
| `tests/api/mockdb-duckdb.node.test.ts` | ✅ DELETE | None | Low | Duplicate of `tests/integrations/mockdb/duckdb.test.ts` |
| `tests/api/sql-guard.node.test.ts` | 🟨 KEEP | Consider moving to `tests/integrations/database/sql-guard.test.ts` | Low | Valid test, false positive |
| `tests/core/barrels.test.ts` | ✅ DELETE | None | Low | Duplicate of `tests/lib/marketing/barrels.test.ts` |
| `tests/core/import-discipline.test.ts` | ✅ DELETE | Verify import discipline still enforced | Medium | Obsolete test, verify enforcement elsewhere |
| `tests/styles/breakpoints-triangulation.test.ts` | ✅ DELETE | Update docs to remove `.spec.ts` reference | Low | Unused test, outdated docs |
| `tests/styles/breakpoints.test.ts` | ✅ DELETE | None | Low | Unused test |
| `tests/styles/typography-presence.test.ts` | ✅ DELETE | Update docs to remove `.spec.ts` reference | Low | Unused test, outdated docs |
| `tests/ui/error-fallback.dom.test.tsx` | 🟨 KEEP | None | Low | Valid test, false positive |
| `tests/ui/react-keys.dom.test.tsx` | ✅ DELETE | None | Low | Unused test |
| `tests/integrations/mockdb/duckdb.test.ts` | ✅ KEEP | None | Low | **KEEP** - Correct location, delete duplicate in `tests/api/` |
| `tests/lib/marketing/barrels.test.ts` | ✅ KEEP | None | Low | **KEEP** - Correct location, delete duplicate in `tests/core/` |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | ✅ DELETE | Verify RouteThemeProvider tested elsewhere | Medium | Unused test, verify component coverage |

## Phase 2: Authoritative Decision Table

### Definitive KEEP (4 files)

| Path | Reason | Stage |
|------|--------|-------|
| `tests/integrations/mockdb/duckdb.test.ts` | ✅ Correct location (keep this, delete duplicate) | - |
| `tests/lib/marketing/barrels.test.ts` | ✅ Correct location (keep this, delete duplicate) | - |
| `tests/api/sql-guard.node.test.ts` | 🟨 Valid test (false positive from orphan audit) | - |
| `tests/ui/error-fallback.dom.test.tsx` | 🟨 Valid test (false positive from orphan audit) | - |

### Stage 1: Safe Deletions (2 files - duplicates in wrong location)

| Path | Decision | Required Follow-ups | Risk Level |
|------|----------|---------------------|------------|
| `tests/api/mockdb-duckdb.node.test.ts` | ✅ DELETE | None | Low |
| `tests/core/barrels.test.ts` | ✅ DELETE | None | Low |

### Stage 3: Intentional Removals (6 files - requires team approval)

| Path | Decision | Required Follow-ups | Risk Level |
|------|----------|---------------------|------------|
| `tests/core/import-discipline.test.ts` | ⚠️ DELETE | Verify import discipline still enforced | Medium |
| `tests/styles/breakpoints-triangulation.test.ts` | ⚠️ DELETE | Update docs to remove `.spec.ts` reference | Low |
| `tests/styles/breakpoints.test.ts` | ⚠️ DELETE | None | Low |
| `tests/styles/typography-presence.test.ts` | ⚠️ DELETE | Update docs to remove `.spec.ts` reference | Low |
| `tests/ui/react-keys.dom.test.tsx` | ⚠️ DELETE | None | Low |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | ⚠️ DELETE | Verify RouteThemeProvider tested elsewhere | Medium |

## Phase 3: Staged Cleanup Implementation Plan

### Stage 1 PR: "De-dupe + doc fixes" (safe, low risk)

**Goal:** Remove duplicate files in wrong locations and fix outdated documentation references.

**Changes:**
1. Delete duplicates (wrong location):
   - `tests/api/mockdb-duckdb.node.test.ts` (duplicate of `tests/integrations/mockdb/duckdb.test.ts`)
   - `tests/core/barrels.test.ts` (duplicate of `tests/lib/marketing/barrels.test.ts`)

2. Keep correct location versions:
   - ✅ `tests/integrations/mockdb/duckdb.test.ts` (keep)
   - ✅ `tests/lib/marketing/barrels.test.ts` (keep)

3. Update documentation:
   - `docs/codebase/repository-directory-structure.md` - Remove/adjust `.spec.ts` references
   - `docs/audits/validation-sweep-audit-20250128.md` - Update/remove reference to `breakpoints-triangulation.test.ts`

**Validation (must pass):**
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:orphans --only=DROP
```

**Expected Outcome:**
- Test suite still passes
- DROP count may not hit 0 yet (Stage 2 addresses test classification)

### Stage 2 PR: "Fix orphan audit classification for tests" (prevents future false positives)

**Goal:** Prevent test files from being incorrectly marked as DROP.

**Options:**
- **Option 2A (Recommended):** Exclude `tests/**` from orphan candidate scanning
- **Option 2B:** Mark files matching Vitest include globs as KEEP with reason "test entrypoint"

**Implementation:** Update `scripts/audit/orphans.ts` to exclude test files or mark them as KEEP.

### Stage 3 PR: "Intentional test removals" (only if team agrees coverage isn't needed)

**Goal:** Remove tests that are no longer needed (requires explicit team approval).

**Split into two PRs:**

**Stage 3A: Policy/enforcement tests**
- `tests/core/import-discipline.test.ts`
- `tests/styles/breakpoints-triangulation.test.ts`
- `tests/styles/breakpoints.test.ts`
- `tests/styles/typography-presence.test.ts`

**Before deleting:** Confirm what replaces them (ESLint rules, dependency-cruiser, CI checks, etc.)

**Stage 3B: UI behavior/warnings tests**
- `tests/ui/react-keys.dom.test.tsx`
- `tests/ui/providers/route-theme-provider.dom.test.tsx`

**Before deleting:** Verify these tests are currently executed by Vitest and confirm removing them doesn't drop important coverage.

---

### Legacy Plan (for reference - replaced by staged approach above)

#### Step 1: Delete Confirmed-Safe Files (8 files)
>>>>>>> bbad31c (chore(tests): complete orphan cleanup stages 1 & 2)

```bash
# Duplicates (delete wrong location, keep correct location)
rm tests/api/mockdb-duckdb.node.test.ts          # Keep tests/integrations/mockdb/duckdb.test.ts
rm tests/core/barrels.test.ts                    # Keep tests/lib/marketing/barrels.test.ts

# Obsolete/Unused tests
rm tests/core/import-discipline.test.ts
rm tests/styles/breakpoints-triangulation.test.ts
rm tests/styles/breakpoints.test.ts
rm tests/styles/typography-presence.test.ts
rm tests/ui/react-keys.dom.test.tsx
rm tests/ui/providers/route-theme-provider.dom.test.tsx
```

### Step 2: Update Documentation

Update outdated documentation references:

1. **`docs/codebase/repository-directory-structure.md`** (lines 1491, 1493):
   - Remove references to `.spec.ts` versions of breakpoint and typography tests

2. **`docs/audits/validation-sweep-audit-20250128.md`** (line 187):
   - Update reference to `breakpoints-triangulation.test.ts` (or remove if test is deleted)

### Step 3: Verify Import Discipline Enforcement

Before deleting `tests/core/import-discipline.test.ts`, verify that import discipline is still enforced by:
- ESLint rules
- Dependency-cruiser
- Other tooling

If not enforced elsewhere, consider keeping the test or implementing enforcement.

### Step 4: Re-run Validation

After deletions, run:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests
pnpm test

# Build
pnpm build

# Orphan audit (should show 0 DROP files, or explain remaining)
pnpm audit:orphans --only=DROP
```

## Findings Summary

### Patterns Identified

1. **Duplicate Test Files:** 3 pairs of duplicate test files in different locations
   - `tests/api/mockdb-duckdb.node.test.ts` ↔ `tests/integrations/mockdb/duckdb.test.ts`
   - `tests/core/barrels.test.ts` ↔ `tests/lib/marketing/barrels.test.ts`

2. **False Positives:** 2 valid test files incorrectly marked as DROP
   - `tests/api/sql-guard.node.test.ts` - Valid test for `guardSQL` function
   - `tests/ui/error-fallback.dom.test.tsx` - Valid test for `ErrorFallback` component

3. **Obsolete Tests:** 5 test files that appear unused
   - Import discipline test (verify enforcement elsewhere)
   - Style/breakpoint tests (verify coverage elsewhere)
   - React keys test (likely redundant with React dev warnings)

4. **Outdated Documentation:** References to `.spec.ts` versions that don't exist

### Recommendations

1. **Keep False Positives:** Add `tests/api/sql-guard.node.test.ts` and `tests/ui/error-fallback.dom.test.tsx` to allowlist or fix orphan audit to recognize test files discovered by Vitest glob patterns.

2. **Fix Duplicate Detection:** Update orphan audit to detect duplicate files (same content hash) and mark the one in the wrong location as DROP.

3. **Update Documentation:** Remove outdated references to `.spec.ts` test files.

4. **Verify Before Deletion:** For `tests/core/import-discipline.test.ts` and `tests/ui/providers/route-theme-provider.dom.test.tsx`, verify that the functionality is tested elsewhere before deletion.

## Acceptance Checklist

- [ ] Delete 8 confirmed-safe files
- [ ] Update documentation to remove outdated `.spec.ts` references
- [ ] Verify import discipline enforcement before deleting `tests/core/import-discipline.test.ts`
- [ ] Verify RouteThemeProvider coverage before deleting `tests/ui/providers/route-theme-provider.dom.test.tsx`
- [ ] Run `pnpm typecheck` - must pass
- [ ] Run `pnpm lint` - must pass
- [ ] Run `pnpm test` - must pass
- [ ] Run `pnpm build` - must pass
- [ ] Run `pnpm audit:orphans --only=DROP` - should show 0 DROP files (or 2 if false positives not allowlisted)

## Notes

- The orphan audit tool correctly identifies unused files, but has false positives for test files that are discovered by Vitest glob patterns rather than imports.
- Consider updating the orphan audit to exclude test files from DROP status if they match Vitest include patterns.
- Duplicate file detection would be a valuable addition to the orphan audit tool.

---

_Last updated: 2025-01-30_
