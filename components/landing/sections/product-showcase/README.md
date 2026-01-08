---
title: "Product Showcase"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in landing/sections/product-showcase/."
---
# Product Showcase Section

Interactive dashboard view switcher with tab navigation and product image showcase.

- Directory: `components/landing/sections/product-showcase`
- Last updated: `2026-01-04`

## Styling Guide

### Tab Button Height

**Important**: Tab buttons use a **doubled height** (2x natural height) for better visual prominence.

- **Desktop**: `60px` (natural height ~30px × 2)
- **Mobile**: `64px` (accommodates larger `text-lg` font size)

**Implementation**: Height is controlled via CSS module (`product-showcase.module.css`) to override variant defaults. The variant file (`tab-switcher.variants.ts`) does NOT set height for the `grid` preset - height is exclusively managed by the CSS module.

**Natural Height Calculation**:
- Desktop: `text-[14px]` (14px) + `leading-5` (20px line-height) + `py-0` = ~30px
- Mobile: `text-lg` (18px) + default line-height (~27px) + `py-0` = ~30px

### Active Tab Background

- **Color**: `bg-muted` (full opacity, no transparency)
- **Purpose**: Provides visible contrast to indicate the active tab
- **Location**: Applied to the wrapper `div` in `tab-switcher.tsx` (line ~186)

**Note**: Do not use opacity modifiers (e.g., `bg-muted/70`) - the full `bg-muted` color is required for proper visibility.

### Vertical Separator Borders

**Inside borders** (between tab buttons):
- **Style**: `border-r border-border/50` (50% opacity)
- **Purpose**: Subtle visual separation between tab buttons
- **Responsive**:
  - Mobile (2 columns): Applied to items 0, 2 (even indices)
  - Desktop (4 columns): Applied to items 0, 1, 2 (all except last)

**Outside dashed rails** (vertical guides):
- **Width**: `w-[1.5px]` (1.5px thick)
- **Opacity**: `0.7` (70% of `--border` color)
- **Pattern**: Dashed repeating gradient (4px transparent, 6px visible)
- **Location**: `product-showcase.tsx` (lines ~326-340)
- **Purpose**: Visual alignment guides connecting tabs to content area

**Important**: Inside separators use 50% opacity for subtlety, while dashed rails use 70% opacity and 1.5px width for better visibility.

### CSS Module Usage

The section uses a CSS module (`product-showcase.module.css`) for component-specific styling that cannot be easily achieved with Tailwind utilities alone. This follows the pattern established in other landing sections (roi, market-insights, hero).

**When to modify**:
- Tab button height changes → Update `product-showcase.module.css`
- Active tab background → Update `tab-switcher.tsx` (wrapper div)
- Separator borders → Update `tab-switcher.tsx` (border classes)
- Dashed rails → Update `product-showcase.tsx` (inline styles)

## Files

- `product-showcase.tsx` - Main component with tab switching logic and dashed rails
- `tab-switcher.tsx` - Tab button component with grid layout
- `tab-switcher.variants.ts` - Tailwind variant definitions (no height for grid preset)
- `product-showcase.module.css` - CSS module for tab button height
- `README.md` - This file

