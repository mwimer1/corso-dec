---
status: "draft"
last_updated: "2025-12-30"
category: "documentation"
---
# Orphan Cleanup - Remaining Action Items

**Last Updated:** 2025-12-30  
**Stage 1 Status:** ✅ Completed

## ✅ Completed (Stage 1)

- Deleted 2 duplicate test files
- Updated documentation references
- All validation passed (typecheck, lint, tests, build)
- Orphan audit shows 0 DROP files

## 📋 Remaining Action Items

### Stage 2: Fix Orphan Audit Classification (Recommended)

**Goal:** Prevent test files from being incorrectly marked as DROP in future audits.

**Status:** ✅ Completed  
**Priority:** Medium  
**Risk:** Low

**Completed:**
Updated `scripts/audit/orphans.ts` to exclude test files from DROP status.

**Options:**

**Option 2A (Recommended):** Exclude `tests/**` from orphan candidate scanning
```typescript
const filteredCandidates = candidates.filter((rel: string) => {
  if (!argv.includeIndex && isIndexBarrel(rel)) return false;
  // Exclude convention files
  if (CONVENTION_FILE_PATTERNS.some(pattern => pattern.test(rel))) return false;
  // Exclude test files
  if (rel.startsWith('tests/')) return false;
  return true;
});
```

**Option 2B:** Mark files matching Vitest include globs as KEEP
```typescript
// After line 490 in orphans.ts
const VITEST_INCLUDE_PATTERNS = [
  /^tests\/.*\.test\.(ts|tsx)$/,
  /^tests\/.*\.dom\.test\.(tsx)$/,
  /^tests\/.*\.node\.test\.(ts|tsx)$/,
];

if (VITEST_INCLUDE_PATTERNS.some(pattern => pattern.test(rel))) {
  record.status = 'KEEP';
  record.reasons.push('KEEP_TEST_ENTRYPOINT');
  results.push(record); continue;
}
```

**Validation:**
- Re-run orphan audit and confirm test files aren't flagged as DROP
- Ensure production code files are still properly analyzed

---

### Stage 3: Intentional Test Removals (Optional - Requires Team Approval)

**Goal:** Remove test files that are no longer needed (requires explicit team approval).

**Status:** ✅ Completed  
**Priority:** Low  
**Risk:** Medium (coverage removal)

**Completed:** All decisions made and implemented:
- React keys test: ✅ Deleted (replaced by ESLint)
- Design system tests: ✅ Consolidated (preserved guardrails)
- Import discipline: ✅ Kept (baseline adds unique value)
- RouteThemeProvider: ✅ Kept (executed test, provides isolation)

#### Stage 3A: Policy/Enforcement Tests (4 files)

| File | Action Required Before Deletion |
|------|--------------------------------|
| `tests/core/import-discipline.test.ts` | Verify import discipline still enforced (ESLint, dependency-cruiser, CI) |
| `tests/styles/breakpoints-triangulation.test.ts` | Confirm breakpoint alignment tested elsewhere or no longer needed |
| `tests/styles/breakpoints.test.ts` | Confirm breakpoint validation tested elsewhere or no longer needed |
| `tests/styles/typography-presence.test.ts` | Confirm typography tokens validated elsewhere or no longer needed |

**Decision Criteria:**
- ✅ If enforcement/validation exists elsewhere → Safe to delete
- ❌ If no replacement enforcement → Keep the test

#### Stage 3B: UI Behavior/Warnings Tests (2 files)

| File | Action Required Before Deletion |
|------|--------------------------------|
| `tests/ui/react-keys.dom.test.tsx` | Verify React key warnings are caught by React dev mode (likely redundant) |
| `tests/ui/providers/route-theme-provider.dom.test.tsx` | Verify RouteThemeProvider tested elsewhere (might be false positive) |

**Decision Criteria:**
- ✅ If component/behavior tested elsewhere → Safe to delete
- ❌ If this is the only test coverage → Keep the test

**Note:** `route-theme-provider.dom.test.tsx` might be a false positive similar to `error-fallback.dom.test.tsx` (which we kept). Verify it's actually executed by Vitest before deletion.

---

## Summary

### Immediate Next Steps (Recommended)

1. **Stage 2** - Fix orphan audit classification
   - Prevents future false positives
   - Low risk, high value
   - Can be done independently

### Future Work (Optional)

2. **Stage 3** - Intentional test removals
   - Requires team approval
   - Requires coverage/enforcement review
   - Can be split into 3A and 3B PRs
   - Only proceed if team agrees coverage isn't needed

---

## Quick Reference

**Current State:**
- ✅ Stage 1: Complete (2 duplicates deleted, docs updated)
- ✅ Stage 2: Complete (orphan audit fixed, test files excluded)
- ✅ Stage 3: Complete (tests removed/consolidated, decisions recorded)

**Files Still Present (from original 12 DROP candidates):**
- 4 files: Definitive KEEP (correct location + valid tests)
- 6 files: Stage 3 candidates (require team approval)

**Orphan Audit Status:**
- Current: 0 DROP files
- Stage 2 will prevent future test file false positives

---

_Last updated: 2025-12-30_

