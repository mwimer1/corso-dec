// FILE: components/insights/sections/insights-list.tsx (moved from marketing sections)

import { InsightCard } from "@/components/insights/insight-card";
import { ContentListSkeleton } from "@/components/ui/molecules";
import { Button } from "@/components/ui/atoms/button";
import { resolveInsightImageUrl } from "@/components/insights/utils/image-resolver";
import { cn } from "@/styles";
import { emptyStateVariants } from "@/styles/ui/molecules";
import { containerMaxWidthVariants } from "@/styles/ui/shared";
import type { InsightPreview } from "@/types/marketing";
import * as React from "react";

/** Props for InsightsList – list of insight previews and loading flag. */
interface InsightsListProps extends React.HTMLAttributes<HTMLDivElement> {
  insights: InsightPreview[];
  /** Show loading placeholder if true. */
  isLoading?: boolean;
  /** Optional click handler for analytics tracking */
  onResultClick?: (slug: string, position: number) => void;
  /** Optional handler to clear all filters (for empty state) */
  onClearFilters?: () => void;
}

export const InsightsList = React.forwardRef<HTMLDivElement, InsightsListProps>(
  ({ insights, isLoading = false, className, onResultClick, onClearFilters, ...props }, ref) => {
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(
            // Responsive container with proper max-width and centering
            containerMaxWidthVariants({ maxWidth: "7xl", centered: true }),
            // Consistent spacing for insights grid
            "px-4 sm:px-6 lg:px-8 py-8",
            className
          )}
          {...props}
        >
          <ContentListSkeleton role="status" aria-label="Loading insights…" columns={3} />
        </div>
      );
    }

    if (!insights || insights.length === 0) {
      // Differentiate between "no content" (onClearFilters not provided) vs "filtered out" (onClearFilters provided)
      const isFilteredOut = onClearFilters !== undefined;
      
      return (
        <div
          ref={ref}
          className={cn(
            // Responsive container with proper max-width and centering
            containerMaxWidthVariants({ maxWidth: "7xl", centered: true }),
            // Consistent spacing for insights grid
            "px-4 sm:px-6 lg:px-8 py-8",
            className
          )}
          {...props}
        >
          <section className={emptyStateVariants({ size: "md", context: "default", variant: "default" })}>
            <div className="flex items-center justify-center text-4xl mb-4 text-muted-foreground">📰</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  {isFilteredOut ? "No articles found" : "No insights available"}
                </h3>
                <p className="max-w-md text-muted-foreground/80">
                  {isFilteredOut
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "We'll publish new market insights soon. Check back later."}
                </p>
              </div>
              {isFilteredOut && onClearFilters && (
                <Button onClick={onClearFilters} variant="default" size="sm">
                  Clear filters
                </Button>
              )}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Responsive container with proper max-width and centering
          containerMaxWidthVariants({ maxWidth: "7xl", centered: true }),
          // Consistent spacing for insights grid
          "px-4 sm:px-6 lg:px-8 py-8",
          className
        )}
        {...props}
      >
        <ul
          role="list"
          className={cn(
            // Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
            "grid gap-6 sm:gap-8",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            "list-none p-0 m-0"
          )}
          aria-label="Insights articles"
        >
          {insights.map((insight) => {
            const imageSrc = resolveInsightImageUrl(insight);
            return (
              <li key={insight.id} className="m-0 p-0 list-none">
                <InsightCard
                  href={`/insights/${insight.slug}`}
                  title={insight.title}
                  excerpt={insight.description || undefined}
                  image={{ src: imageSrc, alt: insight.title }}
                  category={insight.categories?.[0]?.name || undefined}
                  date={insight.publishDate || undefined}
                  readingTime={insight.readingTime ? `${insight.readingTime} min read` : undefined}
                  author={insight.author ? {
                    name: insight.author.name
                  } : undefined}
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
InsightsList.displayName = "InsightsList";
