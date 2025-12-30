---
title: "Shared"
last_updated: "2025-12-30"
category: "styling"
status: "draft"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/shared/."
---
# Shared

Shared styling utilities and base variants used across multiple components for consistency. These are not standalone UI components but reusable helpers that ensure consistent patterns throughout the design system.

## Overview

The `shared/` directory contains reusable styling utilities and base variant factories that are consumed by atoms, molecules, and organisms. These utilities help maintain consistency across the design system by providing centralized implementations of common patterns.

## Utility Files

- **`container-base.ts`** – Container max-width variant factory with responsive sizing options (xs through 7xl, plus custom dashboard and viewport widths). Used by dashboard shell, full-width sections, and other container components.
- **`container-helpers.ts`** – Extended container variants that combine max-width with padding options. Provides `containerWithPaddingVariants` for sections that need both container sizing and responsive padding.
- **`focus-ring.ts`** – Focus ring utility function that provides consistent focus states for interactive elements. Supports primary, danger, success, and warning color variants.
- **`navbar-sizes.ts`** – Navigation bar size utilities for desktop and mobile layouts. Exports functions like `navDesktopClasses()`, `navMobileItemClasses()`, and `navMobileCtaClasses()` for consistent navbar sizing.
- **`surface-interactive.ts`** – Interactive surface variant for hover and elevation effects. Used in market insights and other interactive content areas.
- **`typography-variants.ts`** – Typography variant factory with responsive heading sizes (hero, h1) using clamp() for fluid typography. Includes alignment variants.
- **`underline-accent.ts`** – Animated underline accent variant with slots for wrapper and line elements. Used in hero sections and headers for decorative underlines.

## Usage

Shared utilities are imported directly in variant definition files:

```tsx
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import { focusRing } from '@/styles/ui/shared/focus-ring';

const myComponentVariants = tv({
  base: [focusRing('primary'), 'w-full'],
  variants: {
    container: {
      default: containerMaxWidthVariants({ maxWidth: 'xl', centered: true }),
    },
  },
});
```

## Patterns

- **Not for direct component use**: These utilities are intended for use within variant definition files, not imported directly in React components
- **Reusable patterns**: Each utility solves a common styling problem that appears across multiple components
- **Consistent APIs**: Shared utilities use the same `tv()` pattern as component variants for familiarity
- **Documentation**: Each utility includes JSDoc comments explaining its purpose and usage
