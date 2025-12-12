// components/ui/atoms/skeleton.tsx\n'use client';

import { cn } from "@/styles";
import {
    multiRowSkeletonVariants,
    skeletonRowVariants,
    skeletonVariants,
    type MultiRowSkeletonVariantProps,
    type SkeletonVariantProps,
} from "@/styles/ui/atoms";
import * as React from "react";

/**
 * Skeleton – a shimmer loading placeholder.
 * Supports `shape` variants ('rect', 'circle', 'text') and `size` variants. Can render multiple text rows via `rows`.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & SkeletonVariantProps & {
  /** Number of placeholder lines (if >1, renders a multi-line text skeleton). */
  rows?: number;
  /** Spacing between rows in multi-row mode */
  spacing?: MultiRowSkeletonVariantProps["spacing"];
}>(
  function Skeleton(
    {
      className,
      shape = "rect",
      size = "md",
      rows = 1,
      spacing = "normal",
      ...props
    },
    ref,
  ) {
    // Note: Shared forwardRef + cn(variants, className) pattern is deliberate
    // across simple atoms to favor clarity over abstraction.
    // If multiple text rows are requested, render a composite block with each row as a line skeleton
    if (rows && rows > 1 && shape === "text") {
      return (
        <div
          ref={ref}
          className={cn(multiRowSkeletonVariants({ spacing }), className)}
          {...props}
        >
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={`skeleton-row-${rowIndex}`} className={skeletonRowVariants({ height: size })} />
          ))}
        </div>
      );
    }

    // Default: single skeleton element (rectangular bar, circle, or single text line)
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ shape, size }), className)}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";
