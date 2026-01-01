import { tv, type VariantProps } from '@/styles';
import { focusRing } from '@/styles/ui/shared/focus-ring';

/**
 * Variants for industry tab buttons in the use-case-explorer section.
 * Intentionally local to use-cases (separate from product-showcase TabSwitcher).
 */
const industryTabButtonVariants = tv({
  base: [
    'inline-flex items-center gap-2 px-lg py-xs rounded-[10px]',
    'text-sm font-medium tracking-wide transition-colors border-solid',
    focusRing('primary'),
  ],
  variants: {
    isActive: {
      true: 'border border-foreground bg-muted text-foreground font-semibold',
      false: 'border border-border bg-background text-foreground hover:bg-muted/60',
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

/**
 * Container variant for industry preview images and placeholders.
 * Shared between IndustryPreview and IndustryPreviewPlaceholder components.
 */
const industryPreviewContainerVariants = tv({
  base: 'relative rounded-xl overflow-hidden aspect-[16/10]',
});

/**
 * Skeleton loading state variant for industry preview images.
 */
const industryPreviewSkeletonVariants = tv({
  base: 'absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20 animate-pulse',
});

/**
 * Image variant for industry preview with loading state support.
 */
const industryPreviewImageVariants = tv({
  base: 'object-cover transition-opacity duration-200',
  variants: {
    loading: {
      true: 'opacity-0',
      false: 'opacity-100',
    },
  },
  defaultVariants: {
    loading: false,
  },
});

export type IndustryTabButtonVariantProps = VariantProps<typeof industryTabButtonVariants>;
export type IndustryPreviewContainerVariantProps = VariantProps<typeof industryPreviewContainerVariants>;
export type IndustryPreviewSkeletonVariantProps = VariantProps<typeof industryPreviewSkeletonVariants>;
export type IndustryPreviewImageVariantProps = VariantProps<typeof industryPreviewImageVariants>;

export {
  industryTabButtonVariants,
  industryPreviewContainerVariants,
  industryPreviewSkeletonVariants,
  industryPreviewImageVariants,
};
