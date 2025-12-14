---
title: Styles
description: 'Styling system for styles, using Tailwind CSS and design tokens.'
last_updated: '2025-12-14'
category: styling
status: draft
---
# Styles Directory

This directory contains the global styles and design system for the project, including design tokens (CSS custom properties), Tailwind CSS configuration, and component-level styles.

## Structure

- **tokens/**: Design tokens (CSS variables) for colors, spacing, typography, etc., including theme-specific token overrides.
- **ui/**: Component style variants, organized by atomic design (atoms, molecules, organisms, etc.), built with `tailwind-variants`.
- **globals.css**: Global CSS imports and resets, including Tailwind layers.
- **tailwind.config.ts**: Tailwind configuration extending the token values.
- **utils.ts**: Styling utility functions (e.g., `cn` className merge, `tv` variant creator).

## Design Tokens

Design tokens are CSS variables defined in the `tokens/` directory. They represent our design system values (colors, font sizes, spacing, etc.). Tokens are applied via the `hsl(var(--token))` pattern in Tailwind config for consistency.

**Dark Mode:** Tokens have dark mode variants using the `.dark` class on :root (NextThemes) and a `prefers-color-scheme` media query for redundancy.

**Example:** Using a color token in CSS and Tailwind:

```css
.example {
  color: hsl(var(--foreground));
  background-color: hsl(var(--primary));
}
```

```tsx
<div className="bg-primary text-primary-foreground">Hello</div>
```

## Component Styles and Variants

In `styles/ui/`, each component (or group of components) has a TypeScript file exporting variant classes using `tailwind-variants` (`tv()`).

e.g., `styles/ui/atoms/button-variants.ts` defines `buttonVariants`.

These are imported in components to ensure consistent styling and easily toggle variants (sizes, colors, states).

**Usage Example:**

```tsx
import { buttonVariants } from '@/styles/ui/atoms/button-variants';

<button className={buttonVariants({ size: 'lg', variant: 'primary' })}>
  Click me
</button>
```

## Theming and Route Themes

We support different themes for different app sections (marketing, auth, app, storybook). This is done by adding `data-route-theme` attributes on the `<html>` or root container. Token overrides for these themes are in `tokens/marketing.css`, `auth.css`, etc. This allows, for example, the marketing pages to have a slightly different palette.

**Adding a New Theme:** Create a new CSS file in `tokens/` with `:root[data-route-theme="newtheme"] { --token: value; ... }`.

## Further Reading

- `tokens/README.md` - Detailed design tokens reference.
- `ui/README.md` - Guide to component styling and variant usage.
