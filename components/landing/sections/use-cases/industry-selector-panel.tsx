'use client';

import { Badge, Card, CardContent } from '@/components/ui/atoms';
import type { UseCaseKey } from '@/lib/marketing/client';
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from '@/lib/shared/analytics/track';
import { cn } from '@/styles';
import { buttonVariants } from '@/styles/ui/atoms/button-variants';
import { navbarStyleVariants } from '@/styles/ui/organisms/navbar-variants';
import { Building2, Check, Hammer, Package, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  previewImageSrc?: string;
  previewImageAlt?: string;
}

interface IndustrySelectorPanelProps {
  industries: Industry[];
}

/**
 * Parses impact string into metric badges (limited to 2-3 for cleaner UI).
 * Example: "Agencies report 20–35% more qualified conversations and 10–18% higher close rates."
 * Returns: ["20–35% more qualified conversations", "10–18% higher close rates"]
 */
function parseImpactMetrics(impact: string): string[] {
  // Split on " and " or " & " to get individual metrics
  const parts = impact.split(/\s+and\s+|\s+&\s+/i);
  return parts
    .map((part) => part.trim().replace(/\.$/, '')) // Remove trailing period
    .filter((part) => part.length > 0)
    .slice(0, 3); // Limit to 3 chips max
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
    <div className="rounded-2xl border border-border bg-surface shadow-card p-lg">
      <div className="flex flex-col gap-lg">
        {/* Unified segmented tabs container (Attio-inspired: single container, no individual borders) */}
        <div
          role="tablist"
          aria-orientation="horizontal"
          aria-label="Industry selection"
          className={cn(
            'rounded-xl bg-muted/50 p-1',
            'flex gap-1 overflow-x-auto',
            'lg:grid lg:grid-cols-4 lg:gap-1 lg:overflow-visible'
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
                  'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-primary/20'
                    : 'bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground'
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

            {/* Right: Preview visual + Outcomes + CTAs */}
            <div className="lg:col-span-5 space-y-md">
              {/* Proof visual preview */}
              {activeIndustry.previewImageSrc ? (
                <div className="rounded-xl overflow-hidden bg-muted/30 aspect-[4/3] relative">
                  <Image
                    src={activeIndustry.previewImageSrc}
                    alt={activeIndustry.previewImageAlt || `${activeIndustry.title} preview`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <Card variant="default" className="rounded-xl overflow-hidden">
                  <CardContent className="p-md bg-gradient-to-br from-muted/50 to-muted/30 aspect-[4/3] flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {React.createElement(INDUSTRY_ICONS[activeIndustry.key], {
                          className: 'h-6 w-6 text-primary',
                          'aria-hidden': true,
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {activeIndustry.title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Outcomes block (simplified: chips + one short line) */}
              <div className="space-y-sm">
                <p className="text-sm font-semibold text-foreground">Typical outcomes</p>

                {metrics.length > 0 && (
                  <div className="flex flex-wrap gap-sm" aria-label="Impact metrics">
                    {metrics.map((metric) => (
                      <Badge key={metric} color="secondary" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Single short summary line (avoid repeating chips content) */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeIndustry.impact.split('.')[0]}.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-sm pt-sm">
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

