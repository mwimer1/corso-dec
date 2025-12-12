import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';
import { flexJustifyVariants, textAlignVariants } from '@/styles/shared-variants';

/**
 * Page header size variants - responsive text scaling for different screen sizes
 */
const pageHeaderSizeVariants = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-5xl sm:text-6xl',
} as const;

/**
 * Page header subtitle size variants
 */
const pageHeaderSubtitleSizeVariants = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
} as const;

/**
 * PageHeader variant factory – for page title headers.
 * Supports different sizes, alignments, and spacing options.
 */
const pageHeaderVariants = tv({
  base: '',
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    alignment: textAlignVariants,
    spacing: {
      tight: 'space-y-2',
      normal: 'space-y-4',
      loose: 'space-y-6',
      xl: 'space-y-8',
    },
  },
  defaultVariants: {
    size: 'lg',
    alignment: 'left',
    spacing: 'normal',
  },
});

/**
 * PageHeader title variants
 */
const pageHeaderTitleVariants = tv({
  base: 'font-bold tracking-tight text-foreground',
  variants: {
    size: pageHeaderSizeVariants,
  },
  defaultVariants: {
    size: 'lg',
  },
});

/**
 * PageHeader subtitle variants
 */
const pageHeaderSubtitleVariants = tv({
  base: 'text-muted-foreground',
  variants: {
    size: pageHeaderSubtitleSizeVariants,
  },
  defaultVariants: {
    size: 'lg',
  },
});

/**
 * PageHeader actions container variants
 */
const pageHeaderActionsVariants = tv({
  base: '',
  variants: {
    spacing: {
      tight: 'mt-3',
      normal: 'mt-4',
      loose: 'mt-6',
      xl: 'mt-8',
    },
    alignment: {
      left: 'flex ' + flexJustifyVariants.start,
      center: 'flex ' + flexJustifyVariants.center,
      right: 'flex ' + flexJustifyVariants.end,
      between: 'flex justify-between',
      around: 'flex justify-around',
    },
  },
  defaultVariants: {
    spacing: 'loose',
    alignment: 'left',
  },
});

export type PageHeaderVariantProps = VariantProps<typeof pageHeaderVariants>;
export type PageHeaderTitleVariantProps = VariantProps<typeof pageHeaderTitleVariants>;
export type PageHeaderSubtitleVariantProps = VariantProps<typeof pageHeaderSubtitleVariants>;
export type PageHeaderActionsVariantProps = VariantProps<typeof pageHeaderActionsVariants>;

export {
    pageHeaderActionsVariants, pageHeaderSubtitleVariants, pageHeaderTitleVariants, pageHeaderVariants
};


