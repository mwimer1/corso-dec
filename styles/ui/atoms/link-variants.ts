import { tv } from '@/styles/utils';

export const linkVariants = tv({
  base: 'transition-colors underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  variants: {
    variant: {
      external: 'text-primary hover:text-primary/80',
      internal: 'text-muted-foreground hover:text-[hsl(var(--text-medium))]',
    },
  },
  defaultVariants: {
    variant: 'internal',
  },
});

// Removed unused export: LinkVariantProps
// This type was flagged as unused by the audit

/*
export type LinkVariantProps = VariantProps<typeof linkVariants>;
*/

