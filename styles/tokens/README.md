---
title: "Tokens"
description: ">-"
last_updated: "2025-12-14"
category: "styling"
status: "draft"
---
# Design Tokens

This directory contains CSS custom properties (design tokens) that define the visual design system values for colors, spacing, typography, shadows, animations, and more.

## Token Files

- **colors.css**: Base color palette, semantic colors (success, warning, danger), and dark mode overrides
- **spacing.css**: Spacing scale tokens (xxs through 16xl, plus special values)
- **typography.css**: Font families, sizes, line heights, font weights, and letter spacing
- **radius.css**: Border radius scale (none, sm, base, md, lg, xl, 2xl, 3xl, full)
- **shadows.css**: Shadow tokens for elevation and depth
- **animation.css**: Duration, delay, and easing function tokens
- **border.css**: Border color tokens
- **auth.css**: Theme-specific overrides for authentication pages
- **marketing.css**: Theme-specific overrides for marketing pages
- **protected.css**: Theme-specific overrides for protected/dashboard pages
- **storybook.css**: Theme-specific overrides for Storybook component previews
- **sidebar.css**: Sidebar-specific design tokens
- **hero.css**: Hero section tokens
- **compat.css**: Compatibility shims and legacy aliases

## Token Naming Conventions

- **Scale tokens**: Use numeric or size suffixes (e.g., `--space-sm`, `--radius-lg`, `--duration-300`)
- **Semantic tokens**: Use descriptive names (e.g., `--primary`, `--foreground`, `--surface`)
- **Component tokens**: Use component prefix (e.g., `--sb-*` for sidebar, `--hero-*` for hero)

## HSL Color Format

All color tokens use HSL values without the `hsl()` wrapper. This allows for opacity manipulation:

```css
:root {
  --primary: 221 86% 54%; /* HSL values only */
}
```

Usage in CSS:
```css
.element {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary) / 0.5); /* With opacity */
}
```

## Dark Mode

Dark mode is implemented using two strategies for maximum compatibility:

1. **Media Query**: `@media (prefers-color-scheme: dark)` - respects OS-level preference
2. **Class-based**: `.dark` class (via NextThemes) - allows manual theme toggle

Both strategies define the same token overrides to ensure consistency regardless of activation method.

## Adding New Tokens

1. Define the token in the appropriate file (or create a new file if needed)
2. Add the token to `tailwind.config.ts` if it should be available as a Tailwind utility
3. Document the token's purpose in a comment
4. Ensure dark mode variants are added if it's a color token

**Example:**
```css
/* colors.css */
:root {
  --new-semantic-color: 200 50% 60%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --new-semantic-color: 200 50% 70%; /* Lighter in dark mode */
  }
}

.dark {
  --new-semantic-color: 200 50% 70%;
}
```

## Route Themes

Some routes use different color schemes via `data-route-theme` attribute:

- `auth`: Authentication pages (uses neutral primary instead of brand blue)
- `marketing`: Marketing/landing pages
- `protected`: Dashboard and protected areas (uses neutral primary)
- `storybook`: Component preview environment

Route themes override base tokens only where necessary. See individual theme files for details.

## Token Usage in Components

Tokens are consumed via Tailwind classes (mapped in `tailwind.config.ts`) or directly in CSS:

```tsx
// Tailwind utility (preferred)
<div className="bg-primary text-primary-foreground p-md rounded-lg" />

// Direct CSS variable
<div style={{ backgroundColor: 'hsl(var(--primary))' }} />
```
