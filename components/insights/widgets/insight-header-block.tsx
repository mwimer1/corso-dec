"use client";

import { ArticleImage } from "@/components/insights/widgets/article-image";
import { ArticleMetadata } from "@/components/insights/widgets/article-metadata";
import { CopyLinkButton } from "@/components/insights/widgets/article-utilities";
import { cn } from "@/styles";
import type { ISODateString } from "@/types/shared";
import Link from "next/link";
import * as React from "react";

type Category = { slug: string; name: string };

interface InsightHeaderBlockProps {
  /** Article title */
  title: string;
  /** Publish date */
  publishDate?: ISODateString;
  /** Last updated date */
  updatedDate?: ISODateString;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Author information */
  author?: { name: string; avatar?: string };
  /** Article categories */
  categories?: Category[];
  /** Hero image URL */
  heroImageUrl?: string;
  /** Hero image caption */
  heroCaption?: string;
  /** Back navigation href (default: /insights) */
  backHref?: string;
  /** Article URL for copy link button */
  articleUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InsightHeaderBlock - Consolidated header block for insight detail pages.
 * Combines back navigation, categories, title, metadata, and hero image into
 * a single cohesive header component with consistent vertical rhythm.
 */
export function InsightHeaderBlock({
  title,
  publishDate,
  updatedDate,
  readingTime,
  author,
  categories,
  heroImageUrl,
  heroCaption,
  backHref = "/insights",
  articleUrl,
  className,
}: InsightHeaderBlockProps): React.ReactElement {
  return (
    <header
      className={cn(
        // Hero card container: rounded, border, calm B2B styling matching index hero feel
        "not-prose relative rounded-2xl border border-border bg-card shadow-sm",
        "p-6 sm:p-8 lg:p-10",
        "space-y-6 sm:space-y-8",
        className
      )}
    >
      {/* Copy link button - positioned absolutely in top-right */}
      {articleUrl && (
        <CopyLinkButton url={articleUrl} variant="header" />
      )}

      {/* Eyebrow row: back + categories */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <nav aria-label="Back">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              ←
            </span>
            <span>Back to Insights</span>
          </Link>
        </nav>

        {categories && categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/insights/categories/${category.slug}`}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`View articles in ${category.name} category`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: Side-by-side layout (title/metadata left, image right) */}
      {/* Mobile: Stack image below title/metadata */}
      <div className="lg:flex lg:items-start lg:gap-12">
        {/* Title + metadata column */}
        <div className="flex-1 space-y-4 sm:space-y-5 lg:min-w-0">
          <h1
            className={cn(
              "text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-foreground",
              // Use text-balance for better title wrapping (if available in Tailwind config)
              // Falls back gracefully if not available
              "[text-wrap:balance]"
            )}
          >
            {title}
          </h1>

          <ArticleMetadata
            {...(publishDate && { publishDate })}
            {...(updatedDate && { updatedDate })}
            {...(readingTime && { readingTime })}
            {...(author && { author })}
          />
        </div>

        {/* Hero image - desktop: right side, mobile: below title/metadata */}
        {heroImageUrl ? (
          <div className="mt-6 lg:mt-0 lg:flex-shrink-0">
            <ArticleImage
              src={heroImageUrl}
              alt={title}
              variant="side"
              {...(heroCaption && { caption: heroCaption })}
              priority
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

