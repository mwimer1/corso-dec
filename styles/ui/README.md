---
title: Ui
description: >-
  Styling system for styles, using Tailwind CSS and design tokens. Located in
  ui/.
last_updated: '2025-12-30'
category: styling
status: draft
---
# UI Styles

The UI styles directory contains the design system's component variant definitions, organized by atomic design principles: atoms, molecules, organisms, and shared utilities.

## Directory Structure

- **`atoms/`** – Single-element variant styles (Button, Input, Badge, etc.)
- **`molecules/`** – Composite component variants (NavItem, Card, TabSwitcher, etc.)
- **`organisms/`** – High-level component variants (DashboardShell, ContactForm, Navbar, etc.)
- **`shared/`** – Reusable styling utilities and base variants

## Using Variants with `cn()`

Component variants are designed to work seamlessly with the `cn()` utility for conditional and composed styling:

```tsx
import { badgeVariants } from '@/styles/ui/atoms/badge';
import { cn } from '@/styles';

function Badge({ color, className, ...props }) {
  return (
    <span 
      className={cn(badgeVariants({ color }), className)} 
      {...props} 
    />
  );
}
```

## Shared Variant Maps

Some variant options are reused across multiple components and are defined centrally in `styles/shared-variants.ts` to ensure consistency. These maps provide standard Tailwind class sets for common patterns.

### Available Maps

- **`roundedVariants`** – Common border radius classes (none, sm, md, lg) to apply consistent rounding across components like file uploads and cards.
- **`textAlignVariants`** – Text alignment utilities (left, center, right) for headers, sections, and content blocks.
- **`flexJustifyVariants`** – Flex justify-content utilities (start, center, end) for flex container alignment, commonly used in page headers and legends.
- **`textTri`** (text size triad) – Shared text size scale (sm→text-xs, md→text-sm, lg→text-base) used for consistent typography sizing across labels, empty states, and FAQ components.
- **`sizeHW`** – Height and width size variants (sm/md/lg) mapping to custom token classes, used by interactive components like spinners for consistent sizing.

### Usage Pattern

Developers should use these shared maps when multiple components need the same set of classes for a variant. Import them directly from `@/styles/shared-variants` within variant definition files:

```tsx
import { textTri, roundedVariants } from '@/styles/shared-variants';
import { tv } from '@/styles';

const myComponentVariants = tv({
  variants: {
    size: textTri,
    rounded: roundedVariants,
  },
});
```

**Note**: Components should not import these maps directly. They should use them via component variants that consume these maps in their variant definitions. For example, the Spinner component uses `sizeHW` to consistently apply height/width for its size variants.

## Import Standards

All variant files import `tv` and `VariantProps` from the main `@/styles` barrel:

```tsx
import { tv, type VariantProps } from '@/styles';
```

This ensures consistency and makes it easy to locate style utilities.

## Related Documentation

- [Atoms README](./atoms/README.md) – Single-element variant styles
- [Molecules README](./molecules/README.md) – Composite component variants
- [Organisms README](./organisms/README.md) – High-level component variants
- [Shared README](./shared/README.md) – Reusable styling utilities
