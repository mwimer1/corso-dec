# Insights Search Implementation Summary

**Date**: 2025-01-15  
**Branch**: `chore/app-audit-cleanup`  
**Task**: Implement actual search functionality for `/api/v1/insights/search`

## Overview

Implemented real search functionality for the insights search endpoint, replacing the TODO placeholder that returned empty results. The implementation reuses the same data source (`getAllInsights()`) used by marketing pages for consistency.

## Implementation Details

### Data Source

**Source**: `getAllInsights()` from `@/lib/marketing/server`

- **Same source as marketing pages**: Reuses the exact same function used by `/insights` pages
- **Supports multiple backends**: Works with static data, markdown files, or CMS (via `INSIGHTS_SOURCE` env var)
- **Server-only**: Uses filesystem operations (reads from `content/insights/articles/` or static data)

### Runtime Decision

**Runtime**: `nodejs` (changed from `edge`)

**Reason**: The `getAllInsights()` function uses Node.js-only APIs:
- `fs/promises` for reading markdown files
- `gray-matter` for parsing frontmatter
- `unified` markdown processing pipeline

These operations are not available in Edge runtime, so the route was switched to Node.js runtime.

### Search Algorithm

**Scoring System**:
1. **Title matches**: 100 points (exact match: +50 bonus)
2. **Description matches**: 30 points
3. **Category matches**: 10 points
4. **Recency bonus**: +5 points for articles published in last 30 days

**Sorting**:
- Primary: Score (descending)
- Secondary: Publish date (newer first)

**Filtering**:
- Text search: Case-insensitive substring match in title, description, or category names/slugs
- Category filter: Optional filter by category slug or name
- Pagination: `limit` (default 20, max 50) and `offset` (default 0)

### Response Shape

```typescript
{
  success: true,
  data: {
    results: Array<{
      slug: string;
      title: string;
      description: string;
      categories: Array<{ slug: string; name: string }>;
      url?: string; // `/insights/${slug}`
    }>
  }
}
```

### Caching

**ISR Configuration**: `revalidate = 60` (60 seconds)

- Public content that changes infrequently
- Matches the caching strategy used by insights pages (`revalidate = 300`)
- Balances freshness with performance

## Updated Route Handler

**File**: `app/api/v1/insights/search/route.ts`

**Key Changes**:
- ✅ Runtime changed from `edge` → `nodejs`
- ✅ Added `getAllInsights()` import and usage
- ✅ Implemented scoring and filtering logic
- ✅ Added `limit` and `offset` parameters with validation
- ✅ Maintained rate limiting (60/min) and CORS handling
- ✅ Response shape matches OpenAPI contract

## Tests

**File**: `tests/api/v1/insights-search.test.ts` (NEW)

**Test Coverage**:
- ✅ Empty query validation (400)
- ✅ Valid query returns results (200)
- ✅ Limit cap enforcement (max 50)
- ✅ Category filtering
- ✅ Limit parameter respect
- ✅ CORS OPTIONS handling

**All 7 tests pass** ✅

## Validation Results

### Build
```bash
pnpm next build
```
✅ **Success** - Route compiles correctly

### Type Checking
```bash
pnpm typecheck
```
✅ **Success** - No type errors

### Linting
```bash
pnpm lint
```
✅ **Success** - No new errors (6 pre-existing warnings)

### Tests
```bash
pnpm test tests/api/v1/insights-search.test.ts
```
✅ **Success** - All 7 tests pass

## Data Source & Runtime Choice

### Data Source
- **Module**: `@/lib/marketing/server` → `getAllInsights()`
- **Why**: Reuses the same canonical source used by marketing pages
- **Supports**: Static data, markdown files (`content/insights/articles/`), or future CMS integration

### Runtime: Node.js
- **Why**: `getAllInsights()` uses Node.js-only APIs:
  - `fs/promises` for file system access
  - `gray-matter` for frontmatter parsing
  - `unified` markdown processing
- **Documentation**: Updated route comments to explain Node.js requirement

## Query Parameters

**Schema** (Zod):
- `q`: string (required, 1-200 chars) - Search query
- `category`: string (optional, 1-50 chars) - Filter by category slug/name
- `limit`: number (optional, 1-50, default 20) - Results per page
- `offset`: number (optional, min 0, default 0) - Pagination offset

**Validation**: All parameters validated with Zod `.strict()` schema

## Example Usage

```bash
# Basic search
GET /api/v1/insights/search?q=construction

# Search with category filter
GET /api/v1/insights/search?q=market&category=market-analysis

# Paginated search
GET /api/v1/insights/search?q=trends&limit=10&offset=0
```

## Summary

- ✅ **Real search implemented** - No longer returns empty results
- ✅ **Data source reused** - Same `getAllInsights()` as marketing pages
- ✅ **Runtime switched** - Node.js required for filesystem operations
- ✅ **Scoring & sorting** - Relevance-based ranking with recency tie-breaker
- ✅ **Pagination support** - Limit/offset with defensive caps
- ✅ **Tests added** - 7 tests covering validation, filtering, and pagination
- ✅ **All validation passes** - Build, typecheck, lint, tests

**Implementation Complete**: ✅  
**Ready for Review**: ✅

