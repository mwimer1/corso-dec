# Organisms

Complex UI sections and complete features that combine atoms and molecules.

## Purpose

Organisms are complex components that combine atoms and molecules to form distinct sections of an interface with business logic and state management.

## Public Exports

From `components/ui/organisms/index.ts`:

- **Navigation & Layout**: `Navbar`, `Footer`, `PublicLayout`, `FullWidthSection`
- **Data Display**: `ResultPanel`
- **User Interaction**: `FAQ`
- **System & Utilities**: `AppErrorBoundary`, `ErrorFallback`, `SiteFooterShell`

## Usage in App Routes

Organisms are used throughout the application:

- **Public pages**: `PublicLayout`, `Navbar`, `Footer` in marketing routes (`/`, `/pricing`, `/contact`)
- **Dashboard**: `ResultPanel` for search/query results
- **Error handling**: `AppErrorBoundary`, `ErrorFallback` for error states
- **Content sections**: `FullWidthSection` for full-bleed backgrounds, `FAQ` for FAQ sections

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/organisms/**`
- **CSS Modules**: Used for complex sections (navbar, footer)

## Server/Client Notes

- **Client components**: Most organisms are client components (`Navbar`, `Footer`, `PublicLayout`) due to interactivity
- **Server-safe**: `FullWidthSection`, `ResultPanel` can be server components when used without interactivity
- **Error boundaries**: `AppErrorBoundary` is a client component (React error boundaries require client)

## Footer System

The footer is implemented as a unified system (`footer-system/`) with:
- `Footer` - Main footer component with optional CTA
- `FooterCTA` - Call-to-action band
- `FooterMain` - Main navigation and links
- `FooterLegal` - Legal links and copyright

All footer components are exported via the main `Footer` export from the organisms barrel.
