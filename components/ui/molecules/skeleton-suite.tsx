// components/ui/molecules/skeleton-suite.tsx
"use client";

import { Skeleton } from "@/components/ui/atoms/skeleton";
import { cn } from "@/styles";
import { skeletonSuite } from "@/styles/ui/molecules";
import React from "react";


/**
 * SkeletonTable: A tokenized placeholder for tabular data while loading.
 * It allows for a configurable number of rows, columns, and custom column widths.
 */
export const SkeletonTable = React.forwardRef<
  HTMLDivElement,
  {
    rows?: number;
    columns?: number;
    columnWidths?: string[];
    className?: string;
  }
>(({ rows = 5, columns = 4, columnWidths, className, ...props }, ref) => {
  const widths =
    columnWidths?.length === columns
      ? columnWidths
      : Array.from({ length: columns }, () => "w-full");

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading table"
      className={cn("space-y-2", skeletonSuite({ shape: "rect", size: "md" }), className)}
      {...props}
    >
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`skeleton-row-${rowIndex}`} className="flex gap-sm">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={`skeleton-col-${colIndex}`} className={cn("h-4", widths[colIndex])} />
          ))}
        </div>
      ))}
    </div>
  );
});
SkeletonTable.displayName = "SkeletonTable";

/** Enhanced content list skeleton for grids of content cards */
interface ContentListSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}

const ContentListSkeleton = React.forwardRef<
  HTMLDivElement,
  ContentListSkeletonProps
>(({ count = 6, columns = 3, className, ...props }, ref) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div
      ref={ref}
      className={cn("grid gap-lg", gridClass, className)}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: count }, (_, cardIndex) => (
        <div key={`skeleton-card-${cardIndex}`} className={cn("rounded-lg shadow-sm", skeletonSuite({ shape: "rect", size: "md" }))}>
          <Skeleton className="mb-md h-48 w-full rounded-lg" />
          <div className="space-y-ms">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});
ContentListSkeleton.displayName = "ContentListSkeleton";

export {
    ContentListSkeleton
};

