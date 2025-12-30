---
status: "draft"
last_updated: "2025-12-30"
category: "documentation"
title: "Ui"
description: "Documentation and resources for documentation functionality. Located in ui/."
---
# Dashboard Table UI Updates

This doc summarizes the recent updates to the dashboard table UI:

## Key Changes

- **Professional toolbar design**: Clean, organized toolbar with proper visual hierarchy, borders, and consistent spacing. Uses design system Button components for "Saved Searches" and "Tools" dropdowns.
- Icon-only action buttons: Export (CSV/Excel), Refresh, Reset, Save/Save As, Fullscreen. All controls are keyboard accessible and have `aria-label` attributes. Buttons use focus rings for keyboard navigation.
  - **Note:** Excel export requires AG Grid Enterprise to be enabled (license required). If enterprise features are not available, the Excel export option is not shown in the menu.
- **Grouped actions**: Action buttons are visually grouped with separators (Export/Reset/Refresh group, Save As/Save group) for better organization.
- **Enhanced results count**: Results count displays with improved visual treatment, showing the number prominently with a muted "results" label.
- Refresh calls `refreshServerSide()` to reload grid data.
- **Error handling**: Error alert appears above the toolbar (not inline) when data load fails, with retry button. Error state is tracked and cleared on successful reload.
- Sticky header: Headers remain visible via AG Grid's native sticky positioning.
- Spacing: Grid content uses consistent padding (`px-6 md:px-8`) to align with top bar spacing. Toolbar uses standardized spacing tokens (`px-4 py-2`, `gap-3`, `gap-4`).
- Link rendering: URL columns can be configured with `format: 'link'` to render as clickable anchors.

## Accessibility

- All icon buttons have `aria-label` and `title` attributes for tooltips, with visible focus styles (focus-visible:ring-2 with ring token). The toolbar maintains logical tab order: Saved Searches menu, Tools menu, then action icons.
- Error region uses `role="alert"` to announce errors to screen readers. Error alert appears above toolbar with retry button and proper focus handling.
- Button components (Saved Searches, Tools) use design system Button with proper accessibility attributes.
- Sidebar navigation items have focus rings and proper ARIA labels for keyboard navigation.
- Skip navigation link is available at the top of the page for keyboard users.

## Developer Notes

- Use `EntityGridHost` (`@/components/dashboard/entities`) for new entity pages. Avoid deep imports.
- Sticky header, virtualization, pinning, and sorting are handled natively by AG Grid.
- Styling source of truth: `lib/vendors/ag-grid.theme.ts` (themeQuartz.withParams) for theme configuration, `styles/ui/ag-grid.theme.css` for custom overrides (selection column, density modes). Uses AG Grid Theming API with design system tokens.
- To add link rendering to a column, add `format: 'link'` to the column config in `lib/entities/[entity]/columns.config.ts`.
- Error state is automatically tracked and displayed above the toolbar when data loading fails.
- Toolbar styling uses design system tokens: `border-b border-border` for separation, `px-4 py-2` for padding, `gap-3`/`gap-4` for spacing.
- Action buttons are grouped with visual separators (`border-l border-border`) for better organization.

## Changelog

- feat(dashboard-table): professional toolbar redesign with design system integration
- feat(dashboard-table): grouped action buttons with visual separators
- feat(dashboard-table): enhanced results count display
- feat(dashboard-table): error alert moved above toolbar for better UX
- feat(dashboard-table): icon-only toolbar, refresh/retry, sticky header
- feat(dashboard-table): focus ring styles for keyboard navigation
- feat(dashboard-table): link format support for URL columns
- fix(dashboard-table): consistent padding alignment with top bar
- refactor(dashboard-table): convert dropdown triggers to Button components
