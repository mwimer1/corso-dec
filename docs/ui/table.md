---
title: "Ui"
description: "Documentation and resources for documentation functionality. Located in ui/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Dashboard Table UI Updates

This doc summarizes the recent updates to the dashboard table UI:

Key changes

- Icon-only toolbar: Export (CSV/Excel), Refresh, Reset, Save/Save As, Fullscreen. All controls are keyboard accessible and have `aria-label` attributes. Buttons use focus rings for keyboard navigation.
- Refresh calls `refreshServerSide()` to reload grid data.
- Error handling: Compact inline error alert appears in toolbar when data load fails, with retry button. Error state is tracked and cleared on successful reload.
- Sticky header: Headers remain visible via AG Grid's native sticky positioning.
- Spacing: Grid content uses consistent padding (`px-6 md:px-8`) to align with top bar spacing.
- Link rendering: URL columns can be configured with `format: 'link'` to render as clickable anchors.

Accessibility

- All icon buttons have `aria-label` and visible focus styles (focus-visible:ring-2 with ring token). The toolbar maintains logical tab order: Saved Searches menu, Tools menu, then action icons.
- Error region uses `role="alert"` to announce errors to screen readers. Error alert includes a retry button with proper focus handling.
- Sidebar navigation items have focus rings and proper ARIA labels for keyboard navigation.
- Skip navigation link is available at the top of the page for keyboard users.

Developer notes

- Use `EntityGridHost` (`@/components/dashboard/entity`) for new entity pages. Avoid deep imports.
- Sticky header, virtualization, pinning, and sorting are handled natively by AG Grid.
- To add link rendering to a column, add `format: 'link'` to the column config in `lib/services/entity/[entity]/columns.config.ts`.
- Error state is automatically tracked and displayed in the toolbar when data loading fails.

Changelog

- feat(dashboard-table): icon-only toolbar, refresh/retry, sticky header
- feat(dashboard-table): inline error alert with retry button
- feat(dashboard-table): focus ring styles for keyboard navigation
- feat(dashboard-table): link format support for URL columns
- fix(dashboard-table): consistent padding alignment with top bar
