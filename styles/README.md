---
title: "Styles"
last_updated: "2026-01-07"
category: "styling"
status: "active"
description: "Styling system for styles, using Tailwind CSS and design tokens."
---
# Styles

The styles directory contains styling utilities and design tokens for the Corso platform.

Styling system for styles, using Tailwind CSS and design tokens.

## Directory Structure

```
styles/
breakpoints.ts
fonts.ts
globals.css          # Application CSS entry point (orchestrates tokens + Tailwind)
index.ts
shared-variants.ts
tailwind.config.ts
tokens/              # Design system definitions (tokens, themes, overrides)
ui/
  ui/atoms/
  ui/molecules/
  ui/organisms/
  ui/shared/
utils.ts
```

## Key Files

### `globals.css` - Application Entry Point

**Purpose**: Main CSS entry point that orchestrates the entire styling system.

**Responsibilities**:
- Imports all design tokens from `tokens/index.css`
- Initializes Tailwind CSS (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- Defines global resets and base styles (`html`, `body`)
- Provides component layer overrides (number inputs, buttons, Clerk components)
- Defines utility classes (scrollbar-hide, animations, focus styles)
- Contains animation keyframes used across the application

**Import Location**: Imported directly in `app/layout.tsx` as the application's CSS entry point.

**Why it's at the root level**: 
- It's the **orchestrator** that imports and uses tokens, not a token itself
- It contains build-time Tailwind directives that must be processed by the build system
- It serves as the application entry point, similar to how `app/layout.tsx` is the React entry point

**Relationship to `tokens/`**:
- `globals.css` **depends on** `tokens/` (imports `./tokens/index.css`)
- `tokens/` contains **design system definitions** (values, themes, overrides)
- This creates a clear dependency direction: entry point → design system

### `tokens/` - Design System Definitions

**Purpose**: Contains all design system values, theme overrides, and component-specific styling.

**Contents**:
- Design tokens (colors, spacing, typography, shadows, radius, border, animation)
- Domain-specific tokens (chat, sidebar)
- Route theme overrides (auth, protected, marketing)
- Component theme overrides (ag-grid)
- Global utilities (compat.css for vendor prefixes)

**See**: [`tokens/README.md`](./tokens/README.md) for detailed documentation.

## Architecture Principles

1. **Separation of Concerns**:
   - `tokens/` = Design system **definitions** (what the system is)
   - `globals.css` = Application **orchestration** (how the system is used)

2. **Dependency Direction**:
   - `globals.css` imports from `tokens/` (correct)
   - `tokens/` should never import from `globals.css` (would create circular dependency)

3. **Build System Integration**:
   - `globals.css` contains Tailwind directives processed at build time
   - `tokens/` contains CSS custom properties used at runtime

