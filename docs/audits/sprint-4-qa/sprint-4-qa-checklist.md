---
title: "Qa"
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Sprint 4 QA Checklist

Manual QA verification checklist for Sprint 4: Hardening, Documentation, and Final QA.

## ✅ Quality Gates

- [x] Type checking: `pnpm typecheck` - ✅ Passed
- [x] Linting: `pnpm lint` - ✅ Passed  
- [x] Tests: `pnpm test` - ✅ Passed (809 tests, 128 test files)
- [ ] Quality CI: `pnpm quality:ci` (if available)
- [ ] Test coverage: `pnpm test:coverage` (if available)
- [ ] Audit: `pnpm audit` (if required)

## 📱 Wide Screen Verification (≥1920px)

**Test Environment:** Desktop browser at 1920px+ width

- [ ] **Dashboard pages use max-width container (1600px)**
  - Navigate to `/dashboard/projects`
  - Verify content is centered with max-width of 1600px
  - Verify no edge-to-edge stretch on wide screens
  
- [ ] **Full-width option works correctly**
  - Navigate to entity grid pages (projects, companies, addresses)
  - Verify grids use full-width when `contentWidth="full"` is set
  - Verify content extends to edges appropriately

**Expected Behavior:**
- Default dashboard pages: Centered content with 1600px max-width
- Entity grids: Full-width layout for dense grid views
- Content remains readable and well-spaced

## 📱 Mobile Sidebar Verification (≤767px)

**Test Environment:** Mobile browser or responsive mode at ≤767px width

- [ ] **Sidebar defaults to closed**
  - Navigate to any dashboard page on mobile
  - Verify sidebar is collapsed (hidden) by default
  - Verify content is not blocked by sidebar

- [ ] **Sidebar opens as drawer**
  - Click hamburger button to open sidebar
  - Verify sidebar appears as overlay drawer with backdrop
  - Verify backdrop blur and shadow are visible
  - Verify sidebar width is appropriate (max 92vw, min sidebar width)

- [ ] **Sidebar closes on backdrop click**
  - Open sidebar drawer
  - Click backdrop (dark overlay area)
  - Verify sidebar closes immediately

- [ ] **Sidebar closes on ESC key**
  - Open sidebar drawer
  - Press ESC key
  - Verify sidebar closes immediately

- [ ] **Sidebar closes on route navigation**
  - Open sidebar drawer
  - Navigate to a different dashboard page (e.g., click "Chat" link)
  - Verify sidebar auto-closes after navigation

- [ ] **Sidebar doesn't block content when closed**
  - Close sidebar (ensure it's collapsed)
  - Verify page content is fully accessible
  - Verify no overlay or backdrop when sidebar is closed

**Expected Behavior:**
- Sidebar collapsed by default on mobile
- Drawer pattern with backdrop when open
- Multiple closing mechanisms (backdrop, ESC, navigation)
- Content always accessible when sidebar is closed

## 📊 AG Grid Numeric Alignment Verification

**Test Environment:** Desktop browser

- [ ] **Currency columns are right-aligned**
  - Navigate to `/dashboard/projects` (or companies/addresses with currency columns)
  - Verify currency columns (e.g., "Total Value", "Budget") are right-aligned
  - Verify headers are optionally right-aligned for numeric columns
  - Verify alignment is consistent across all currency columns

- [ ] **Number columns are right-aligned**
  - Verify numeric columns (e.g., counts, IDs, quantities) are right-aligned
  - Verify formatting uses thousand separators (e.g., `12,345`)
  - Verify alignment is consistent across all numeric columns

- [ ] **CSV export works correctly**
  - Open entity grid (projects, companies, or addresses)
  - Click Export → CSV
  - Verify CSV file downloads correctly
  - Verify numeric values are exported correctly (formatted or raw values)
  - Verify alignment doesn't affect export format

**Expected Behavior:**
- All numeric columns (currency, numbers) right-aligned
- Headers optionally right-aligned for numeric columns
- Consistent formatting across all numeric columns
- CSV export works correctly with proper formatting

## 🤖 Chat Data Answers Verification

**Test Environment:** Desktop or mobile browser

- [ ] **Tool calling works correctly**
  - Ask a question requiring database query (e.g., "How many projects were created in 2024?")
  - Verify assistant uses `execute_sql` tool
  - Verify SQL query is executed successfully
  - Verify results are returned to the model
  - Verify assistant streams a data-backed answer

- [ ] **SQL validation and tenant scoping**
  - Ask a query that requires data access
  - Verify SQL is validated (no dangerous operations allowed)
  - Verify tenant scoping is enforced (only user's org data)
  - Verify row limit is enforced (max 100 rows)

- [ ] **Results are formatted properly**
  - Verify query results are formatted correctly in the response
  - Verify numbers, dates, and text are formatted appropriately
  - Verify table rendering (if applicable) works correctly

- [ ] **Streaming works without breaking**
  - Ask a data query question
  - Verify response streams correctly in NDJSON format
  - Verify tool calls don't break streaming
  - Verify final response streams completely

- [ ] **Error handling is graceful**
  - Ask a query that might fail (e.g., invalid table name, syntax error)
  - Verify error messages are user-friendly (no SQL internals leaked)
  - Verify retry button appears for failed queries
  - Verify error state can be cleared

- [ ] **Multi-step tool calling (if applicable)**
  - Ask a complex question requiring multiple queries
  - Verify assistant can make up to 3 tool calls per turn
  - Verify each tool call receives results correctly
  - Verify final response summarizes findings from all tool calls

**Expected Behavior:**
- Tool calling works correctly for data queries
- SQL validation and tenant scoping enforced
- Results formatted properly
- Streaming works smoothly
- Error handling is graceful with user-friendly messages
- Multi-step tool calling works for complex queries

## 📱 Chat Mobile UX Verification (≤390px)

**Test Environment:** Mobile browser or responsive mode at ≤390px width

- [ ] **Safe-area inset bottom padding works**
  - Navigate to `/dashboard/chat` on mobile (iOS device preferred)
  - Verify composer container has safe-area bottom padding
  - Verify composer is not hidden behind iOS home indicator/notch
  - Verify padding uses `env(safe-area-inset-bottom)` CSS variable

- [ ] **Composer not hidden by keyboard**
  - Open chat interface on mobile
  - Tap input field to show virtual keyboard
  - Verify composer remains accessible when keyboard is shown
  - Verify composer scrolls into view if needed

- [ ] **Message list scrolls correctly**
  - Send multiple messages to create a long conversation
  - Verify message list scrolls correctly during streaming
  - Verify scroll position is stable (no jumping or jitter)
  - Verify new messages appear correctly at bottom

- [ ] **Stop/retry buttons visible and usable**
  - Start a chat query (with streaming response)
  - Verify "Stop" button is visible and clickable
  - Click "Stop" button
  - Verify streaming stops immediately
  - Verify "Retry" button appears for failed queries
  - Verify "Retry" button is visible and clickable

**Expected Behavior:**
- Safe-area padding prevents content from being hidden behind iOS notch/home indicator
- Composer remains accessible when keyboard is shown
- Message list scrolls smoothly during streaming
- Stop/retry buttons are visible and usable on mobile

## 📝 Documentation Verification

- [ ] **Dashboard layout documentation updated**
  - Verify `components/dashboard/layout/README.md` documents `contentWidth` prop
  - Verify mobile sidebar drawer behavior is documented
  - Verify desktop sidebar behavior is documented

- [ ] **AG Grid formatting documentation updated**
  - Verify `docs/ui/table.md` documents numeric alignment
  - Verify `docs/architecture-design/dashboard-ui-standards.md` documents numeric formatting
  - Verify formatting patterns (currency, number) are documented

- [ ] **Chat data answers documentation updated**
  - Verify `components/chat/README.md` documents tool calling behavior
  - Verify `app/api/v1/README.md` documents tool functions and limits
  - Verify safety limits (row limit, tenant scoping) are documented

**Expected Behavior:**
- All documentation accurately reflects implemented features
- Documentation is clear and actionable for developers
- Code examples and usage patterns are provided

## 🐛 Known Limitations & Edge Cases

Document any known limitations or edge cases discovered during QA:

- **Tool calling limits**: Maximum 3 tool calls per conversation turn
- **SQL query limits**: Maximum 100 rows per query (enforced by SQL Guard)
- **Mobile sidebar behavior**: Sidebar defaults to collapsed on mobile (≤767px)
- **Browser compatibility**: Safe-area padding requires iOS 11+ or modern browsers

## 📋 QA Completion Summary

**Date Completed:** __________

**Tester:** __________

**Overall Status:**
- [ ] All checks passed
- [ ] Some issues found (documented below)
- [ ] Critical issues found (documented below)

**Issues Found:**
- _Document any issues found during QA_

**Notes:**
- _Additional notes or observations_
