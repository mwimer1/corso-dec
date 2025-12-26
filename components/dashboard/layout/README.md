# Dashboard Layout Components

## Purpose

Main layout structure for the protected dashboard area, including sidebar navigation, top bar, and content container.

## Key Files

- `dashboard-layout.tsx` - Root layout wrapper with sidebar and top bar
- `dashboard-sidebar.tsx` - Sidebar navigation component
- `dashboard-top-bar.tsx` - Top bar with user profile and actions

## Usage

Used in `app/(protected)/dashboard/layout.tsx` to provide consistent dashboard structure across all protected routes.

## Styling

- Uses Tailwind CSS with dashboard-specific tokens
- Responsive sidebar (collapsible on mobile)
- Theme-aware (light/dark mode support)

## Client/Server Notes

- All components are client components (require interactivity)
- Layout structure is server-rendered, interactive elements are client-only
