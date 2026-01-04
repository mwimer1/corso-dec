---
title: "Landing"
last_updated: "2026-01-04"
category: "components"
status: "draft"
description: "UI components for the components system, following atomic design principles. Located in landing/."
---
# Landing Page Components

Components specific to the homepage (`/`) and landing page experience.

## Purpose

Homepage sections like Hero, Product Showcase, ROI Calculator, Use Case Explorer, and Market Insights that are used exclusively on the landing page.

## Sections

### Use Case Explorer

The Use Case Explorer section (`sections/use-cases/`) showcases how Corso serves different industries. It features:

- **Industry-specific tab navigation** - Interactive tabs for Insurance Brokers, Building Materials Suppliers, Contractors & Builders, and Developers & Real Estate
- **Enhanced placeholder designs** - Sophisticated visual placeholders with industry-specific color theming and mock UI elements
- **Smooth transitions** - Fade-in animations and smooth content transitions between industry selections
- **Responsive grid layout** - Adaptive layout that stacks on mobile and uses a 7:5 grid on desktop with sticky preview positioning
- **CSS module-based styling** - Uses `use-case-explorer.module.css` for refined control over complex animations, responsive behavior, and component-scoped theming

The section follows the codebase styling standards, using design tokens throughout and respecting `prefers-reduced-motion` for accessibility.

## Usage

Import from `@/components/landing` in `app/(marketing)/page.tsx` (the homepage route).

## Related

See `components/marketing/` for other marketing page components (Pricing, Contact, Legal sections).

