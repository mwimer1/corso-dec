// styles/ui/shared/surface-interactive.ts
import { tv } from '@/styles';

/** @public — hover/elevation utility used in market-insights */
export const surfaceInteractive = tv({
  base:
    'transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
  variants: {
    elevate: {
      true: 'transition-shadow duration-200 ease-in-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-lg',
      false: '',
    },
  },
  defaultVariants: {
    elevate: false,
  },
});



