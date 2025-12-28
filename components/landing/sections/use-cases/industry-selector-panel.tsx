'use client';

import { Badge, Button, Card, CardContent } from '@/components/ui/atoms';
import { TabSwitcher, type TabItem } from '@/components/ui/molecules';
import type { UseCaseKey } from '@/lib/marketing/client';
import { APP_LINKS } from '@/lib/shared';
import { trackEvent, trackNavClick } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { IndustryPreview } from './industry-preview';

interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}

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

  const handleTabChange = (index: number) => {
    setIsUserInteraction(true);
    setActiveIndex(index);
  };

  // Convert industries to TabItem format for TabSwitcher
  const tabs: TabItem[] = validIndustries.map((industry) => ({
    id: industry.key,
    label: industry.title,
  }));

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
          {/* Tab switcher - matches ProductShowcase pattern */}
          <div className="w-full">
            <TabSwitcher
              tabs={tabs}
              active={activeIndex}
              onTabChange={handleTabChange}
              alignment="left"
              variant="default"
              layout="row"
              buttonVariant="default"
              aria-label="Choose an industry"
            />
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

                {/* Outcomes + CTAs */}
                <div className="space-y-4 pt-2">
                  {/* Outcomes block */}
                  {metrics.length > 0 && (
                    <div className="space-y-2">
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

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <Button
                      asLink={APP_LINKS.FOOTER.CONTACT}
                      variant="secondary"
                      onClick={() => trackNavClick('Talk to sales', APP_LINKS.FOOTER.CONTACT)}
                      className="w-full sm:w-auto"
                    >
                      Talk to sales
                    </Button>
                    <Button
                      asLink={APP_LINKS.NAV.SIGNUP}
                      variant="default"
                      onClick={() => trackNavClick('Start for free', APP_LINKS.NAV.SIGNUP)}
                      className="w-full sm:w-auto"
                    >
                      Start for free
                    </Button>
                  </div>
                </div>
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
