'use client';

import { Badge, Card, CardContent } from '@/components/ui/atoms';
import { trackEvent } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Industry } from './types';
import { UseCaseCard } from './use-case-card';
import { UseCasePreviewPane } from './use-case-preview-pane';
import styles from './use-case-explorer.module.css';

interface IndustrySelectorPanelProps {
  industries: Industry[];
}

export function IndustrySelectorPanel({ industries }: IndustrySelectorPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserInteraction, setIsUserInteraction] = useState(false);
  const previousIndexRef = useRef<number>(0);

  // Get valid industries array (default to empty if invalid)
  const validIndustries = industries && industries.length > 0 ? industries : [];
  const activeIndustry = validIndustries[activeIndex] ?? validIndustries[0] ?? null;

  // Check if we have an odd number of industries (for spanning logic)
  const isOddCount = validIndustries.length % 2 !== 0;

  const handleCardClick = (index: number) => {
    setIsUserInteraction(true);
    setActiveIndex(index);
  };

  const handleTabClick = (index: number) => {
    setIsUserInteraction(true);
    setActiveIndex(index);
  };

  // Fix invalid index if needed
  useEffect(() => {
    if (validIndustries.length > 0 && activeIndex >= validIndustries.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, validIndustries.length]);

  // Track analytics when industry changes due to user interaction
  useEffect(() => {
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
      <div className="p-6 text-center text-muted-foreground">
        <p>Unable to load industry information. Please refresh the page.</p>
      </div>
    );
  }

  // Production-safe: Validate active industry
  if (!activeIndustry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[IndustrySelectorPanel] Invalid active industry at index:', activeIndex);
    }
    return null;
  }

  return (
    <div className={cn(styles['selectorPanel'], 'space-y-8')}>
      {/* Industry Tabs Row */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Choose your industry · <span className="text-foreground font-medium">{activeIndustry.title}</span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge color="secondary" className="text-xs">
              Texas statewide
            </Badge>
            <Badge color="secondary" className="text-xs">
              Updated regularly
            </Badge>
            <Badge color="secondary" className="text-xs">
              Export-ready
            </Badge>
          </div>
        </div>
        {/* Horizontal scrollable tabs */}
        <div className={cn(styles['industryTabs'], 'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1')}>
          {validIndustries.map((industry, index) => (
            <button
              key={industry.key}
              type="button"
              onClick={() => handleTabClick(index)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeIndex === index
                  ? 'bg-muted text-foreground border-2 border-foreground font-semibold shadow-sm'
                  : 'bg-background text-foreground border-2 border-border hover:border-foreground/30 hover:bg-muted/60'
              )}
              aria-pressed={activeIndex === index}
              aria-label={`Select ${industry.title} industry`}
            >
              {industry.title}
            </button>
          ))}
        </div>
      </div>

      {/* Left Pane Container - Card Grid with Section Title */}
      <Card className={cn(styles['cardGridContainer'])}>
        <CardContent className="p-5 space-y-4">
          {/* Section Title/Subtitle */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
              Spot demand early and de-risk site selection with real permit signals.
            </h3>
            <p className="text-sm text-muted-foreground">
              Tap a workflow to see an example preview and the artifacts you can export.
            </p>
          </div>

          {/* Use Case Cards Grid */}
          <div className={cn(styles['cardGrid'], 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2')}>
            {validIndustries.map((industry, index) => {
              const isLast = index === validIndustries.length - 1;
              const isLastInOddGrid = isOddCount && isLast;

              return (
                <UseCaseCard
                  key={industry.key}
                  industry={industry}
                  isSelected={activeIndex === index}
                  onClick={() => handleCardClick(index)}
                  isLastInOddGrid={isLastInOddGrid}
                />
              );
            })}
          </div>

          {/* Problem and Help Sections - Bottom Left */}
          <div className={cn(styles['problemHelpSection'], 'space-y-3')}>
            {/* The Problem */}
            <div className={cn(styles['problemHelpCard'], 'p-4 rounded-lg bg-muted/50')}>
              <h4 className="text-sm font-semibold text-foreground mb-2">The problem</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeIndustry.description}
              </p>
            </div>

            {/* How Corso helps */}
            <div className={cn(styles['problemHelpCard'], 'p-4 rounded-lg bg-muted/50')}>
              <h4 className="text-sm font-semibold text-foreground mb-2">How Corso helps</h4>
              <ul className="space-y-2" aria-label="Key benefits">
                {activeIndustry.benefits.slice(0, 3).map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Pane - Right (Desktop) / Accordion (Mobile) */}
      <details className={cn(styles['previewAccordion'], 'lg:hidden')} open={false}>
        <summary className={cn(styles['previewAccordionSummary'], 'cursor-pointer list-none')}>
          <span className="text-sm font-semibold text-foreground">
            Preview: {activeIndustry.title}
          </span>
        </summary>
        <div className={cn(styles['previewAccordionContent'], 'mt-4')}>
          <UseCasePreviewPane industry={activeIndustry} />
        </div>
      </details>

      {/* Desktop Preview Pane - Sticky */}
      <div className={cn(styles['previewPaneDesktop'], 'hidden lg:block')}>
        <UseCasePreviewPane industry={activeIndustry} />
      </div>
    </div>
  );
}
