"use client";

import { cn } from "@/styles";
import type { ISODateString } from "@/types/shared";
import { Calendar, Clock, User } from "lucide-react";
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
 * Parses an ISO date string safely, handling date-only strings (YYYY-MM-DD)
 * without timezone shifting. Uses UTC to prevent date shifting based on
 * local timezone.
 */
function parseISODateSafe(value: string): Date {
  // Handles "YYYY-MM-DD" safely without timezone shifting
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (y !== undefined && m !== undefined && d !== undefined) {
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  return new Date(value);
}

/**
 * Formats a date string for display using Intl.DateTimeFormat for
 * timezone-safe formatting.
 */
function formatArticleDate(value: ISODateString): string {
  try {
    const date = parseISODateSafe(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    // Fallback to ISO string if parsing fails
    return value;
  }
}

/**
 * ArticleMetadata - Displays article metadata (date, reading time, author)
 * in a unified, responsive bar format with timezone-safe date handling.
 */
export function ArticleMetadata({
  publishDate,
  updatedDate,
  readingTime,
  author,
  className,
}: ArticleMetadataProps): React.ReactElement {
  const isUpdated = Boolean(
    updatedDate && publishDate && updatedDate !== publishDate
  );

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 text-sm text-muted-foreground",
        className
      )}
    >
      {/* Date(s) + reading time */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        {publishDate && (
          <time dateTime={publishDate} className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formatArticleDate(publishDate)}</span>
          </time>
        )}

        {isUpdated && updatedDate ? (
          <>
            <span
              aria-hidden
              className="hidden sm:inline text-muted-foreground/40"
            >
              •
            </span>
            <time
              dateTime={updatedDate}
              className="inline-flex items-center gap-2"
              title={`Updated ${formatArticleDate(updatedDate)}`}
            >
              <span className="sr-only">Updated</span>
              <span>Updated {formatArticleDate(updatedDate)}</span>
            </time>
          </>
        ) : null}

        {typeof readingTime === "number" && readingTime > 0 ? (
          <>
            <span
              aria-hidden
              className="hidden sm:inline text-muted-foreground/40"
            >
              •
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{readingTime} min read</span>
            </span>
          </>
        ) : null}
      </div>

      {/* Author */}
      {author?.name ? (
        <>
          <span
            aria-hidden
            className="hidden sm:inline text-muted-foreground/40"
          >
            •
          </span>
          <div
            className="inline-flex items-center gap-2"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
          >
            {author.avatar ? (
              <Image
                src={author.avatar}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-border shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                <User
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            )}
            <span className="text-foreground/80">
              <span className="text-muted-foreground">Written by </span>
              <span className="font-medium text-foreground" itemProp="name">
                {author.name}
              </span>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
