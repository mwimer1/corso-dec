---
title: Styles
description: 'Styling system for styles, using Tailwind CSS and design tokens.'
last_updated: '2025-12-30'
category: styling
status: draft
---
# Styles

The styles directory contains the design system's styling infrastructure, including Tailwind CSS configuration, design tokens, component variants, and CSS pattern utilities.

## Directory Structure

- **`ui/`** – Component variant definitions organized by atomic design (atoms, molecules, organisms, shared)
- **`tokens/`** – Design tokens for colors, spacing, typography, and theme variants
- **`utils.ts`** – Core styling utilities (`cn`, `tv`, `VariantProps`)
- **`shared-variants.ts`** – Reusable variant maps for common patterns
- **`globals.css`** – Global stylesheet imports and base styles

## Related Documentation

- [UI Styles](./ui/README.md) – Component variant system and usage patterns
- [Pattern Utilities (CSS)](./ui/patterns/README.md) – CSS pattern utilities for design effects and layouts
