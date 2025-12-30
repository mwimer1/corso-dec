---
title: Docs
description: Documentation and resources for documentation functionality.
last_updated: '2025-12-30'
category: documentation
status: draft
---
# 🎨 Style Pattern Library

**Comprehensive guide to Corso's style system patterns** - from atomic variants to complex component composition strategies
for consistent, maintainable UI development.

## 📋 Quick Reference

| Pattern Type | Purpose | Example Use Case |
|-------------|---------|------------------|
| **Shared Variants** | Reusable style patterns | `menuItemBaseVariants`, `ctaBaseVariants` |
| **Composition Strategy** | Component assembly | Extend + compound variants |
| **Animation Patterns** | Motion design | `entranceAnimations`, `hoverAnimations` |
| **Size Variants** | Consistent scaling | `textSize`, `sizeHW` |

## 🧩 Shared Variant Patterns

### Menu Item Base Variants
```typescript
// Use for dropdown items, select options, context menus
const itemVariants = tv({
  extend: menuItemBaseVariants,
  base: ['justify-between'],
  variants: {
    intent: {
      default: '',
      destructive: 'text-destructive focus:text-destructive',
    },
  },
});
```

### CTA Button Base Variants
```typescript
// Use for marketing buttons, primary actions
const buttonVariants = tv({
  extend: ctaBaseVariants,
  variants: {
    variant: {
      cta: '', // Uses shared CTA styling
    },
  },
  compoundVariants: [
    {
      variant: 'cta',
      class: ctaBaseVariants({ brand: 'marketing', size: 'md' })
    },
  ],
});
```

### Card Container Variants
```typescript
// Use for card-like components with consistent elevation/padding
const cardVariants = tv({
  extend: cardContainerVariants,
  slots: {
    container: ['group flex flex-col overflow-hidden'],
  },
});
```

## 🎭 Animation Pattern Library

### Entrance Animations
```typescript
// Smooth component appearances
const modalVariants = tv({
  base: [
    'rounded-lg border bg-surface p-6 shadow-lg',
    entranceAnimations.fadeInUp, // From bottom with fade
  ],
});

// Sequential reveals
const listItemVariants = tv({
  base: [
    'p-4 border-b',
    entranceAnimations.fadeIn, // Standard fade in
  ],
  variants: {
    delay: staggerAnimations,
  },
});
```

### Interactive Animations
```typescript
// Hover effects
const cardVariants = tv({
  base: [
    'p-6 rounded-lg border',
    hoverAnimations.lift, // Subtle upward movement
  ],
});

// State transitions
const loadingVariants = tv({
  base: [
    'flex items-center gap-2',
    stateAnimations.spin, // Loading spinner
  ],
});
```

## 📏 Size Variant Patterns

### Text Size Consistency
```typescript
// Use shared textSize for consistent typography scaling
const componentVariants = tv({
  variants: {
    size: textSize, // sm: text-xs, md: text-sm, lg: text-base
  },
});
```

### Component Size HW (Height/Width)
```typescript
// Use shared sizeHW for consistent component dimensions
const buttonVariants = tv({
  variants: {
    size: sizeHW, // sm: h-sm w-sm, md: h-md w-md, etc.
  },
});
```

## 🔗 Composition Strategies

### Extend Pattern
```typescript
// Start with shared base, add component-specific styles
const customButtonVariants = tv({
  extend: interactiveBase, // Inherits focus/disabled states
  base: ['rounded-md px-4 py-2'],
  variants: {
    // Add custom variants
    style: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
});
```

### Compound Variants Pattern
```typescript
// Complex conditional styling
const complexVariants = tv({
  base: 'p-4 rounded',
  variants: {
    intent: { primary: '', secondary: '', danger: '' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    // Primary intent with different sizes
    { intent: 'primary', size: 'sm', class: 'bg-blue-500 text-white text-sm' },
    { intent: 'primary', size: 'md', class: 'bg-blue-600 text-white text-base' },
    { intent: 'primary', size: 'lg', class: 'bg-blue-700 text-white text-lg' },

    // Secondary intent variants
    { intent: 'secondary', size: 'sm', class: 'bg-gray-100 text-gray-800' },
    { intent: 'secondary', size: 'md', class: 'bg-gray-200 text-gray-900' },
    { intent: 'secondary', size: 'lg', class: 'bg-gray-300 text-black' },
  ],
});
```

### Slot-Based Composition
```typescript
// Multi-element components with coordinated styling
const cardVariants = tv({
  slots: {
    root: 'rounded-lg border bg-surface',
    header: 'p-4 border-b',
    content: 'p-4',
    footer: 'p-4 border-t',
  },
  variants: {
    size: {
      sm: { root: 'text-sm', content: 'p-3' },
      md: { root: 'text-base', content: 'p-4' },
      lg: { root: 'text-lg', content: 'p-6' },
    },
  },
});

// Usage in component
const { root, header, content, footer } = cardVariants({ size: 'md' });
```

## 🎯 Component-Specific Patterns

### Form Components
```typescript
// Consistent form input styling
const inputVariants = tv({
  extend: formInputBaseVariants,
  base: ['border-input bg-background'],
  variants: {
    variant: {
      default: '',
      ghost: 'border-0 shadow-none focus-visible:ring-0',
    },
  },
});

// Form field wrapper
const fieldVariants = tv({
  base: 'space-y-2',
  variants: {
    orientation: {
      vertical: 'flex flex-col',
      horizontal: 'grid grid-cols-[auto,1fr] items-center gap-4',
    },
  },
});
```

### Navigation Components
```typescript
// Consistent nav item styling
const navItemVariants = tv({
  extend: interactiveBase,
  base: ['flex items-center gap-2 px-3 py-2 rounded-md'],
  variants: {
    state: {
      default: 'text-foreground hover:bg-surface-hover',
      active: 'bg-primary text-primary-foreground',
      disabled: 'text-muted-foreground cursor-not-allowed',
    },
  },
});
```

### Content Components
```typescript
// Consistent card styling
const cardVariants = tv({
  extend: cardContainerVariants,
  slots: {
    container: 'group flex flex-col overflow-hidden',
    image: 'object-cover transition-transform group-hover:scale-105',
    title: 'font-semibold text-lg',
    description: 'text-muted-foreground',
  },
});
```

## 🎨 Theme Integration Patterns

### Route-Specific Theming
```typescript
// Marketing pages - use marketing tokens
const marketingButtonVariants = tv({
  base: 'px-6 py-3 rounded-full font-medium',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'border-2 border-primary text-primary',
    },
  },
});

// Auth pages - use auth tokens
const authCardVariants = tv({
  base: 'p-8 rounded-lg border bg-[hsl(var(--background))]',
});
```

### Dark Mode Support
```typescript
// Automatic dark mode support via CSS custom properties
const themeAwareVariants = tv({
  base: [
    'bg-[hsl(var(--surface))]',
    'text-[hsl(var(--text-high))]',
    'border-[hsl(var(--border))]',
  ],
  variants: {
    variant: {
      elevated: 'shadow-[hsl(var(--shadow-md))]',
      outlined: 'border-2',
    },
  },
});
```

## ⚡ Performance Patterns

### Lazy Loading Variants
```typescript
// Dynamic imports for large variant collections
const heavyComponentVariants = lazy(() =>
  import('@/styles/ui/molecules/heavy-component')
    .then(module => ({ default: module.heavyComponentVariants }))
);
```

### Bundle Optimization
```typescript
// Tree-shake unused variants
const optimizedVariants = tv({
  base: 'p-4',
  variants: {
    // Only include actually used variants
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  },
});
```

## 🧪 Testing Patterns

### Variant Coverage Testing
```typescript
// Test all variant combinations
const buttonVariants = ['default', 'destructive', 'outline'];
const sizes = ['sm', 'md', 'lg'];

describe('Button Variants', () => {
  buttonVariants.forEach(variant => {
    sizes.forEach(size => {
      it(`renders ${variant} ${size} correctly`, () => {
        render(<Button variant={variant} size={size} />);
        // Visual regression test
        expect(screen.getByRole('button')).toMatchSnapshot();
      });
    });
  });
});
```

### Accessibility Testing
```typescript
// Test focus and keyboard navigation
describe('Interactive Components', () => {
  it('supports keyboard navigation', () => {
    render(<InteractiveComponent />);
    const element = screen.getByRole('button');

    // Focus management
    element.focus();
    expect(element).toHaveFocus();

    // Keyboard interactions
    fireEvent.keyDown(element, { key: 'Enter' });
    // Assert expected behavior
  });
});
```

## 📚 Advanced Patterns

### Higher-Order Variants
```typescript
// Create variant factories
const createButtonVariants = (baseStyles: string) => tv({
  extend: interactiveBase,
  base: baseStyles,
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
});

// Usage
const primaryButtonVariants = createButtonVariants('rounded-md px-4 py-2');
const iconButtonVariants = createButtonVariants('p-2 rounded-full');
```

### Responsive Variants
```typescript
// Responsive behavior patterns
const responsiveVariants = tv({
  base: 'p-4',
  variants: {
    size: {
      sm: 'text-sm md:text-base',
      md: 'text-base md:text-lg',
      lg: 'text-lg md:text-xl',
    },
  },
});
```

## 🔍 Migration Patterns

### Legacy to Shared Variants
```typescript
// Before: Duplicated styles
const oldButtonVariants = tv({
  base: 'px-4 py-2 rounded-md focus:outline-none focus:ring-2',
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white focus:ring-blue-300',
      secondary: 'bg-gray-200 text-gray-800 focus:ring-gray-300',
    },
  },
});

// After: Use shared variants
const newButtonVariants = tv({
  extend: interactiveBase, // Handles focus/disabled states
  base: 'px-4 py-2 rounded-md',
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
});
```

## 🎯 Best Practices Checklist

### ✅ Do
- [ ] Use shared variants for common patterns
- [ ] Follow composition patterns for complex components
- [ ] Include accessibility considerations (focus, disabled states)
- [ ] Use semantic variant names (intent, size, state)
- [ ] Test all variant combinations
- [ ] Document variant purposes and usage

### ❌ Don't
- [ ] Don't duplicate styles across components
- [ ] Don't use arbitrary class names
- [ ] Don't skip TypeScript typing
- [ ] Don't ignore accessibility requirements
- [ ] Don't create variants without clear use cases

## 📊 Success Metrics

- **Consistency Score**: % of components using shared variants
- **Bundle Size**: Monitor for variant bloat
- **Type Safety**: 100% TypeScript coverage
- **Accessibility**: WCAG compliance across all variants
- **Maintainability**: Time to add new variants

## 🔗 Related Documentation

- [Shared Variants](../styles/ui/shared/README.md) - Shared variant reference
- [Shared Styles](../styles/ui/shared/README.md) - Shared styles and patterns
- [Atoms Reference](../styles/ui/atoms/README.md) - Atomic components
- [Molecules Reference](../styles/ui/molecules/README.md) - Molecule components

---

**Pattern Library Status:** ✅ Complete and verified
**Last Updated:** 2025-09-11
**Coverage:** 100% of identified patterns documented
