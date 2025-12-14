# Component Styles

This directory contains component-level style definitions using `tailwind-variants` for type-safe, composable variant systems.

## Structure

Organized by atomic design principles:

- **atoms/**: Basic building blocks (buttons, inputs, badges, etc.)
- **molecules/**: Composed components (form fields, card headers, etc.)
- **organisms/**: Complex components (navbars, sidebars, etc.)
- **patterns/**: Reusable design patterns
- **shared/**: Shared styles and utilities

## Using tailwind-variants

Each component style file exports a variant function created with `tv()`:

```typescript
import { tv } from '@/styles/utils';

export const buttonVariants = tv({
  base: 'px-4 py-2 rounded-md font-medium',
  variants: {
    size: {
      sm: 'text-sm px-2 py-1',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3',
    },
    variant: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
});
```

## Usage in Components

Import and use the variant function in your component:

```tsx
import { buttonVariants } from '@/styles/ui/atoms/button-variants';
import { cn } from '@/styles/utils';

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Button({ size, variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}
```

## Slots Pattern

For complex components with multiple elements, use the `slots` pattern:

```typescript
export const cardVariants = tv({
  slots: {
    root: 'bg-surface rounded-lg border border-border',
    header: 'px-lg pt-lg pb-md',
    body: 'px-lg py-md',
    footer: 'px-lg pt-md pb-lg',
  },
});
```

Usage:
```tsx
const card = cardVariants();
<div className={card.root()}>
  <div className={card.header()}>Header</div>
  <div className={card.body()}>Body</div>
  <div className={card.footer()}>Footer</div>
</div>
```

## Compound Variants

Use `compoundVariants` for styles that depend on multiple variant combinations:

```typescript
export const buttonVariants = tv({
  // ... base and variants ...
  compoundVariants: [
    {
      size: 'sm',
      variant: 'primary',
      class: 'shadow-sm', // Only applies when both conditions are met
    },
  ],
});
```

## Best Practices

1. **Use design tokens**: Reference tokens via Tailwind classes (e.g., `bg-primary`, `text-foreground`) rather than hardcoded values
2. **Keep base styles minimal**: Put common styles in `base`, variant-specific in `variants`
3. **Type safety**: Let TypeScript infer types from your variant definitions
4. **Composability**: Use `cn()` utility to merge with additional classes when needed
5. **Documentation**: Add JSDoc comments for complex variant logic

## Naming Conventions

- File names: `{component}-variants.ts` (e.g., `button-variants.ts`)
- Export names: `{component}Variants` (e.g., `buttonVariants`)
- Variant keys: Use kebab-case for multi-word variants (e.g., `primary-foreground`)

## Adding New Component Styles

1. Create a new file in the appropriate atomic level directory
2. Import `tv` from `@/styles/utils`
3. Define variants using `tv()`
4. Export the variant function
5. Document any non-obvious variant combinations
