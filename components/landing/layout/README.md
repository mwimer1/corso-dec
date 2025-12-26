# Landing Page Layout Components

## Purpose

Layout structure and navigation configuration for public landing pages.

## Key Files

- `landing-section.tsx` - Reusable section wrapper for landing page content
- `nav.config.ts` - Navigation configuration for landing page header

## Usage

Used in `app/(marketing)/layout.tsx` and landing page routes to provide consistent public-facing layout structure.

## Styling

- Uses Tailwind CSS with marketing/landing-specific design tokens
- Full-width sections with background variants
- Responsive navigation

## Client/Server Notes

- Components are client components (navigation interactivity)
- Navigation config is server-safe (static data)
