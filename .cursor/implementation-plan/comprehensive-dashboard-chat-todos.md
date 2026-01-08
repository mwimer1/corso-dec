# Comprehensive Dashboard + Chat Implementation Plan
## Tactical To-Do List (Post-Audit)

**Status**: Awaiting approval to begin implementation  
**Last Updated**: Generated from audit reports  
**Scope**: Dashboard UX/AG Grid + Chat System completion

---

## 🔴 P0 - Critical Blockers (Must Fix First)

### Dashboard & Entity Tables

#### DASH-001: Fix RBAC Navigation/API Mismatch
**Priority**: P0  
**Workstream**: Dashboard  
**Files**: 
- `lib/dashboard/nav.tsx`
- `app/api/v1/entity/[entity]/route.ts` (verify backend authz)

**Tasks**:
- Remove 'viewer' role from Projects and Addresses nav items in `DASHBOARD_NAV_ITEMS`
- Verify backend API returns appropriate error messages (not just 403)
- Optionally: Add "Unauthorized" UI state on entity pages for viewers who manually navigate

**Acceptance**:
- Viewer role users see only Chat in sidebar
- Manual navigation to `/dashboard/projects` as viewer shows graceful error (not blank grid)
- Member+ roles see all sections as before

**Estimated Effort**: 15 minutes

---

#### DASH-002: Add Data Load Error Feedback in Toolbar
**Priority**: P0  
**Workstream**: Dashboard  
**Files**:
- `components/dashboard/entity/shared/grid/entity-grid-host.tsx`
- `components/dashboard/entity/shared/grid/grid-menubar.tsx`

**Tasks**:
- Add `loadError` state to `EntityGridHost`
- Set error state in fetcher catch block (where `params.fail()` is called)
- Pass `loadError` prop to `GridMenubar`
- Render inline error alert in toolbar: "⚠️ Error loading data. [Retry]" with `role="alert"`
- Retry button calls `gridRef.current.api.refreshServerSide()`
- Clear error state on successful retry

**Acceptance**:
- Simulated API failure (offline/500) shows visible error in toolbar
- Retry button works and clears error on success
- No error shown during normal operation
- ARIA alert announced by screen readers

**Estimated Effort**: 1 hour

---

### Chat System

#### CHAT-001: Implement `/api/v1/ai/chat` Route Handler
**Priority**: P0  
**Workstream**: Chat  
**Files**: 
- `app/api/v1/ai/chat/route.ts` (create)

**Tasks**:
- Create route file with `export const runtime = 'nodejs'`
- Implement POST handler with:
  - Zod validation for request body (`content: string`, optional `preferredTable`)
  - Clerk auth check (return 401 if no user)
  - Rate limiting: 30/min (use `withRateLimitEdge` or `checkRateLimit`)
  - Parse mode prefix `[mode:projects]` from content (strip before sending to LLM)
  - Call OpenAI streaming API using `createOpenAIClient()` from `@/lib/integrations/openai/server`
  - Stream NDJSON chunks: `{ assistantMessage: { content: "...", type: "assistant" }, detectedTableIntent: null, error: null }\n`
  - Handle errors: send `{ error: "..." }\n` chunk and close stream
  - Support AbortController for cancellation
- Update client to use `/api/v1/ai/chat` instead of `/api/v1/dashboard/chat/process`

**Acceptance**:
- Route accepts POST with JSON body
- Returns NDJSON stream (`Content-Type: application/x-ndjson`)
- Authentication required (401 if not logged in)
- Rate limiting enforced (429 on 31st request in 1 min)
- Streaming works end-to-end (client receives chunks incrementally)
- Errors return error chunks, not crash
- Cancellation works (client abort stops server stream)

**Estimated Effort**: 3-4 hours

---

#### CHAT-002: Implement OpenAI Integration in SQL Generation
**Priority**: P0  
**Workstream**: Chat  
**Files**:
- `app/api/v1/ai/generate-sql/route.ts`

**Tasks**:
- Replace TODO stub with actual OpenAI call
- Use `callOpenAIJSON` or `createOpenAIClient()` from `@/lib/integrations/openai/server`
- Construct prompt: "Convert the following question to a SQL SELECT query for the [table] table. Only return SQL, no explanation."
- Pass user's question + table context (from `preferredTable` or infer from question)
- Replace `validateSQLScope` usage (currently uses simpler `isUnsafe()` regex)
- Validate generated SQL with `validateSQLScope` (from `@/lib/database/scope` or equivalent)
- Return 400 with `code: "INVALID_SQL"` if validation fails
- Return `{ sql: generatedSQL }` on success

**Acceptance**:
- Natural language question → generates valid SQL
- SQL is validated with `validateSQLScope` (SELECT-only, org_id scoped)
- Unsafe SQL (DROP, DELETE without WHERE, etc.) returns 400
- Response time < 3 seconds for typical queries
- Rate limiting still enforced

**Estimated Effort**: 2-3 hours

---

#### CHAT-003: Connect SQL Execution to Chat Flow
**Priority**: P0  
**Workstream**: Chat  
**Files**:
- `app/api/v1/ai/chat/route.ts` (extend)
- Consider: use OpenAI function calling OR two-step approach

**Tasks**:
- Option A (Function Calling - Recommended):
  - Define function schema for `execute_sql(query: string)`
  - Pass to OpenAI chat completion as `tools` parameter
  - When model calls function, intercept and:
    - Validate SQL with `validateSQLScope`
    - Execute via `clickhouseQuery` or call `/api/v1/entity/[entity]/query`
    - Format results (limit rows, convert to text/markdown)
    - Return function result to model
    - Model incorporates data into final answer
- Option B (Two-Step):
  - Detect SQL in model output (regex or structured output)
  - Extract and execute separately
  - Append results as final chunk
- Handle query errors gracefully (stream error chunk, don't crash)

**Acceptance**:
- User asks "How many projects in 2024?"
- Chat generates SQL, executes it, includes results in answer
- SQL validation prevents unsafe queries
- Results are formatted for readability
- Errors (DB timeout, invalid SQL) show user-friendly messages

**Estimated Effort**: 4-5 hours (function calling) or 3-4 hours (two-step)

---

## 🟠 P1 - High Priority (This Sprint)

### Dashboard & Entity Tables

#### DASH-003: Make Company URL Columns Clickable
**Priority**: P1  
**Workstream**: Dashboard  
**Files**:
- `lib/services/entity/companies/columns.config.ts`

**Tasks**:
- Add `format: 'link'` to `company_url` column definition
- Add `format: 'link'` to `linkedin_url` column definition

**Acceptance**:
- When columns are visible, cells render as `<a>` tags
- Links open in new tab (`target="_blank"`, `rel="noopener noreferrer"`
- Email addresses render as `mailto:` links
- URLs without scheme get `https://` prepended
- Malicious schemes (javascript:) are blocked (render as text)

**Estimated Effort**: 10 minutes

---

#### DASH-004: Improve Focus Visibility on Interactive Elements
**Priority**: P1  
**Workstream**: Dashboard  
**Files**:
- `components/dashboard/entity/shared/grid/grid-menubar.tsx`
- `components/dashboard/sidebar/sidebar-item.tsx`
- Global CSS or component-specific styles

**Tasks**:
- Add to toolbar icon buttons: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`
- Add to dropdown triggers: Same focus ring classes
- Add to sidebar nav links: Enhanced focus ring (2px, using design token colors)
- Test in both light and dark mode

**Acceptance**:
- All interactive elements show visible focus ring on keyboard navigation
- Focus ring uses design system tokens (`--ring`, `--ring-offset-background`)
- Focus ring visible in dark mode
- No layout shift when focus ring appears

**Estimated Effort**: 30 minutes

---

#### DASH-005: Align Grid Padding with Top Bar
**Priority**: P1  
**Workstream**: Dashboard  
**Files**:
- `components/dashboard/entity/shared/grid/entity-grid-host.tsx` OR
- `components/dashboard/layout/dashboard-layout.tsx`

**Tasks**:
- Add horizontal padding to grid container: `px-6 md:px-8`
- Ensure padding matches top bar padding (24px on desktop, 16px on mobile)
- Verify no horizontal scroll introduced

**Acceptance**:
- Grid content (toolbar + table) aligns vertically with top bar title
- Consistent spacing on left/right edges
- Responsive: 16px on mobile, 24px+ on desktop
- No overflow or horizontal scroll

**Estimated Effort**: 15 minutes

---

#### DASH-006: Consolidate Mock Data Implementation
**Priority**: P1  
**Workstream**: AG Grid / Entity Tables  
**Files**:
- `lib/services/entity/actions.ts` (has duplicate mock logic)
- `lib/api/data.ts` (edge-safe mock fetch)
- Potentially: `lib/mocks/entity-data.server.ts` (if exists)

**Tasks**:
- Audit all mock data paths:
  - Edge-safe: `lib/api/data.ts` → `getEntityPage()` → fetches JSON from `public/__mockdb__/`
  - Server-side: `lib/services/entity/actions.ts` → duplicate logic
- Create unified mock service: `lib/services/entity/mock-data.ts`
- Consolidate query processing (filter/sort/paginate) into single function
- Update both paths to use unified service
- Ensure Edge compatibility (no `fs` imports in Edge-bundled code)
- Remove duplicate logic from `actions.ts`

**Acceptance**:
- Single source of truth for mock data loading
- Both Edge and Node contexts use same logic
- No duplicate query processing code
- All mock call sites updated and tested

**Estimated Effort**: 2 hours

---

#### DASH-007: Fix `getEntityConfig()` to Use Real Column Configs
**Priority**: P1  
**Workstream**: AG Grid / Entity Tables  
**Files**:
- `lib/services/entity/config.ts`

**Tasks**:
- Replace placeholder switch statement with actual imports
- Use dynamic imports: `const { PROJECTS_COLUMNS } = await import('./projects/columns.config')`
- Return actual column configs for each entity
- If function is unused, either remove it OR mark as deprecated with JSDoc
- Add unit test: `getEntityConfig('projects')` returns same columns as `PROJECTS_COLUMNS`

**Acceptance**:
- Function returns real column definitions (not placeholder)
- All entity types supported (projects, companies, addresses)
- Type-safe (no `any` types)
- Test passes

**Estimated Effort**: 1 hour

---

#### DASH-008: Implement Filter Support in Entity API Route
**Priority**: P1  
**Workstream**: AG Grid / Entity Tables  
**Files**:
- `app/api/v1/entity/[entity]/route.ts`

**Tasks**:
- Remove TODO comment about filters
- Parse `filters` query param (JSON string)
- Transform to `Filter[]` format expected by service layer
- Pass filters to `getEntityPage()` call
- Add validation: ensure filters array is well-formed
- Return 400 if filters are malformed

**Acceptance**:
- Query param `?filters=[{"field":"status","operator":"equals","value":"active"}]` works
- Filters are applied to query results
- Invalid filter format returns 400
- Filter schema matches what UI sends (AG Grid filter model format)

**Estimated Effort**: 1-2 hours

---

### Chat System

#### CHAT-004: Fix Type Safety Violations
**Priority**: P1  
**Workstream**: Chat  
**Files**:
- `lib/chat/client/process.ts`
- `components/chat/sections/chat-window.tsx`

**Tasks**:
- Replace `any` in `AIChunk` type with proper interfaces:
  ```typescript
  type AIChunk = {
    assistantMessage: { content: string; type: 'assistant' } | null;
    detectedTableIntent: { table: string; confidence: number } | null;
    error: string | null;
  };
  ```
- Fix error casting in `process.ts:31`
- Fix CSS property casting in `chat-window.tsx:92` (use proper React.CSSProperties type)

**Acceptance**:
- Zero `any` types in chat code
- TypeScript strict mode passes
- All types properly defined

**Estimated Effort**: 30 minutes

---

#### CHAT-005: Fix Chat Page Runtime Configuration
**Priority**: P1  
**Workstream**: Chat  
**Files**:
- `app/(protected)/dashboard/chat/page.tsx`

**Tasks**:
- Change `export const runtime = 'edge'` to `export const runtime = 'nodejs'`
- Verify this doesn't break any client-only components (chat is client-rendered, should be fine)

**Acceptance**:
- Page uses Node.js runtime
- Can import/use Node-only dependencies if needed
- No build/runtime errors

**Estimated Effort**: 5 minutes

---

#### CHAT-006: Improve Intent Detection (or Remove Stub)
**Priority**: P1  
**Workstream**: Chat  
**Files**:
- `lib/chat/query/intent-detection.ts`

**Tasks**:
- Option A: Replace keyword matching with LLM-based detection (call OpenAI with small prompt)
- Option B: Remove this function if not used, OR mark as deprecated
- If keeping: Improve to detect actual table names from question

**Acceptance**:
- If kept: Intent detection is more accurate (uses LLM or better heuristics)
- If removed: All call sites updated, no dead code

**Estimated Effort**: 1-2 hours (Option A) or 15 minutes (Option B)

---

#### CHAT-007: Add Conversation Context to LLM Prompts
**Priority**: P1  
**Workstream**: Chat  
**Files**:
- `app/api/v1/ai/chat/route.ts`

**Tasks**:
- Accept conversation history in request (or load from localStorage on client, send as array)
- Build messages array for OpenAI:
  - System prompt: "You are Corso AI..."
  - Previous messages (last N, bounded by token limits)
  - Current user message
- Include table/entity context in system prompt based on mode
- Ensure error messages from history are excluded

**Acceptance**:
- Multi-turn conversations work (follow-up questions reference previous context)
- Context is bounded (not infinite, respects token limits)
- System prompt includes relevant table schema/context

**Estimated Effort**: 2 hours

---

## 🟡 P2 - Medium Priority (Next Sprint)

### Dashboard & Entity Tables

#### DASH-009: Enhance Empty State Messaging
**Priority**: P2  
**Workstream**: Dashboard  
**Files**:
- `components/dashboard/entity/shared/grid/entity-grid.tsx` (or create custom overlay component)

**Tasks**:
- Implement custom `noRowsOverlayComponent` for AG Grid
- Show contextual message:
  - No filters: "No records found. Click 'New [Entity]' to add one." (if create action exists)
  - Filters active: "No matches found. Try adjusting your filters."
- Style with design system tokens

**Acceptance**:
- Empty state shows helpful message (not generic "No rows")
- Message adapts to filter state
- Accessible (proper ARIA, keyboard navigable if needed)

**Estimated Effort**: 1 hour

---

#### DASH-010: Mock DB Default Behavior (Dev/Test)
**Priority**: P2  
**Workstream**: AG Grid / Entity Tables  
**Files**:
- `lib/services/entity/actions.ts`
- `lib/api/data.ts`
- Environment variable handling

**Tasks**:
- Update env logic to default mock in dev/test unless explicitly disabled
- Production should default to real DB unless explicitly enabled
- Update env parsing: `const useMock = env.CORSO_USE_MOCK_DB === 'true' || (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false')`

**Acceptance**:
- Dev/test environments use mock by default (no flag needed)
- Production uses real DB by default (safe)
- Explicit flags still work (can override defaults)

**Estimated Effort**: 30 minutes

---

#### DASH-011: Remove Fallback to All Nav Items
**Priority**: P2  
**Workstream**: Dashboard  
**Files**:
- `components/dashboard/sidebar/dashboard-sidebar.tsx` (or wherever nav is rendered)

**Tasks**:
- Remove fallback that shows all `DASHBOARD_NAV_ITEMS` if `availableItems` is empty
- Show empty nav or "No sections available" message instead
- Add defensive check: log warning if role is missing/invalid

**Acceptance**:
- No nav items shown if user has no valid role
- No security risk from fallback exposing all items
- Edge case logged for debugging

**Estimated Effort**: 15 minutes

---

#### DASH-012: Documentation Updates
**Priority**: P2  
**Workstream**: Documentation  
**Files**:
- `app/(protected)/dashboard/README.md`
- `docs/ui/table.md`
- Remove: `docs/examples/dashboard/*.tsx` (if confirmed unused)

**Tasks**:
- Update dashboard README:
  - Remove mention of `DashboardProvider` (doesn't exist)
  - Update component list (remove BarChart if not implemented)
  - Update code snippet to match actual layout.tsx
  - Clarify RBAC enforcement (UI + backend)
- Update table.md:
  - Mark implemented features vs planned
  - Remove references to search input if not implemented
  - Note error alert is now implemented (after DASH-002)
- Remove outdated example files (if confirmed no references)

**Acceptance**:
- Docs accurately reflect current implementation
- No references to removed components
- Examples match actual code

**Estimated Effort**: 1 hour

---

### Chat System

#### CHAT-008: Add Error Boundaries for Chat
**Priority**: P2  
**Workstream**: Chat  
**Files**:
- `app/(protected)/dashboard/chat/error.tsx` (create if missing)
- Or enhance global error boundary

**Tasks**:
- Create chat-specific error boundary component
- Display user-friendly error message
- Provide retry mechanism
- Log errors for monitoring

**Acceptance**:
- Chat errors don't crash entire page
- Error UI is clear and actionable
- Retry works correctly

**Estimated Effort**: 1 hour

---

#### CHAT-009: Add Loading Indicators for Streaming
**Priority**: P2  
**Workstream**: Chat  
**Files**:
- `components/chat/widgets/message-item.tsx` OR
- `components/chat/sections/chat-window.tsx`

**Tasks**:
- Show "typing" indicator (pulsing ellipsis) while streaming
- Or show spinner in assistant message bubble
- Hide when stream completes

**Acceptance**:
- Visual feedback during streaming
- Indicator disappears when complete
- Accessible (screen reader announces "Assistant is typing")

**Estimated Effort**: 30 minutes

---

#### CHAT-010: Improve Error Handling & Recovery
**Priority**: P2  
**Workstream**: Chat  
**Files**:
- `app/api/v1/ai/chat/route.ts`
- `hooks/chat/use-chat.ts`

**Tasks**:
- Handle OpenAI API errors gracefully (rate limit, timeout, etc.)
- Stream error chunks instead of crashing
- Add retry logic (exponential backoff) in client hook
- Show user-friendly error messages (not raw API errors)

**Acceptance**:
- All error cases handled gracefully
- Users see helpful messages
- Retry works automatically or manually

**Estimated Effort**: 2 hours

---

#### CHAT-011: Add Request Deduplication
**Priority**: P2  
**Workstream**: Chat  
**Files**:
- `hooks/chat/use-chat.ts`

**Tasks**:
- Prevent multiple simultaneous requests
- Disable send button while request in flight
- Track pending request, cancel previous if new one starts
- Use AbortController to cancel duplicate requests

**Acceptance**:
- Rapid clicks don't send duplicate requests
- Only one request active at a time
- Previous request cancelled cleanly

**Estimated Effort**: 30 minutes

---

## 🟢 P3 - Low Priority (Future Enhancements)

### Dashboard

- DASH-013: Add dark mode toggle (UI control, not just OS preference)
- DASH-014: Performance optimization (AG Grid bundle size, lazy loading)
- DASH-015: Export functionality enhancements (formats, large datasets)
- DASH-016: Saved searches persistence (localStorage or backend)

### Chat

- CHAT-012: Implement chart visualization (if chart generation is implemented)
- CHAT-013: Add message editing/deleting
- CHAT-014: Add export chat history
- CHAT-015: Improve table rendering (formatting, pagination for large results)
- CHAT-016: Add analytics tracking (chat interactions, SQL generation usage)

---

## 🧹 Cleanup Tasks

### Files to Remove (After Verification)
- `docs/examples/dashboard/*.tsx` (if confirmed unused)
- `lib/services/entity/columns/registry.ts` (if unused)
- Any commented-out legacy code in dashboard components

### Deprecations to Address
- Legacy route paths: `/api/v1/dashboard/chat/process` → update client to use `/api/v1/ai/chat`
- Old env vars: `USE_MOCK_DB`, `NEXT_PUBLIC_USE_MOCK_DB` → ensure migration to `CORSO_USE_MOCK_DB`

---

## 📋 Testing Requirements

### Unit Tests to Add
- `getEntityConfig()` returns correct column configs
- Filter transformation in entity API route
- Mock data consolidation logic
- Chat streaming NDJSON parsing
- SQL validation in chat flow
- Error handling in chat route

### Integration Tests to Add
- End-to-end chat flow (question → SQL → results)
- Entity grid with filters end-to-end
- RBAC nav filtering
- Mock/real DB switching

---

## ✅ Acceptance Checklist (Overall)

### Dashboard
- [ ] All P0 tasks completed
- [ ] RBAC mismatch fixed
- [ ] Error states visible
- [ ] Focus indicators on all interactive elements
- [ ] Padding consistent across pages
- [ ] Mock data consolidated
- [ ] Filters work end-to-end
- [ ] Documentation updated

### Chat
- [ ] All P0 tasks completed
- [ ] Chat endpoint implemented and streaming works
- [ ] SQL generation uses OpenAI
- [ ] Query execution integrated
- [ ] Type safety improved
- [ ] Error handling comprehensive
- [ ] Conversation context works

### Quality Gates
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] All tests pass (existing + new)
- [ ] No console errors in production
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Manual QA completed per checklist

---

## 🚀 Implementation Order Recommendation

**Week 1: Critical Blockers (P0)**
1. DASH-001 (RBAC fix) - Quick win
2. DASH-002 (Error feedback) - UX critical
3. CHAT-001 (Chat route) - Core functionality
4. CHAT-002 (SQL generation) - Core functionality
5. CHAT-003 (SQL execution) - Core functionality

**Week 2: High Priority (P1)**
1. DASH-003 (Link columns) - Quick win
2. DASH-004 (Focus styles) - Accessibility
3. DASH-005 (Padding) - Visual polish
4. DASH-006 (Mock consolidation) - Code quality
5. DASH-007 (getEntityConfig) - Code quality
6. DASH-008 (Filters) - Feature completeness
7. CHAT-004 through CHAT-007 - Chat improvements

**Week 3: Medium Priority (P2)**
- Remaining P2 tasks + cleanup + documentation

---

**Status**: Ready for approval. Awaiting green light to begin implementation.
