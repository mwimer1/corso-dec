# Dashboard Components

## Purpose

Dashboard domain components for protected user interface: entity grids, layouts, sidebar navigation, and data visualization.

## Key Files

- `entity/` - Entity grid system (projects, addresses, companies)
- `layout/` - Dashboard layout structure
- `sidebar/` - Sidebar navigation components

## Usage

Dashboard components are used in `app/(protected)/dashboard/**` routes to build the authenticated user interface.

## Architecture

- Entity grids use AG Grid with server-side row model
- Layout components provide consistent dashboard structure
- Sidebar integrates with Clerk for authentication state

## Client/Server Notes

- Most dashboard components are client components (interactivity required)
- Data fetching is server-side via API routes
