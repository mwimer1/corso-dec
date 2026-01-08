// styles/components/ui/atoms/slider.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

const sliderVariants = tv({
  base: ['relative flex w-full touch-none select-none items-center'],
  variants: {
    size: {
      sm: 'h-4',
      md: 'h-5',
      lg: 'h-6',
    },
    intent: {
      default: '',
      primary: '',
    },
  },
  defaultVariants: {
    intent: 'default',
  },
});

// Slider thumb styling
const sliderThumbVariants = tv({
  base: [
    'rounded-full border shadow',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ],
  variants: {
    size: {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    },
    variant: {
      slider: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'slider',
  },
});

export type SliderVariantProps = VariantProps<typeof sliderVariants>;
export type SliderThumbVariantProps = VariantProps<typeof sliderThumbVariants>;
export { sliderThumbVariants, sliderVariants };


