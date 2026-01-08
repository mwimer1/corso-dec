---
title: "Layout"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in dashboard/layout/."
---
# Dashboard Layout Components

Layout components for dashboard pages including `DashboardLayout` wrapper and sidebar navigation.

## DashboardLayout Component

The `DashboardLayout` component provides a consistent layout wrapper for all dashboard pages with side navigation.

### Content Width Control

The `contentWidth` prop controls the maximum width of page content:

- **`"dashboard"`** (default): Uses max-width container (1600px) for better readability on wide screens. Content is centered with consistent padding.
- **`"full"`**: Full-width layout for dense grid views or specific pages that need edge-to-edge content.

**Usage:**
```tsx
// Default: centered content with 1600px max-width
<DashboardLayout>
  {children}
</DashboardLayout>

// Full-width for entity grids
<DashboardLayout contentWidth="full">
  <EntityGridHost config={config} />
</DashboardLayout>
```

**Implementation:**
- Default: Uses `dashboardShellVariants({ maxWidth: 'default' })` which applies `max-w-[1600px]` from `containerMaxWidthVariants`
- Full-width: Uses `dashboardShellVariants({ maxWidth: 'none' })` for edge-to-edge layout
- See `styles/ui/organisms/dashboard-shell.ts` for variant definitions

### Mobile Sidebar Behavior

On mobile devices (≤767px), the sidebar uses a drawer pattern:

- **Default state**: Sidebar is collapsed (closed) by default to avoid blocking content
- **Opening**: Sidebar opens as an overlay drawer when hamburger button is clicked
- **Closing**: Sidebar closes when:
  - Backdrop is clicked
  - ESC key is pressed
  - Route navigation occurs (prevents stuck open state)
- **Visual**: Fixed overlay with backdrop blur and shadow for visual separation

**Desktop behavior** (≥768px):
- Sidebar uses inline collapsed/expanded behavior
- No overlay or backdrop
- Sidebar state persists across route changes

**Implementation details:**
- Mobile detection: Uses `window.matchMedia('(max-width: 767px)')`
- Default state: Initializes based on viewport width (collapsed on mobile, expanded on desktop)
- Drawer styling: See `components/dashboard/sidebar/sidebar-root.tsx` for mobile drawer CSS classes
- Backdrop: Rendered conditionally when `isMobile && !sidebarCollapsed`

### Accessibility

- Sidebar toggle button includes `aria-expanded` and `aria-controls` attributes
- Backdrop click handler includes `aria-hidden="true"` to prevent screen reader announcements
- Sidebar includes `aria-label="Dashboard sidebar"` for screen readers
- ESC key handling provides keyboard-accessible close mechanism

## Related Components

- `DashboardSidebar` - Sidebar navigation component
- `DashboardHeader` - Page header component
- `DashboardTopBar` - Top bar with breadcrumbs and actions
- `DashboardNav` - Navigation menu items

