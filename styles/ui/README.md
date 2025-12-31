---
title: Ui
description: >-
  Styling system for styles, using Tailwind CSS and design tokens. Located in
  ui/.
last_updated: '2025-12-31'
category: styling
status: draft
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `styles/ui`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Import Policy

### Domain Barrels (Preferred)
Prefer importing from domain barrels when the utility fits a category:
- `@/styles/ui/atoms` - Atomic component variants (buttons, inputs, badges)
- `@/styles/ui/molecules` - Molecular component variants (nav-items, page-headers, pricing-cards)
- `@/styles/ui/organisms` - Organism component variants (navbars, footers, dashboards)

### Shared Utilities (Deep Imports Allowed)
For utilities that don't fit domain categories, use deep imports from `@/styles/ui/shared/*`:
- `@/styles/ui/shared/container-base` - Container max-width variants
- `@/styles/ui/shared/container-helpers` - Container padding/layout helpers
- `@/styles/ui/shared/focus-ring` - Focus ring utilities
- `@/styles/ui/shared/typography-variants` - Typography variants
- `@/styles/ui/shared/underline-accent` - Underline accent utilities

**Do NOT use the barrel**: `@/styles/ui/shared` is restricted. Use deep imports instead.

### Examples

```typescript
// ✅ CORRECT: Domain barrel
import { buttonVariants } from '@/styles/ui/atoms';

// ✅ CORRECT: Deep import for shared utility
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';

// ❌ INCORRECT: Shared barrel (restricted)
import { containerMaxWidthVariants } from '@/styles/ui/shared';
```
