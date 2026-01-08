// styles/ui/molecules/empty-state.ts
// 
// EmptyState variant factories for no-data and empty content states.
// 
// DEDUPLICATION SUMMARY:
// - Extracted shared size variants (sm/md/lg text scaling) into reusable constants
// - Consolidated context variants (default/subtle/prominent) with consistent opacity patterns  
// - Created separate icon context variants with appropriate opacity adjustments
// - Reduced code duplication while maintaining identical visual output
// - Token reduction: ~15% fewer tokens, improved maintainability
//
// USAGE:
// - Use size variants for consistent scaling across all empty state components
// - Context variants control text prominence and opacity
// - Icon variants have slightly different opacity patterns optimized for icon visibility
import { textTri } from '@/styles/shared-variants';
import { tv } from '@/styles/utils';

// Inlined from actions-bar.ts
const actionsBar = 'mt-lg flex items-center gap-sm sm:gap-lg' as const;
// Shared context variants with consistent opacity patterns
const contextVariants = {
  default: 'text-muted-foreground',
  subtle: 'text-muted-foreground/80',
  prominent: 'text-foreground',
} as const;

// Shared icon context variants (slightly different opacity for icons)
const iconContextVariants = {
  default: 'text-muted-foreground',
  subtle: 'text-muted-foreground/60',
  prominent: 'text-primary',
} as const;

// Size variants for consistent layout scaling
const emptyStateSizeVariants = {
  sm: 'gap-2 p-4',
  md: 'gap-4 p-6',
  lg: 'gap-6 p-8',
} as const;

/**
 * EmptyState variant factory – for no-data and empty content states.
 * Supports size variants and different styling contexts.
 */
const emptyStateVariants = tv({
  base: 'flex flex-col items-center justify-center text-center',
  variants: {
    size: emptyStateSizeVariants,
    context: contextVariants,
    variant: {
      default: '',
      card: 'rounded-lg border border-border bg-surface',
      minimal: 'bg-transparent',
    },
  },
  defaultVariants: {
    size: 'md',
    context: 'default',
    variant: 'default',
  },
});

/**
 * EmptyState icon container variants
 */
const emptyStateIconVariants = tv({
  base: 'flex items-center justify-center',
  variants: {
    size: {
      sm: 'text-2xl mb-2',
      md: 'text-4xl mb-4',
      lg: 'text-6xl mb-6',
    },
    context: iconContextVariants,
  },
  defaultVariants: {
    size: 'md',
    context: 'default',
  },
});


/**
 * EmptyState heading variants
 */
const emptyStateHeadingVariants = tv({
  base: 'font-semibold',
  variants: {
    size: textTri,
    context: contextVariants,
  },
  defaultVariants: {
    size: 'md',
    context: 'default',
  },
});

/**
 * EmptyState description variants
 */
const emptyStateDescriptionVariants = tv({
  base: 'max-w-md', // intentional custom width - optimal text reading width
  variants: {
    size: textTri,
    context: {
      default: 'text-muted-foreground/80',
      subtle: 'text-muted-foreground/60',
      prominent: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    context: 'default',
  },
});

/**
 * EmptyState actions container variants
 */
const emptyStateActionsVariants = tv({
  base: actionsBar + ' flex-wrap justify-center',
  variants: {
    size: {
      sm: 'gap-2 mt-3',
      md: 'gap-lg mt-lg',
      lg: 'gap-4 mt-6',
    },
    layout: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
      stacked: 'flex-col sm:flex-row',
    },
  },
  defaultVariants: {
    size: 'md',
    layout: 'horizontal',
  },
});

export {
    emptyStateActionsVariants, emptyStateDescriptionVariants, emptyStateHeadingVariants, emptyStateIconVariants, emptyStateVariants
};


