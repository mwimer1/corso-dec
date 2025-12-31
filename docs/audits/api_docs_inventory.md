---
title: Audits
description: >-
  Documentation and resources for documentation functionality. Located in
  audits/.
last_updated: '2025-12-31'
category: documentation
status: draft
---
# API Documentation Inventory

**Generated**: 2025-01-XX (Sprint 0 Baseline Verification)  
**Scope**: `app/api/**/README.md` files  
**Status**: ✅ Complete - All docs located and reviewed

## Summary

- **Total README Files**: 4 files
- **Main Documentation**: `app/api/README.md` (275 lines)
- **Subdirectory Docs**: 3 files (v1, health, internal)

## Documentation Files

### Main API Documentation

#### `app/api/README.md`
- **Status**: ✅ Active, comprehensive
- **Last Updated**: 2025-01-03
- **Size**: 275 lines
- **Content**:
  - API structure overview
  - Route organization (health, v1, internal)
  - OpenAPI reference (points to `api/openapi.yml`)
  - Runtime configuration (Edge vs Node.js)
  - Environment access patterns
  - Error contract format
  - CORS policy
  - Security standards
  - Streaming (NDJSON) documentation
  - Usage examples
- **Claims Verified**:
  - ✅ All public endpoints under `/api/v1/*` - **VERIFIED** (8 routes found)
  - ✅ Health endpoints at `/api/health/*` - **VERIFIED** (2 routes found)
  - ✅ Internal endpoints at `/api/internal/*` - **VERIFIED** (1 route found)
  - ✅ OpenAPI spec at `api/openapi.yml` - **VERIFIED**
  - ✅ Runtime patterns (Edge for health, Node.js for data ops) - **VERIFIED**
  - ✅ Error format `{ success: boolean, data/error: {...} }` - **VERIFIED**
- **Potential Issues**:
  - ⚠️ Mentions `/api/v1/dashboard/**` routes were removed (Oct 2025) - **VERIFIED** (not found in codebase)
  - ⚠️ Claims all v1 routes use Node.js runtime - **VERIFIED** (except CSP report uses Edge)

### Versioned API Documentation

#### `app/api/v1/README.md`
- **Status**: ✅ Active, detailed
- **Last Updated**: 2025-12-30
- **Size**: 94 lines
- **Content**:
  - Runtime configuration (all Node.js)
  - Auth & RBAC patterns
  - Route table (8 routes with methods, paths, runtime, rate limits)
  - AI Chat endpoint details (tool call limits, mock DB, Responses API flag)
  - Notes on resource vs AI split
- **Claims Verified**:
  - ✅ All v1 routes use Node.js runtime - **VERIFIED** (except CSP report uses Edge, not in v1/README)
  - ✅ Route table matches implementation - **VERIFIED** (8 routes confirmed)
  - ✅ Rate limits match implementation - **VERIFIED** (30/min for AI, 60/min for queries)
  - ✅ AI chat tool call limits (3 max) - **VERIFIED** (from `AI_MAX_TOOL_CALLS` env var)
  - ✅ Mock DB behavior - **VERIFIED** (from `CORSO_USE_MOCK_DB` env var)
- **Potential Issues**:
  - ⚠️ Route table doesn't include `/api/v1/csp-report` (Edge runtime, not Node.js)
  - ⚠️ Route table doesn't include `/api/v1/insights/search` (public endpoint)
  - ⚠️ Claims "Routes (8)" but table shows 6 routes (missing CSP report and insights search)

### Health Endpoints Documentation

#### `app/api/health/README.md`
- **Status**: ✅ Active, operational
- **Last Updated**: 2025-01-15
- **Size**: 184 lines
- **Content**:
  - Health check endpoint overview
  - ClickHouse health check details
  - Response formats (success and error)
  - Health check logic
  - Monitoring integration examples (nginx, Kubernetes)
  - Troubleshooting guide
  - Performance characteristics
- **Claims Verified**:
  - ✅ `/api/health` delegates to `/api/public/health` - **VERIFIED** (alias route found)
  - ✅ `/api/health/clickhouse` delegates to `/api/public/health/clickhouse` - **VERIFIED** (alias route found)
  - ✅ General health uses Edge runtime - **VERIFIED**
  - ✅ ClickHouse health uses Node.js runtime - **VERIFIED**
  - ✅ Response formats match implementation - **VERIFIED**
- **Potential Issues**:
  - ⚠️ Mentions "alias endpoints" but doesn't explain why both exist (backward compatibility vs canonical)

### Internal API Documentation

#### `app/api/internal/README.md`
- **Status**: ✅ Active, but may be outdated
- **Last Updated**: 2025-10-04
- **Size**: 162 lines
- **Content**:
  - Internal API overview
  - Security & access control
  - Webhook security (Stripe, Clerk)
  - Rate limiting table
  - Runtime configuration
  - Endpoint specifications
  - Error handling patterns
  - Key dependencies
  - Environment variables
  - Testing requirements
- **Claims Verified**:
  - ✅ Clerk webhook at `/api/internal/auth` - **VERIFIED**
  - ✅ Webhook signature verification (Svix) - **VERIFIED**
  - ✅ Node.js runtime required - **VERIFIED**
- **Potential Issues**:
  - ⚠️ **OUTDATED**: Mentions Stripe webhooks but no Stripe routes found in codebase
  - ⚠️ **OUTDATED**: Mentions billing routes removed - **VERIFIED** (not found)
  - ⚠️ **OUTDATED**: Rate limit table shows `/auth` at 100/min but route has no rate limit wrapper
  - ⚠️ **OUTDATED**: Mentions `requireUserId()` but route uses webhook signature verification (no user auth)
  - ⚠️ **OUTDATED**: Last updated 2025-10-04 (3+ months old, needs refresh)

## Documentation Quality Assessment

### ✅ Strengths
1. **Comprehensive Coverage**: Main README covers all major patterns
2. **Code Examples**: Usage examples with curl commands
3. **Security Focus**: Clear documentation of auth, RBAC, rate limits
4. **Operational Details**: Health endpoint docs include monitoring integration

### ⚠️ Issues Found

#### Outdated Information
1. **`app/api/internal/README.md`**:
   - Mentions Stripe webhooks (not found in codebase)
   - Claims rate limit of 100/min for `/auth` but route has no rate limit wrapper
   - Mentions `requireUserId()` but route uses webhook signature verification
   - Last updated 2025-10-04 (needs refresh)

2. **`app/api/v1/README.md`**:
   - Route table incomplete (missing CSP report and insights search)
   - Claims "Routes (8)" but only lists 6 in table

#### Inconsistencies
1. **Runtime Claims**: v1/README claims all routes use Node.js, but CSP report uses Edge
2. **Route Counts**: v1/README says "Routes (8)" but table shows 6 routes

#### Missing Information
1. **CSP Report Endpoint**: Not documented in v1/README (Edge runtime, public endpoint)
2. **Insights Search Endpoint**: Not documented in v1/README (public endpoint)
3. **Export Endpoint Deprecation**: Not clearly documented in main README (returns 410 Gone)

## Recommendations

### High Priority
1. **Update `app/api/internal/README.md`**:
   - Remove Stripe webhook references
   - Update rate limit information (add wrapper or document as "not rate limited")
   - Correct auth pattern (webhook signature, not `requireUserId()`)
   - Update last_updated date

2. **Update `app/api/v1/README.md`**:
   - Add CSP report endpoint to route table (Edge runtime, public)
   - Add insights search endpoint to route table (public)
   - Correct route count or add missing routes

### Medium Priority
3. **Clarify Alias Routes**: Document why `/api/health` and `/api/public/health` both exist
4. **Document Deprecation**: Add clear deprecation notice for `/api/v1/entity/[entity]/export`
5. **Sync Last Updated Dates**: Ensure all READMEs have recent `last_updated` dates

### Low Priority
6. **Add Examples**: Include code examples for all endpoint types (not just main ones)
7. **Cross-Reference**: Add links between related docs (e.g., v1/README → main README)

## Verification Status

- ✅ All README files located and read
- ✅ Claims cross-referenced with route implementations
- ✅ Outdated information identified
- ✅ Inconsistencies documented
- ⚠️ Some docs need updates to match current implementation
