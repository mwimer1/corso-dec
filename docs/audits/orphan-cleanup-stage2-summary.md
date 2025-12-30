---
status: "completed"
last_updated: "2025-12-30"
category: "documentation"
---
# Orphan Cleanup - Stage 2 Summary

**Date:** 2025-12-30  
**Status:** ✅ Completed  
**Risk Level:** Low

## Changes Made

### Orphan Audit Update

**File:** `scripts/audit/orphans.ts`

**Change:** Added exclusion for test files in the candidate filtering logic.

```typescript
const filteredCandidates = candidates.filter((rel: string) => {
  if (!argv.includeIndex && isIndexBarrel(rel)) return false;
  // Exclude convention files (tooling/CLI consumed, not TS imported)
  if (CONVENTION_FILE_PATTERNS.some(pattern => pattern.test(rel))) return false;
  // Exclude test files (discovered by Vitest glob patterns, not via imports)
  // Test files are entrypoints for the test runner, not production code modules
  if (rel.startsWith('tests/')) return false;
  return true;
});
```

**Rationale:**
- Test files are discovered by Vitest via glob patterns (`tests/**/*.test.{ts,tsx}`), not via imports
- Test files are entrypoints for the test runner, not production code modules
- Excluding them prevents false positives where valid tests are marked as DROP
- This aligns with the orphan audit's goal: finding unused **production** modules

## Validation Results

✅ **Typecheck:** Passed  
✅ **Lint:** Passed  
✅ **Orphan Audit:** 
   - Candidates: 605 (down from 740, ~135 test files excluded)
   - DROP files: 0 (test files no longer appear as candidates)

## Impact

- **Orphan Audit:** More accurate results - test files no longer cause false positives
- **Maintenance:** Prevents future confusion about test files being marked as DROP
- **Production Code:** Still properly analyzed for orphan detection
- **Test Files:** Now correctly excluded from orphan analysis

## Before vs After

**Before:**
- 740 candidates (included test files)
- Test files could be marked as DROP (false positives)
- Required manual verification for test file DROP candidates

**After:**
- 605 candidates (excludes test files)
- Test files automatically excluded from orphan analysis
- No false positives for test files

## Notes

- Test files are still scanned for references in `REFERENCE_DIRS` (docs, scripts, tools, etc.)
- This change only affects whether test files are considered as **candidates** for DROP status
- Production code files are still fully analyzed
- The orphan audit's core functionality remains unchanged - only the candidate set is filtered

---

_Completed: 2025-12-30_



