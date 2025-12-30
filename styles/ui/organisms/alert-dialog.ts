// styles/ui/organisms/alert-dialog.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';
/**
 * AlertDialog overlay variants
 *
 * Alert-specific overlay styling
 */
const alertDialogOverlayVariants = tv({
  base: [
    'fixed inset-0 z-50',
    'bg-background/80 backdrop-blur-sm',
    'transition-all duration-200 ease-in-out',
  ],
});

/**
 * AlertDialog content variants
 *
 * Alert-specific content styling
 */
const alertDialogContentVariants = tv({
  base: [
    'fixed left-[50%] top-[50%] z-50 grid w-full max-h-[85vh] max-w-lg',
    'translate-x-[-50%] translate-y-[-50%] gap-4',
    'bg-background p-6 shadow-lg border border-border',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    // Alert dialog specific positioning
    '-translate-x-1/2 -translate-y-1/2',
  ],
  variants: {
    // Override size variants to use alert-specific sizing
    size: {
      sm: 'p-4 max-w-sm',
      md: 'p-6 max-w-lg',
      lg: 'p-8 max-w-2xl',
      full: 'w-screen h-screen max-w-none rounded-none p-4 sm:p-6 md:p-8',
    },
    // Map variant to border
    variant: {
      default: '',
      destructive: '',
      warning: '',
      success: '',
    },
  },
  compoundVariants: [
    // Map variant to border color
    {
      variant: 'default',
      class: 'border-border',
    },
    {
      variant: 'destructive',
      class: 'border-destructive',
    },
    {
      variant: 'warning',
      class: 'border-warning',
    },
    {
      variant: 'success',
      class: 'border-success',
    },
  ],
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * AlertDialog title variants
 */
const alertDialogTitleVariants = tv({
  base: 'font-semibold',
  variants: {
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    },
    variant: {
      default: 'text-foreground',
      destructive: 'text-danger',
      warning: 'text-warning',
      success: 'text-success',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/**
 * AlertDialog description variants
 */
const alertDialogDescriptionVariants = tv({
  base: 'text-muted-foreground',
  variants: {
    size: {
      sm: 'text-sm mt-1',
      md: 'text-sm mt-2',
      lg: 'text-base mt-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// removed: alertDialogActionsVariants (unused)

/**
 * AlertDialog header variants
 *
 * Alert-specific header styling
 */
const alertDialogHeaderVariants = tv({
  base: 'flex flex-col gap-2',
  variants: {
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
    padding: {
      sm: 'px-4 pt-4',
      md: 'px-6 pt-6',
      lg: 'px-8 pt-8',
    },
    bordered: {
      true: 'border-b border-border',
      false: '',
    },
  },
  defaultVariants: {
    align: 'start',
    padding: 'md',
    bordered: false,
  },
});

/**
 * AlertDialog footer variants
 *
 * Alert-specific footer styling
 */
const alertDialogFooterVariants = tv({
  base: 'flex items-center justify-end gap-2',
  variants: {
    align: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
    padding: {
      sm: 'px-4 pb-4',
      md: 'px-6 pb-6',
      lg: 'px-8 pb-8',
    },
  },
  defaultVariants: {
    align: 'end',
    padding: 'md',
  },
});

export type AlertDialogOverlayVariantProps = VariantProps<typeof alertDialogOverlayVariants>;
export type AlertDialogContentVariantProps = VariantProps<typeof alertDialogContentVariants>;
export type AlertDialogTitleVariantProps = VariantProps<typeof alertDialogTitleVariants>;
export type AlertDialogDescriptionVariantProps = VariantProps<
  typeof alertDialogDescriptionVariants
>;
export type AlertDialogHeaderVariantProps = VariantProps<typeof alertDialogHeaderVariants>;
export type AlertDialogFooterVariantProps = VariantProps<typeof alertDialogFooterVariants>;

export {
    alertDialogContentVariants, alertDialogDescriptionVariants, alertDialogFooterVariants, alertDialogHeaderVariants, alertDialogOverlayVariants,
    alertDialogTitleVariants
};


