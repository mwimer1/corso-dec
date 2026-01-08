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

/** Card subcomponents using cardVariants slots */
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { header } = cardVariants();
    return <div ref={ref} className={cn(header(), className)} {...props} />;
  },
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { title } = cardVariants();
    return <h3 ref={ref} className={cn(title(), className)} {...props} />;
  },
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { description } = cardVariants();
    return <p ref={ref} className={cn(description(), className)} {...props} />;
  },
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { content } = cardVariants();
    return <div ref={ref} className={cn(content(), className)} {...props} />;
  },
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { footer } = cardVariants();
    return <div ref={ref} className={cn(footer(), className)} {...props} />;
  },
);
CardFooter.displayName = "CardFooter";
