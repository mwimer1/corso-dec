---
title: "Orphan Cleanup - Stage 3 Summary"
description: "Stage 3 cleanup: intentional test removals with replacement enforcement"
last_updated: "2025-12-30"
category: "audits"
status: "completed"
---

# Orphan Cleanup - Stage 3 Summary

**Date:** 2025-12-30  
**Status:** ✅ Completed  
**Risk Level:** Low (with replacement enforcement)

## Changes Made

### PR 1: Remove React Keys Test

**Deleted:**
- `tests/ui/react-keys.dom.test.tsx`

**Rationale:**
- Redundant with React dev mode warnings (automatic in development)
- ESLint rule `react/jsx-key` provides static analysis enforcement
- Test was checking for warnings that React already logs automatically

**Replacement Enforcement:**
- ✅ ESLint rule: `react/jsx-key` (enabled in `eslint.config.mjs`)
- ✅ React dev mode warnings (automatic in development and CI)

**Validation:**
- ✅ Typecheck: Passed
- ✅ Lint: Passed (ESLint rule active)
- ✅ Tests: Passed (516 tests, down from 520)

---

### PR 2: Consolidate Design System Tests

**Deleted:**
- `tests/styles/breakpoints-triangulation.test.ts`
- `tests/styles/breakpoints.test.ts`
- `tests/styles/typography-presence.test.ts`

**Created:**
- `tests/styles/design-system.contract.test.ts` (consolidated contract test)

**Rationale:**
- All three tests validated design system contracts (breakpoints, typography)
- Consolidation reduces maintenance burden (1 file instead of 3)
- Preserves all guardrails while improving discoverability
- Single contract test is easier to maintain and harder to forget

**Test Coverage Preserved:**
- ✅ Breakpoint validation (BREAKPOINT → Tailwind screens)
- ✅ Container override validation (2xl breakpoint)
- ✅ Typography token presence (7xl–9xl tokens)

**Validation:**
- ✅ Typecheck: Passed
- ✅ Lint: Passed
- ✅ Tests: 7 tests in consolidated file (all passing)
- ✅ Build: Passed

---

### PR 3: Import Discipline

**Decision:** ✅ KEEP

**Rationale:**
- Baseline enforcement provides unique value: allows existing violations, blocks new ones
- ESLint/dependency-cruiser/lib-structure-validator enforce strict rules
- Baseline file (`scripts/policies/import-baseline.json`) is actively maintained (117 existing violations)
- Provides migration path: allows legacy violations while preventing incremental drift

**No Changes:** Test remains as-is

---

## Summary Statistics

### Files Processed
- **Original Stage 3 Candidates:** 6 files
- **Deleted:** 4 files (React keys + 3 design system tests)
- **Consolidated:** 3 design system tests → 1 contract test
- **Kept:** 2 files (RouteThemeProvider + Import Discipline)

### Test Suite
- **Before:** 520 tests across 105 test files
- **After:** 516 tests across 102 test files
- **Coverage:** All guardrails preserved (consolidated, not removed)

### Orphan Audit
- **Before:** 0 DROP files
- **After:** 0 DROP files (clean)

---

## Validation Results

✅ **Typecheck:** Passed  
✅ **Lint:** Passed  
✅ **Tests:** 516 tests passed (102 test files)  
✅ **Build:** Passed  
✅ **Orphan Audit:** 0 DROP files

---

## Key Achievements

1. ✅ **Reduced Maintenance:** 4 fewer test files to maintain
2. ✅ **Preserved Safety:** All guardrails kept (consolidated, not removed)
3. ✅ **Replacement Enforcement:** ESLint rule confirmed for React keys
4. ✅ **Better Organization:** Design system tests consolidated into single contract test
5. ✅ **Zero Regressions:** All tests pass, no coverage lost

---

## Decision Log

All decisions recorded in `docs/audits/orphan-cleanup-stage3-decision-log.md`:
- ✅ React keys: DELETE (replaced by ESLint)
- ✅ RouteThemeProvider: KEEP (executed test, provides isolation)
- ✅ Design system tests: KEEP + CONSOLIDATE (preserved guardrails)
- ✅ Import discipline: KEEP (baseline adds unique value)

---

## Next Steps

### Completed ✅
- [x] Decision log created
- [x] React keys test removed (replacement enforcement confirmed)
- [x] Design system tests consolidated
- [x] Import discipline test kept
- [x] All validation gates passed

### Future Improvements (Optional)
- Monitor ESLint `react/jsx-key` rule effectiveness
- Consider expanding design system contract test if more tokens are added
- Document baseline enforcement strategy for import discipline

---

_Completed: 2025-12-30_

