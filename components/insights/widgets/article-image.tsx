"use client";

import {
    INSIGHT_HERO_HEIGHT,
    INSIGHT_HERO_SIZES,
    INSIGHT_HERO_WIDTH,
} from "@/components/insights/constants";
import { cn } from "@/styles";
import Image from "next/image";
import * as React from "react";

interface ArticleImageProps {
  /** Image source URL */
  src: string;
  /** Image alt text */
  alt: string;
  /** Optional image caption */
  caption?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use lazy loading (default: true) */
  loading?: "lazy" | "eager";
  /** Image priority for LCP optimization (default: false) */
  priority?: boolean;
}

/**
 * ArticleImage - Enhanced article hero image component with caption support,
 * proper aspect ratio handling, and performance optimizations.
 */
export function ArticleImage({
  src,
  alt,
  caption,
  className,
  loading = "lazy",
  priority = false,
}: ArticleImageProps): React.ReactElement {
  return (
    <figure className={cn("relative overflow-hidden rounded-lg -mx-4 sm:mx-0", className)}>
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-muted">
        <Image
          src={src}
          alt={alt}
          width={INSIGHT_HERO_WIDTH}
          height={INSIGHT_HERO_HEIGHT}
          sizes={INSIGHT_HERO_SIZES}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading={loading}
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      </div>
      {caption && (
        <figcaption className="mt-3 px-4 sm:px-0 text-sm text-muted-foreground text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
