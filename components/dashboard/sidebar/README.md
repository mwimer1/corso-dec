# Dashboard Sidebar Components

## Purpose

Modular sidebar navigation system with context-aware tooltips, user profile integration, and collapsible menu items.

## Key Files

- `sidebar-root.tsx` - Root sidebar container with context provider
- `sidebar-item.tsx` - Individual navigation item component
- `sidebar-context.tsx` - React context for sidebar state management
- `sidebar-user-profile.tsx` - User profile section with Clerk integration
- `sidebar-tooltip.tsx` - Tooltip layer for collapsed sidebar state

## Usage

Imported and used by `components/dashboard/layout/dashboard-sidebar.tsx` to build the dashboard navigation.

## Styling

- CSS modules for sidebar-specific styles (`sidebar.module.css`)
- Responsive collapse behavior (mobile/desktop)
- Theme-aware tooltips and hover states

## Client/Server Notes

- All components are client components (require React context and interactivity)
- Integrates with Clerk for authentication state
