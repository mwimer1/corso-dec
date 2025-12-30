---
title: "Molecules"
last_updated: "2025-12-30"
category: "styling"
status: "draft"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/molecules/."
---
# Molecules

Molecule-level styles define compositions of atoms, creating more complex component variants. These represent multi-element components that combine multiple atoms or add structural patterns beyond single elements.

## Overview

Molecules are intermediate-level styling units that compose atoms into reusable component patterns. They often include multiple slots (using `tv()` slots API) or combine multiple variant dimensions to create richer component styles.

## Variant Files

- **`auth-card.ts`** – Authentication card container with elevation and padding variants
- **`empty-state.ts`** – Empty state component with icon, title, and description styling using shared text size scale
- **`loading-states-variants.ts`** – Loading state variants for skeleton screens and spinners, using shared text size scale
- **`nav-item.ts`** – Navigation item with state (default, active, disabled), variant (text, button, icon), and responsive size options
- **`page-header.ts`** – Page header component with title, description, and action area using shared alignment variants
- **`pricing-card.ts`** – Pricing card component with variant and size options
- **`pricing-grid.ts`** – Grid layout for pricing cards with responsive column variants
- **`skeleton-suite-variants.ts`** – Comprehensive skeleton loading variants for various content types
- **`tab-switcher.ts`** – Tab navigation component with variant and size options

## Usage

Molecules are used in composite components that combine multiple elements:

```tsx
import { navItemVariants } from '@/styles/ui/molecules/nav-item';
import type { NavItemVariantProps } from '@/styles/ui/molecules/nav-item';

function NavItem({ state, variant, size, className, ...props }: NavItemVariantProps & { className?: string }) {
  return <a className={navItemVariants({ state, variant, size, className })} {...props} />;
}
```

## Patterns

- **Multi-slot variants**: Some molecules use `slots` in `tv()` to style multiple sub-elements (e.g., card header, content, footer)
- **Shared variant maps**: Molecules often import shared variant maps from `@/styles/shared-variants` (e.g., `textAlignVariants`, `flexJustifyVariants`, `textTri`) for consistent alignment and sizing
- **Responsive patterns**: Molecules frequently include responsive size variants for mobile and desktop layouts
- **State management**: Many molecules include state variants (active, disabled, loading) for interactive components
