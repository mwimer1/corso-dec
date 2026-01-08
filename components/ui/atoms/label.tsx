// components/atoms/label.tsx
"use client";

import { cn } from "@/styles";
import { labelVariants, type LabelVariantProps } from "@/styles/ui/atoms";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

/**
 * Label – an accessible form field label.
 * Styled via `labelVariants` to support size, weight, and a required asterisk.
 */
interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    LabelVariantProps {
  required?: boolean;
}

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(function Label(
  { className, required, size, weight, children, ...props },
  ref,
) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ size, weight, required }), className)}
      {...props}
    >
      {children}
    </LabelPrimitive.Root>
  );
});
Label.displayName = "Label";
