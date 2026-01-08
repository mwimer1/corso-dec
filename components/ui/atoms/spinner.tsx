// components/atoms/spinner.tsx
"use client";

import { cn } from "@/styles";
import { spinnerVariants, type SpinnerVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/**
 * Spinner – token-driven loading indicator.
 *
 * @example
 *   <Spinner size="lg" variant="default" />
 */
interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    SpinnerVariantProps {}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size, variant = "default", className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        aria-label="Loading..."
        viewBox="0 0 24 24"
        className={cn(spinnerVariants({ size, variant }), className)}
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          opacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  },
);
Spinner.displayName = "Spinner";
