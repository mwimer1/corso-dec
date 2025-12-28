# Dashboard Logic

Non-UI dashboard logic and utilities.

## Purpose

Contains server-side and client-safe dashboard logic, separate from UI components.

## Structure

This directory is minimal and primarily contains legacy exports. Most dashboard functionality has been moved to:
- **UI Components**: `components/dashboard/` - Dashboard UI components and layout
- **Entity Services**: `lib/entities/` - Entity management logic

## Guidelines

- **No UI components** - UI components belong in `components/dashboard/`
- **No React hooks** - React hooks belong in `components/dashboard/hooks/` or domain-specific locations
- **Server/client-safe logic only** - Pure functions and utilities

## Related

- **UI Components**: `components/dashboard/` - Dashboard UI components
- **Entity Services**: `lib/entities/` - Entity management services
- **Navigation**: `components/dashboard/layout/dashboard-nav.tsx` - Navigation items and utilities

---

_Last updated: 2025-01-03_
