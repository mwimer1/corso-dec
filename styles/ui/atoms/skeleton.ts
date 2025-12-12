// FILE: styles/components/ui/atoms/skeleton.ts
import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

/**
 * Skeleton variant factory – for loading placeholders.
 * Supports `shape` (rect, circle, text) and `size` variants.
 * Enhanced to support multi-row text skeletons.
 */
const skeletonVariants = tv({
  base: 'motion-safe:animate-pulse bg-[hsl(var(--muted))]',
  variants: {
    shape: {
      rect: 'rounded-md',
      circle: 'rounded-[10px]',
      text: 'h-4 rounded-sm', // use tokenized rounding (rounded-sm = 4px) instead of generic "rounded"
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
      '2xl': '',
    },
  },
  compoundVariants: [
    // Text skeleton heights
    { shape: 'text', size: 'xs', class: 'h-2' }, // 0.5rem (8px)
    { shape: 'text', size: 'sm', class: 'h-3' }, // 0.75rem (12px)
    { shape: 'text', size: 'md', class: 'h-4' }, // 1rem (16px)
    { shape: 'text', size: 'lg', class: 'h-5' }, // 1.25rem (20px)
    { shape: 'text', size: 'xl', class: 'h-6' }, // 1.5rem (24px)
    { shape: 'text', size: '2xl', class: 'h-8' }, // 2rem (32px)

    // Circle skeleton dimensions
    { shape: 'circle', size: 'xs', class: 'h-6 w-6' }, // 1.5rem
    { shape: 'circle', size: 'sm', class: 'h-8 w-8' }, // 2rem
    { shape: 'circle', size: 'md', class: 'h-10 w-10' }, // 2.5rem
    { shape: 'circle', size: 'lg', class: 'h-12 w-12' }, // 3rem
    { shape: 'circle', size: 'xl', class: 'h-16 w-16' }, // 4rem
    { shape: 'circle', size: '2xl', class: 'h-20 w-20' }, // 5rem

    // Rectangle skeleton default heights
    { shape: 'rect', size: 'xs', class: 'h-4' },
    { shape: 'rect', size: 'sm', class: 'h-6' },
    { shape: 'rect', size: 'md', class: 'h-8' },
    { shape: 'rect', size: 'lg', class: 'h-12' },
    { shape: 'rect', size: 'xl', class: 'h-16' },
    { shape: 'rect', size: '2xl', class: 'h-20' },
  ],
  defaultVariants: {
    shape: 'rect',
    size: 'md',
  },
});

/**
 * Multi-row skeleton container variants
 * Used when rendering multiple text rows
 */
const multiRowSkeletonVariants = tv({
  base: 'w-full overflow-hidden rounded-md border border-border bg-surface motion-safe:animate-pulse',
  variants: {
    spacing: {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-3',
    },
  },
  defaultVariants: {
    spacing: 'normal',
  },
});

/**
 * Individual row within multi-row skeleton
 */
const skeletonRowVariants = tv({
  base: 'bg-muted border-b border-border/40 last:border-0',
  variants: {
    height: {
      xs: 'h-2',
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-5',
      xl: 'h-6',
      '2xl': 'h-8',
    },
  },
  defaultVariants: {
    height: 'md',
  },
});

export type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;
export type MultiRowSkeletonVariantProps = VariantProps<
  typeof multiRowSkeletonVariants
>;
// Removed unused export: SkeletonRowVariantProps
// This type was flagged as unused by the audit

/*
export type SkeletonRowVariantProps = VariantProps<typeof skeletonRowVariants>;
*/

export {
    multiRowSkeletonVariants,
    skeletonRowVariants, skeletonVariants
};


