'use client';

import Link from 'next/link';
import { PillGroup } from '@/components/landing/widgets/pill-group';
import { buttonVariants } from '@/styles/ui/atoms/button-variants';
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import type { UseCaseKey } from '@/lib/marketing/client';
import { useState, useRef } from 'react';

interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
}

interface IndustrySelectorPanelProps {
  industries: Industry[];
}

/**
 * Parses impact string into metric badges.
 * Example: "Agencies report 20–35% more qualified conversations and 10–18% higher close rates."
 * Returns: ["20–35% more qualified conversations", "10–18% higher close rates"]
 */
function parseImpactMetrics(impact: string): string[] {
  // Split on " and " or " & " to get individual metrics
  const parts = impact.split(/\s+and\s+|\s+&\s+/i);
  return parts
    .map((part) => part.trim().replace(/\.$/, '')) // Remove trailing period
    .filter((part) => part.length > 0);
}

export function IndustrySelectorPanel({ industries }: IndustrySelectorPanelProps) {
  const [activeKey, setActiveKey] = useState<UseCaseKey>(industries[0]?.key ?? 'insurance');
  const activeIndustry = industries.find((ind) => ind.key === activeKey) ?? industries[0];
  const metrics = activeIndustry ? parseImpactMetrics(activeIndustry.impact) : [];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle keyboard navigation for vertical tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const itemsCount = industries.length;
    let nextIndex = index;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = (index + 1) % itemsCount;
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + itemsCount) % itemsCount;
      e.preventDefault();
    } else if (e.key === 'Home') {
      nextIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      nextIndex = itemsCount - 1;
      e.preventDefault();
    }

    if (nextIndex !== index) {
      const nextIndustry = industries[nextIndex];
      if (nextIndustry) {
        setActiveKey(nextIndustry.key);
        // Focus the newly selected tab
        setTimeout(() => {
          tabRefs.current[nextIndex]?.focus();
        }, 0);
      }
    }
  };

  // Mobile pill selection handler
  const handlePillSelect = (label: string) => {
    const industry = industries.find((ind) => ind.title === label);
    if (industry) {
      setActiveKey(industry.key);
    }
  };

  if (!activeIndustry) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-xl mt-md">
      {/* Mobile: Horizontal PillGroup */}
      <div className="lg:hidden mb-md">
        <PillGroup
          id="industry-selector-mobile"
          items={industries.map((ind) => ind.title)}
          selected={activeIndustry.title}
          onSelect={handlePillSelect}
          aria-label="Select industry"
        />
      </div>

      {/* Desktop: Vertical Tab List */}
      <div
        className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Industry selection"
      >
        {industries.map((industry, index) => {
          const isSelected = industry.key === activeKey;
          return (
            <button
              key={industry.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`industry-tab-${industry.key}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`industry-panel-${industry.key}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                'px-4 py-2 text-left rounded-md text-base font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'bg-surface-selected text-foreground font-semibold border-l-4 border-primary'
                  : 'bg-transparent text-foreground hover:bg-surface-hover'
              )}
              onClick={() => setActiveKey(industry.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {industry.title}
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div
        id={`industry-panel-${activeKey}`}
        role="tabpanel"
        aria-labelledby={`industry-tab-${activeKey}`}
        aria-live="polite"
        className={cn(
          'flex-1 rounded-lg border border-border bg-surface p-lg shadow-card',
          'lg:min-h-[400px]'
        )}
      >
        <h3 className="text-xl font-bold text-foreground mb-xs">{activeIndustry.title}</h3>
        <p className="text-base text-muted-foreground mb-sm">{activeIndustry.subtitle}</p>
        <p className="text-sm text-foreground mb-sm">{activeIndustry.description}</p>

        <ul className="list-disc pl-5 mb-sm" aria-label="Key benefits">
          {activeIndustry.benefits.slice(0, 3).map((benefit) => (
            <li key={benefit} className="text-sm text-foreground mb-xs">
              {benefit}
            </li>
          ))}
        </ul>

        {/* Impact Metrics as Badges */}
        {metrics.length > 0 && (
          <div className="mb-md flex flex-wrap gap-sm" aria-label="Impact metrics">
            {metrics.map((metric) => (
              <span
                key={metric}
                className="inline-block bg-surface-contrast/10 text-foreground text-xs font-medium rounded-full px-3 py-1"
              >
                {metric}
              </span>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-sm mt-md">
          <Link
            href={APP_LINKS.FOOTER.CONTACT}
            onClick={() => trackNavClick('Talk to sales', APP_LINKS.FOOTER.CONTACT)}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
          >
            Talk to sales
          </Link>
          <Link
            href={APP_LINKS.NAV.SIGNUP}
            onClick={() => trackNavClick('Start free', APP_LINKS.NAV.SIGNUP)}
            className={cn(buttonVariants({ variant: 'cta', size: 'lg' }), 'w-full sm:w-auto')}
          >
            Start free
          </Link>
        </div>
      </div>
    </div>
  );
}

