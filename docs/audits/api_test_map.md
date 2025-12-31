---
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# API Test Mapping

**Generated**: 2025-01-XX (Sprint 0 Baseline Verification)  
**Scope**: Tests referencing `/api/` paths or importing `app/api` modules  
**Status**: ✅ Complete - All test files located and categorized

## Summary

- **Total Test Files**: 42 files found (grep `/api/`)
- **Direct API Tests**: 18 files (grep `app/api`)
- **Test Categories**: Unit tests, integration tests, security tests, CORS tests, rate limit tests

## Test Files by Route

### Health Endpoints

#### `/api/health`
- **Tests**: 
  - `tests/api/health.test.ts` - Health endpoint tests
- **Coverage**: ✅ Has tests
- **Notes**: General health check endpoint

#### `/api/health/clickhouse`
- **Tests**: 
  - `tests/api/health-clickhouse.test.ts` - ClickHouse health check tests
- **Coverage**: ✅ Has tests
- **Notes**: Database connectivity health check

### Versioned API (v1)

#### `POST /api/v1/user`
- **Tests**: 
  - `tests/api/v1/user.test.ts` - User endpoint tests
- **Coverage**: ✅ Has tests
- **Notes**: User profile operations

#### `POST /api/v1/ai/generate-sql`
- **Tests**: 
  - `tests/chat/generate-sql.route.basic.test.ts` - Basic functionality
  - `tests/chat/generate-sql.route.auth.test.ts` - Authentication tests
  - `tests/chat/generate-sql.route.success.test.ts` - Success scenarios
  - `tests/chat/generate-sql.route.validation.test.ts` - Input validation
  - `tests/chat/generate-sql.route.tenant.test.ts` - Tenant isolation
  - `tests/chat/generate-sql.route.security.test.ts` - Security tests
- **Coverage**: ✅ Comprehensive test coverage (6 test files)
- **Notes**: Well-tested endpoint with multiple test scenarios

#### `POST /api/v1/ai/chat`
- **Tests**: 
  - `tests/chat/chat.route.basic.test.ts` - Basic functionality
  - `tests/chat/chat.route.auth.test.ts` - Authentication tests
  - `tests/chat/chat.route.tenant.test.ts` - Tenant isolation
  - `tests/api/chat-streaming.test.ts` - Streaming NDJSON tests
  - `tests/api/chat-prompt.node.test.ts` - Prompt handling tests
- **Coverage**: ✅ Comprehensive test coverage (5 test files)
- **Notes**: Well-tested endpoint including streaming scenarios

#### `POST /api/v1/entity/[entity]/query`
- **Tests**: 
  - `tests/api/v1/entity-query.test.ts` - Entity query tests
  - `tests/api/projects-query.runtime.test.ts` - Runtime-specific tests
- **Coverage**: ✅ Has tests
- **Notes**: Entity query endpoint with filtering/sorting/pagination

#### `GET /api/v1/entity/[entity]`
- **Tests**: 
  - `tests/api/entity.get.test.ts` - Entity GET endpoint tests
  - `tests/api/v1/entity-list.relaxed.test.ts` - Relaxed auth mode tests
  - `tests/api/v1/entity-rate-limit.test.ts` - Rate limiting tests
- **Coverage**: ✅ Has tests (3 test files)
- **Notes**: Entity list endpoint with various test scenarios

#### `GET /api/v1/entity/[entity]/export`
- **Tests**: 
  - `tests/dashboard/entity-export.route.test.ts` - Export endpoint tests
  - `tests/api/export.cors.test.ts` - CORS tests
- **Coverage**: ✅ Has tests
- **Notes**: Deprecated endpoint (returns 410 Gone) - tests may need updates

#### `POST /api/v1/query`
- **Tests**: 
  - `tests/api/v1/query.test.ts` - Generic query endpoint tests
- **Coverage**: ✅ Has tests
- **Notes**: Generic SQL query endpoint

#### `GET /api/v1/insights/search`
- **Tests**: 
  - `tests/api/v1/insights-search.test.ts` - Insights search tests
- **Coverage**: ✅ Has tests
- **Notes**: Public search endpoint

#### `POST /api/v1/csp-report`
- **Tests**: 
  - `tests/api/csp-report.cors.test.ts` - CORS tests
- **Coverage**: ⚠️ Limited coverage (CORS only)
- **Notes**: CSP violation reporting - may need more comprehensive tests

### Internal Endpoints

#### `POST /api/internal/auth`
- **Tests**: 
  - `tests/api/internal/auth.webhook.test.ts` - Webhook signature verification tests
- **Coverage**: ✅ Has tests
- **Notes**: Clerk webhook endpoint

## Cross-Cutting Test Files

### Infrastructure Tests
- **`tests/api/api-barrel.test.ts`** - Tests for `@/lib/api` barrel exports (edge safety)
- **`tests/api/http-helpers.test.ts`** - HTTP response helper tests
- **`tests/api/responses-api.node.test.ts`** - Response API tests (Node.js)
- **`tests/core/lib-api-edge-safety.test.ts`** - Edge runtime safety tests for `@/lib/api`

### Security Tests
- **`tests/security/ai-security.test.ts`** - AI security validation tests
- **`tests/security/rate-limit.edge.test.ts`** - Edge rate limiting tests

### CORS Tests
- **`tests/api/middleware-cors.test.ts`** - CORS middleware tests
- **`tests/api/csp-report.cors.test.ts`** - CSP report CORS tests
- **`tests/api/export.cors.test.ts`** - Export endpoint CORS tests

### Runtime Boundary Tests
- **`tests/runtime-boundary/edge-imports.test.ts`** - Edge runtime import validation

### Type Tests
- **`tests/types/openapi.types.test.ts`** - OpenAPI generated types tests

### Documentation Tests
- **`tests/api/README.md`** - Test documentation/patterns
- **`tests/api/README-request-patterns.md`** - Request pattern documentation

## Test Coverage Analysis

### Well-Tested Endpoints
1. **`/api/v1/ai/generate-sql`** - 6 test files covering basic, auth, validation, tenant, security
2. **`/api/v1/ai/chat`** - 5 test files covering basic, auth, tenant, streaming
3. **`/api/v1/entity/[entity]`** - 3 test files covering GET, relaxed auth, rate limits

### Adequately Tested Endpoints
1. **`/api/v1/user`** - 1 test file
2. **`/api/v1/entity/[entity]/query`** - 2 test files
3. **`/api/v1/query`** - 1 test file
4. **`/api/v1/insights/search`** - 1 test file
5. **`/api/health`** - 1 test file
6. **`/api/health/clickhouse`** - 1 test file
7. **`/api/internal/auth`** - 1 test file

### Under-Tested Endpoints
1. **`/api/v1/csp-report`** - Only CORS tests, missing:
   - Content-Type validation tests
   - Report format parsing tests (Reporting API, legacy, permissive JSON)
   - Fan-out to `CSP_FORWARD_URI` tests
   - Dev logging tests

2. **`/api/v1/entity/[entity]/export`** - Tests exist but endpoint is deprecated (410 Gone):
   - Tests may need updates to verify deprecation behavior
   - Should test deprecation headers (Deprecation, Sunset, Link)

## Test Patterns & Observations

### Test Organization
- **Route-Specific Tests**: Most tests are colocated by route (e.g., `tests/chat/chat.route.*.test.ts`)
- **Domain Tests**: Some tests organized by domain (e.g., `tests/api/v1/*`, `tests/chat/*`)
- **Cross-Cutting Tests**: Infrastructure tests in `tests/api/`, `tests/security/`, `tests/core/`

### Test Types
- **Unit Tests**: Route handler logic, validation, error handling
- **Integration Tests**: Full request/response cycles
- **Security Tests**: Auth, RBAC, SQL injection prevention, rate limiting
- **CORS Tests**: Preflight handling, origin validation
- **Runtime Tests**: Edge vs Node.js runtime validation

### Implementation-Coupled Tests
Some tests appear to be implementation-coupled (testing internal structure):

1. **Tool Call Structure**: `tests/chat/chat.route.*.test.ts` may test OpenAI function calling internals
2. **Internal Function Calls**: Tests may call internal functions directly (not just HTTP endpoints)
3. **Rate Limiter Internals**: `tests/api/v1/entity-rate-limit.test.ts` may test rate limiter implementation details

**Note**: These are identified but NOT changed in Sprint 0 (read-only analysis).

## Test Quality Indicators

### ✅ Strengths
1. **Comprehensive Coverage**: Most endpoints have dedicated test files
2. **Security Focus**: Separate security test files for AI endpoints
3. **CORS Testing**: Dedicated CORS tests for browser-facing endpoints
4. **Runtime Validation**: Tests for Edge vs Node.js runtime boundaries

### ⚠️ Gaps
1. **CSP Report**: Limited test coverage (CORS only)
2. **Export Endpoint**: Tests may not reflect deprecation (410 Gone)
3. **Rate Limiting**: `/api/internal/auth` has no rate limit wrapper but no tests verify this

## Recommendations

### High Priority
1. **Add CSP Report Tests**: 
   - Content-Type validation (Reporting API, legacy, permissive JSON)
   - Report format parsing
   - Fan-out to `CSP_FORWARD_URI`
   - Dev logging behavior

2. **Update Export Tests**: 
   - Verify 410 Gone response
   - Test deprecation headers (Deprecation, Sunset, Link)
   - Verify alternative endpoint suggestion

### Medium Priority
3. **Add Rate Limit Tests**: Verify `/api/internal/auth` rate limiting (or document why it's not rate limited)
4. **Add Integration Tests**: End-to-end tests for complete request/response cycles
5. **Test Documentation**: Ensure test patterns are documented in `tests/api/README.md`

### Low Priority
6. **Test Organization**: Consider consolidating route-specific tests (e.g., all entity tests in one directory)
7. **Test Coverage Metrics**: Generate coverage reports to identify untested code paths

## Verification Commands

```bash
# Find all tests referencing /api/
rg -n "/api/" tests

# Find all tests importing app/api
rg -n "app/api" tests

# Count test files
find tests -name "*.test.ts" -o -name "*.test.tsx" | wc -l

# List API test files
find tests -path "*/api/*" -name "*.test.ts"
```
