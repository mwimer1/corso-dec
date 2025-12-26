# Insights Components

Blog and article content components for insights pages.

## Purpose

Provides components for displaying blog articles, insights, and related content with SEO optimization.

## Public Exports

From `components/insights/index.ts`:

- **Layout**: `InsightsSection`, `InsightsNavbar`, navigation config
- **Content**: `InsightDetail`, `InsightsList`, `InsightCard`, `InsightsHero`
- **Filters**: `CategoryFilter`
- **SEO**: `generateArticleMetadata` utility
- **Hooks**: `useArticleAnalytics`
- **Types**: `Category`, `CategoryFilterProps`, `InsightCardProps`

## Usage in App Routes

Insights components are used in:

- **Insights pages**: `InsightsList`, `InsightDetail` in `/insights` routes
- **Article pages**: `InsightDetail` with metadata generation for SEO
- **Navigation**: `InsightsNavbar` for insights-specific navigation

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/**`
- **CSS Modules**: Used for complex article layouts

## Server/Client Notes

- **Server components**: `InsightDetail`, `InsightsList` for SEO and initial render
- **Client components**: `InsightsClient`, `CategoryFilter` for interactivity
- **Metadata generation**: Server-side `generateArticleMetadata` for Next.js metadata API
