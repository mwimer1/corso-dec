'use client';

import { Badge, Card, CardContent } from '@/components/ui/atoms';
import { trackEvent } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { useEffect, useRef, useState } from 'react';
import type { Industry, PreviewTab } from './types';
import { UseCaseCard } from './use-case-card';
import styles from './use-case-explorer.module.css';
import { UseCasePreviewPane } from './use-case-preview-pane';

interface IndustrySelectorPanelProps {
  industries: Industry[];
}

export function IndustrySelectorPanel({ industries }: IndustrySelectorPanelProps) {
  // Default to developers industry (first in desired order)
  const [activeIndustryId, setActiveIndustryId] = useState<string>('developers');
  const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('dashboard');
  const [isUserInteraction, setIsUserInteraction] = useState(false);
  const previousIndustryRef = useRef<string>('');

  // Get valid industries array
  const validIndustries = industries && industries.length > 0 ? industries : [];
  const activeIndustry = validIndustries.find((ind) => ind.id === activeIndustryId) ?? validIndustries[0] ?? null;

  // Set default use case when industry changes
  useEffect(() => {
    if (activeIndustry && activeIndustry.useCases.length > 0) {
      const firstUseCase = activeIndustry.useCases[0];
      if (firstUseCase && (!activeUseCaseId || !activeIndustry.useCases.find((uc) => uc.id === activeUseCaseId))) {
        setActiveUseCaseId(firstUseCase.id);
        setPreviewTab('dashboard'); // Reset to dashboard tab
      }
    }
  }, [activeIndustry, activeUseCaseId]);

  const activeUseCase = activeIndustry?.useCases.find((uc) => uc.id === activeUseCaseId) ?? activeIndustry?.useCases[0] ?? null;

  const handleIndustryClick = (industryId: string) => {
    setIsUserInteraction(true);
    setActiveIndustryId(industryId);
    setActiveUseCaseId(null); // Will be set by useEffect
  };

  const handleUseCaseClick = (useCaseId: string) => {
    setIsUserInteraction(true);
    setActiveUseCaseId(useCaseId);
    setPreviewTab('dashboard'); // Reset to dashboard when use case changes
  };

  // Track analytics when industry changes
  useEffect(() => {
    if (!activeIndustry || !isUserInteraction || previousIndustryRef.current === activeIndustryId) {
      return;
    }

    try {
      trackEvent('industry_tab_selected', {
        industry: activeIndustry.id,
        industryTitle: activeIndustry.label,
        section: 'use_cases',
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[IndustrySelectorPanel] Analytics tracking failed:', error);
      }
    }

    previousIndustryRef.current = activeIndustryId;
  }, [activeIndustryId, activeIndustry, isUserInteraction]);

  // Production-safe: Validate industries array
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

  if (!activeIndustry || !activeUseCase) {
    return null;
  }

  return (
    <div className={cn(styles['selectorPanel'], 'space-y-6')}>
      {/* Industry Tabs Row */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Choose your industry · <span className="text-foreground font-medium">{activeIndustry.label}</span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {activeIndustry.quickProof.map((proof) => (
              <Badge key={proof} color="default" className="text-xs rounded-full px-3 py-1">
                {proof}
              </Badge>
            ))}
          </div>
        </div>
        {/* Horizontal scrollable tabs */}
        <div className={cn(styles['industryTabs'], 'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1')}>
          {validIndustries.map((industry) => (
            <button
              key={industry.id}
              type="button"
              onClick={() => handleIndustryClick(industry.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeIndustryId === industry.id
                  ? 'bg-muted/60 border border-foreground/30 text-foreground font-semibold'
                  : 'bg-background border border-border text-foreground hover:border-foreground/20 hover:bg-muted/60'
              )}
              aria-pressed={activeIndustryId === industry.id}
              aria-label={`Select ${industry.label} industry`}
            >
              {industry.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className={cn(styles['mainLayout'])}>
        {/* Left Pane - Industry Card with Workflows */}
        <Card className={cn(styles['cardGridContainer'], 'flex flex-col h-full')}>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col min-h-0">
            {/* Section Title/Subtitle */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                {activeIndustry.tagline}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeIndustry.helperLine}
              </p>
            </div>

            {/* Workflow Cards Grid */}
            <div className={cn(styles['cardGrid'], 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2')}>
              {activeIndustry.useCases.map((useCase) => (
                <UseCaseCard
                  key={useCase.id}
                  useCase={useCase}
                  isSelected={activeUseCaseId === useCase.id}
                  onClick={() => handleUseCaseClick(useCase.id)}
                />
              ))}
            </div>

            {/* Problem and Help Sections - Bottom Left (anchored to bottom) */}
            <div className="mt-auto">
              <div className="border-t border-border my-6 opacity-70" aria-hidden="true" />
              <div className={cn(styles['problemHelpSection'], 'space-y-3 lg:grid lg:grid-cols-2 lg:gap-4')}>
                {/* The Problem */}
                <div className={cn(styles['problemHelpCard'], 'p-4 rounded-lg bg-muted/30 lg:h-48')}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">The problem</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activeUseCase.pain}
                  </p>
                </div>

                {/* How Corso helps */}
                <div className={cn(styles['problemHelpCard'], 'p-4 rounded-lg bg-muted/30 lg:h-48')}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">How Corso helps</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activeUseCase.howCorsoHelps}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Pane - Preview (Desktop) */}
        <div className={cn(styles['previewPaneDesktop'], 'hidden lg:flex')}>
          <UseCasePreviewPane
            useCase={activeUseCase}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
            className="h-full"
          />
        </div>
      </div>

      {/* Preview Pane - Mobile Accordion */}
      <details className={cn(styles['previewAccordion'], 'lg:hidden')} open={false}>
        <summary className={cn(styles['previewAccordionSummary'], 'cursor-pointer list-none')}>
          <span className="text-sm font-semibold text-foreground">
            Preview: {activeUseCase.title}
          </span>
        </summary>
        <div className={cn(styles['previewAccordionContent'], 'mt-4')}>
          <UseCasePreviewPane
            useCase={activeUseCase}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      </details>
    </div>
  );
}
