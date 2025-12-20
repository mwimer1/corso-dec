'use client';

import type { UseCaseKey } from '@/lib/marketing/client';
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { buttonVariants } from '@/styles/ui/atoms/button-variants';
import { navbarStyleVariants } from '@/styles/ui/organisms/navbar-variants';
import { Building2, Check, Hammer, Package, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

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

  const INDUSTRY_ICONS: Record<UseCaseKey, React.ElementType> = {
    insurance: Shield,
    suppliers: Package,
    construction: Hammer,
    developers: Building2,
  };

  // Handle keyboard navigation for horizontal tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const itemsCount = industries.length;
    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % itemsCount;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
        // Focus the newly selected tab and scroll into view on mobile
        setTimeout(() => {
          tabRefs.current[nextIndex]?.focus();
          tabRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }, 0);
      }
    }
  };

  if (!activeIndustry) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card p-lg">
      <div className="flex flex-col gap-lg">
        {/* Unified segmented tabs (mobile scroll, desktop grid) */}
        <div
          role="tablist"
          aria-orientation="horizontal"
          aria-label="Industry selection"
          className={cn(
            'flex gap-sm overflow-x-auto pb-2 -mx-2 px-2',
            'lg:mx-0 lg:px-0 lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-sm'
          )}
        >
          {industries.map((industry, index) => {
            const isSelected = industry.key === activeKey;
            const Icon = INDUSTRY_ICONS[industry.key];
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
                  'flex items-center justify-center lg:justify-start gap-2',
                  'whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-foreground border-border hover:bg-surface-hover hover:border-border'
                )}
                onClick={() => setActiveKey(industry.key)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <Icon className="h-4 w-4 opacity-90" aria-hidden="true" />
                <span>{industry.title}</span>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div
          id={`industry-panel-${activeKey}`}
          role="tabpanel"
          aria-labelledby={`industry-tab-${activeKey}`}
          aria-live="polite"
          className="min-w-0"
        >
          <div className="grid gap-xl lg:grid-cols-12 lg:items-start">
            {/* Left: Narrative + benefits */}
            <div className="lg:col-span-7 min-w-0">
              <h3 className="text-2xl font-bold text-foreground mb-xs">{activeIndustry.title}</h3>
              <p className="text-base text-muted-foreground mb-sm">{activeIndustry.subtitle}</p>
              <p className="text-sm text-foreground/90 mb-md">{activeIndustry.description}</p>

              <ul className="space-y-xs" aria-label="Key benefits">
                {activeIndustry.benefits.slice(0, 3).map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-[2px]" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Outcomes + CTAs */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border bg-background p-md">
                <p className="text-sm font-semibold text-foreground mb-sm">Typical outcomes</p>

                {metrics.length > 0 && (
                  <div className="flex flex-wrap gap-sm" aria-label="Impact metrics">
                    {metrics.map((metric) => (
                      <span
                        key={metric}
                        className="inline-flex items-center rounded-full border border-border bg-surface-hover px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-sm text-sm text-muted-foreground">{activeIndustry.impact}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-sm mt-md">
                <Link
                  href={APP_LINKS.FOOTER.CONTACT}
                  onClick={() => trackNavClick('Talk to sales', APP_LINKS.FOOTER.CONTACT)}
                  className={cn(
                    buttonVariants({ variant: 'secondary' }),
                    navbarStyleVariants().button(),
                    'w-full sm:w-auto'
                  )}
                >
                  Talk to sales
                </Link>
                <Link
                  href={APP_LINKS.NAV.SIGNUP}
                  onClick={() => trackNavClick('Start for free', APP_LINKS.NAV.SIGNUP)}
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    navbarStyleVariants().button(),
                    'w-full sm:w-auto'
                  )}
                >
                  Start for free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

