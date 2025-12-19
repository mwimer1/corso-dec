"use client";

import { SectionHeader } from "@/components/ui/patterns/section-header";
import { cn } from "@/styles";
import type { ISODateString } from "@/types/shared";
import * as React from "react";
import { ArticleMetadata } from "./article-metadata";

interface ArticleHeaderProps {
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
  categories?: Array<{ slug: string; name: string }>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ArticleHeader - Displays article header with title, metadata, and categories.
 * Provides a clean, organized structure for article information.
 */
export function ArticleHeader({
  title,
  publishDate,
  updatedDate,
  readingTime,
  author,
  categories,
  className,
}: ArticleHeaderProps): React.ReactElement {
  return (
    <header className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Article Title */}
      <SectionHeader 
        headingLevel={1} 
        title={title} 
        align="left"
      />

      {/* Unified Metadata Bar */}
      <ArticleMetadata
        {...(publishDate && { publishDate })}
        {...(updatedDate && { updatedDate })}
        {...(readingTime && { readingTime })}
        {...(author && { author })}
      />

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((category) => (
            <span
              key={category.slug}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 transition-colors"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
