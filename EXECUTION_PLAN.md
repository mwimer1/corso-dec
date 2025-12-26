# Next.js App Router Audit Cleanup - Execution Plan

**Branch**: `chore/app-audit-cleanup`  
**Baseline**: pnpm 10.17.1, Node v24.11.1  
**Date**: 2025-01-15

## Baseline Status

### Environment
- **pnpm**: 10.17.1
- **node**: v24.11.1
- **Lint**: ✅ Passes (5 warnings, 0 errors - unused eslint-disable directives)

### Filesystem Evidence

**Current API Structure:**
```
app/api/
├── health/                    # ❌ Empty directory (to be removed)
│   └── clickhouse/            # ❌ Empty directory (to be removed)
├── insights/                  # ❌ Empty directory (to be removed)
│   └── search/                # ❌ Empty directory (to be removed)
├── internal/
│   ├── test/                  # ❌ Empty directory (to be removed)
│   └── auth/route.ts
├── public/
│   └── health/
│       ├── route.ts           # ✅ Canonical health endpoint
│       └── clickhouse/route.ts # ✅ Canonical ClickHouse health
├── test/                      # ❌ Empty directory (to be removed)
└── v1/
    ├── entity/[entity]/export/route.ts  # ⚠️ Returns 501 (deprecated)
    └── insights/search/route.ts        # ⚠️ Returns empty results (needs impl)
```

**Dashboard Route Groups:**
```
app/(protected)/dashboard/
├── layout.tsx                 # ✅ Root auth layout
├── (no-topbar)/              # ⚠️ Route group (no functional difference)
│   ├── layout.tsx            # Same as (with-topbar)
│   └── chat/page.tsx
└── (with-topbar)/            # ⚠️ Route group (no functional difference)
    ├── layout.tsx             # Same as (no-topbar)
    ├── (entities)/[entity]/page.tsx
    ├── account/page.tsx      # ⚠️ "use client" in page (needs refactor)
    └── subscription/page.tsx
```

### Evidence Searches

**Health Endpoint References:**
- `api/openapi.yml:43` - `/api/health` documented (needs alias)
- `api/openapi.yml:68` - `/api/health/clickhouse` documented (needs alias)
- `lib/integrations/clickhouse/client.ts:222,230` - Uses `/api/health/clickhouse` (will work with alias)
- `tests/api/health.test.ts:2` - Imports from `@/app/api/public/health/route` ✅
- `tests/api/health-clickhouse.test.ts:1` - Imports from `@/app/api/public/health/clickhouse/route` ✅

**Export Endpoint:**
- `app/api/v1/entity/[entity]/export/route.ts:27` - Returns 501 (deprecated)
- `api/openapi.yml:794` - Still documented (needs deprecation)

**Dashboard Route Groups:**
- `app/(protected)/dashboard/(no-topbar)/layout.tsx:9` - Comment says "no longer controls top bar rendering"
- `app/(protected)/dashboard/(with-topbar)/layout.tsx:9` - Comment says "no longer controls top bar rendering"
- Both layouts render identical `DashboardLayout` component

**Client Boundary:**
- `app/(protected)/dashboard/(with-topbar)/account/page.tsx:2` - `"use client"` directive in page component

**Insights Search:**
- `app/api/v1/insights/search/route.ts:54` - TODO comment: "Implement actual search logic"
- Returns empty results array

---

## Execution Plan

### Task 1: Create Health Endpoint Aliases
**Risk**: 🟡 Medium  
**Files to Touch**:
- `app/api/health/route.ts` (NEW - alias to `/api/public/health`)
- `app/api/health/clickhouse/route.ts` (NEW - alias to `/api/public/health/clickhouse`)

**Implementation**:
- Create `app/api/health/route.ts` that re-exports from `@/app/api/public/health/route`
- Create `app/api/health/clickhouse/route.ts` that re-exports from `@/app/api/public/health/clickhouse/route`
- Ensure runtime configs match (Edge for health, Node.js for clickhouse)

**Validation**:
- ✅ Tests pass: `pnpm test tests/api/health.test.ts`
- ✅ Tests pass: `pnpm test tests/api/health-clickhouse.test.ts`
- ✅ Build succeeds: `pnpm next build`
- ✅ Manual test: `curl http://localhost:3000/api/health`
- ✅ Manual test: `curl http://localhost:3000/api/health/clickhouse`

---

### Task 2: Update OpenAPI Specification
**Risk**: 🟢 Low  
**Files to Touch**:
- `api/openapi.yml` (update health endpoint paths to reflect aliases)

**Implementation**:
- Update `/api/health` path description to note it's an alias
- Update `/api/health/clickhouse` path description to note it's an alias
- Ensure both paths remain documented (aliases are transparent to API consumers)

**Validation**:
- ✅ OpenAPI validation: `pnpm openapi:gen`
- ✅ RBAC check: `pnpm openapi:rbac:check`
- ✅ Generated types update correctly

---

### Task 3: Delete Empty API Directories
**Risk**: 🟢 Low  
**Files/Directories to Delete**:
- `app/api/health/clickhouse/` (empty directory)
- `app/api/insights/search/` (empty directory)
- `app/api/internal/test/` (empty directory)
- `app/api/test/` (empty directory)

**Note**: `app/api/health/` will be created in Task 1, so don't delete it yet.

**Validation**:
- ✅ Build succeeds: `pnpm next build`
- ✅ No broken imports
- ✅ Route summary shows no missing routes

---

### Task 4: Consolidate Dashboard Layout Route Groups
**Risk**: 🟡 Medium  
**Files to Touch**:
- `app/(protected)/dashboard/(no-topbar)/layout.tsx` (DELETE)
- `app/(protected)/dashboard/(with-topbar)/layout.tsx` (DELETE)
- `app/(protected)/dashboard/layout.tsx` (UPDATE - add DashboardLayout wrapper)
- `app/(protected)/dashboard/(no-topbar)/chat/page.tsx` (MOVE to `app/(protected)/dashboard/chat/page.tsx`)
- `app/(protected)/dashboard/(with-topbar)/(entities)/[entity]/page.tsx` (MOVE to `app/(protected)/dashboard/(entities)/[entity]/page.tsx`)
- `app/(protected)/dashboard/(with-topbar)/account/page.tsx` (MOVE to `app/(protected)/dashboard/account/page.tsx`)
- `app/(protected)/dashboard/(with-topbar)/account/layout.tsx` (MOVE to `app/(protected)/dashboard/account/layout.tsx`)
- `app/(protected)/dashboard/(with-topbar)/subscription/page.tsx` (MOVE to `app/(protected)/dashboard/subscription/page.tsx`)
- `app/(protected)/dashboard/(with-topbar)/subscription/layout.tsx` (MOVE to `app/(protected)/dashboard/subscription/layout.tsx`)
- `app/(protected)/dashboard/README.md` (UPDATE - remove route group references)

**Implementation**:
1. Move all pages out of route groups to flat structure
2. Update root dashboard layout to include `DashboardLayout` wrapper
3. Delete route group directories
4. Update README documentation

**Validation**:
- ✅ Build succeeds: `pnpm next build`
- ✅ Routes accessible: `/dashboard/chat`, `/dashboard/projects`, `/dashboard/account`, `/dashboard/subscription`
- ✅ Layout renders correctly (sidebar visible)
- ✅ No broken imports

---

### Task 5: Refactor Account Page Client Boundary
**Risk**: 🟡 Medium  
**Files to Touch**:
- `app/(protected)/dashboard/account/page.tsx` (UPDATE - remove "use client", make server component)
- `components/auth/account-page-client.tsx` (NEW - client component wrapper)

**Implementation**:
- Extract client logic from account page into new client component
- Make account page a server component that renders the client component
- Ensure Clerk UserProfile still works correctly

**Validation**:
- ✅ Build succeeds: `pnpm next build`
- ✅ Account page renders: `/dashboard/account`
- ✅ UserProfile component works (can edit profile)
- ✅ No hydration errors

---

### Task 6: Deprecate Export Endpoint in OpenAPI
**Risk**: 🟢 Low  
**Files to Touch**:
- `api/openapi.yml` (UPDATE - mark export endpoint as deprecated)

**Implementation**:
- Add `deprecated: true` to `/api/v1/entity/{entity}/export` operation
- Update description to note deprecation and removal reason
- Keep endpoint in spec for backward compatibility (returns 501)

**Validation**:
- ✅ OpenAPI validation: `pnpm openapi:gen`
- ✅ Generated types include deprecated flag
- ✅ API docs show deprecation notice

---

### Task 7: Implement Insights Search Endpoint
**Risk**: 🟡 Medium  
**Files to Touch**:
- `app/api/v1/insights/search/route.ts` (UPDATE - implement search logic)

**Implementation**:
- Determine search backend (Supabase table, static files, or external CMS)
- Implement search query logic
- Return actual results matching query and category filters
- Maintain Edge runtime compatibility

**Validation**:
- ✅ Build succeeds: `pnpm next build`
- ✅ Search returns results: `curl "http://localhost:3000/api/v1/insights/search?q=test"`
- ✅ Category filter works: `curl "http://localhost:3000/api/v1/insights/search?q=test&category=trends"`
- ✅ Empty query returns 400: `curl "http://localhost:3000/api/v1/insights/search?q="`
- ✅ Tests pass (if tests exist)

---

## Execution Order

1. **Task 1** (Health aliases) - Foundation for other changes
2. **Task 2** (OpenAPI health) - Document aliases
3. **Task 3** (Delete empty dirs) - Cleanup after aliases created
4. **Task 4** (Dashboard consolidation) - Independent, can be done in parallel
5. **Task 5** (Account refactor) - Depends on Task 4 completion
6. **Task 6** (Export deprecation) - Independent documentation update
7. **Task 7** (Insights search) - Independent implementation

## Quality Gates

After all tasks complete:
- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes (fix any new warnings)
- ✅ `pnpm test` passes
- ✅ `pnpm next build` succeeds with route summary
- ✅ `pnpm openapi:gen && pnpm openapi:rbac:check` passes
- ✅ `pnpm validate:cursor-rules` passes

## Risk Assessment Summary

- **🟢 Low Risk**: Tasks 2, 3, 6 (documentation/cleanup)
- **🟡 Medium Risk**: Tasks 1, 4, 5, 7 (code changes affecting routes/layouts)

## Notes

- Health endpoint tests already import from canonical paths (`@/app/api/public/health/route`), so aliases won't break tests
- Dashboard route groups are already non-functional (both render same layout), so consolidation is safe
- Export endpoint already returns 501, so deprecation is just documentation
- Insights search needs backend decision before implementation

