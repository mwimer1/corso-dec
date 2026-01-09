'use client';

import { Badge } from '@/components/ui/atoms';
import { Button, Card, CardContent } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS } from '@/lib/shared';
import { cn } from '@/styles';
import type { PreviewTab, UseCase } from './types';
import { SegmentedTabs } from './segmented-tabs';
import styles from './use-case-explorer.module.css';

interface UseCasePreviewPaneProps {
  useCase: UseCase;
  previewTab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  className?: string;
}

const tabOptions: { value: string; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'sample', label: 'Sample record' },
  { value: 'outputs', label: 'Outputs' },
];

export function UseCasePreviewPane({
  useCase,
  previewTab,
  onTabChange,
  className,
}: UseCasePreviewPaneProps) {
  const preview = useCase.preview;

  return (
    <Card className={cn(styles['previewPane'], 'h-full w-full flex flex-col', className)}>
      <CardContent className="p-6 flex flex-col flex-1 min-h-0">
        {/* Header with labels */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Example preview</p>
            <Badge color="default" className="text-xs">
              Sample
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{useCase.title}</h3>
        </div>

        {/* Preview Tabs - Segmented Control */}
        <div className="mb-4">
          <SegmentedTabs
            value={previewTab}
            onValueChange={(v) => onTabChange(v as PreviewTab)}
            items={tabOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            ariaLabel="Preview content tabs"
          />
        </div>

        {/* TOP REGION: header + tabs + tab content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Tab Content */}
          <div className={cn(styles['previewContent'], 'relative flex-1 min-h-0')}>
            <div
              key={previewTab}
              id={`tabpanel-${previewTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${previewTab}`}
              tabIndex={0}
              className={cn(styles['previewTabContent'], 'space-y-4')}
            >
              {/* Dashboard Tab */}
              {previewTab === 'dashboard' && (
                <div className="space-y-4">
                  {/* KPI Surface - Muted */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                      {preview.headline}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {preview.kpis.map((kpi, idx) => (
                        <div key={idx}>
                          <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                          <p className="text-xl font-semibold text-foreground">{kpi.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What you'll do - Muted Surface */}
                  <div className="bg-muted/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold text-foreground">What you'll do</h4>
                      <Badge color="default" className="text-xs">
                        Updated regularly
                      </Badge>
                    </div>
                    <ul className="space-y-2">
                      {preview.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Sample Record Tab */}
              {previewTab === 'sample' && (
                <div className="bg-muted/40 p-4 rounded-xl space-y-3">
                  {preview.sampleRecord.map((field, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <p className="text-xs text-muted-foreground font-medium flex-shrink-0">
                        {field.label}
                      </p>
                      <p className="text-sm text-foreground text-right truncate flex-1">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Outputs Tab */}
              {previewTab === 'outputs' && (
                <div className="bg-muted/40 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Export outputs</h4>
                  <div className="flex flex-wrap gap-2">
                    {useCase.outputs.map((output) => (
                      <Badge key={output} color="default" className="text-xs">
                        {output}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM REGION: divider + CTA footer callout */}
        <div className="mt-auto">
          <div className="border-t border-border my-6 opacity-70" aria-hidden="true" />
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Want to see this in your territory?
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Start with sample data, then apply filters for your market and asset class.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                asChild
                variant="default"
                size="sm"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
