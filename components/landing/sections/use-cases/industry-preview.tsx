'use client';

import type { UseCaseKey } from '@/lib/marketing/client';
import { cn } from '@/styles';
import Image from 'next/image';
import { useState } from 'react';
import { IndustryPreviewPlaceholder } from './industry-preview-placeholder';
import {
  industryPreviewContainerVariants,
  industryPreviewImageVariants,
  industryPreviewSkeletonVariants,
} from './use-case-explorer.variants';

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
    <div className={cn(industryPreviewContainerVariants(), className)}>
      {/* Skeleton loading state */}
      {isLoading && (
        <div className={industryPreviewSkeletonVariants()} aria-hidden="true" />
      )}

      {/* Preview image */}
      <Image
        src={previewImage.src}
        alt={previewImage.alt}
        fill
        className={industryPreviewImageVariants({ loading: isLoading })}
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

