---
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
last_updated: "2025-12-31"
category: "documentation"
status: "active"
---
# Dashboard Setup & Quickstart

Complete guide to running the dashboard locally with mock data in 2-3 minutes.

## 1) Quick Start (2 minutes)

### Install Dependencies
```bash
pnpm install
```

### Create `.env.local`

Create a `.env.local` file in the project root with these minimal working flags:

```bash
# Auth: Relaxed mode for development (no org required)
NEXT_PUBLIC_AUTH_MODE=relaxed
ALLOW_RELAXED_AUTH=true

# Data: Use mock JSON files instead of real database
CORSO_USE_MOCK_DB=true

# Rate Limiting: Disable for development (avoid RATE_LIMITED loops)
DISABLE_RATE_LIMIT=true

# AG Grid: Enable Enterprise features (required for server-side row model)
NEXT_PUBLIC_AGGRID_ENTERPRISE=1
```

### Run Development Server
```bash
pnpm dev
```

### Visit Dashboard
Open your browser and navigate to:
- **Projects**: <http://localhost:3000/dashboard/projects>
- **Companies**: <http://localhost:3000/dashboard/companies>
- **Addresses**: <http://localhost:3000/dashboard/addresses>

You should see a working data grid with mock data!

## 2) Auth Modes

### Strict Mode (Default)
- **Requires**: Organization membership + RBAC role checks
- **Use case**: Production, multi-tenant scenarios
- **Behavior:**
  - User must belong to an organization
  - User must have `org:member`, `org:admin`, or `org:owner` role
  - API endpoints enforce RBAC checks

### Relaxed Mode (Development)
- **Requires**: Only a signed-in user (no org/RBAC required)
- **Use case**: Local development, testing
- **How to enable**:
  ```bash
  NEXT_PUBLIC_AUTH_MODE=relaxed
  ALLOW_RELAXED_AUTH=true  # Explicit opt-in required
  ```
- **Behavior**:
  - Organization membership is optional
  - RBAC checks are bypassed
  - Any signed-in user can access protected resources
  - Entity APIs skip org context and role validation
  - Signed-in user is still required (auth() must return userId)

### Production Warning

If relaxed mode is enabled in production (`NODE_ENV=production`), you'll see a console warning:

```
⚠️  WARNING: Relaxed auth mode is enabled in PRODUCTION. 
This bypasses organization membership and RBAC checks. 
Only use this for development/testing or with explicit approval.
```

The mode still works, but the warning reminds you that security is reduced.

### Opt-in Requirement

Relaxed mode requires **explicit opt-in** via `ALLOW_RELAXED_AUTH=true`. If you set `NEXT_PUBLIC_AUTH_MODE=relaxed` without `ALLOW_RELAXED_AUTH=true`, you'll see:

```
⚠️  NEXT_PUBLIC_AUTH_MODE=relaxed requires ALLOW_RELAXED_AUTH=true to enable. 
Relaxed mode is currently DISABLED. Set ALLOW_RELAXED_AUTH=true in .env.local to enable.
```

## 3) Mock DB Behavior

### Location

When `CORSO_USE_MOCK_DB=true`, entity data is read from static JSON files:

- `public/__mockdb__/projects.json`
- `public/__mockdb__/companies.json`
- `public/__mockdb__/addresses.json`

These files are checked into the repository and serve as fixtures for development.

### JSON Shape

Each JSON file contains an array of objects (rows):

```json
[
  {
    "building_permit_id": "BP-2024-001",
    "status": "active",
    "job_value": 125000,
    "effective_date": "2024-01-15",
    "description": "Residential construction",
    ...
  },
  ...
]
```

### Pagination

The API slices results by `page` and `pageSize`:

- `page=0, pageSize=50` returns rows 0-49
- `page=1, pageSize=50` returns rows 50-99
- Total count is calculated from the full array length

Example request:
```
GET /api/v1/entity/projects?page=0&pageSize=50
```

### Adding/Editing Mock Rows

**Safe approach:**

1. Edit the JSON file directly (e.g., `public/__mockdb__/projects.json`)
2. Ensure the JSON is valid (use a JSON validator if needed)
3. Ensure new fields match the column `accessor` values in column configs
   - See `lib/entities/projects/columns.config.ts` for field names
   - See section 4 below for accessor → field mapping

**Warning**: Invalid JSON will break the API endpoint. Always validate before saving.

**Example**: To add a new project row:

```json
{
  "building_permit_id": "BP-2024-999",
  "status": "pending",
  "job_value": 50000,
  "effective_date": "2024-12-01",
  "effective_year": 2024,
  "effective_month": 12,
  "description": "Test project",
  "property_type_major_category": "Residential",
  "city": "San Francisco",
  "state": "CA",
  "zipcode": "94102"
}
```

## 4) Column Config ↔ Schema Mapping

### How Columns Map to Data

The dashboard uses a two-layer architecture:

1. **TableColumnConfig** (framework-agnostic) in `lib/entities/<entity>/columns.config.ts`
2. **AG Grid ColDef** (AG Grid-specific) via adapter in `lib/entities/adapters/aggrid.ts`

### Accessor → Field Mapping

The `accessor` property in `TableColumnConfig` becomes `colDef.field` in AG Grid:

```typescript
// Column config
{ 
  id: 'status',
  label: 'Status',
  accessor: 'status',  // ← This becomes AG Grid's field
  sortable: true
}

// Adapter converts to AG Grid ColDef
{
  field: 'status',     // ← Same as accessor
  headerName: 'Status',
  sortable: true
}
```

### Troubleshooting Blank Fields

If a column renders blank, it's typically an **accessor/key mismatch**:

- **Problem**: Column `accessor: 'status'` but JSON row has `state` key
- **Solution**: Either:
  1. Update column config `accessor` to match JSON key, OR
  2. Update JSON row to include the expected key

### Dev-Only Schema Validator

The dashboard includes a **dev-only schema validator** that warns about mismatches:

**Location**: `components/dashboard/entities/shared/grid/entity-grid.tsx` → `validateSchemaInDev()`

**Behavior**:
- Runs only in development (`NODE_ENV !== 'production'` and `NODE_ENV !== 'test'`)
- Checks if `colDef.field` values exist in the first row's keys
- Warns in console if fields are missing

**Example warning**:
```
⚠️ [projects] Schema mismatch detected: Column fields not found in row data
Missing fields: status, job_value
Sample row keys: building_permit_id, state, value, effective_date
Check that column accessors match JSON keys in mock data or database schema.
```

**Note**: This validator doesn't run in production or tests to avoid performance overhead.

## 5) API Whitelist Behavior (sortBy + filters)

### SortBy Whitelist

**Rule**: `sortBy` must be one of the allowed sortable accessors (where `sortable !== false`).

**Allowed fields**: Determined by loading column config and filtering `sortable: true` columns.

**Invalid sortBy behavior**:
- Invalid field is **ignored** (doesn't fail)
- Dev warning in console: `[entity route] Invalid sortBy field "not_a_field" for entity "projects". Allowed fields: name, status, created_at. Ignoring sortBy and using default sort.`
- API still returns 200 with data (sorted by default)

**Example URLs**:

✅ Valid:
```
/api/v1/entity/projects?page=0&pageSize=50&sortBy=status&sortDir=asc
```

❌ Invalid (ignored, dev warns):
```
/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc
```

### Filters Whitelist

**Rule**: Filter `field` values must match column `accessor` values.

**Invalid filter field behavior**:
- Invalid fields are **dropped** from the filter array
- Valid filters are still applied
- Dev warning: `[entity route] Invalid filter fields for entity "projects": not_a_field. These filters will be ignored.`
- API returns 200 with data (filtered by valid fields only)

**Invalid filters format behavior**:
- If `filters` param is not a valid JSON array → returns **400** with `INVALID_FILTERS` error code
- Must be a JSON array: `[{"field": "...", "op": "...", "value": "..."}]`

**Example URLs**:

✅ Valid:
```
/api/v1/entity/projects?page=0&pageSize=50&filters=[{"field":"status","op":"eq","value":"active"}]
```

❌ Invalid field (dropped, dev warns):
```
/api/v1/entity/projects?page=0&pageSize=50&filters=[{"field":"not_a_field","op":"eq","value":"x"}]
```

❌ Invalid format (400 error):
```
/api/v1/entity/projects?page=0&pageSize=50&filters={"bad":"format"}
```

Response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILTERS",
    "message": "Invalid filters format"
  }
}
```

### Filter Operations

Supported filter operations:
- `eq` - equals
- `contains` - contains (text search)
- `gt`, `lt`, `gte`, `lte` - comparison operators
- `in` - in array
- `between` - range
- `bool` - boolean

## 6) Saved Searches Persistence

### Storage Location

Saved searches are persisted to `localStorage` with the following key format:

```
corso:gridSavedStates:${userId}:${gridId}
```

**Examples**:
- `corso:gridSavedStates:user_test_123:projects`
- `corso:gridSavedStates:user_test_123:companies`

### Storage Structure

Each saved search is stored as:
```json
{
  "My Saved Search": {
    "state_name": "My Saved Search",
    "grid_state": {
      "columnState": [...],
      "filterModel": {...},
      "sortModel": [...]
    }
  }
}
```

### How to Reset

**Option 1: Clear Site Data (Browser DevTools)**
1. Open DevTools (F12)
2. Go to Application → Storage → Local Storage
3. Find `http://localhost:3000`
4. Delete the `corso:gridSavedStates:*` keys

**Option 2: Remove Specific Entry (Console)**
```javascript
// Remove all saved searches for current user
Object.keys(localStorage)
  .filter(key => key.startsWith('corso:gridSavedStates:'))
  .forEach(key => localStorage.removeItem(key));
```

**Option 3: Clear All Local Storage**
```javascript
localStorage.clear();
```

## 7) Rate Limiting & Dev Bypass

### Rate Limits

Entity API endpoints have rate limits:
- **GET `/api/v1/entity/[entity]`**: 60 requests/minute
- **POST `/api/v1/entity/[entity]/query`**: 60 requests/minute

When rate limited, the API returns:
- Status: `429 Too Many Requests`
- Error code: `RATE_LIMITED`
- Header: `Retry-After` (seconds to wait)

### Dev Bypass

**Flag**: `DISABLE_RATE_LIMIT=true`

**Behavior**:
- Completely bypasses rate limiting checks
- All requests succeed regardless of frequency
- Only works in development (guard in code)

**Why it exists**:
- Prevents `RATE_LIMITED` errors during development
- Allows rapid iteration without waiting for rate limit windows
- Avoids request storm detection false positives during debugging

**Note**: This flag only affects rate limiting middleware. It doesn't disable other security measures.

## 8) Verification Checklist

Use this checklist to verify your dashboard setup is working correctly:

### ✅ API Endpoint Verification

**Test**: `GET /api/v1/entity/projects?page=0&pageSize=50`

**Expected**:
- Status: `200 OK`
- Response includes `data.data` array with rows
- Response includes `data.total` number (count of all rows)
- Response includes `data.page` and `data.pageSize`

**Command**:
```bash
curl "http://localhost:3000/api/v1/entity/projects?page=0&pageSize=50"
```

### ✅ UI Verification

**Test**: Visit `/dashboard/projects`

**Expected**:
- Page loads without errors
- Data grid displays rows
- Results count badge shows number > 0
- No infinite spinners (grid finishes loading)
- No console errors

### ✅ Request Storm Check

**Test**: Monitor network requests in DevTools

**Expected**:
- Initial load makes 1-2 requests to `/api/v1/entity/projects`
- Requests stop after initial load (no infinite loop)
- No repeated failed requests (429, 500, etc.)

**How to check**:
1. Open DevTools → Network tab
2. Filter by "projects" or "entity"
3. Reload page
4. Verify requests settle after 1-2 seconds

## 9) Running Tests

### Unit/Integration Tests

**Command**: `pnpm test`

**Environment**: Tests run with mocked dependencies (no real API calls)

**Coverage**: Includes API integration tests for entity endpoints:
- `tests/api/v1/entity-list.relaxed.test.ts` - Relaxed auth + mock DB tests
- `tests/api/v1/entity-query.test.ts` - Query endpoint tests
- `tests/api/v1/entity-rate-limit.test.ts` - Rate limiting tests

### E2E Tests (Playwright)

**Prerequisites**: Install Playwright browsers (first time only)
```bash
pnpm test:e2e:install
```

**Run E2E tests**:
```bash
pnpm test:e2e
```

**Run with UI mode** (interactive):
```bash
pnpm test:e2e:ui
```

**Environment Variables**: E2E tests automatically use:
- `E2E_BYPASS_AUTH=true` - Bypass authentication
- `NEXT_PUBLIC_AUTH_MODE=relaxed` - Relaxed auth mode
- `ALLOW_RELAXED_AUTH=true` - Enable relaxed mode
- `CORSO_USE_MOCK_DB=true` - Use mock database
- `DISABLE_RATE_LIMIT=true` - Disable rate limiting

**Test files**:
- `tests/e2e/dashboard-projects.smoke.test.ts` - Smoke test for projects page

See `tests/e2e/README.md` for detailed E2E test documentation.

## Troubleshooting

### Dashboard Shows "No rows"

**Possible causes**:
1. Mock DB JSON files are missing or invalid
2. Column `accessor` doesn't match JSON row keys (check dev console for schema warnings)
3. Auth not working (check console for auth errors)

**Solution**:
1. Verify `CORSO_USE_MOCK_DB=true` in `.env.local`
2. Check browser console for schema mismatch warnings
3. Verify JSON files exist in `public/__mockdb__/`
4. Verify auth mode is set correctly

### API Returns 401 Unauthorized

**Possible causes**:
1. Not signed in (Clerk auth required)
2. Auth mode is strict but no org membership

**Solution**:
1. Sign in via `/sign-in`
2. For development, use relaxed auth mode (see section 2)

### API Returns 429 Rate Limited

**Possible causes**:
1. Rate limit bypass not enabled
2. Making too many requests in rapid succession

**Solution**:
1. Add `DISABLE_RATE_LIMIT=true` to `.env.local`
2. Restart dev server

### Columns Render Blank

**Possible causes**:
1. Column `accessor` doesn't match JSON row key
2. Field name typo in column config

**Solution**:
1. Check dev console for schema mismatch warnings
2. Compare column config `accessor` with JSON row keys
3. Update either column config or JSON data to match

### Request Storm (Infinite Requests)

**Possible causes**:
1. AG Grid error causing retries
2. API returning errors that trigger retries
3. State management issue

**Solution**:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify API endpoint returns 200 with valid data
4. Check AG Grid configuration (Enterprise features enabled)

## Additional Resources

- **Dashboard Architecture**: See `components/dashboard/entities/README.md`
- **Column Configuration**: See `lib/entities/<entity>/columns.config.ts`
- **API Routes**: See `app/api/v1/entity/[entity]/route.ts`
- **Development Setup**: See `docs/development/setup-guide.md`
