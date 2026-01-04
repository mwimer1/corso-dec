import { SectionHeader } from '@/components/ui/patterns';
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

  // Removed inner section wrapper - parent FullWidthSection provides full-bleed background and border
  // Header is left-aligned to match the Industry Explorer content below
  return (
    <div className={cn(styles['useCaseExplorer'], 'space-y-lg')}>
      <SectionHeader
        id="use-cases-title"
        headingLevel={2}
        align="left"
        title="Built for your industry."
        subtitle="Discover how Corso turns building-permit data into actionable business intelligence."
        size="marketingHero"
      />
      <IndustrySelectorPanel industries={industries} />
    </div>
  );
}
