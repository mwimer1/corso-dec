---
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/patterns/."
last_updated: "2025-12-30"
category: "styling"
status: "draft"
title: "Patterns"
---
# CSS Pattern Utilities

CSS pattern utilities are global CSS classes that provide design effects or layouts not tied to a single component. These patterns are reusable across the application and handle visual effects, animations, or layout behaviors that require custom CSS beyond Tailwind utilities.

## Overview

Pattern CSS files in this directory provide low-level styling utilities that:
- Are not component-specific but can be used by multiple components
- Require custom CSS that doesn't fit into Tailwind plugins or component variants
- Provide design effects or layout behaviors that need to be shared globally

These CSS files are imported in `@layer components` via `styles/ui/shared/patterns.css`, which is then imported in `styles/globals.css`.

## Current Patterns

### Animated Pill

The animated pill pattern is used for highlighting dynamic text by animating its width to match the text content. It's commonly used in hero sections to create a pill-shaped element that dynamically sizes to match the width of a heading's first line.

**Purpose**: Creates a responsive pill element that measures and matches the width of a target element (typically the first line of an H1 heading) to create a visually aligned highlight effect.

**CSS Classes**:

- **`.animated-pill`** – Main class that sets the pill's max-width based on a CSS variable (`--pill-target-width`) with an optional overscan to prevent jitter. The class:
  - Uses `max-width: calc(var(--pill-target-width, 48ch) + var(--pill-overscan))` to constrain width
  - Sets `width: max-content` to allow natural content sizing
  - Includes `--pill-overscan` CSS variable (defaults to 2px) to counteract sub-pixel kerning differences
  - Applies font rendering optimizations (`font-kerning: normal`, `text-rendering: optimizelegibility`)
  - Sets border-radius via CSS variable (`--radius-md`)
  - Respects `prefers-reduced-motion` by disabling animations and transitions

- **`.width-clamp`** – Utility class for centering and constraining the pill element. It:
  - Centers the element using `margin-left: auto` and `margin-right: auto`
  - Sets `display: inline-block` to enable proper width constraints

**Usage**: The actual width measurement and animation are JavaScript-driven. The CSS handles sizing, responsiveness, and accessibility. See `components/landing/widgets/animated-pill` for a complete implementation example.

**Component Integration**: The `AnimatedPill` React component uses both classes together:
```tsx
<span className="animated-pill width-clamp ...">
  {/* content */}
</span>
```

The component measures the target element's width and sets the `--pill-target-width` CSS variable, which the CSS then uses to constrain the pill's maximum width.

## Adding New Pattern CSS

If a design pattern or utility doesn't fit into a component variant or Tailwind plugin and needs custom CSS, consider adding it here. Guidelines:

- **Keep patterns minimal and generic** – Patterns should be reusable across multiple components, not tied to a specific component's implementation
- **Use CSS layers** – All pattern CSS should be wrapped in `@layer components` to ensure proper cascade order
- **Respect accessibility** – Include `prefers-reduced-motion` media queries where animations are involved
- **Document CSS variables** – If your pattern uses CSS variables, document them clearly in comments
- **Import via shared/patterns.css** – Add your pattern file to `styles/ui/shared/patterns.css` so it's included in the global stylesheet

**Example structure**:
```css
@layer components {
  /**
   * Pattern description
   * Documents CSS variables and usage
   */
  .my-pattern {
    /* pattern styles */
  }
  
  @media (prefers-reduced-motion: reduce) {
    .my-pattern {
      /* reduced motion overrides */
    }
  }
}
```

## Related Files

- **Import entry point**: `styles/ui/shared/patterns.css` – Imports all pattern CSS files
- **Global import**: `styles/globals.css` – Includes patterns via the shared file
- **Component example**: `components/landing/widgets/animated-pill/animated-pill.tsx` – Shows how to use the animated pill pattern

## Note on Terminology

This directory contains **CSS Pattern Utilities** (low-level CSS classes), which is distinct from the **Patterns** component category in `components/ui/patterns/` (React components like SectionHeader). To avoid confusion, this README specifically documents CSS-level patterns.
