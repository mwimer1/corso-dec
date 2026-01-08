// components/ui/atoms/toggle.tsx\n// FILE: app/_components/ui/atoms/toggle.tsx
"use client";

import { cn } from "@/styles";
import { toggleVariants, type ToggleVariantProps } from "@/styles/ui/atoms";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as React from "react";

/**
 * Toggle — token-aware Radix <Toggle> wrapper.
 *
 * ```tsx
 * <Toggle variant="default" size="sm" pressed={isBold} aria-label="Toggle bold">
 *   <BoldIcon />
 * </Toggle>
 * ```
 */
interface ToggleProps
  extends ToggleVariantProps,
    Omit<
      React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
      "className" | "children"
    > {
  /** Optional utility class overrides */
  className?: string;
  /** Toggle content (icon / text) */
  children?: React.ReactNode;
}

export const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ size, className, children, variant = "default", ...props }, ref) => {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </TogglePrimitive.Root>
  );
});
Toggle.displayName = "Toggle";
