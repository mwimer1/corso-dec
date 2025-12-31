// components/ui/atoms/progress.tsx
/**
 * Atomic progress bar with inner sliding indicator
 * Combines Progress component and internal ProgressBar sub-component
 */
"use client";

import { cn } from "@/styles";
import { progressVariants, type ProgressVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/** Internal indicator bar */
interface ProgressBarProps {
  /** 0–100 translated to transform-X */
  percentage: number;
  /** Extra Tailwind classes for the bar */
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className,
}) => (
  <div
    data-bar
    className={cn(
      "h-full w-full transition-transform duration-300 ease-in-out motion-reduce:transition-none",
      className,
    )}
    /* slide the bar */
    style={{ transform: `translateX(-${100 - percentage}%)` }}
  />
);

ProgressBar.displayName = "ProgressBar";

interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    ProgressVariantProps {
  /** 0-100 value for the progress bar */
  value: number;
  /** Maximum value (defaults to 100) */
  max?: number;
  /** Label for screen readers */
  ariaLabel?: string;
  /** Additional className for the track container */
  className?: string;
  /** Additional className for the indicator bar */
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      ariaLabel = "Progress",
      className,
      indicatorClassName,
      size = "md",
      ...rest
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-label={ariaLabel}
        {...rest}
      >
        <ProgressBar
          percentage={percentage}
          className={indicatorClassName ?? ""}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";
