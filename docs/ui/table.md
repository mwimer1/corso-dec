---
title: "Ui"
description: "Documentation and resources for documentation functionality. Located in ui/."
last_updated: "2025-12-14"
category: "documentation"
status: "draft"
---
# Dashboard Table UI Updates

This doc summarizes the recent updates to the dashboard table UI:

Key changes

- Icon-only toolbar: Views, Filters, Export, Columns, Refresh/Retry. All controls are keyboard accessible and have `aria-label` attributes. Buttons use a minimum 44x44 hit target via `h-8 w-8` utility and focus rings.
- Refresh animates and calls `refetch()`; Retry appears only when an error exists and calls `refetch()` once.
- Sticky header: headers use `position: sticky; top: 0; z-index: 20` via the `tableHeadBase({ sticky: true })` variant to remain above virtualized rows and spacer.
- Compact error handling: large destructive banners removed in favor of a compact inline `AlertBox` status; Retry control moved to toolbar.
- Spacing tokens: page padding uses `--space-4px` (4px token) applied via `px-[var(--space-4px)]` to ensure consistent spacing across breakpoints.

Accessibility

- All icon buttons have `aria-label` and visible focus styles. The toolbar maintains logical tab order with the Search input first, then action icons, then user menu.
- Error region uses `AlertBox` (role=alert) to announce errors. Table region uses `aria-busy` when loading.

Developer notes

- Use `EntityGrid` (`@/components/dashboard/entity`) for new dashboards. Avoid deep imports.
- Sticky header, virtualization, pinning, and sorting are handled natively by AG Grid.

Changelog

- feat(dashboard-table): icon-only toolbar, refresh/retry, sticky header
