---
title: "Generate SQL Route Test Audit"
description: "Audit of generate-sql route tests to identify potential failure modes and test setup issues."
last_updated: "2025-12-29"
category: "documentation"
status: "resolved"
---
# Generate SQL Route Test Audit - December 2025

**Date:** 2025-12-25  
**Branch:** main  
**HEAD:** f57eaf9bf5952ed5342b42988752be833361a925  
**Status:** ✅ All tests passing (15/15)

## Executive Summary

Audit of `tests/chat/generate-sql.route.test.ts` and `app/api/v1/ai/generate-sql/route.ts` to identify potential failure modes and test setup issues. All tests currently pass, but defensive improvements were implemented to prevent future failures.

## Findings

### ✅ Tests Status: All Passing

All 15 tests in `generate-sql.route.test.ts` pass successfully:
- Route module loading
- Authentication (401 for unauthenticated)
- Successful SQL generation (200)
- Validation errors (400 for missing fields, unsafe SQL)
- Tenant isolation enforcement
- RBAC/authentication behavior

### 🔍 Audit Findings

#### 1. Missing `getEnv` Mock (FIXED)

**Issue:** Route calls `getEnv()` from `@/lib/server/env` but test file didn't mock it.

**Location:**
- Route: `app/api/v1/ai/generate-sql/route.ts:98`
- Test: `tests/chat/generate-sql.route.test.ts`

**Impact:** Low risk currently (tests pass), but could fail if:
- `getEnv()` throws on missing env vars
- Environment validation becomes stricter
- CI environment lacks required env vars

**Fix Applied:** Added top-level `vi.mock('@/lib/server/env')` mock:
```typescript
vi.mock('@/lib/server/env', () => ({
  getEnv: () => ({
    OPENAI_SQL_MODEL: 'gpt-4o-mini',
  }),
}));
```

**Verification:** Tests still pass after fix.

#### 2. Request vs NextRequest Type Mismatch (NO ACTION NEEDED)

**Issue:** Route handler expects `NextRequest`, but tests construct `Request` and cast with `as any`.

**Location:**
- Route handler: `async (req: NextRequest): Promise<Response>`
- Test: `new Request(...)` cast to `as any`

**Impact:** None currently. Both `Request` and `NextRequest` support:
- `req.headers.get()` (used by `getTenantContext`)
- `req.json()` (used by handler)

**Analysis:** The route only uses `req.json()` and passes `req` to `getTenantContext()`, which only accesses `req.headers.get()`. Both methods work on standard `Request` objects, so the type mismatch doesn't cause runtime failures.

**Recommendation:** Consider updating tests to use `NextRequest` for better type safety, but not required for functionality.

#### 3. Response → NextResponse Body Stream Conversion (MONITORED)

**Issue:** Wrappers (`withErrorHandlingEdge`, `withRateLimitEdge`) convert `Response` to `NextResponse` when adding request ID headers.

**Location:** `lib/middleware/http/request-id.ts:37-46`

**Current Implementation:**
```typescript
export function addRequestIdHeader(res: Response | NextResponse, requestId: string): NextResponse {
  const response =
    res instanceof NextResponse
      ? res
      : new NextResponse(res.body, {  // ← Potential body stream issue
          status: res.status,
          headers: res.headers,
        });
  // ...
}
```

**Risk:** If `res.body` is already consumed or not cloneable, conversion could fail.

**Evidence:** No failures observed. Tests pass, indicating current implementation works in test environment.

**Recommendation:** Monitor for failures. If issues arise, consider:
- Mutating headers in-place instead of converting Response to NextResponse
- Ensuring body streams are cloneable before conversion
- Adding regression test that verifies body remains readable after header addition

#### 4. Runtime vs Wrapper Mismatch (DOCUMENTED, NO ACTION)

**Issue:** Route declares `runtime = 'nodejs'` but uses Edge wrappers (`withErrorHandlingEdge`, `withRateLimitEdge`).

**Location:** `app/api/v1/ai/generate-sql/route.ts:21,25`

**Analysis:** Edge wrappers are edge-safe (no Node-only dependencies), so they work in Node runtime. This is conceptually inconsistent but functionally correct.

**Recommendation:** Consider migrating to Node wrappers (`withErrorHandlingNode`, `withRateLimitNode`) for consistency, but not urgent since current setup works.

## Changes Applied

### Patch 1: Add `getEnv` Mock (DEFENSIVE IMPROVEMENT)

**File:** `tests/chat/generate-sql.route.test.ts`

Added mock after line 34:
```typescript
// Mock getEnv - route uses OPENAI_SQL_MODEL
vi.mock('@/lib/server/env', () => ({
  getEnv: () => ({
    OPENAI_SQL_MODEL: 'gpt-4o-mini',
  }),
}));
```

**Rationale:** Prevents future failures if `getEnv()` becomes stricter or if CI environment lacks env vars.

**Verification:** ✅ All tests still pass

## Recommendations

### High Priority
- ✅ **DONE:** Add `getEnv` mock to prevent env-related failures

### Medium Priority
- Monitor for Response→NextResponse body stream issues
- Consider adding regression test for header addition preserving body readability

### Low Priority
- Update tests to use `NextRequest` instead of `Request` (type safety improvement)
- Consider migrating Node routes to `withErrorHandlingNode` / `withRateLimitNode` for consistency

## Test Verification

All quality gates pass:

```bash
✅ pnpm typecheck          # Passes
✅ pnpm lint              # Passes (minor false positives in IDE)
✅ pnpm vitest run tests/chat/generate-sql.route.test.ts  # 15/15 tests pass
✅ pnpm test              # Full suite passes
```

## Evidence: Node Wrapper Adoption Failure Pattern

From code analysis, the historical failure pattern with Response→NextResponse conversion:

**Problem:** When wrapping handlers that return `Response`, `addRequestIdHeader` tries to create `NextResponse` from `res.body`. If the body stream was already consumed or isn't cloneable, this fails.

**Solution Pattern (if needed):**
1. Mutate headers in-place on Response objects instead of converting
2. Ensure body streams are cloneable before conversion
3. Add unit test verifying body remains readable after header addition

**Current Status:** No failures observed. Implementation appears to handle body streams correctly in practice.

## Related Files

- `app/api/v1/ai/generate-sql/route.ts` - Route handler
- `tests/chat/generate-sql.route.test.ts` - Test suite
- `lib/middleware/http/request-id.ts` - Header addition utility
- `lib/middleware/edge/error-handler.ts` - Error handling wrapper
- `lib/middleware/edge/rate-limit.ts` - Rate limiting wrapper

## Notes

- Tests are currently passing, so no urgent fixes required
- Changes made are defensive improvements to prevent future failures
- All findings are documented for future reference
- Body stream conversion risk is monitored but not causing issues currently

