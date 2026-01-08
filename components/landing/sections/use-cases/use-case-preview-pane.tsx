'use client';

import { Badge } from '@/components/ui/atoms';
import { Button, Card, CardContent } from '@/components/ui/atoms';
import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS } from '@/lib/shared';
import { cn } from '@/styles';
import type { PreviewTab, UseCase } from './types';
import styles from './use-case-explorer.module.css';

interface UseCasePreviewPaneProps {
  useCase: UseCase;
  previewTab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  className?: string;
}

const tabOptions: { id: PreviewTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sample', label: 'Sample record' },
  { id: 'outputs', label: 'Outputs' },
];

export function UseCasePreviewPane({
  useCase,
  previewTab,
  onTabChange,
  className,
}: UseCasePreviewPaneProps) {
  const preview = useCase.preview;

  return (
    <Card className={cn(styles['previewPane'], className)}>
      <CardContent className="p-6 flex flex-col">
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

        {/* Local Segmented Control - Muted Styling */}
        <div className="mb-4">
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="inline-flex items-center gap-0.5 rounded-lg bg-muted/50 p-1 border border-border"
          >
            {tabOptions.map((opt) => {
              const selected = opt.id === previewTab;
              return (
                <button
                  key={opt.id}
                  role="tab"
                  aria-selected={selected}
                  aria-pressed={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTabChange(opt.id)}
                  className={cn(
                    'relative inline-flex items-center justify-center h-9 px-3 text-xs font-medium rounded-md transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selected
                      ? 'bg-muted text-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={cn(styles['previewContent'], 'relative min-h-[200px] flex-1')}>
          <div key={previewTab} className={cn(styles['previewTabContent'], 'space-y-4')}>
            {/* Dashboard Tab */}
            {previewTab === 'dashboard' && (
              <>
                {/* Dark KPI Card */}
                <Card className="bg-foreground text-background border-0">
                  <CardContent className="p-4">
                    <p className="text-xs text-background/70 mb-3 uppercase tracking-wide">
                      {preview.headline}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {preview.kpis.map((kpi, idx) => (
                        <div key={idx}>
                          <p className="text-xs text-background/70 mb-1">{kpi.label}</p>
                          <p className="text-xl font-semibold text-background">{kpi.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
              </>
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

        {/* CTA Card - Height aligned with left bottom cards */}
        <Card className="mt-6 bg-foreground text-background border-0 lg:h-48 flex flex-col">
          <CardContent className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-semibold text-background mb-2">
                Want to see this in your territory?
              </h4>
              <p className="text-sm text-background/80">
                Start with sample data, then apply filters for your market and asset class.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
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
