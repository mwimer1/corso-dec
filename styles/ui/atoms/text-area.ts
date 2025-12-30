// styles/ui/atoms/text-area.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

/**
 * TextArea variant factory
 * – resize: none | vertical | both
 * – state: visual validation state
 * – height: textarea-specific height sizing
 */
const textAreaVariants = tv({
  base: [
    'block w-full rounded-md',
    'bg-background text-foreground border border-input placeholder:text-muted-foreground',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    resize: {
      none: 'resize-none',
      y: 'resize-y', // vertical only
      both: 'resize',
    },
    state: {
      default: '',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-green-500 focus-visible:ring-green-500',
    },
    // Custom height variants for textarea
    height: {
      sm: 'min-h-16', // 64px
      md: 'min-h-20', // 80px - default
      lg: 'min-h-24', // 96px
      xl: 'min-h-32', // 128px
    },
    // New: size alias to align with component prop usage
    size: {
      sm: 'min-h-[6rem] text-sm px-3 py-2',
      md: 'min-h-[8rem] text-sm px-3 py-2',
      lg: 'min-h-[10rem] text-base px-4 py-3',
    },
  },
  defaultVariants: {
    resize: 'y',
    state: 'default',
    height: 'md',
    size: 'md',
  },
});

export type TextAreaVariantProps = VariantProps<typeof textAreaVariants>;

export { textAreaVariants };


