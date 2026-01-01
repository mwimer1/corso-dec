'use client';

import { Badge, Card, CardContent } from '@/components/ui/atoms';
import { useArrowKeyNavigation } from '@/components/ui/hooks/use-arrow-key-navigation';
import { tabButtonVariants } from '@/styles/ui/molecules/tab-switcher';
import { trackEvent } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { IndustryPreview } from './industry-preview';
import type { Industry } from './types';

interface IndustrySelectorPanelProps {
  industries: Industry[];
}

const MAX_IMPACT_METRICS = 3;

export function IndustrySelectorPanel({ industries }: IndustrySelectorPanelProps) {
  // Hooks must be called unconditionally (before any early returns)
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserInteraction, setIsUserInteraction] = useState(false);
  const previousIndexRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get valid industries array (default to empty if invalid)
  const validIndustries = industries && industries.length > 0 ? industries : [];
  const activeIndustry = validIndustries[activeIndex] ?? validIndustries[0] ?? null;

  const handleTabChange = (index: number) => {
    setIsUserInteraction(true);
    setActiveIndex(index);
  };

  // Keyboard navigation for tab buttons - must be called unconditionally
  const { getRef, onKeyDown } = useArrowKeyNavigation<HTMLButtonElement>({
    itemCount: validIndustries.length,
    onSelect: handleTabChange,
  });

  // Fix invalid index if needed (use effect to avoid state update during render)
  useEffect(() => {
    if (validIndustries.length > 0 && activeIndex >= validIndustries.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, validIndustries.length]);

  // Track analytics when industry changes due to user interaction
  useEffect(() => {
    // Skip if no valid industry or on initial mount
    if (!activeIndustry || !isUserInteraction || previousIndexRef.current === activeIndex) {
      return;
    }

    try {
      trackEvent('industry_tab_selected', {
        industry: activeIndustry.key,
        industryTitle: activeIndustry.title,
        section: 'use_cases',
      });
    } catch (error) {
      // Analytics failures should not break the UI
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[IndustrySelectorPanel] Analytics tracking failed:', error);
      }
    }

    previousIndexRef.current = activeIndex;
  }, [activeIndex, activeIndustry, isUserInteraction]);

  // Production-safe: Validate industries array and render fallback
  if (validIndustries.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[IndustrySelectorPanel] Invalid industries array:', industries);
    }
    return (
      <Card variant="default" className="p-6">
        <CardContent className="text-center text-muted-foreground">
          <p>Unable to load industry information. Please refresh the page.</p>
        </CardContent>
      </Card>
    );
  }

  // Production-safe: Validate active industry
  if (!activeIndustry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[IndustrySelectorPanel] Invalid active industry at index:', activeIndex);
    }
    return null;
  }

  // Use structured impactMetrics if available, otherwise fall back to empty array
  const metrics = activeIndustry.impactMetrics?.slice(0, MAX_IMPACT_METRICS) ?? [];

  // Determine preview image (prefer new previewImage, fall back to legacy fields)
  const previewImage = activeIndustry.previewImage
    ? activeIndustry.previewImage
    : activeIndustry.previewImageSrc && activeIndustry.previewImageAlt
      ? { src: activeIndustry.previewImageSrc, alt: activeIndustry.previewImageAlt }
      : undefined;

  return (
    <Card variant="highlight" className="overflow-hidden">
      <CardContent className="p-6 lg:p-8">
        <div className="space-y-6 lg:space-y-8">
          {/* Tab switcher - inline implementation for industry selection */}
          <div className="w-full">
            <div
              role="tablist"
              aria-label="Choose an industry"
              className="flex w-full justify-start gap-xs sm:gap-sm"
            >
              {validIndustries.map((industry, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={industry.key}
                    ref={getRef(index)}
                    type="button"
                    role="tab"
                    tabIndex={isActive ? 0 : -1}
                    aria-selected={isActive}
                    aria-controls={`industry-panel-${industry.key}`}
                    id={`tab-${industry.key}`}
                    data-state={isActive ? 'active' : 'inactive'}
                    className={cn(
                      tabButtonVariants({ isActive, preset: 'default' }),
                      // Typography alignment - medium size, visible color, strong weight when active
                      'inline-flex items-center gap-2 px-3 py-2 text-sm text-foreground',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}
                    onClick={() => handleTabChange(index)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                  >
                    {industry.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content panel with transition */}
          <div
            id={`industry-panel-${activeIndustry.key}`}
            role="tabpanel"
            aria-live="polite"
            aria-labelledby={`tab-${activeIndustry.key}`}
            className="min-w-0"
          >
            <div
              ref={contentRef}
              key={activeIndustry.key}
              className={cn(
                'grid gap-6 lg:gap-8',
                'lg:grid-cols-12 lg:items-start',
                // Transition animation - fade + slight slide (respects prefers-reduced-motion via CSS)
                'animate-fadeIn'
              )}
            >
              {/* Left: Narrative + benefits */}
              <div className="lg:col-span-7 min-w-0 space-y-4 lg:space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {activeIndustry.title}
                  </h3>
                  <p className="text-base text-muted-foreground mb-3">
                    {activeIndustry.subtitle}
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {activeIndustry.description}
                  </p>
                </div>

                <ul className="space-y-2" aria-label="Key benefits">
                  {activeIndustry.benefits.slice(0, 3).map((benefit) => (
                    <li key={benefit} className="flex gap-2 text-sm text-foreground">
                      <Check
                        className="h-4 w-4 text-primary mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Outcomes */}
                {metrics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">
                      Typical outcomes
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      aria-label="Impact metrics"
                    >
                      {metrics.map((metric) => (
                        <Badge key={metric} color="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Preview - visible on mobile (stacked) and desktop */}
              <div className="lg:col-span-5">
                <IndustryPreview
                  industryKey={activeIndustry.key}
                  title={activeIndustry.title}
                  {...(previewImage && { previewImage })}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
