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
    <div
      aria-label="Insights overview"
      className={cn(
        'relative overflow-hidden',
        className
      )}
    >
      {/* keep H1 for SEO, hide visually */}
      <h1 className="sr-only">Construction Industry Insights</h1>

      {/* soft decorative wash without external libs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-40 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      </div>

      <div className="relative z-10">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-base md:text-lg text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
