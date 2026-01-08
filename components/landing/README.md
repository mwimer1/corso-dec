---
description: "Homepage-specific components used exclusively on the landing page."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Landing Page Components

Components specific to the homepage (`/`) and landing page experience.

## Purpose

Homepage sections like Hero, Product Showcase, ROI Calculator, Use Case Explorer, and Market Insights that are used exclusively on the landing page.

## Sections

### Use Case Explorer

The Use Case Explorer section (`sections/use-cases/`) showcases how Corso serves different industries with a streamlined card grid layout. It features:

- **Card grid layout** - Interactive use case cards displayed in a responsive grid (1 column mobile, 2 columns tablet/desktop) with clean selected states and hover elevation
- **Sticky preview pane** - Desktop preview pane with segmented control tabs (Dashboard / Sample record / Outputs) that sticks to the viewport with proper nav offset
- **Mobile accordion** - Preview pane collapses into a `<details>` accordion on mobile for better space utilization
- **Problem and help sections** - Muted surface cards showing "The problem" and "How Corso helps" for the selected use case
- **Odd count spanning** - Last card automatically spans full width on medium+ screens when there's an odd number of cards
- **Tag display** - Shows up to 2 tags per card with a "+N" badge for additional tags
- **Segmented control tabs** - Three preview tabs (Dashboard, Sample record, Outputs) with animated transitions
- **Enhanced placeholder designs** - Sophisticated visual placeholders with industry-specific color theming and mock UI elements
- **CSS module-based styling** - Uses `use-case-explorer.module.css` for refined control over complex animations, responsive behavior, and component-scoped theming

**Component Architecture:**
- `use-case-explorer.tsx` - Main client component with header and CTAs
- `industry-selector-panel.tsx` - Card grid layout with left pane (cards + problem/help) and right pane (preview)
- `use-case-card.tsx` - Individual use case card component
- `use-case-preview-pane.tsx` - Sticky preview pane with segmented control
- `industry-preview.tsx` - Preview image/placeholder component

The section follows the codebase styling standards, using design tokens throughout and respecting `prefers-reduced-motion` for accessibility. It's integrated on both the homepage (`/`) and the insights index page (`/insights`).

## Usage

Import from `@/components/landing` in `app/(marketing)/page.tsx` (the homepage route).

## Related Documentation

- [Components Overview](../README.md) - Component directory overview
- [Marketing Components](../marketing/README.md) - Marketing page components
- **Marketing Routes**: `app/(marketing)/README.md` - Marketing route documentation

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

