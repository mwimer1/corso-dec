'use client';

import { cn } from '@/styles';
import Image from 'next/image';
import React, { useState } from 'react';
import type { UseCaseKey } from '@/lib/marketing/client';
import { IndustryPreviewPlaceholder } from './industry-preview-placeholder';

interface PreviewImage {
  src: string;
  alt: string;
}

interface IndustryPreviewProps {
  industryKey: UseCaseKey;
  title: string;
  previewImage?: PreviewImage;
  className?: string;
}

/**
 * IndustryPreview - Renders preview image or placeholder
 * Provides skeleton loading state and fixed aspect ratio to prevent layout shift
 */
export function IndustryPreview({
  industryKey,
  title,
  previewImage,
  className,
}: IndustryPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // If no preview image, render placeholder
  if (!previewImage || hasError) {
    return (
      <IndustryPreviewPlaceholder
        industryKey={industryKey}
        title={title}
        {...(className && { className })}
      />
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden aspect-[16/10]', className)}>
      {/* Skeleton loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Preview image */}
      <Image
        src={previewImage.src}
        alt={previewImage.alt}
        fill
        className={cn(
          'object-cover transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        sizes="(max-width: 1024px) 100vw, 33vw"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        priority={false}
      />
    </div>
  );
}

