import { cn } from "@/styles";
import { cardVariants, type CardVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/** Props for Card container. */
interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariantProps {
  /** If true, applies elevated variant (overrides variant prop). */
  elevated?: boolean;
}

/** 🟢 Atom: Card container with tokenized styling and variant support. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, variant = "default", ...props }, ref) => {
    // If elevated is true, use 'elevated' variant, otherwise use provided variant
    const resolvedVariant = elevated ? "elevated" : variant || "default";
    const { root } = cardVariants({ variant: resolvedVariant });

    return (
      <div
        ref={ref}
        role="region"
        className={cn(root(), className)}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";
// The following subcomponents were removed because they are not used
// by other modules in the codebase. Keep the primary Card atom only.
