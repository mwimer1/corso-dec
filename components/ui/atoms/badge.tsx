// components/atoms/badge.tsx
"use client";

import { cn } from "@/styles";
import { badgeVariants, type BadgeVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/**
 * Badge – a small pill-shaped label for status or categories.
 * Supports color variants (default, success, info, primary, secondary, warning, error).
 */
interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    BadgeVariantProps {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ color = "default", className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ color }), className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
