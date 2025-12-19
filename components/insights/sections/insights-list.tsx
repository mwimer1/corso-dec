// FILE: components/insights/sections/insights-list.tsx (moved from marketing sections)

import { InsightCard } from "@/components/insights/insight-card";
import { ContentListSkeleton } from "@/components/ui/molecules";
import { cn } from "@/styles";
import { emptyStateVariants } from "@/styles/ui/molecules";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { InsightPreview } from "@/types/marketing";
import * as React from "react";

// Helper to generate Pexels CDN URLs with consistent 16:9 crop
const pexels = (id: number, w = 1200, h = 675) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

// Category-aware placeholder thumbnails (remote Pexels CDN).
// If a post has coverImage (imageUrl), it should override these.
const categoryImageMap: Record<string, string> = {
  technology: pexels(8470810),
  "market-analysis": pexels(19915446),
  sustainability: pexels(27863809),
  "cost-management": pexels(5915147),
  safety: pexels(10739750),
  data: pexels(4508751),
  general: pexels(1188532),
  default: pexels(20847810),
};

/** Props for InsightsList – list of insight previews and loading flag. */
interface InsightsListProps extends React.HTMLAttributes<HTMLDivElement> {
  insights: InsightPreview[];
  /** Show loading placeholder if true. */
  isLoading?: boolean;
  /** Optional click handler for analytics tracking */
  onResultClick?: (slug: string, position: number) => void;
}

export const InsightsList = React.forwardRef<HTMLDivElement, InsightsListProps>(
  ({ insights, isLoading = false, className, onResultClick, ...props }, ref) => {
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
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">No insights available</h3>
              <p className="max-w-md text-muted-foreground/80">We’ll publish new market insights soon. Check back later.</p>
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
        <div className="mx-auto">
          <ul
            role="list"
            className={cn(
              // Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
              "grid gap-6 sm:gap-8 lg:gap-10",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              "list-none p-0 m-0"
            )}
            aria-label="Insights articles"
          >
            {insights.map((insight) => {
              const primaryCategory = insight.categories?.[0]?.slug;
              const isGenericImage = insight.imageUrl && insight.imageUrl.includes("projects-interface");
              // Determine which image to use: post cover, category placeholder, or default
              let imageSrc: string;
              if (insight.imageUrl && !isGenericImage) {
                imageSrc = insight.imageUrl;
              } else if (primaryCategory && categoryImageMap[primaryCategory]) {
                imageSrc = categoryImageMap[primaryCategory]!;
              } else {
                imageSrc = categoryImageMap['default']!;
              }
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
      </div>
    );
  },
);
InsightsList.displayName = "InsightsList";

export default InsightsList;


