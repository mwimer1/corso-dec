# Navbar Component

## Purpose

Main navigation bar for public pages (landing, marketing) with responsive menu, authentication state, and theme switching.

## Key Files

- `navbar.tsx` - Main navbar component (public export)
- `index.ts` - Internal navbar helpers and utilities

## Usage

```tsx
import { Navbar } from '@/components/ui/organisms';

<Navbar />
```

## Features

- Responsive mobile menu
- Authentication state integration (Clerk)
- Theme switching (light/dark mode)
- Active route highlighting

## Styling

- Uses Tailwind CSS with marketing design tokens
- Responsive breakpoints for mobile/desktop
- Theme-aware styling

## Client/Server Notes

- Navbar is a client component (requires interactivity and authentication state)
- Internal helpers remain in `navbar/index.ts` to avoid self-import cycles
