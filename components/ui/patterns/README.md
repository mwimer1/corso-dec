# Patterns

Reusable design patterns and layout components.

## Purpose

Patterns are reusable design system components that provide consistent layout and structure patterns across the application.

## Public Exports

From `components/ui/patterns/index.ts`:

- **Section Patterns**: `SectionHeader`, `SectionShell`

## Usage in App Routes

Patterns are used throughout the application:

- **Landing pages**: `SectionHeader` for section titles in `/` route
- **Marketing pages**: `SectionHeader` for consistent heading styles
- **Dashboard**: `SectionShell` for page sections with guidelines
- **Content sections**: `SectionShell` for full-width sections with centered content

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/patterns/**`
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Server-safe**: Both `SectionHeader` and `SectionShell` are server-safe components
- **Presentational**: Patterns are primarily presentational and don't require client-side interactivity

## SectionHeader

Provides consistent section heading styles with:
- Configurable heading levels (h1-h6)
- Alignment options (left, center, right)
- Size variants (marketingHero, default, etc.)
- Optional subtitle support

## SectionShell

Provides full-width section containers with:
- Tone variants (surface, muted, brand, background)
- Optional guidelines overlay
- Optional center line overlay
- Centered content container with responsive padding
