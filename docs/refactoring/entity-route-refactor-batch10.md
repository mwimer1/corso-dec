---
last_updated: "2026-01-04"
category: "documentation"
status: "draft"
title: "Refactoring"
description: "Documentation and resources for documentation functionality. Located in refactoring/."
---
# Batch 10 — Entity Route Refactoring Summary

**Goal**: Extract validation and org resolution helpers from `/api/v1/entity/[entity]` route to improve maintainability and code reuse.

## Before/After Responsibilities

### Before Refactoring

The route file (`app/api/v1/entity/[entity]/route.ts`) contained ~437 lines with the following responsibilities:

1. **Authentication & RBAC** (~150 lines)
   - Manual auth check with `auth()`
   - Complex org resolution logic with fallbacks (header → active → memberships)
   - RBAC checks with different logic for active vs fallback orgs
   - Relaxed auth mode handling

2. **Org Resolution** (~70 lines, embedded in handler)
   - Header extraction (`X-Corso-Org-Id`)
   - Active org fallback from Clerk session
   - Fallback to first org from user memberships
   - Error handling for missing org context
   - Relaxed vs strict mode logic

3. **Entity Param Validation** (~10 lines)
   - Zod schema validation using `EntityParamSchema`

4. **Filter/Sort Validation** (~120 lines)
   - `parseFiltersParam()` function (inline)
   - `getAllowedSortFields()` function (inline)
   - `getAllowedFilterFields()` function (inline)
   - Sort field validation logic
   - Filter field validation logic
   - Column config loading for validation

5. **Query Execution** (~20 lines)
   - Build params object
   - Call `getEntityPage()`
   - Format response

### After Refactoring

The route file is now ~227 lines (48% reduction) with cleaner separation:

1. **Authentication & RBAC** (~60 lines)
   - Uses extracted `resolveOrgContext()` helper
   - Simplified RBAC logic (still route-specific)
   - Relaxed auth mode handling preserved

2. **Org Resolution** (extracted to `lib/entities/org-resolution.ts`)
   - `resolveOrgContext()` function (returns `Response | OrgResolutionResult`)
   - All fallback logic encapsulated
   - Reusable across entity routes

3. **Entity Param Validation** (~10 lines, unchanged)
   - Zod schema validation (kept inline - simple enough)

4. **Filter/Sort Validation** (extracted to `lib/entities/validation.ts`)
   - `parseFiltersParam()` - exported helper
   - `getAllowedSortFields()` - exported helper
   - `getAllowedFilterFields()` - exported helper
   - `validateSortBy()` - exported helper
   - `validateFilters()` - exported helper
   - `validateEntityQueryParams()` - convenience function that handles both

5. **Query Execution** (~20 lines, unchanged)
   - Build params object
   - Call `getEntityPage()`
   - Format response

## Files Created

### `lib/entities/validation.ts`
- **Purpose**: Centralized validation helpers for entity routes
- **Exports**:
  - `parseFiltersParam()` - Parse filters from URL param
  - `getAllowedSortFields()` - Get sortable fields from column config
  - `getAllowedFilterFields()` - Get filterable fields from column config
  - `validateSortBy()` - Validate sort field against allowed fields
  - `validateFilters()` - Validate filters against allowed fields
  - `validateEntityQueryParams()` - Convenience function for both
- **Tests**: `tests/lib/entities/validation.test.ts` (24 test cases)

### `lib/entities/org-resolution.ts`
- **Purpose**: Organization context resolution for entity routes
- **Exports**:
  - `resolveOrgContext()` - Resolve org ID with fallback logic
  - `OrgResolutionResult` - Type for resolution result
- **Features**:
  - Supports relaxed and strict auth modes
  - Header → active org → memberships fallback chain
  - Returns `Response | OrgResolutionResult` for error handling

## Files Modified

### `app/api/v1/entity/[entity]/route.ts`
- **Changes**:
  - Removed inline validation functions (moved to `lib/entities/validation.ts`)
  - Removed org resolution logic (moved to `lib/entities/org-resolution.ts`)
  - Added imports for extracted helpers
  - Simplified handler logic using extracted functions
- **Line count**: 437 → 227 (48% reduction)
- **Behavior**: Identical (all tests pass)

## Error Behavior Verification

✅ All existing tests pass:
- `tests/api/entity.get.test.ts` - 18 tests passing
- Error responses remain identical (401, 403, 400, etc.)
- Response formats unchanged

## Frontend Compatibility

✅ Frontend fetchers remain compatible:
- `components/dashboard/entities/shared/fetchers.ts` unchanged
- Query params format unchanged (GET with URLSearchParams)
- Headers format unchanged (`X-Corso-Org-Id`)
- Response format unchanged (wrapped and flat formats supported)

## OpenAPI Spec Compatibility

✅ OpenAPI spec unchanged:
- No changes to `api/openapi.yml` required
- Request/response schemas unchanged
- Endpoint behavior unchanged

## Benefits

1. **Code Reuse**: Validation helpers can be reused by other routes (e.g., `/query` endpoint)
2. **Testability**: Extracted functions have unit tests (24 test cases)
3. **Maintainability**: Smaller route file is easier to understand and modify
4. **Consistency**: Shared helpers ensure consistent validation logic across routes
5. **Type Safety**: All helpers are fully typed with TypeScript

## Next Steps (Future Work)

- Consider extracting RBAC logic to a shared helper (currently route-specific due to org source handling)
- Consider using `requireTenantContext()` pattern if we migrate to throwing exceptions instead of returning Responses
- Apply similar refactoring to `/api/v1/entity/[entity]/query` route (POST endpoint)

## Testing

All tests passing:
- ✅ Type checking: `pnpm typecheck`
- ✅ Unit tests: `tests/lib/entities/validation.test.ts` (24/24 passing)
- ✅ Integration tests: `tests/api/entity.get.test.ts` (18/18 passing)
