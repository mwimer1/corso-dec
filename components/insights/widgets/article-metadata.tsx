"use client";

import { cn } from "@/styles";
import type { ISODateString } from "@/types/shared";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import Image from "next/image";
import * as React from "react";

interface ArticleMetadataProps {
  /** Publish date of the article */
  publishDate?: ISODateString;
  /** Last updated date (optional, defaults to publishDate if not provided) */
  updatedDate?: ISODateString;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Author information */
  author?: { name: string; avatar?: string };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats a date string for display
 */
function formatArticleDate(date: ISODateString): string {
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    // Fallback to ISO string if parsing fails
    return date;
  }
}

/**
 * ArticleMetadata - Displays article metadata (date, reading time, author)
 * in a unified, responsive bar format.
 */
export function ArticleMetadata({
  publishDate,
  updatedDate,
  readingTime,
  author,
  className,
}: ArticleMetadataProps): React.ReactElement {
  // Determine which date to show - prefer updatedDate if it's different from publishDate
  const displayDate = updatedDate && updatedDate !== publishDate ? updatedDate : publishDate;
  const isUpdated = updatedDate && updatedDate !== publishDate;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6 text-sm text-muted-foreground",
        className
      )}
    >
      {/* Date and Reading Time */}
      <div className="flex items-center flex-wrap gap-4">
        {displayDate && (
          <time
            dateTime={displayDate}
            className="flex items-center gap-1.5"
            title={
              isUpdated && updatedDate
                ? `Updated ${formatArticleDate(updatedDate)}`
                : undefined
            }
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isUpdated ? "Updated " : ""}
              {formatArticleDate(displayDate)}
            </span>
          </time>
        )}
        {readingTime && (
          <>
            <span
              aria-hidden
              className="hidden sm:inline text-muted-foreground/50"
            >
              •
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{readingTime} min read</span>
            </span>
          </>
        )}
      </div>

      {/* Author */}
      {author && (
        <>
          <span aria-hidden className="hidden sm:inline text-muted-foreground/50">
            •
          </span>
          <div className="flex items-center gap-2">
            {author.avatar && (
              <Image
                src={author.avatar}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-border shrink-0"
              />
            )}
            <span>
              <span className="text-foreground/70">Written by </span>
              <span className="font-medium text-foreground">{author.name}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
