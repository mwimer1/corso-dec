"use client";

import { cn } from '@/styles';

type Variant = 'radial' | 'grid' | 'bands' | 'radial-grid';
type Props = {
  variant?: Variant;
  className?: string;
  /** Intensity knob (0–1). We convert to CSS var; default tuned for marketing surfaces. */
  intensity?: number;
};

export function SectionSurface({ variant = 'radial-grid', className, intensity = 0.06 }: Props) {
  const classes = cn(
    'pointer-events-none absolute inset-0 isolate section-surface',
    variant === 'radial' && 'section-surface--radial',
    variant === 'grid' && 'section-surface--grid',
    variant === 'bands' && 'section-surface--bands',
    variant === 'radial-grid' && 'section-surface--radial section-surface--grid',
    className,
  );

  return (
    <div aria-hidden className={classes} style={{ ['--pattern-alpha' as any]: String(intensity) }} />
  );
}


