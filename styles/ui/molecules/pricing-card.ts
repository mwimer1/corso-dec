import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

/**
 * pricingCardVariants
 * -------------------
 * Layout recipe for the `<PricingCard>` molecule.
 * Supports popular highlighting, different sizes, and button variants.
 */
const pricingCardVariants = tv({
  slots: {
    container: [
      'flex flex-col rounded-2xl border-2 bg-surface shadow-card',
      'transition-all duration-200',
    ],
    popularBadge: [
      'mb-3 self-start rounded-[10px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground',
    ],
    title: ['text-xl font-semibold text-foreground'],
    // Price styling: remove large vertical margins so priceNote sits directly below
    price: ['text-4xl font-bold text-foreground'],
    // Small italic note shown directly under the price
    priceNote: ['text-sm italic text-muted-foreground mt-1'],
    // Description should start slightly below the price note
    description: ['mt-2 mb-4 text-sm text-muted-foreground'],
    featureList: ['flex flex-1 flex-col gap-2 text-sm text-muted-foreground'],
    featureItem: ["before:mr-2 before:content-['✓'] before:text-primary"],
    // CTA button slot (variant-specific borders applied in component if needed)
    ctaButton: ['mt-6 w-full'],
  },
  variants: {
    isPopular: {
      true: { container: ['border-primary shadow-panel', 'ring-1 ring-primary/20'] },
      false: { container: 'border-border' },
    },
    size: {
      sm: { container: 'p-4', title: 'text-lg', price: 'text-2xl' },
      md: { container: 'p-6', title: 'text-xl', price: 'text-4xl' },
      lg: { container: 'p-8', title: 'text-2xl', price: 'text-5xl' },
    },
    variant: {
      default: { container: 'hover:shadow-lg' },
      featured: {
        container: ['border-primary bg-primary/5', 'hover:shadow-xl hover:shadow-primary/10'],
      },
      minimal: { container: ['border-border/50 shadow-sm', 'hover:border-border hover:shadow-md'] },
    },
  },
  defaultVariants: {
    isPopular: false,
    size: 'md',
    variant: 'default',
  },
});

export type PricingCardVariantProps = VariantProps<typeof pricingCardVariants>;

export { pricingCardVariants };


