// removed unused VariantProps import
import { tv } from '@/styles/utils';

const footerCTA = tv({
  slots: {
    section: 'relative isolate',
    glow: [
      'absolute inset-[-1px]',
      'bg-radial-[80%_60%_at_50%_0%] from-primary/18 via-transparent to-60%',
      'bg-radial-[60%_40%_at_100%_100%] from-primary/12 via-transparent to-70%',
      'blur-[24px] opacity-60 pointer-events-none',
      'mask-radial-120/100 at-50% black 40% transparent 100%'
    ],
    blueGlow: [
      'absolute inset-[-1px]',
      'bg-radial-[80%_60%_at_50%_0%] from-white/10 via-transparent to-60%',
      'bg-radial-[60%_40%_at_100%_100%] from-black/10 via-transparent to-70%',
      'blur-[24px] opacity-40 pointer-events-none'
    ],
    buttons: 'z-10',
    primaryButton: [
      'border-2',
      'bg-primary text-primary-foreground',
      'border-primary/80',
      'shadow-[0_3px_8px_hsl(var(--primary)/0.3)]',
      'hover:bg-primary/90 hover:border-primary/85',
      'hover:shadow-[0_6px_15px_hsl(var(--primary)/0.5)]'
    ],
    outlineButton: [
      'border-2 border-white/40',
      'bg-transparent text-background',
      'hover:border-white/70 hover:bg-primary hover:text-primary-foreground',
      'hover:shadow-[0_0_10px_hsl(var(--background)/0.2)]'
    ]
  },
  variants: {
    tone: {
      dark: {
        section: [
          'relative isolate overflow-hidden rounded-2xl',
          'border border-border/60',
          'bg-foreground/95 bg-gradient-to-br from-foreground to-foreground/90',
          'px-5 py-2xl text-center',
          'shadow-lg ring-1 ring-inset ring-white/10'
        ]
      },
      blue: {
        section: [
          'w-full px-0',
          'bg-blue-600 text-white'
        ]
      }
    },
    fullBleed: {
      true: '',
      false: ''
    },
    layout: {
      center: '',
      split: ''
    }
  },
  compoundVariants: [
    {
      tone: 'blue',
      fullBleed: true,
      class: {
        section: 'w-full px-0'
      }
    },
    {
      tone: 'dark',
      fullBleed: false,
      class: {
        section: 'rounded-2xl border border-border/60 px-5 py-2xl'
      }
    }
  ],
  defaultVariants: {
    tone: 'blue',
    fullBleed: true,
    layout: 'center'
  },
});
export { footerCTA };


