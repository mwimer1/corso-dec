---
title: "Tokens"
last_updated: "2026-01-07"
category: "styling"
status: "active"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in tokens/."
---
# Tokens

Styling system for styles, using Tailwind CSS and design tokens. Located in tokens/.

## Overview

The `tokens/` directory contains **design system definitions** - the foundational values, themes, and overrides that define the Corso design system.

**What belongs in `tokens/`**:
- **Design tokens**: Core design system values (colors, spacing, typography, etc.)
- **Domain-specific tokens**: Tokens scoped to specific domains (sidebar)
- **Route theme overrides**: Theme customizations for specific routes (auth, protected, marketing)
- **Component theme overrides**: Theme customizations for third-party components (ag-grid)
- **Global utilities**: Compatibility shims and vendor prefix rules

**What does NOT belong in `tokens/`**:
- ❌ Component-specific tokens (e.g., `--chat-*` tokens defined in `components/chat/chat.module.css` - these belong with the component)
- ❌ Tokens used by only one component (these should be defined in the component's CSS module file)

**What does NOT belong in `tokens/`**:
- ❌ Application entry points (e.g., `globals.css` - these belong at `styles/` root)
- ❌ Tailwind directives (`@tailwind base`, etc. - these belong in `globals.css`)
- ❌ Global resets and base styles (`html`, `body` - these belong in `globals.css`)
- ❌ Application-level utility classes (these belong in `globals.css` or component-specific files)

**Key Principle**: `tokens/` defines **what** the design system is. `globals.css` (at `styles/` root) defines **how** the design system is used and orchestrated.

## File Categories

### Design Tokens
- `colors.css` - Color system tokens
- `spacing.css` - Spacing scale tokens
- `typography.css` - Font and text size tokens
- `shadows.css` - Shadow tokens
- `radius.css` - Border radius tokens
- `border.css` - Border tokens
- `animation.css` - Animation and transition tokens

### Domain-Specific Tokens
- `sidebar.css` - Sidebar component tokens

**Note**: Chat tokens are defined directly in `components/chat/chat.module.css` because they are component-specific (only used by the chat component). Component-specific tokens should be defined in the component's CSS module file rather than in separate token files for better maintainability and consistency.

### Route Theme Overrides
- `auth.css` - Authentication pages theme
- `protected.css` - Protected dashboard pages theme
- `marketing.css` - Marketing/public pages theme

### Component Theme Overrides
- `ag-grid.css` - AG Grid table component theme overrides

### Global Utilities
- `compat.css` - Global compatibility shims and vendor prefix rules

## Usage

**Primary Import Pattern**: Tokens are typically imported via `globals.css`, which imports `tokens/index.css`:

```typescript
// In app/layout.tsx (or other entry points)
import '@/styles/globals.css';  // This imports tokens/index.css internally
```

**Direct Token Imports** (rare, for specific use cases):

```typescript
// Import all tokens (via index.css) - usually not needed, use globals.css instead
import '@/styles/tokens/index.css';

// Import specific component theme overrides (if not using globals.css)
import '@/styles/tokens/ag-grid.css';

// Import specific domain tokens (if not using globals.css)
import '@/styles/tokens/sidebar.css';
```

**Note**: Component-specific tokens (e.g., chat tokens) are colocated with their components and should be imported from the component directory, not from `tokens/`.

**Note**: In most cases, you should import `@/styles/globals.css` rather than importing tokens directly. The `globals.css` file already imports all tokens and sets up Tailwind CSS.

