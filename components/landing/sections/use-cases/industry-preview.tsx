'use client';

import type { UseCaseKey } from '@/lib/marketing/client';
import { cn } from '@/styles';
import Image from 'next/image';
import { useState } from 'react';
import styles from './use-case-explorer.module.css';

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
 * IndustryPreview - Renders preview image with enhanced transitions
 * Provides smooth fade-in loading state and fixed aspect ratio to prevent layout shift
 * Returns null if no preview image is provided or if image fails to load
 */
export function IndustryPreview({
  industryKey: _industryKey,
  title: _title,
  previewImage,
  className,
}: IndustryPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // If no preview image or error, return null (placeholder removed - legacy component)
  // industryKey and title props kept for API compatibility but no longer used
  if (!previewImage || hasError) {
    return null;
  }

  return (
    <div className={cn(styles['previewContainer'], className)}>
      {/* Enhanced skeleton loading state */}
      {isLoading && (
        <div className={styles['skeleton']} aria-hidden="true" />
      )}

      {/* Preview image with smooth fade-in transition */}
      <Image
        src={previewImage.src}
        alt={previewImage.alt}
        fill
        className={styles['previewImage']}
        data-loading={isLoading}
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

