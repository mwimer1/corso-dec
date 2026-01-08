'use client';

import { Badge } from '@/components/ui/atoms';
import { Button, Card, CardContent } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { APP_LINKS } from '@/lib/shared';
import { cn } from '@/styles';
import { useState } from 'react';
import { IndustryPreview } from './industry-preview';
import type { Industry } from './types';
import styles from './use-case-explorer.module.css';

type PreviewTab = 'dashboard' | 'sample' | 'outputs';

interface UseCasePreviewPaneProps {
  industry: Industry;
  className?: string;
}

/**
 * UI-only mapping for preview tab content, metrics, and actions
 * This doesn't modify the DEFAULT_USE_CASES schema to keep validation intact
 */
const PREVIEW_TAB_CONTENT: Record<string, {
  dashboard: { title: string; description: string };
  sample: { title: string; description: string };
  outputs: { title: string; description: string };
  metrics?: {
    label1: string; value1: string;
    label2: string; value2: string;
    label3: string; value3: string;
  };
  actions?: string[];
}> = {
  insurance: {
    dashboard: {
      title: 'Insurance Dashboard',
      description: 'Real-time permit alerts with owner enrichment and territory routing.',
    },
    sample: {
      title: 'Sample Record',
      description: 'New construction permit for 123 Main St. Owner: John Smith. Estimated value: $250K.',
    },
    outputs: {
      title: 'Outputs',
      description: 'Automated alerts, enriched contact data, and routed leads to assigned agents.',
    },
    metrics: {
      label1: 'New permits (30d)',
      value1: '412',
      label2: 'Total job value',
      value2: '$128.4M',
      label3: 'Top GC share',
      value3: '18%',
    },
    actions: [
      'Track new construction permits by city, zip, and corridor',
      'See scope/value changes over time',
      'Drill into contractors + owners to build an outreach list',
    ],
  },
  suppliers: {
    dashboard: {
      title: 'Suppliers Dashboard',
      description: 'Track contractor permit activity and project opportunities by region.',
    },
    sample: {
      title: 'Sample Record',
      description: 'Remodel permit for ABC Construction. Project type: Kitchen renovation. Value: $45K.',
    },
    outputs: {
      title: 'Outputs',
      description: 'Contractor activity reports, project timelines, and quote opportunities.',
    },
    metrics: {
      label1: 'Active contractors',
      value1: '1,247',
      label2: 'Project opportunities',
      value2: '$89.2M',
      label3: 'Quote win rate',
      value3: '24%',
    },
    actions: [
      'Monitor contractor permit activity by region',
      'Identify project opportunities early',
      'Track share-of-wallet by contractor',
    ],
  },
  construction: {
    dashboard: {
      title: 'Construction Dashboard',
      description: 'Find active projects by trade and territory with lead scoring.',
    },
    sample: {
      title: 'Sample Record',
      description: 'Electrical permit for XYZ Builders. Trade: Electrical. Status: Approved.',
    },
    outputs: {
      title: 'Outputs',
      description: 'Trade-matched leads, project details, and follow-up reminders.',
    },
    metrics: {
      label1: 'Active projects',
      value1: '892',
      label2: 'Total project value',
      value2: '$156.8M',
      label3: 'Lead conversion',
      value3: '22%',
    },
    actions: [
      'Find active projects by trade and territory',
      'Score leads by project value and timing',
      'Auto-route and track follow-ups',
    ],
  },
  developers: {
    dashboard: {
      title: 'Developers Dashboard',
      description: 'Market intelligence and development opportunity tracking.',
    },
    sample: {
      title: 'Sample Record',
      description: 'New development permit. Zoning: Commercial. Units: 12. Value: $2.5M.',
    },
    outputs: {
      title: 'Outputs',
      description: 'Market trend reports, competitive analysis, and investment timing insights.',
    },
    metrics: {
      label1: 'New developments',
      value1: '234',
      label2: 'Total investment',
      value2: '$342.1M',
      label3: 'Market growth',
      value3: '28%',
    },
    actions: [
      'Identify development opportunities early',
      'Track market trends and competitive activity',
      'Assess property values and investment timing',
    ],
  },
};

export function UseCasePreviewPane({ industry, className }: UseCasePreviewPaneProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');

  const tabContent = PREVIEW_TAB_CONTENT[industry.key] ?? PREVIEW_TAB_CONTENT['insurance'];

  // Determine preview image (prefer new previewImage, fall back to legacy fields)
  const previewImage = industry.previewImage
    ? industry.previewImage
    : industry.previewImageSrc && industry.previewImageAlt
      ? { src: industry.previewImageSrc, alt: industry.previewImageAlt }
      : undefined;

  const tabOptions = [
    { id: 'dashboard' as PreviewTab, label: 'Dashboard' },
    { id: 'sample' as PreviewTab, label: 'Sample record' },
    { id: 'outputs' as PreviewTab, label: 'Outputs' },
  ];

  const currentContent = tabContent?.[activeTab] ?? tabContent?.dashboard ?? { title: '', description: '' };
  const metrics = tabContent?.metrics;
  const actions = tabContent?.actions ?? [];

  return (
    <Card className={cn(styles['previewPane'], className)}>
      <CardContent className="p-6">
        {/* Header with labels */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Example preview</p>
            <Badge color="secondary" className="text-xs">
              Sample
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{industry.title}</h3>
        </div>

        {/* Segmented Control */}
        <div className="mb-4">
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            options={tabOptions}
          />
        </div>

        {/* Tab Content with animated transitions */}
        <div className={cn(styles['previewContent'], 'relative min-h-[200px]')}>
          <div
            key={activeTab}
            className={cn(styles['previewTabContent'], 'space-y-4')}
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                {currentContent.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentContent.description}
              </p>
            </div>

            {/* Metrics Card (for dashboard tab) */}
            {activeTab === 'dashboard' && metrics && (
              <Card className="bg-foreground text-background border-0">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-background/70 mb-1">{metrics.label1}</p>
                      <p className="text-xl font-semibold text-background">{metrics.value1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-background/70 mb-1">{metrics.label2}</p>
                      <p className="text-xl font-semibold text-background">{metrics.value2}</p>
                    </div>
                    <div>
                      <p className="text-xs text-background/70 mb-1">{metrics.label3}</p>
                      <p className="text-xl font-semibold text-background">{metrics.value3}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview Image - Only render if preview image exists */}
            {previewImage && (
              <div className="mt-4">
                <IndustryPreview
                  industryKey={industry.key}
                  title={industry.title}
                  previewImage={previewImage}
                />
              </div>
            )}
          </div>
        </div>

        {/* What you'll do section */}
        {activeTab === 'dashboard' && actions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-foreground">What you'll do</h4>
              <Badge color="secondary" className="text-xs">
                Updated regularly
              </Badge>
            </div>
            <ul className="space-y-2">
              {actions.map((action) => (
                <li key={action} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Card */}
        <Card className="mt-6 bg-foreground text-background border-0">
          <CardContent className="p-5">
            <h4 className="text-base font-semibold text-background mb-2">
              Want to see this in your territory?
            </h4>
            <p className="text-sm text-background/80 mb-4">
              Start with sample data, then apply filters for your market and asset class.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <LinkTrack
                  href={APP_LINKS.NAV.SIGNUP}
                  label="use-case-preview:start-free"
                  target="_blank"
                >
                  Start free
                </LinkTrack>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-background/30 text-background hover:bg-background/10"
              >
                <LinkTrack
                  href={APP_LINKS.NAV.BOOK_DEMO}
                  label="use-case-preview:talk-to-sales"
                  target="_blank"
                >
                  Talk to sales
                </LinkTrack>
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
