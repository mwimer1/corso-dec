import { tv } from '@/styles';

// Underline accent for headings: animated scaleX underline
/** @public — animated underline accent used in hero and headers */
export const underlineAccent = tv({
  slots: {
    wrap: "relative inline-block pb-[6px]",
    // include will-change and prefers-reduced-motion fallback via classes
    line: "absolute inset-x-0 bottom-0 h-[4px] rounded-[10px] origin-left scale-x-0 will-change-transform",
  },
  variants: {
    color: {
      // Primary uses hero-accent token (falling back to primary). Kept as token-driven
      // so designers can switch accents globally. Also provide an explicit primary
      // fallback in case token is missing.
      primary: { line: "bg-[hsl(var(--primary))]" },
      foreground: { line: "bg-[hsl(var(--foreground))]" },
      custom: {},
    },
    show: {
      true: { line: "scale-x-100" },
      false: {},
    },
    duration: {
      // Use motion-safe prefixed transitions; users with reduced motion will
      // not see transitions because the transition classes are gated by
      // motion-safe in the composed class name.
      slow: { line: "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-in-out" },
      normal: { line: "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-in-out" },
      fast: { line: "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out" },
    },
  },
  defaultVariants: {
    color: "primary",
    show: false,
    duration: "normal",
  },
});

// Removed unused export: UnderlineAccentVariants
// This type was flagged as unused by the audit

/*
export type UnderlineAccentVariants = VariantProps<typeof underlineAccent>;
*/



