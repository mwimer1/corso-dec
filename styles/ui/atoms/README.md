---
title: "Atoms"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/atoms/."
last_updated: "2025-12-30"
category: "styling"
status: "draft"
---
# Atoms

Atom-level styles define the simplest, single-element variant styles in the design system. These correspond 1:1 with fundamental UI components and provide the building blocks for more complex compositions.

## Overview

Atoms are the smallest, indivisible styling units. Each atom variant file defines styles for a single UI element type (e.g., Button, Input, Badge) using `tailwind-variants` (`tv`). These variants are consumed by React components in `components/ui/atoms/` to provide consistent, type-safe styling.

## Variant Files

- **`badge.ts`** – Small pill-shaped badges with color variants (default, success, info, primary, secondary, warning, error)
- **`button-variants.ts`** – Button component with variant (default, destructive, outline, secondary, ghost, link, cta) and size options
- **`card.ts`** – Card container with slots (root, header, title, description, content, footer) and elevation variants
- **`checkbox.ts`** – Checkbox input styling with state variants
- **`icon.ts`** – Icon component size and color variants
- **`input.ts`** – Text input field variants with size and state options
- **`label.ts`** – Form label styling with size variants using shared text size scale
- **`link-variants.ts`** – Link component styling variants
- **`progress.ts`** – Progress bar component with size and color variants
- **`select.ts`** – Select dropdown styling variants
- **`skeleton.ts`** – Loading skeleton placeholder variants
- **`skip-nav-link.ts`** – Skip navigation link for accessibility
- **`slider.ts`** – Range slider component variants
- **`spinner-variants.ts`** – Loading spinner with size variants using shared `sizeHW` map
- **`text-area.ts`** – Multi-line text input variants
- **`toggle.ts`** – Toggle switch component variants

## Usage

Atoms are imported and used in component implementations:

```tsx
import { badgeVariants } from '@/styles/ui/atoms/badge';
import type { BadgeVariantProps } from '@/styles/ui/atoms/badge';

function Badge({ color, className, ...props }: BadgeVariantProps & { className?: string }) {
  return <span className={badgeVariants({ color, className })} {...props} />;
}
```

## Patterns

- **Single-element focus**: Each atom defines styles for one UI element type
- **Variant-based styling**: Uses `tv()` with variant objects for different visual states
- **Type safety**: Exports `VariantProps<typeof variantName>` for TypeScript support
- **Shared utilities**: Some atoms use shared variant maps from `@/styles/shared-variants` (e.g., `textTri`, `sizeHW`) for consistency
