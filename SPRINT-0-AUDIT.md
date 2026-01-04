# Sprint 0 — Baseline Audit & Ground Truth

**Branch:** `sprint-0-baseline-auditlog`  
**Status:** ✅ Baseline health confirmed, no code changes  
**Date:** 2025-01-04

## Executive Summary

Sprint 0 establishes baseline health and documents the exact files and architecture for upcoming sprints. No runtime behavior changes—documentation only.

## Baseline Command Results

### ✅ pnpm install
```
Status: Success
Lockfile: Up to date
Duration: 4.9s
```

### ✅ pnpm typecheck
```
Status: Success (exit code 0)
Pre-hook: openapi:gen (bundled + linted + types generated)
TypeScript: No errors found
```

### ✅ pnpm lint
```
Status: Success (exit code 0)
Commands:
  - eslint . (with cache)
  - ast-grep:scan (sgconfig.yml)
No errors or warnings
```

### ✅ pnpm test
```
Status: Success (exit code 0)
Test Files: 128 passed
Tests: 809 passed
Duration: 34.68s
Coverage: All critical paths passing
```

### ✅ quality:ci (Note: Not run in Sprint 0, documented for reference)
Available command: `pnpm quality:ci`
Runs: lint + typecheck + typecheck:prod + test:coverage + madge:ci + jscpd:ci + docs:validate + audit:barrels

## File Map for Upcoming Sprints

### Sprint 1: Dashboard Layout + Sidebar Responsiveness

#### Dashboard Layout Container
- **Primary file:** `components/dashboard/layout/dashboard-layout.tsx`
  - **Line 48-51:** Uses `dashboardShellVariants` with `maxWidth: "none"`
  - **Issue:** Content stretches edge-to-edge on wide screens
  - **Fix location:** Change `maxWidth: "none"` → `maxWidth: "default"` (uses `max-w-[1600px]` from `containerMaxWidthVariants`)

- **Styling variant:** `styles/ui/organisms/dashboard-shell.ts`
  - **Line 19-22:** `maxWidth` variant with `default: containerMaxWidthVariants({ maxWidth: 'dashboard', centered: true })`
  - **Note:** `dashboard` = `max-w-[1600px]` (defined in `containerMaxWidthVariants`)

- **Container utilities:** `styles/ui/shared/container-base.ts`
  - **Line 38:** `dashboard: 'max-w-[1600px]'` — sensible max width for dashboard content

#### Sidebar State & Mobile Behavior
- **Primary file:** `components/dashboard/layout/dashboard-layout.tsx`
  - **Line 25:** `const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);`
  - **Issue:** Sidebar defaults to `false` (expanded) on all screen sizes
  - **Fix location:** Make sidebar default to `true` (collapsed) on mobile, add responsive drawer pattern

- **Sidebar component:** `components/dashboard/sidebar/sidebar-root.tsx`
  - **Line 13-36:** Renders sidebar with collapse state
  - **Line 32-34:** Responsive width already handled (`max-[640px]:w-[min(...)]`)
  - **Note:** No drawer overlay/backdrop pattern yet

- **Sidebar toggle:** `components/dashboard/sidebar/sidebar-top.tsx`
  - **Line 31-42:** Toggle button with proper ARIA attributes (`aria-expanded`, `aria-controls`)
  - **Status:** ✅ Accessibility already handled

- **Sidebar context:** `components/dashboard/sidebar/sidebar-context.tsx`
  - **Line 5-18:** Provides `collapsed` state to children
  - **Note:** Simple context, no mobile detection

### Sprint 2: AG Grid Polish (Alignment + Formatting)

#### AG Grid Column Adapter
- **Primary file:** `lib/entities/adapters/aggrid.ts`
  - **Line 17-53:** `toColDef()` function converts `TableColumnConfig` → AG Grid `ColDef`
  - **Line 32-33:** Currency format uses `valueFormatter: currencyFormatter` but **no right alignment**
  - **Issue:** Numeric columns are left-aligned (default AG Grid behavior)
  - **Fix location:** Add `cellClass: 'ag-right-aligned-cell'` for numeric formats (`currency`, potentially `number` if it exists)

- **Formatter functions:** `lib/entities/adapters/aggrid-formatters.ts` (inferred, not read in Sprint 0)
  - **Contains:** `currencyFormatter`, `numberGetter`, etc.
  - **Note:** Need to verify formatting consistency (Intl.NumberFormat usage)

- **Grid configuration:** `components/dashboard/entities/shared/ag-grid-config.ts`
  - **Line 9-31:** `createDefaultColDef()` — may need updates for default numeric alignment

- **Grid theme CSS:** `styles/ui/ag-grid.theme.css`
  - **Line 19-179:** AG Grid theme overrides
  - **Note:** May need right-alignment utility class if AG Grid doesn't provide it

#### Grid Error/Retry UX
- **Grid component:** `components/dashboard/entities/shared/entity-grid.tsx`
  - **Line 79-147:** `AgGridEnterpriseError` component for error display
  - **Line 148-433:** `EntityGrid` component with error handling
  - **Note:** Need to verify retry behavior and error message clarity

- **Fetchers:** `components/dashboard/entities/shared/fetchers.ts`
  - **Line 172-289:** `createEntityFetcher()` — handles API requests
  - **Line 132-171:** Error handling with status codes
  - **Note:** Error handling exists; verify UX polish

### Sprint 3: Chat Data Tooling (SQL Integration) ✅ COMPLETE

**Status:** Already implemented in previous sprint - functionality is complete.

- **Tool calling:** OpenAI function calling integrated in chat handler (`lib/api/ai/chat/handler.ts`)
- **Tools defined:** `execute_sql` and `describe_schema` tools in `lib/api/ai/chat/tools.ts`
- **Streaming support:** Tool calls handled in streaming responses (`lib/api/ai/chat/streaming.ts`)
- **Security validation:** Uses `guardSQL()` for SQL validation with tenant isolation
- **Tests:** Tool definitions and streaming tested (`tests/api/ai/chat/tools.test.ts`, `tests/api/chat-streaming.test.ts`)

#### Chat API Route
- **Primary file:** `app/api/v1/ai/chat/route.ts`
  - **Line 33-42:** Handler wrapped with error handling + rate limiting
  - **Line 26:** Delegates to `handleChatRequest` from `@/lib/api/ai/chat/handler`
  - **Streaming format:** NDJSON (per OpenAPI spec)
  - **Rate limit:** 30 requests/minute

- **Chat handler:** `lib/api/ai/chat/handler.ts`
  - **Contains:** Main chat processing logic
  - **Tools integration:** ✅ Complete - tools passed to OpenAI via `getChatCompletionsTools()`

#### SQL Generation Route (for tool calling)
- **Primary file:** `app/api/v1/ai/generate-sql/route.ts`
  - **Line 64-181:** SQL generation with security validation
  - **Line 33:** Uses `validateSQLScope()` for security
  - **Line 34:** Uses OpenAI client
  - **Line 100:** Sanitizes user input

- **SQL validation:** `lib/integrations/database/scope.ts`
  - **Contains:** `validateSQLScope()` function
  - **Note:** Already enforces tenant scoping and security

#### Warehouse Query Execution
- **ClickHouse client:** `lib/integrations/clickhouse/client.ts`
  - **Line 118-197:** `query()` method with server/client context handling
  - **Server path:** Calls `clickhouseQuery()` from `./server` (direct import)

- **ClickHouse server:** `lib/integrations/clickhouse/server.ts`
  - **Line 54-130:** `clickhouseQuery()` function (server-side execution)
  - **Note:** This is where actual query execution happens

#### Chat UI Components
- **Chat window:** `components/chat/sections/chat-window.tsx`
  - **Line 17-310:** Main chat UI with message list
  - **Mobile considerations:** Already handles scrolling

- **Chat composer:** `components/chat/sections/chat-composer.tsx`
  - **Line 34-286:** Input component
  - **Mobile considerations:** Need to verify safe-area padding and keyboard behavior

- **Chat client hook:** `components/chat/hooks/use-chat.ts`
  - **Line 147-417:** Chat state management
  - **Line 203-365:** `sendMessage()` function
  - **Note:** Handles streaming via `processUserMessageStreamClient`

## Known Issues / Gaps (for later sprints)

1. ✅ **Dashboard layout:** Fixed in Sprint 1 - Content width controlled via `contentWidth` prop
2. ✅ **Mobile sidebar:** Fixed in Sprint 1 - Drawer pattern implemented for mobile
3. ✅ **AG Grid numeric alignment:** Fixed in Sprint 2 - Right alignment for numeric columns
4. ✅ **Chat data tooling:** Complete - Tool calling integration already implemented
5. **Chat mobile UX:** May need safe-area padding improvements (to be verified in Sprint 4)

## Architecture Notes

### Design System
- Uses Tailwind CSS with design tokens (CSS custom properties)
- Token system in `styles/tokens/*.css`
- Variant system using `tailwind-variants` (tv)
- Consistent patterns: `@/styles/ui/atoms`, `@/styles/ui/molecules`, `@/styles/ui/organisms`

### Security Patterns
- All routes use Clerk authentication
- RBAC enforced via `requireAnyRoleForAI` / `requireRole`
- Tenant isolation via `getTenantContext` (orgId required)
- SQL validation via `validateSQLScope`
- Input sanitization via `sanitizeUserInput`

### Runtime Boundaries
- Edge runtime: `@/lib/api` barrel (Edge-compatible only)
- Node runtime: `@/lib/server` barrel (Node.js only)
- Client-safe: `@/lib/shared` barrel
- Strict enforcement via ESLint rules

## Next Steps

1. ✅ **Sprint 1:** Dashboard layout max-width + mobile sidebar drawer - COMPLETE
2. ✅ **Sprint 2:** AG Grid numeric alignment + formatting polish - COMPLETE
3. ✅ **Sprint 3:** Chat tool calling (SQL integration) - COMPLETE (was already implemented)
4. **Sprint 4:** Hardening, docs, final QA - IN PROGRESS

## Verification Checklist (for PR)

- ✅ All baseline commands pass
- ✅ No code changes (documentation only)
- ✅ File map complete
- ✅ Known issues documented
- ✅ Architecture patterns noted

---

**Generated:** 2025-01-04  
**Branch:** `sprint-0-baseline-auditlog`  
**Commit:** Will commit this audit document only
