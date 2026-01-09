---
title: "Layout"
last_updated: "2026-01-27"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in insights/layout/."
---
# Insights Layout Components

Layout components specific to the Insights section.

- Directory: `components/insights/layout`
- Last updated: `2026-01-27`

## Scope

**Note**: Global navigation and layout (`PublicLayout`, navbar, footer) are out of scope for insights-specific components. Those live in `components/ui/organisms/public-layout.tsx` and are shared across all marketing pages.

**Do not modify**: Global navigation, footer, or `PublicLayout` structure. These are shared across all marketing pages and changes would affect the entire site.

## Components

### nav.config.ts

Exports `getInsightsNavItems()` which provides navigation items for the Insights section. Used with `PublicLayout` via `navMode="insights"` and `navItems` prop.

The `navMode="insights"` and `navItems` from `nav.config.ts` apply to all insights routes:
- `/insights` - Landing page
- `/insights/[slug]` - Article detail pages
- `/insights/categories/[category]` - Category pages

All insights pages use `PublicLayout` with consistent navigation configuration.

## FullWidthSection Usage

The Insights landing page (`/insights`) uses `FullWidthSection` for consistent section spacing:

- **Hero Section**: `padding="hero"`, `containerMaxWidth="7xl"`, `containerPadding="lg"`
- **Controls Section**: `padding="md"`, `containerMaxWidth="7xl"`, `containerPadding="lg"`

**Important**: Never use manual container wrappers like `<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">`. Always use `FullWidthSection` for consistent spacing and alignment with the design system.

This ensures:
- Consistent vertical rhythm across sections
- Proper responsive padding that matches navbar/footer
- Alignment with other marketing pages (landing page, etc.)

