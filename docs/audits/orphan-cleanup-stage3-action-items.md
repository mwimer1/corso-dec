---
status: "draft"
last_updated: "2025-12-30"
category: "documentation"
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
---
# Orphan Cleanup - Stage 3 Action Items

**Status:** ⏳ Pending Team Approval  
**Risk Level:** Medium (coverage removal)  
**Priority:** Low (optional cleanup)

## Quick Reference

| File | Category | Recommendation | Status |
|------|----------|----------------|--------|
| `tests/core/import-discipline.test.ts` | Policy | **Team Decision** - Baseline enforcement may add value | ⚠️ Needs review |
| `tests/styles/breakpoints-triangulation.test.ts` | Design System | **Team Decision** - Only test for breakpoint alignment | ⚠️ Needs review |
| `tests/styles/breakpoints.test.ts` | Design System | **Team Decision** - Only test for container override | ⚠️ Needs review |
| `tests/styles/typography-presence.test.ts` | Design System | **Team Decision** - Only test for typography tokens | ⚠️ Needs review |
| `tests/ui/react-keys.dom.test.tsx` | UI Behavior | **DELETE** - Redundant with React dev mode | ✅ Safe to delete |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | UI Component | **KEEP** - False positive, test is executed | ✅ Verified: Keep |

## Overview

Stage 3 involves intentional removal of 6 test files that may no longer be needed. **These are NOT safe to delete automatically** - they require explicit team approval and verification that:

1. The functionality is tested elsewhere, OR
2. The enforcement/validation is handled by other tooling, OR
3. The team explicitly agrees the coverage isn't needed

**Key Finding:** `route-theme-provider.dom.test.tsx` is a **false positive** - the test is executed by Vitest and passes. It should be **KEPT** unless the team explicitly decides E2E coverage is sufficient.

---

## Stage 3A: Policy/Enforcement Tests (4 files)

These tests validate architectural policies and design system alignment. Before deletion, verify that enforcement exists elsewhere.

### 1. `tests/core/import-discipline.test.ts` ⚠️

**What It Tests:**
- Cross-domain leaf import enforcement
- Validates that new cross-domain imports match baseline in `scripts/policies/import-baseline.json`
- Scans all files in `lib/` for violations of domain boundaries
- Ensures no new cross-domain leaf imports are added without updating baseline

**Test Coverage:**
- Scans all `.ts`/`.tsx` files in `lib/`
- Detects imports like `@/lib/domain-a/specific-file` from `@/lib/domain-b/`
- Compares against baseline to catch new violations
- Allows barrel imports (`@/lib/domain`) and entrypoints (`@/lib/domain/server`)

**Current Enforcement Mechanisms:**

✅ **ESLint Rules (Active):**
- `corso/no-cross-domain-imports` - Enforces domain boundaries via `eslint-plugin-corso/rules/domain-config.json`
- `corso/no-deep-imports` - Prevents deep imports within domains
- `@typescript-eslint/no-restricted-imports` - Additional pattern-based restrictions

✅ **Dependency-Cruiser (Active):**
- `.dependency-cruiser.cjs` - Circular dependency detection
- `pnpm validate:dependencies` - Runs dependency-cruiser validation
- `config/domain-map.ts` - Architecture boundaries configuration

✅ **Lib Structure Validator (Active):**
- `tests/core/lib-structure-validator.test.ts` - Validates cross-domain imports
- `scripts/validation/lib-structure.ts` - Scans for cross-domain violations

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Is import discipline enforced by ESLint? | ✅ Yes - `corso/no-cross-domain-imports` | Can delete if ESLint coverage is sufficient |
| Is import discipline enforced by dependency-cruiser? | ✅ Yes - `.dependency-cruiser.cjs` | Can delete if dependency-cruiser coverage is sufficient |
| Is import discipline enforced by lib-structure-validator? | ✅ Yes - `lib-structure-validator.test.ts` | **Potential overlap** - verify if this test adds unique value |
| Does baseline enforcement add value over ESLint? | ⚠️ Maybe - baseline allows existing violations, ESLint blocks new ones | **Team decision needed** - baseline is more permissive |

**Recommendation:** 
- **KEEP** if baseline enforcement is still needed (allows existing violations, blocks new ones)
- **DELETE** if ESLint + dependency-cruiser + lib-structure-validator provide sufficient coverage

**Action Required:**
1. Review `scripts/policies/import-baseline.json` - is this baseline still maintained?
2. Compare coverage: ESLint rules vs baseline enforcement
3. Team decision: Is baseline enforcement still valuable, or is ESLint sufficient?

---

### 2. `tests/styles/breakpoints-triangulation.test.ts` ⚠️

**What It Tests:**
- Breakpoint alignment between `@/styles/breakpoints` and `tailwind.config.ts`
- Verifies Tailwind config uses `BREAKPOINT` correctly
- Ensures breakpoint values match expected design system values
- Validates Tailwind screens are generated from `BREAKPOINT` tokens

**Test Coverage:**
- Validates `BREAKPOINT` import and structure
- Verifies Tailwind config references `BREAKPOINT` correctly
- Checks breakpoint values (sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536)
- Ensures Tailwind screens match `BREAKPOINT` values

**Current Enforcement Mechanisms:**

✅ **Tailwind Config (Active):**
- `tailwind.config.ts` directly imports and uses `BREAKPOINT`:
  ```typescript
  import { BREAKPOINT } from './styles/breakpoints';
  screens: Object.fromEntries(
    Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])
  )
  ```
- TypeScript compilation ensures `BREAKPOINT` exists and is used correctly

⚠️ **No Other Automated Enforcement Found:**
- No ESLint rules for breakpoint alignment
- No dependency-cruiser rules for breakpoint validation
- No other tests validating breakpoint alignment

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Is breakpoint alignment enforced by TypeScript? | ✅ Yes - import ensures alignment | TypeScript ensures import exists, but doesn't validate values |
| Is breakpoint alignment enforced by other tests? | ❌ No - no other tests found | This appears to be the only test |
| Would removing this test drop coverage? | ⚠️ Yes - no other validation | **Risk:** Breakpoint drift could go undetected |

**Recommendation:** 
- **KEEP** if breakpoint alignment is critical (design system consistency)
- **DELETE** if breakpoint values are stable and unlikely to drift

**Action Required:**
1. Team decision: Is breakpoint alignment validation still needed?
2. Consider: Would breakpoint drift be caught by visual regression tests or design review?
3. Alternative: Add ESLint rule to enforce `BREAKPOINT` usage in Tailwind config

---

### 3. `tests/styles/breakpoints.test.ts` ⚠️

**What It Tests:**
- Tailwind config uses `BREAKPOINT` correctly
- Tailwind container doesn't override 2xl to non-design-system value
- Validates `BREAKPOINT['2xl']` matches Tailwind screens

**Test Coverage:**
- Verifies Tailwind config imports `BREAKPOINT`
- Checks container override doesn't conflict with design system
- Ensures 2xl breakpoint matches design system value

**Current Enforcement Mechanisms:**

✅ **Tailwind Config (Active):**
- `tailwind.config.ts` uses `BREAKPOINT` for screens
- Container has hardcoded `'2xl': '1400px'` (different from BREAKPOINT['2xl'] = 1536)

⚠️ **No Other Automated Enforcement Found:**
- No ESLint rules
- No other tests
- Container override is hardcoded (not validated)

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Is breakpoint validation enforced elsewhere? | ❌ No - no other tests | This appears to be the only test |
| Does container override need validation? | ⚠️ Maybe - container uses 1400px, BREAKPOINT uses 1536px | **Note:** Container override is intentional (1400px vs 1536px) |
| Would removing this test drop coverage? | ⚠️ Yes - no other validation | **Risk:** Container override conflicts could go undetected |

**Recommendation:** 
- **KEEP** if container override validation is important
- **DELETE** if container override is stable and unlikely to change
- **MERGE** with `breakpoints-triangulation.test.ts` if both are kept

**Action Required:**
1. Team decision: Is container override validation still needed?
2. Consider: Container uses 1400px, BREAKPOINT uses 1536px - is this intentional?
3. Alternative: Merge with `breakpoints-triangulation.test.ts` to reduce duplication

---

### 4. `tests/styles/typography-presence.test.ts` ⚠️

**What It Tests:**
- Typography token presence in CSS
- Ensures large typography tokens (7xl, 8xl, 9xl) exist in `styles/tokens/typography.css`
- Validates CSS variables are defined

**Test Coverage:**
- Reads `styles/tokens/typography.css`
- Checks for CSS variables: `--text-7xl`, `--text-8xl`, `--text-9xl`
- Validates token presence (not values)

**Current Enforcement Mechanisms:**

⚠️ **No Automated Enforcement Found:**
- No ESLint rules for typography tokens
- No dependency-cruiser rules
- No other tests validating typography tokens
- TypeScript doesn't validate CSS variable existence

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Is typography token validation enforced elsewhere? | ❌ No - no other tests | This appears to be the only test |
| Would removing this test drop coverage? | ⚠️ Yes - no other validation | **Risk:** Missing typography tokens could go undetected |
| Are typography tokens stable? | ⚠️ Unknown | Team decision needed |

**Recommendation:** 
- **KEEP** if typography tokens are actively maintained
- **DELETE** if typography tokens are stable and unlikely to change
- **CONSIDER** adding to design token validation suite if one exists

**Action Required:**
1. Team decision: Is typography token validation still needed?
2. Check: Are typography tokens actively used in the codebase?
3. Alternative: Add to design token validation if expanding token system

---

## Stage 3B: UI Behavior/Warnings Tests (2 files)

These tests validate UI component behavior and React warnings. Before deletion, verify that the components are tested elsewhere or that the warnings are caught by other means.

### 5. `tests/ui/react-keys.dom.test.tsx` ⚠️

**What It Tests:**
- React key warnings for various components
- Ensures components render arrays without missing key warnings
- Tests: `ContactItem`, `Slider`, `Skeleton`, `SkeletonTable`

**Test Coverage:**
- Mocks `console.error` to catch React key warnings
- Renders components with array props
- Verifies no "Each child in a list should have a unique 'key' prop" warnings

**Current Enforcement Mechanisms:**

✅ **React Development Mode (Active):**
- React automatically logs key warnings in development
- Warnings appear in browser console during development
- CI/test environments typically run in development mode

⚠️ **No Other Automated Enforcement Found:**
- No ESLint rules for React keys (React's built-in rules handle this)
- No other tests specifically checking for key warnings
- Components may have individual tests that don't check keys

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Are React key warnings caught by React dev mode? | ✅ Yes - React logs warnings automatically | React dev mode catches these |
| Are React key warnings caught in CI? | ⚠️ Maybe - depends on test environment | If tests run in dev mode, warnings appear |
| Does this test add value over React's built-in warnings? | ⚠️ Maybe - ensures warnings are caught in test suite | **Note:** React warnings are already caught by dev mode |

**Recommendation:** 
- **DELETE** if React dev mode warnings are sufficient (likely redundant)
- **KEEP** if you want explicit test coverage for key warnings
- **CONSIDER** if these components have other tests that would catch key issues

**Action Required:**
1. Team decision: Are React dev mode warnings sufficient?
2. Check: Do CI tests run in development mode and catch key warnings?
3. Verify: Are these components tested elsewhere (would catch key issues)?

---

### 6. `tests/ui/providers/route-theme-provider.dom.test.tsx` ⚠️

**What It Tests:**
- `RouteThemeProvider` component behavior
- Verifies theme is set on `documentElement.dataset.routeTheme`
- Tests that component returns `null` (invisible component)

**Test Coverage:**
- Tests theme setting: `theme="auth"` → `dataset.routeTheme = "auth"`
- Tests invisible component: returns `null`
- Mocks `document.documentElement` for testing

**Component Details:**
- Component: `@/app/providers/route-theme-provider`
- Purpose: Sets route theme on document element for CSS theming
- Used in: Production code (likely in layout or route providers)

**Current Enforcement Mechanisms:**

✅ **E2E Test (Active):**
- `tests/e2e/route-theme.smoke.test.ts` - Tests theme application end-to-end
- Verifies `data-route-theme` attribute is set correctly
- Tests CSS custom properties are applied
- **Note:** E2E test validates end result, not component behavior in isolation

⚠️ **No Other Unit Tests Found:**
- No other unit tests for `RouteThemeProvider` component
- Component is actively used in production:
  - `app/(auth)/_theme.tsx` - Uses `RouteThemeProvider` with `theme="auth"`
  - `app/(marketing)/_theme.tsx` - Uses `RouteThemeProvider` with `theme="marketing"`

**Decision Criteria:**

| Question | Answer | Action |
|----------|--------|--------|
| Is RouteThemeProvider tested elsewhere? | ✅ Yes - E2E test exists | E2E test validates end result |
| Is RouteThemeProvider used in production? | ✅ Yes - used in `app/(auth)/_theme.tsx` and `app/(marketing)/_theme.tsx` | Component is actively used |
| Does E2E test cover component behavior? | ⚠️ Partial - E2E tests end result, not component isolation | E2E validates theme attribute, not component logic |
| Would removing this test drop coverage? | ⚠️ Yes - no unit test coverage for component | **Risk:** Component behavior untested in isolation |
| Is this a false positive? | ⚠️ Possibly - similar to `error-fallback.dom.test.tsx` | Orphan audit may have missed it |

**Recommendation:** 
- **KEEP** - Component is used in production and unit test provides isolation testing
- **REASONING:** E2E test validates end result, but unit test validates component behavior (useEffect, cleanup, null return)
- **ALTERNATIVE:** If E2E coverage is sufficient, could delete unit test

**Action Required:**
1. ✅ **VERIFIED:** `RouteThemeProvider` test is executed by Vitest (2 tests pass)
2. **Team decision:** Is unit test isolation valuable, or is E2E end-to-end coverage sufficient?
3. **Consider:** Unit test validates `useEffect` cleanup and component behavior; E2E validates theme application

**Update:** Test is actually executed by Vitest and passes. This is a **false positive** from the orphan audit (similar to `error-fallback.dom.test.tsx`). The test should be **KEPT** unless team explicitly decides E2E coverage is sufficient.

---

## Summary Table

| File | Category | Risk | Enforcement Exists? | Recommendation | Action Required |
|------|----------|------|---------------------|----------------|-----------------|
| `tests/core/import-discipline.test.ts` | Policy | Medium | ✅ Yes (ESLint, dependency-cruiser, lib-structure-validator) | **Team Decision** - Baseline enforcement may add value | Review baseline vs ESLint coverage |
| `tests/styles/breakpoints-triangulation.test.ts` | Design System | Low | ⚠️ Partial (TypeScript import, no value validation) | **Team Decision** - Only test for breakpoint alignment | Decide if breakpoint validation is needed |
| `tests/styles/breakpoints.test.ts` | Design System | Low | ⚠️ Partial (TypeScript import, container override not validated) | **Team Decision** - Only test for container override | Decide if container validation is needed |
| `tests/styles/typography-presence.test.ts` | Design System | Low | ❌ No | **Team Decision** - Only test for typography tokens | Decide if typography validation is needed |
| `tests/ui/react-keys.dom.test.tsx` | UI Behavior | Low | ✅ Yes (React dev mode) | **DELETE** - Likely redundant | Verify React dev mode catches warnings |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | UI Component | Low | ✅ Yes (E2E test exists) | **KEEP** - False positive, test is executed | ✅ Verified: Test runs and passes |

---

## Approval Checklist

Before proceeding with Stage 3 deletions, the team must:

### For Each File:

- [ ] **Review test coverage** - Verify what the test actually covers
- [ ] **Check enforcement alternatives** - Confirm if ESLint/tooling provides equivalent coverage
- [ ] **Assess risk** - Determine if removing test drops important coverage
- [ ] **Team approval** - Explicit approval from team lead/architect
- [ ] **Document decision** - Record why test was kept or deleted

### For Policy/Enforcement Tests (3A):

- [ ] **Import Discipline:** Review `scripts/policies/import-baseline.json` - is baseline still maintained?
- [ ] **Breakpoints:** Decide if breakpoint alignment validation is critical for design system
- [ ] **Typography:** Decide if typography token validation is needed

### For UI Behavior Tests (3B):

- [ ] **React Keys:** Verify React dev mode catches warnings in CI
- [x] **RouteThemeProvider:** ✅ **VERIFIED** - Test is executed by Vitest (2 tests pass). This is a false positive. **KEEP** unless team decides E2E coverage is sufficient.

---

## Recommended Approach

### Option 1: Conservative (Recommended)
**Keep all tests** until explicit team approval for each:
- Import discipline: Keep if baseline enforcement adds value
- Breakpoint tests: Keep if design system alignment is critical
- Typography: Keep if tokens are actively maintained
- React keys: Delete (redundant with React dev mode)
- RouteThemeProvider: **KEEP** (component used, no other tests)

### Option 2: Aggressive
**Delete all except RouteThemeProvider:**
- Import discipline: Delete (ESLint + dependency-cruiser sufficient)
- Breakpoint tests: Delete (TypeScript import ensures alignment)
- Typography: Delete (tokens stable)
- React keys: Delete (redundant)
- RouteThemeProvider: **KEEP** (component used, no other tests)

### Option 3: Hybrid
**Delete low-risk, keep medium-risk:**
- Import discipline: **Team decision** (baseline may add value)
- Breakpoint tests: **Team decision** (design system alignment)
- Typography: Delete (low risk, tokens stable)
- React keys: Delete (redundant)
- RouteThemeProvider: **KEEP** (component used, no other tests)

---

## Next Steps

1. **Team Review Meeting:** Schedule review of Stage 3 candidates
2. **Coverage Analysis:** Verify enforcement alternatives for each test
3. **Risk Assessment:** Document risk of removing each test
4. **Approval:** Get explicit team approval for deletions
5. **Implementation:** Create PR with approved deletions only

---

_Last updated: 2025-12-30_

