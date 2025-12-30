---
title: "Orphan Cleanup - Stage 3 Decision Log"
description: "Recorded team decisions for Stage 3 test file removals"
last_updated: "2025-12-30"
category: "audits"
status: "approved"
---

# Stage 3 Decision Log

**Date:** 2025-12-30  
**Status:** ✅ Approved  
**Approach:** Conservative cleanup with explicit replacement enforcement

## Decision Summary

| File | Decision | Rationale | Replacement Enforcement |
|------|----------|-----------|------------------------|
| `tests/ui/react-keys.dom.test.tsx` | ✅ DELETE | Redundant with React dev mode + ESLint | ESLint `react/jsx-key` rule |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | ✅ KEEP | Executed test, provides unit isolation | N/A (kept) |
| `tests/styles/breakpoints-triangulation.test.ts` | ✅ KEEP + CONSOLIDATE | Only test for breakpoint alignment | Merged into contract test |
| `tests/styles/breakpoints.test.ts` | ✅ KEEP + CONSOLIDATE | Only test for container override | Merged into contract test |
| `tests/styles/typography-presence.test.ts` | ✅ KEEP + CONSOLIDATE | Only test for typography tokens | Merged into contract test |
| `tests/core/import-discipline.test.ts` | ✅ KEEP | Baseline enforcement adds unique value | Baseline allows existing violations, blocks new ones |

---

## Detailed Decisions

### 1. `tests/ui/react-keys.dom.test.tsx`

**Decision:** ✅ DELETE

**Rationale:**
- React dev mode automatically logs key warnings in development
- ESLint `react/jsx-key` rule provides static analysis enforcement
- Test is redundant with built-in React warnings
- Low risk: warnings are caught during development and CI

**Replacement Enforcement:**
- ESLint rule: `react/jsx-key` (enabled in `eslint.config.mjs`)
- React dev mode warnings (automatic in development)
- CI test environment runs in dev mode, catching warnings

**Owner:** Platform Team  
**PR:** Stage 3 PR 1

---

### 2. `tests/ui/providers/route-theme-provider.dom.test.tsx`

**Decision:** ✅ KEEP

**Rationale:**
- Test is executed by Vitest (verified: 2 tests pass)
- Provides unit-level isolation testing for component behavior
- E2E test validates end result, but unit test validates `useEffect` cleanup and component logic
- False positive from orphan audit (test is actively used)

**Replacement Enforcement:** N/A (test is kept)

**Owner:** Platform Team  
**PR:** N/A (no change)

---

### 3. `tests/styles/breakpoints-triangulation.test.ts`

**Decision:** ✅ KEEP + CONSOLIDATE

**Rationale:**
- Only automated test validating breakpoint alignment between `BREAKPOINT` and Tailwind config
- TypeScript ensures import exists, but doesn't validate values
- Consolidation reduces maintenance burden while keeping guardrail
- Merged into `tests/styles/design-system.contract.test.ts`

**Replacement Enforcement:** Consolidated contract test

**Owner:** Platform Team  
**PR:** Stage 3 PR 2

---

### 4. `tests/styles/breakpoints.test.ts`

**Decision:** ✅ KEEP + CONSOLIDATE

**Rationale:**
- Only test validating container override doesn't conflict with design system
- Container uses hardcoded `1400px` vs BREAKPOINT `1536px` (intentional)
- Consolidation reduces maintenance while keeping validation
- Merged into `tests/styles/design-system.contract.test.ts`

**Replacement Enforcement:** Consolidated contract test

**Owner:** Platform Team  
**PR:** Stage 3 PR 2

---

### 5. `tests/styles/typography-presence.test.ts`

**Decision:** ✅ KEEP + CONSOLIDATE

**Rationale:**
- Only automated test validating typography token presence in CSS
- No other enforcement found (ESLint, dependency-cruiser don't validate CSS variables)
- Consolidation reduces maintenance while keeping guardrail
- Merged into `tests/styles/design-system.contract.test.ts`

**Replacement Enforcement:** Consolidated contract test

**Owner:** Platform Team  
**PR:** Stage 3 PR 2

---

### 6. `tests/core/import-discipline.test.ts`

**Decision:** ✅ KEEP

**Rationale:**
- Baseline enforcement provides unique value: allows existing violations, blocks new ones
- ESLint/dependency-cruiser/lib-structure-validator enforce strict rules
- Baseline file (`scripts/policies/import-baseline.json`) is actively maintained (117 existing violations)
- Provides migration path: allows legacy violations while preventing incremental drift
- Different philosophy than strict ESLint rules (permissive baseline vs strict enforcement)

**Replacement Enforcement:** N/A (test is kept)

**Owner:** Platform Team  
**PR:** N/A (no change)

---

## Implementation Status

- [x] **Decision Log Created** - 2025-12-30
- [x] **PR 1: React Keys Test Removal** - ✅ Completed 2025-12-30
- [x] **PR 2: Design System Test Consolidation** - ✅ Completed 2025-12-30
- [x] **PR 3: Import Discipline** - ✅ No change (kept) - 2025-12-30

**All PRs completed and validated:**
- ✅ Typecheck: Passed
- ✅ Lint: Passed
- ✅ Tests: 516 tests passed (102 test files)
- ✅ Build: Passed
- ✅ Orphan Audit: 0 DROP files

---

## Notes

### Why Consolidation Over Deletion?

Design system tests (breakpoints, typography) are the **only automated enforcement** preventing silent drift. Consolidation achieves:
- ✅ Maintenance reduction (fewer files)
- ✅ Safety preservation (all guardrails kept)
- ✅ Easier discovery (single contract test file)

### Why Keep Import Discipline Baseline?

The baseline test provides **unique value** that ESLint cannot:
- **Permissive baseline**: Allows 117 existing violations (documented in baseline)
- **Strict enforcement**: Blocks new violations not in baseline
- **Migration strategy**: Enables gradual cleanup without blocking development

This is different from ESLint's strict "no violations ever" approach.

---

_Last updated: 2025-12-30_

