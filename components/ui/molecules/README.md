# Molecules

Composite components that combine atoms to create more complex UI elements.

## Purpose

Molecules are groups of atoms bonded together to form more complex components. They represent relatively simple UI patterns that can be reused across the application.

## Public Exports

From `components/ui/molecules/index.ts`:

- **Layout**: `PageHeader`
- **Navigation**: `NavItem`, `LinkTrack` (analytics)
- **Forms**: `Select`, `TextArea`
- **Data Display**: `MetricCard`, `PricingCard`
- **Loading**: `LoadingStates`, `SkeletonSuite`, `SkeletonTable`
- **Tabs**: `TabSwitcher`
- **Progress**: `ReadingProgress`
- **Auth**: `AuthCard`

## Usage in App Routes

Molecules are used in various routes:

- **Dashboard**: `PageHeader` in entity pages, `SkeletonTable` for loading states
- **Marketing**: `PricingCard` in pricing page, `NavItem` in navigation
- **Landing**: `MetricCard` for metrics display, `ReadingProgress` for articles
- **Auth**: `AuthCard` wrapper for auth forms

## Styling

- **Tailwind CSS**: Primary styling
- **CVA Variants**: Component variants in `styles/ui/molecules/**`
- **CSS Modules**: Used sparingly for complex molecules

## Server/Client Notes

Mix of server and client components:
- **Client**: `TabSwitcher`, `NavItem` (interactive)
- **Server-safe**: `PageHeader`, `MetricCard` (presentational)

## Internal-Only

No internal-only modules in molecules (all exports are public).
