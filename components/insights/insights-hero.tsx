import { cn } from '@/styles';
import type { ReactNode } from 'react';

type Props = {
  title: string;        // visual headline (H2)
  eyebrow?: string;     // small overline, e.g., "Insights"
  description?: ReactNode;
  className?: string;
};

export function InsightsHero({ title, eyebrow = 'Insights', description, className }: Props) {
  return (
    <section
      aria-label="Insights overview"
      className={cn(
        'relative py-12 md:py-16',
        'bg-muted/20 rounded-2xl border border-border',
        'overflow-hidden',
        className
      )}
    >
      {/* keep H1 for SEO, hide visually */}
      <h1 className="sr-only">Construction Industry Insights</h1>

      {/* soft decorative wash without external libs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-40 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-base md:text-lg text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
