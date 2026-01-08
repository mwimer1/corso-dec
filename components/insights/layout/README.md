---
title: "Layout"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in insights/layout/."
---
# Insights Layout Components

Layout components specific to the Insights section.

- Directory: `components/insights/layout`
- Last updated: `2026-01-07`

## Scope

**Note**: Global navigation and layout (`PublicLayout`, navbar, footer) are out of scope for insights-specific components. Those live in `components/ui/organisms/public-layout.tsx` and are shared across all marketing pages.

## Components

### nav.config.ts

Exports `getInsightsNavItems()` which provides navigation items for the Insights section. Used with `PublicLayout` via `navMode="insights"` and `navItems` prop.

The `navMode="insights"` and `navItems` from `nav.config.ts` apply to all insights routes:
- `/insights` - Landing page
- `/insights/[slug]` - Article detail pages
- `/insights/categories/[category]` - Category pages

All insights pages use `PublicLayout` with consistent navigation configuration.

