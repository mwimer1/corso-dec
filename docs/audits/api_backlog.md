# API Backlog - Prioritized Improvement Items

**Generated**: 2025-01-XX (Sprint 0 Baseline Verification)  
**Status**: ✅ Complete - Backlog created from verified inventory  
**Priority**: High → Medium → Low

## Quick Wins (Low Effort, High Impact)

### 1. Add Missing Rate Limit to Internal Auth Route
- **File**: `app/api/internal/auth/route.ts`
- **Issue**: Route has no rate limit wrapper, but README claims 100/min
- **Fix**: Add `withRateLimitNode` wrapper with `{ windowMs: 60_000, maxRequests: 100 }`
- **Impact**: Security improvement, consistency with other routes
- **Effort**: ~5 minutes
- **Priority**: 🔴 High

### 2. Add Error Handling Wrapper to Internal Auth Route
- **File**: `app/api/internal/auth/route.ts`
- **Issue**: Route has no `withErrorHandlingNode` wrapper (inconsistent with other routes)
- **Fix**: Wrap handler with `withErrorHandlingNode`
- **Impact**: Consistent error handling, better error responses
- **Effort**: ~5 minutes
- **Priority**: 🔴 High

### 3. Update Internal API README
- **File**: `app/api/internal/README.md`
- **Issue**: Outdated (last updated 2025-10-04), mentions Stripe webhooks (not found), incorrect auth pattern
- **Fix**: 
  - Remove Stripe webhook references
  - Update auth pattern (webhook signature, not `requireUserId()`)
  - Update rate limit information
  - Update `last_updated` date
- **Impact**: Accurate documentation, reduces confusion
- **Effort**: ~15 minutes
- **Priority**: 🟡 Medium

### 4. Update v1 API README Route Table
- **File**: `app/api/v1/README.md`
- **Issue**: Route table incomplete (missing CSP report and insights search), claims "Routes (8)" but only lists 6
- **Fix**: 
  - Add `/api/v1/csp-report` to table (Edge runtime, public, 30/min)
  - Add `/api/v1/insights/search` to table (public, 60/min)
  - Update route count or clarify which routes are included
- **Impact**: Accurate documentation
- **Effort**: ~10 minutes
- **Priority**: 🟡 Medium

### 5. Document Export Endpoint Deprecation
- **File**: `app/api/README.md` or `app/api/v1/README.md`
- **Issue**: Export endpoint returns 410 Gone but not clearly documented
- **Fix**: Add deprecation notice with removal date, sunset date, alternative endpoint
- **Impact**: Clear communication to API consumers
- **Effort**: ~5 minutes
- **Priority**: 🟡 Medium

## Structural Improvements (Medium Effort, High Impact)

### 6. Remove or Fully Deprecate Export Endpoint
- **File**: `app/api/v1/entity/[entity]/export/route.ts`
- **Issue**: Endpoint returns 410 Gone but still exists in codebase
- **Options**:
  - **Option A**: Remove route file entirely (breaking change)
  - **Option B**: Keep route but add clear deprecation headers and documentation
- **Impact**: Code cleanup or clear deprecation path
- **Effort**: ~30 minutes (Option B) or ~10 minutes (Option A)
- **Priority**: 🟡 Medium
- **Decision Needed**: Product/API versioning strategy

### 7. Consolidate Health Endpoint Aliases
- **Files**: 
  - `app/api/health/route.ts` (alias)
  - `app/api/health/clickhouse/route.ts` (alias)
  - `app/api/public/health/route.ts` (canonical)
  - `app/api/public/health/clickhouse/route.ts` (canonical)
- **Issue**: Alias routes exist for backward compatibility, but unclear if still needed
- **Fix**: 
  - Verify if aliases are still used (check logs, analytics)
  - If not needed: Remove aliases, update OpenAPI spec
  - If needed: Document why both exist, add redirects (308) from aliases to canonical
- **Impact**: Cleaner codebase or clear backward compatibility strategy
- **Effort**: ~1 hour (investigation + implementation)
- **Priority**: 🟢 Low
- **Decision Needed**: Backward compatibility requirements

### 8. Standardize Error Handling Patterns
- **Files**: All route files in `app/api/**`
- **Issue**: `/api/internal/auth` doesn't use error handling wrapper (inconsistent)
- **Fix**: Ensure all routes use `withErrorHandlingNode` or `withErrorHandlingEdge`
- **Impact**: Consistent error responses, better error handling
- **Effort**: ~15 minutes (already identified in Quick Wins #2)
- **Priority**: 🔴 High (duplicate of #2)

### 9. Add Missing CSP Report Tests
- **File**: `tests/api/csp-report.cors.test.ts` (expand) or create new test file
- **Issue**: CSP report endpoint only has CORS tests, missing:
  - Content-Type validation tests
  - Report format parsing (Reporting API, legacy, permissive JSON)
  - Fan-out to `CSP_FORWARD_URI` tests
  - Dev logging behavior tests
- **Fix**: Add comprehensive test coverage
- **Impact**: Better test coverage, catch regressions
- **Effort**: ~2 hours
- **Priority**: 🟡 Medium

## Documentation & OpenAPI Alignment

### 10. Verify OpenAPI Spec Completeness
- **File**: `api/openapi.yml`
- **Issue**: Need to verify all routes are documented in OpenAPI spec
- **Fix**: 
  - Cross-reference route inventory with OpenAPI paths
  - Add missing endpoints
  - Update schemas to match implementation
- **Impact**: Accurate API documentation, type generation
- **Effort**: ~2-3 hours
- **Priority**: 🟡 Medium

### 11. Document Alias Route Strategy
- **File**: `app/api/health/README.md` or `app/api/README.md`
- **Issue**: Alias routes exist but purpose unclear
- **Fix**: Document backward compatibility strategy, when to use aliases vs canonical
- **Impact**: Clear understanding of route organization
- **Effort**: ~30 minutes
- **Priority**: 🟢 Low

### 12. Sync Documentation Last Updated Dates
- **Files**: All `app/api/**/README.md` files
- **Issue**: Some docs have outdated `last_updated` dates
- **Fix**: Update `last_updated` dates when making changes
- **Impact**: Better documentation maintenance
- **Effort**: ~5 minutes per file
- **Priority**: 🟢 Low

## Test Improvements

### 13. Update Export Endpoint Tests for Deprecation
- **File**: `tests/dashboard/entity-export.route.test.ts`
- **Issue**: Tests may not reflect 410 Gone deprecation behavior
- **Fix**: 
  - Verify 410 Gone response
  - Test deprecation headers (Deprecation, Sunset, Link)
  - Verify alternative endpoint suggestion
- **Impact**: Tests match implementation
- **Effort**: ~30 minutes
- **Priority**: 🟡 Medium

### 14. Add Rate Limit Tests for Internal Auth
- **File**: Create `tests/api/internal/auth.rate-limit.test.ts` or add to existing test
- **Issue**: No tests verify rate limiting for `/api/internal/auth` (if added)
- **Fix**: Add rate limit tests after implementing rate limiting
- **Impact**: Verify rate limiting works correctly
- **Effort**: ~30 minutes
- **Priority**: 🟡 Medium (depends on #1)

### 15. Add Integration Tests for Complete Request/Response Cycles
- **File**: Create `tests/api/integration/` directory
- **Issue**: Most tests are unit tests, limited end-to-end integration tests
- **Fix**: Add integration tests that test full request/response cycles
- **Impact**: Better confidence in API behavior
- **Effort**: ~4-6 hours
- **Priority**: 🟢 Low

## Code Quality & Consistency

### 16. Verify All Routes Use Consistent Patterns
- **Files**: All route files in `app/api/**`
- **Issue**: Need to verify consistency across:
  - Error handling wrappers
  - Rate limiting patterns
  - CORS handling
  - Input validation
  - Output formatting
- **Fix**: Audit all routes, create consistency checklist
- **Impact**: Easier maintenance, fewer bugs
- **Effort**: ~2 hours (audit) + implementation time
- **Priority**: 🟡 Medium

### 17. Remove Dead Code / Unused Exports
- **Files**: All route files, `lib/api/**`, `lib/middleware/**`
- **Issue**: May have unused exports, dead code
- **Fix**: Run dead code analysis, remove unused code
- **Impact**: Cleaner codebase, smaller bundle
- **Effort**: ~1-2 hours (analysis) + cleanup time
- **Priority**: 🟢 Low

### 18. Add Type Safety for Route Handlers
- **Files**: All route files in `app/api/**`
- **Issue**: Some route handlers use `as any` casts (e.g., rate limit wrappers)
- **Fix**: Improve TypeScript types to avoid `as any` casts
- **Impact**: Better type safety, catch errors at compile time
- **Effort**: ~3-4 hours
- **Priority**: 🟢 Low

## Backlog Summary

### By Priority

**🔴 High Priority (Quick Wins)**
1. Add rate limit to internal auth route
2. Add error handling wrapper to internal auth route

**🟡 Medium Priority (Structural)**
3. Update internal API README
4. Update v1 API README route table
5. Document export endpoint deprecation
6. Remove or fully deprecate export endpoint
9. Add missing CSP report tests
10. Verify OpenAPI spec completeness
13. Update export endpoint tests for deprecation
14. Add rate limit tests for internal auth
16. Verify all routes use consistent patterns

**🟢 Low Priority (Polish)**
7. Consolidate health endpoint aliases
11. Document alias route strategy
12. Sync documentation last updated dates
15. Add integration tests
17. Remove dead code / unused exports
18. Add type safety for route handlers

### By Category

**Quick Wins**: 5 items (High/Medium priority, low effort)
**Structural**: 6 items (Medium effort, high impact)
**Documentation**: 3 items (Low effort, improves clarity)
**Testing**: 3 items (Medium effort, better coverage)
**Code Quality**: 3 items (Low priority, long-term benefits)

### Estimated Effort

- **Quick Wins**: ~1-2 hours total
- **Structural**: ~8-12 hours total
- **Documentation**: ~1-2 hours total
- **Testing**: ~3-4 hours total
- **Code Quality**: ~6-8 hours total

**Total Estimated Effort**: ~19-28 hours

## Next Steps

1. **Sprint 1**: Focus on Quick Wins (#1, #2) and Medium Priority documentation (#3, #4, #5)
2. **Sprint 2**: Structural improvements (#6, #9, #10) and test updates (#13, #14)
3. **Sprint 3+**: Code quality improvements (#16, #17, #18) and low-priority items

## Notes

- All backlog items reference concrete file paths
- Each item includes impact assessment and effort estimate
- Priority based on security, consistency, and user impact
- Some items require product/architecture decisions before implementation
