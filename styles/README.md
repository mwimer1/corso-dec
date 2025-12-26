# Styles Architecture

> **Design system styles for the Corso platform** - Token-driven, Tailwind-powered, with component variants via `tailwind-variants`.

## Architecture Overview

The styles system follows a clear data flow:

```
CSS Tokens (styles/tokens/*.css)
    ↓
globals.css (imports tokens)
    ↓
Tailwind Config (maps tokens to utilities)
    ↓
Component Variants (tv() functions)
    ↓
Runtime (components consume via cn())
```

### 1. **Tokens** (`styles/tokens/*.css`)
- Canonical source of truth for all design values
- CSS custom properties (`--token-name: value`)
- Organized by category: colors, spacing, typography, shadows, etc.
- **Dark mode**: Controlled via `.dark` class only (no `@media prefers-color-scheme`)

### 2. **Global Styles** (`styles/globals.css`)
- Imports all token files via `styles/tokens/index.css`
- Applies Tailwind directives (`@tailwind base/components/utilities`)
- Entry point for Next.js layout

### 3. **Tailwind Config** (`tailwind.config.ts`)
- Maps tokens to Tailwind utilities: `var(--token-name, fallback)`
- **Contract**: Fallback values must match token defaults exactly
- Validated via `pnpm check:tokens`

### 4. **Component Variants** (`styles/ui/*/`)
- Created with `tv()` from `tailwind-variants`
- Organized by atomicity: atoms → molecules → organisms
- Exported via category barrels

### 5. **Runtime Usage**
- Components import `cn()` from `@/styles` for class merging
- Variants imported from category barrels: `@/styles/ui/atoms`, `@/styles/ui/molecules`, `@/styles/ui/organisms`

## Consumption in Next.js

### Layout Integration

```tsx
// app/layout.tsx
import { latoVariable } from '@/styles';
import '@/styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={latoVariable}>
      <body>{children}</body>
    </html>
  );
}
```

### Component Usage

```tsx
// components/ui/atoms/button.tsx
import { cn } from '@/styles';
import { buttonVariants } from '@/styles/ui/atoms';

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Build Artifacts

### ⚠️ Important: Do Not Import Build Artifacts

**`styles/build/tailwind.css` is tooling-only** - Do not import this file at runtime.

- **Purpose**: Generated CSS for analysis, size auditing, and tooling
- **Generation**: `pnpm tailwind:build` (or `pnpm tailwind:watch` for development)
- **Runtime**: Next.js uses PostCSS to process `globals.css` directly
- **Why**: Next.js handles Tailwind compilation automatically; the build artifact is redundant

If you need to regenerate the build artifact:
```bash
pnpm tailwind:build
```

## Adding New Tokens vs Variants

### When to Add a Token

Add a token (`styles/tokens/*.css`) when:
- The value is a **design primitive** (color, spacing, typography, etc.)
- The value should be **themeable** (dark mode, route themes)
- The value is used **across multiple components**

**Example**: Adding a new spacing scale
```css
/* styles/tokens/spacing.css */
:root {
  --space-10xl: 10rem;
}
```

Then map it in `tailwind.config.ts`:
```ts
spacing: {
  '10xl': 'var(--space-10xl, 10rem)',
}
```

### When to Add a Variant

Add a variant (`styles/ui/*/`) when:
- You need **component-specific styling logic**
- You need **conditional classes** based on props
- The styling is **not a design primitive**

**Example**: Adding a button variant
```ts
// styles/ui/atoms/button-variants.ts
export const buttonVariants = tv({
  base: '...',
  variants: {
    intent: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
  },
});
```

## Validation & Guardrails

### Token Contract Validation

```bash
pnpm check:tokens
```

Validates:
- All tokens referenced in `tailwind.config.ts` are defined in CSS
- Fallback values match token defaults exactly
- No undefined tokens referenced

### Route Theme Policy Validation

```bash
pnpm check:route-themes
```

Validates:
- Route theme files only override allowed tokens (colors/semantic)
- No structural tokens (spacing, typography, radius) are overridden

### Combined Check

```bash
pnpm check:styles
```

Runs both validation scripts.

## Import Policy

### ✅ Allowed Imports from `@/styles`

- **Global utilities only**:
  - `cn` - Class name merging utility
  - `latoVariable` - Font CSS variable
  - `tv` - Tailwind variants factory (re-exported from utils)

### ❌ Forbidden Imports from `@/styles`

- **Component variants** - Import from category barrels instead:
  - `@/styles/ui/atoms` - Atom-level variants (button, input, badge, etc.)
  - `@/styles/ui/molecules` - Molecule-level variants (nav-item, page-header, etc.)
  - `@/styles/ui/organisms` - Organism-level variants (dashboard-shell, faq, etc.)

**Why**: Keeps the main barrel focused on global utilities, prevents circular dependencies, and makes component dependencies explicit.

## Related Documentation

- [Token System](./tokens/README.md) - Token conventions and adding tokens
- [Component Variants](./ui/README.md) - Creating and using `tv()` variants
- [Audit Notes](./README.audit-notes.md) - Historical decisions and findings
