# Footer System Components

## Purpose

Unified footer system for public pages with CTA sections, main navigation, and legal links. Replaces legacy footer components.

## Key Files

- `footer.tsx` - Main footer component (default export)
- `footer-cta.tsx` - Call-to-action section
- `footer-main.tsx` - Main navigation and links section
- `footer-legal.tsx` - Legal links and copyright section

## Usage

```tsx
import { Footer } from '@/components/ui/organisms';

<Footer />
```

## Architecture

- Modular system: CTA, main, and legal sections are composable
- Single barrel export: `Footer` exported from `components/ui/organisms/index.ts`
- Legacy cleanup: Old `footer.tsx` removed, system components consolidated

## Styling

- Uses Tailwind CSS with marketing design tokens
- Responsive grid layout
- Theme-aware (light/dark mode)

## Client/Server Notes

- All components are client components (interactive links and CTAs)
