---
category: "documentation"
last_updated: "2026-01-03"
status: "draft"
title: "Cicd Workflow"
description: "Documentation and resources for documentation functionality. Located in cicd-workflow/."
---
# Reference Sweep Results - Final Parity Check

**Date**: 2026-01-03  
**Branch**: `chore/final-parity-legacy-sweep`  
**Purpose**: Verify repository consistency after all prior PRs

## Reference Sweep Summary

### `/api/public` References
**Status**: ✅ **CLEAN** (deprecated references only)
- `.env.test`: `CSP_REPORT_URI=/api/public/csp-report` (test config, acceptable)
- `.env.example`: Commented out deprecated `CSP_REPORT_URI` (documented as deprecated)

**Action**: No changes needed - deprecated references are properly documented.

### `/api/v1/dashboard` References
**Status**: ✅ **CLEAN** (historical/example references only)
- `api/README.md`: Example code (line 161) - should be updated to `/api/v1/ai/chat`
- `app/api/README.md`: Documentation note about removal (acceptable)
- `docs/references/api-specification.md`: Error examples (acceptable for documentation)
- `scripts/lint/audit-ai-security.ts`: Legacy path in comment (acceptable)
- `scripts/check-architecture-drift.ts`: Architecture validation script (acceptable)
- `.cursor/implementation-plan/`: Historical planning docs (acceptable)

**Action**: Update example in `api/README.md` to use correct endpoint.

### `sanitizeUserInput` References
**Status**: ✅ **CLEAN** (all correct)
- Implementation: `lib/security/prompt-injection.ts`
- Usage: `lib/api/ai/chat/request.ts`, `app/api/v1/ai/generate-sql/route.ts`
- Tests: `tests/security/prompt-injection.test.ts`
- Documentation: `.cursor/rules/security-standards.mdc`, `docs/security/security-implementation.md`

**Action**: No changes needed - all references are correct.

### `createWrappedHandler` References
**Status**: ✅ **CLEAN** (legitimate usage)
- `lib/api/dynamic-route.ts`: Internal implementation detail (acceptable)
- `tests/api/dynamic-route.test.ts`: Test references (acceptable)

**Action**: No changes needed - legitimate internal usage.

### `OPTIONS(` Handler References
**Status**: ✅ **CLEAN** (all correct)
- All routes properly implement OPTIONS handlers
- Uses `handleCors()` or `handleOptions()` as appropriate

**Action**: No changes needed.

### `handleCors(` References
**Status**: ✅ **CLEAN** (all correct)
- Implementation: `lib/middleware/shared/cors.ts`
- Usage: `app/api/v1/csp-report/route.ts`, documentation examples

**Action**: No changes needed.

### `getTenantContext(` References
**Status**: ✅ **CLEAN** (all correct)
- Implementation: `lib/server/db/tenant-context.ts`
- Usage: AI endpoints, query endpoints (all correct)

**Action**: No changes needed.

### `requireTenantContext(` References
**Status**: ✅ **CLEAN** (not in code)
- Only found in docs as future consideration
- Not implemented in codebase

**Action**: No changes needed.

### `auth();` References
**Status**: ✅ **CLEAN** (all correct)
- All usage follows correct patterns
- Uses `auth()` from `@clerk/nextjs/server`

**Action**: No changes needed.

### `x-corso-rbac` References
**Status**: ✅ **CLEAN** (all correct)
- OpenAPI spec: All bearer operations have `x-corso-rbac` annotations
- AI endpoints: `[member, admin, owner]` (matches implementation)
- Documentation: Consistent references

**Action**: No changes needed.

### `org:member|org:admin|org:owner` References
**Status**: ✅ **CLEAN** (all correct)
- Implementation: Supports both formats (`member` and `org:member`)
- Tests: Comprehensive coverage of both formats
- OpenAPI: Uses simplified format (`member`, `admin`, `owner`)

**Action**: No changes needed.

### `/export` References
**Status**: ✅ **CLEAN** (properly documented as 410 Gone stub)
- `app/api/v1/entity/[entity]/export/route.ts`: Returns 410 Gone (documented)
- `app/api/v1/README.md`: Documented as permanently removed
- `app/api/README.md`: Documented as removed
- `api/openapi.yml`: Still in spec (returns 410 Gone)
- Documentation: All references note it's a stub

**Action**: No changes needed - properly documented as removed/stub.

## OpenAPI Parity Verification

### AI Endpoints RBAC
- **OpenAPI**: `/api/v1/ai/chat` → `x-corso-rbac: [member, admin, owner]`
- **Implementation**: Supports `['member', 'org:member', 'admin', 'org:admin', 'owner', 'org:owner']`
- **Status**: ✅ **PARITY** - OpenAPI uses simplified format, implementation supports both

- **OpenAPI**: `/api/v1/ai/generate-sql` → `x-corso-rbac: [member, admin, owner]`
- **Implementation**: Supports `['member', 'org:member', 'admin', 'org:admin', 'owner', 'org:owner']`
- **Status**: ✅ **PARITY** - OpenAPI uses simplified format, implementation supports both

### OpenAPI Validation Results
- ✅ `pnpm openapi:gen`: PASSED
- ✅ `pnpm openapi:rbac:check`: PASSED
- ✅ `pnpm openapi:lint`: PASSED

## Smoke Test Coverage

### Existing Tests
- ✅ `/api/health` returns 200
- ✅ `/api/v1/ai/chat` unauth => 401
- ✅ `/api/v1/ai/generate-sql` unauth => 401

### Added Tests
- ✅ `/api/v1/ai/chat` auth but forbidden => 403
- ✅ `/api/v1/ai/generate-sql` auth but forbidden => 403

**Total Smoke Tests**: 13 tests (11 existing + 2 new)

## Findings & Actions

### Actions Required
1. **Update example in `api/README.md`**: Change `/api/v1/dashboard/chat/process` to `/api/v1/ai/chat`

### No Actions Required
- All other references are correct, properly documented, or acceptable (historical docs, test configs)

## Quality Gates

- ✅ **Lint**: PASSED
- ✅ **Typecheck**: PASSED (includes OpenAPI generation)
- ✅ **OpenAPI RBAC Check**: PASSED
- ✅ **OpenAPI Lint**: PASSED
- ✅ **Smoke Tests**: PASSED (13 tests)
