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
  /** Size variant - 'hero' for full-width, 'thumbnail' for smaller side image, 'side' for right-side header image */
  variant?: "hero" | "thumbnail" | "side";
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
  variant = "hero",
}: ArticleImageProps): React.ReactElement {
  // When priority is true, don't pass loading prop (Next.js handles it automatically)
  const imageProps = priority
    ? { priority: true }
    : { loading, priority: false };
  if (variant === "thumbnail") {
    return (
      <figure className={cn("not-prose flex-shrink-0", className)}>
        <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] lg:w-[280px] lg:h-[280px] overflow-hidden rounded-lg bg-muted border border-border shadow-sm">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
            className="object-cover transition-transform duration-300 hover:scale-105"
            {...imageProps}
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

  if (variant === "side") {
    return (
      <figure className={cn("not-prose flex-shrink-0", className)}>
        <div className="relative w-[280px] lg:w-[320px] xl:w-[360px] aspect-[4/3] overflow-hidden rounded-lg bg-muted border border-border shadow-md">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 280px, (max-width: 1280px) 320px, 360px"
            className="object-cover"
            {...imageProps}
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

  // hero variant
  return (
    <figure className={cn("not-prose mx-auto w-full max-w-3xl md:max-w-4xl", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-muted border border-border shadow-md",
          // Standardized hero height per breakpoint (prevents massive heroes on wide screens)
          "h-[200px] sm:h-[260px] lg:h-[320px]"
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="object-cover"
          {...imageProps}
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
