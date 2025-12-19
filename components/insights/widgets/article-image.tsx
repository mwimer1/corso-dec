"use client";

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
    <figure className={cn("mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl", className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="object-cover transition-transform duration-300 hover:scale-105"
          loading={loading}
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
