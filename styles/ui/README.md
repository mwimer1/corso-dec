# Component Variants

> **Tailwind Variants (`tv()`) for component styling** - Type-safe, composable variant systems.

## Overview

Component variants use `tailwind-variants` (`tv()`) to create type-safe, composable styling systems. Variants are organized by atomicity: **atoms** → **molecules** → **organisms**.

## How `tv()` Works

### Basic Example

```ts
// styles/ui/atoms/button-variants.ts
import { tv } from '@/styles/utils';

export const buttonVariants = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-border bg-transparent',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
```

### Usage in Components

```tsx
// components/ui/atoms/button.tsx
import { cn } from '@/styles';
import { buttonVariants } from '@/styles/ui/atoms';

export function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### Slots Pattern (Multi-Element Variants)

For components with multiple styled elements:

```ts
// styles/ui/organisms/contact-form.ts
export const contactFormVariants = tv({
  slots: {
    container: 'space-y-4',
    header: 'space-y-2',
    title: 'text-2xl font-bold',
    description: 'text-muted-foreground',
    fieldsContainer: 'space-y-4',
    fieldGroup: 'space-y-2',
    // ... more slots
  },
  variants: {
    layout: {
      default: {},
      compact: {
        container: 'space-y-2',
        fieldsContainer: 'space-y-2',
      },
    },
  },
});
```

```tsx
// Usage
const variants = contactFormVariants({ layout: 'compact' });

<form className={variants.container()}>
  <div className={variants.header()}>
    <h2 className={variants.title()}>Contact Us</h2>
  </div>
  <div className={variants.fieldsContainer()}>
    {/* fields */}
  </div>
</form>
```

## Adding Variants

### Atom Variants

**Location**: `styles/ui/atoms/`

**When**: Single-element components (button, input, badge, etc.)

**Example**:

```ts
// styles/ui/atoms/badge-variants.ts
import { tv, type VariantProps } from '@/styles/utils';

export const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
```

**Export**: Add to `styles/ui/atoms/index.ts`

### Molecule Variants

**Location**: `styles/ui/molecules/`

**When**: Multi-element components (nav-item, page-header, pricing-card, etc.)

**Example**:

```ts
// styles/ui/molecules/nav-item.ts
import { tv, type VariantProps } from '@/styles/utils';

export const navItemVariants = tv({
  base: 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
  variants: {
    variant: {
      default: 'text-foreground hover:bg-accent',
      active: 'bg-accent text-accent-foreground',
    },
  },
});

export type NavItemVariantProps = VariantProps<typeof navItemVariants>;
```

**Export**: Add to `styles/ui/molecules/index.ts`

### Organism Variants

**Location**: `styles/ui/organisms/`

**When**: Complex, multi-section components (dashboard-shell, faq, contact-form, etc.)

**Example**:

```ts
// styles/ui/organisms/dashboard-shell.ts
import { tv } from '@/styles/utils';

export const dashboardShellVariants = tv({
  base: 'flex-1 overflow-hidden transition-[margin] duration-300',
  variants: {
    sidebar: {
      expanded: 'ml-[var(--sidebar-width-expanded)]',
      collapsed: 'ml-[var(--sidebar-width-collapsed)]',
    },
  },
  defaultVariants: {
    sidebar: 'expanded',
  },
});
```

**Export**: Add to `styles/ui/organisms/index.ts`

## Import Rules

### ✅ Correct: Category Barrels

```tsx
// Import from category barrels
import { buttonVariants } from '@/styles/ui/atoms';
import { navItemVariants } from '@/styles/ui/molecules';
import { dashboardShellVariants } from '@/styles/ui/organisms';
```

### ❌ Incorrect: Main Barrel

```tsx
// ❌ DON'T import component variants from @/styles
import { buttonVariants } from '@/styles'; // Wrong!
```

### ✅ Correct: Global Utilities

```tsx
// ✅ Global utilities come from @/styles
import { cn, latoVariable } from '@/styles';
```

## Using Variants with `cn()`

Always use `cn()` to merge variant classes with additional classes:

```tsx
import { cn } from '@/styles';
import { buttonVariants } from '@/styles/ui/atoms';

export function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        className // Additional classes merge correctly
      )}
      {...props}
    />
  );
}
```

### Conditional Variants

```tsx
const className = cn(
  buttonVariants({ variant, size }),
  isDisabled && 'opacity-50 cursor-not-allowed',
  isFullWidth && 'w-full',
  className
);
```

## Type Safety

### Variant Props Types

```ts
import type { VariantProps } from '@/styles/utils';
import { buttonVariants } from '@/styles/ui/atoms';

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
// Result: { variant?: 'default' | 'outline', size?: 'sm' | 'md' | 'lg' }
```

### Component Props

```tsx
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Additional props
}
```

## Variant Organization

### Directory Structure

```
styles/ui/
  ├── atoms/
  │   ├── button-variants.ts
  │   ├── input.ts
  │   ├── badge.ts
  │   └── index.ts          # Barrel export
  ├── molecules/
  │   ├── nav-item.ts
  │   ├── page-header.ts
  │   └── index.ts          # Barrel export
  ├── organisms/
  │   ├── dashboard-shell.ts
  │   ├── faq.ts
  │   └── index.ts          # Barrel export
  └── shared/
      ├── container-base.ts
      ├── typography-variants.ts
      └── index.ts          # Shared utilities
```

### Barrel Exports

Each category has an `index.ts` that re-exports all variants:

```ts
// styles/ui/atoms/index.ts
export * from './button-variants';
export * from './badge';
export * from './input';
// ... etc
```

## Best Practices

### 1. Use Tokens, Not Hardcoded Values

```ts
// ✅ CORRECT: Use tokens
base: 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]'

// ❌ WRONG: Hardcoded values
base: 'bg-white text-gray-900'
```

### 2. Keep Variants Focused

Each variant file should handle one component's styling logic. Don't mix multiple components in one file.

### 3. Export Types

Always export `VariantProps` types for consumers:

```ts
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
```

### 4. Use Default Variants

Provide sensible defaults:

```ts
defaultVariants: {
  variant: 'default',
  size: 'md',
}
```

### 5. Document Complex Variants

For complex variants with many options, add JSDoc comments:

```ts
/**
 * Dashboard shell variants
 * - sidebar: Controls left margin based on sidebar state
 */
export const dashboardShellVariants = tv({
  // ...
});
```

## Related Documentation

- [Styles Architecture](../README.md) - Overall system architecture
- [Design Tokens](../tokens/README.md) - Token conventions and usage
- [Tailwind Variants Docs](https://www.tailwind-variants.org/) - Official `tv()` documentation
