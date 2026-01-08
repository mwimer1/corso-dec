'use client';

import { IndustrySelectorPanel } from './industry-selector-panel';
import { STREAMLINED_INDUSTRIES } from './use-cases.data';
import styles from './use-case-explorer.module.css';
import { cn } from '@/styles';

export default function IndustryExplorer() {
  return (
    <div className={cn(styles['useCaseExplorer'], 'space-y-md')}>
      {/* Header */}
      <div className="space-y-3">
        <h2 id="use-cases-title" className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Workflows that turn permits into{' '}
          <span className="relative inline-block">
            <span className="relative z-10">action</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 right-0 z-0 h-1.5 rounded-full bg-primary/70"
            />
          </span>
          .
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Pick your industry. Explore the workflows Corso supports—what you'll do, what you'll see, and what you can export.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-4" aria-hidden="true" />

      <IndustrySelectorPanel industries={STREAMLINED_INDUSTRIES} />
    </div>
  );
}
