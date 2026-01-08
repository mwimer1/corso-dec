'use client';

import { zUseCaseMap, type UseCaseKey } from '@/lib/marketing/client';
import { IndustrySelectorPanel } from './industry-selector-panel';
import type { Industry } from './types';
import { DEFAULT_USE_CASES } from './use-cases.data';
import styles from './use-case-explorer.module.css';
import { cn } from '@/styles';

export default function IndustryExplorer() {
  // Production-safe validation
  let validatedData = DEFAULT_USE_CASES;
  try {
    zUseCaseMap.parse(DEFAULT_USE_CASES);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[IndustryExplorer] Invalid DEFAULT_USE_CASES:', error);
    }
    // In production, continue with data but log warning
  }

  // Transform DEFAULT_USE_CASES into Industry array
  const industries: Industry[] = Object.entries(validatedData).map(([key, data]) => {
    const industry: Industry = {
      key: key as UseCaseKey,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      benefits: data.benefits,
      impact: data.impact,
    };
    // Add optional fields only if they exist
    if (data.impactMetrics) {
      industry.impactMetrics = data.impactMetrics;
    }
    if (data.previewImage) {
      industry.previewImage = data.previewImage;
    }
    if (data.previewImageSrc) {
      industry.previewImageSrc = data.previewImageSrc;
    }
    if (data.previewImageAlt) {
      industry.previewImageAlt = data.previewImageAlt;
    }
    return industry;
  });

  return (
    <div className={cn(styles['useCaseExplorer'], 'space-y-lg')}>
      {/* Header */}
      <div className="space-y-3">
        <h2 id="use-cases-title" className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Workflows that turn permits into{' '}
          <span className="underline decoration-primary decoration-2 underline-offset-4">
            action
          </span>
          .
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Pick your industry. Explore the workflows Corso supports—what you'll do, what you'll see, and what you can export.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-6" aria-hidden="true" />

      <IndustrySelectorPanel industries={industries} />
    </div>
  );
}
