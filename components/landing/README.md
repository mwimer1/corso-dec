# Landing Components

Landing page sections and widgets for the main marketing page.

## Purpose

Provides hero sections, product showcases, use case explorers, and interactive widgets for the landing page.

## Public Exports

From `components/landing/index.ts`:

- **Hero**: `Hero` - Main landing page hero section
- **Sections**: `LazyMarketInsightsSection`, `ProductShowcase`, `IndustryExplorer`

## Usage in App Routes

Landing components are used in:

- **Landing page**: All components in `/` route
- **Hero section**: `Hero` at the top of the landing page
- **Product showcase**: `ProductShowcase` for feature highlights
- **Use cases**: `IndustryExplorer` for industry-specific use cases
- **Market insights**: `LazyMarketInsightsSection` for data visualization

## Styling

- **Tailwind CSS**: Primary styling approach
- **CSS Modules**: Used for complex sections (`hero.module.css`, `market-insights.module.css`, `roi.module.css`)
- **CVA Variants**: Component variants where applicable
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Server components**: Most landing sections are server-rendered for SEO
- **Client components**: Interactive widgets (ROI calculator, charts) require client-side interactivity
- **Lazy loading**: `LazyMarketInsightsSection` uses dynamic imports for code splitting
