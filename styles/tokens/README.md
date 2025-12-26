# Design Tokens

> **Canonical source of truth** for all design values in the Corso platform.

## Token Philosophy

**Tokens are canonical** - All design values originate here. Tailwind config, component variants, and runtime styles reference tokens; they never define their own values.

## Token Categories

### Core Categories

- **`colors.css`** - Color system (primary, secondary, semantic, text hierarchy)
- **`spacing.css`** - Spacing scale (`--space-*`)
- **`typography.css`** - Font families, sizes, line heights, weights
- **`radius.css`** - Border radius scale (`--radius-*`)
- **`shadows.css`** - Box shadow definitions (`--shadow-*`)
- **`border.css`** - Border colors and variants
- **`animation.css`** - Duration, delay, and easing tokens

### Route Theme Categories

- **`auth.css`** - Authentication page theme
- **`marketing.css`** - Marketing page theme
- **`protected.css`** - Dashboard/protected area theme
- **`storybook.css`** - Storybook component preview theme

### Special Purpose

- **`compat.css`** - Compatibility shims and legacy aliases
- **`sidebar.css`** - Sidebar-specific tokens
- **`hero.css`** - Hero section tokens

## Token Naming Conventions

### Pattern: `--category-name[-modifier]`

- **Category**: What type of value (color, space, text, etc.)
- **Name**: Semantic name (primary, sm, high, etc.)
- **Modifier**: Optional variant (foreground, hover, selected, etc.)

### Examples

```css
/* Colors */
--primary: 221 86% 54%;
--primary-foreground: 0 0% 98%;
--text-high: 222.2 47.4% 11.2%;

/* Spacing */
--space-xs: 0.25rem;
--space-md: 1rem;
--space-2xl: 2.5rem;

/* Typography */
--text-sm: 0.875rem;
--font-sans: lato, system-ui, ...;

/* Shadows */
--shadow-sm: 0 1px 3px 0 rgba(0,0,0,.1), ...;
--shadow-card: 0 8px 24px hsl(var(--foreground) / 0.06);
```

## Adding a New Token

### Step 1: Define the Token

Add the token to the appropriate category file:

```css
/* styles/tokens/spacing.css */
:root {
  --space-10xl: 10rem;
}
```

### Step 2: Map to Tailwind Config

Add the token to `tailwind.config.ts` with a matching fallback:

```ts
// tailwind.config.ts
spacing: {
  '10xl': 'var(--space-10xl, 10rem)', // Fallback must match token default
}
```

### Step 3: Validate

Run the token contract check:

```bash
pnpm check:tokens
```

This ensures:
- Token is defined in CSS
- Fallback matches token default exactly
- No undefined tokens referenced

## Mapping Tokens to Tailwind

### Pattern

```ts
// tailwind.config.ts
extend: {
  [category]: {
    [utilityName]: 'var(--token-name, fallback-value)',
  },
}
```

### Examples

```ts
// Color token
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary, 221 86% 54%))',
    foreground: 'hsl(var(--primary-foreground, 0 0% 98%))',
  },
}

// Spacing token
spacing: {
  'md': 'var(--space-md, 1rem)',
}

// Shadow token
boxShadow: {
  'sm': 'var(--shadow-sm, 0 1px 3px 0 rgba(0,0,0,.1), ...)',
}
```

### Critical Rule: Fallback Matching

**The fallback value must match the token default exactly.**

```css
/* Token definition */
--space-md: 1rem;
```

```ts
// ✅ CORRECT: Fallback matches
spacing: {
  'md': 'var(--space-md, 1rem)',
}

// ❌ WRONG: Fallback mismatch
spacing: {
  'md': 'var(--space-md, 1.5rem)', // Different value!
}
```

## Dark Mode

### Class-Only Mechanism

**Dark mode is controlled via `.dark` class only** - Do not add `@media (prefers-color-scheme: dark)` blocks.

The `.dark` class is applied by NextThemes (or equivalent) based on user preference.

### Dark Mode Token Overrides

```css
/* styles/tokens/colors.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
}

/* Dark mode via .dark class */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

### Route Theme Dark Mode

Route themes can override dark mode values:

```css
/* styles/tokens/auth.css */
.dark[data-route-theme="auth"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

## Route Theme Policy

### Allowed Overrides

Route themes (`auth.css`, `marketing.css`, etc.) can only override:
- **Color tokens**: `--primary`, `--secondary`, `--background`, `--foreground`, `--surface`
- **Semantic colors**: `--success`, `--warning`, `--danger`, `--info`, `--muted`
- **Surface variants**: `--surface-contrast`, `--surface-hover`, `--surface-selected`
- **Text hierarchy colors**: `--text-high`, `--text-medium`, `--text-low`
- **Borders**: `--border`, `--border-subtle`, `--input`, `--ring`

### Forbidden Overrides

Route themes **cannot** override:
- **Spacing tokens**: `--space-*`
- **Typography tokens**: `--text-*` (sizes), `--font-*`
- **Radius tokens**: `--radius-*`
- **Shadow tokens**: `--shadow-*`
- **Animation tokens**: `--duration-*`, `--delay-*`, `--easing-*`

**Rationale**: Structural tokens must remain consistent across themes to preserve layout and interaction patterns.

### Validation

```bash
pnpm check:route-themes
```

Validates that route theme files only override allowed tokens.

## Reduced Motion Support

Animation tokens automatically respect `prefers-reduced-motion`:

```css
/* styles/tokens/animation.css */
:root {
  --duration-300: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-300: 0ms; /* Disabled for accessibility */
  }
}
```

Components using animation tokens automatically respect user preferences.

## Token Organization

### File Structure

```
styles/tokens/
  ├── colors.css          # Color system
  ├── spacing.css         # Spacing scale
  ├── typography.css      # Font system
  ├── radius.css          # Border radius
  ├── shadows.css         # Box shadows
  ├── border.css          # Border colors
  ├── animation.css       # Duration/delay/easing
  ├── auth.css            # Auth route theme
  ├── marketing.css       # Marketing route theme
  ├── protected.css       # Protected route theme
  ├── storybook.css       # Storybook theme
  ├── compat.css          # Compatibility shims
  ├── sidebar.css         # Sidebar tokens
  ├── hero.css            # Hero section tokens
  └── index.css           # Imports all token files
```

### Import Order

Tokens are imported via `index.css` in a specific order:
1. Core categories (colors, spacing, typography, etc.)
2. Route themes (auth, marketing, protected, storybook)
3. Special purpose (compat, sidebar, hero)

This ensures proper cascade and override behavior.

## Related Documentation

- [Styles Architecture](../README.md) - Overall system architecture
- [Component Variants](../ui/README.md) - Using tokens in component variants
- [Audit Notes](../README.audit-notes.md) - Historical decisions
