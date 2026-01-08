// components/ui/atoms/progress/progress-indicator.tsx
/**
 * primitives/Progress/ProgressBar.tsx
 * Atomic sub-component rendered inside <Progress>
 */
"use client";

import { cn } from "@/styles";
import * as React from "react";

/** Internal indicator bar */
interface ProgressBarProps {
  /** 0–100 translated to transform-X */
  percentage: number;
  /** Extra Tailwind classes for the bar */
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
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
