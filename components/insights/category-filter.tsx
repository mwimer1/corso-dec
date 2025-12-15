'use client';

import { Button } from '@/components/ui/atoms';
import { cn } from '@/styles';
import * as React from 'react';

const { useCallback, useMemo } = React;

export type Category = { key: string; label: string; count?: number };

type Props = {
  categories: Category[];
  value: string;                   // active key ('all', etc.)
  onChange: (key: string) => void; // setter
  className?: string;
  stickyOffsetClassName?: string;  // e.g., 'top-14'
};

export function CategoryFilter({
  categories,
  value,
  onChange,
  className,
  stickyOffsetClassName = 'top-14',
}: Props) {
  const keys = useMemo(() => categories.map(c => c.key), [categories]);

  const handleArrow = useCallback((current: string, dir: 1 | -1) => {
    const idx = keys.indexOf(current);
    if (idx === -1) return;
    const next = (idx + dir + keys.length) % keys.length;
    const nextKey = keys[next];
    if (nextKey !== undefined) {
      onChange(nextKey);
    }
  }, [keys, onChange]);

  return (
    <div className={cn('sticky z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60', stickyOffsetClassName)}>
      <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 border-b border-border', className)}>
        <div role="tablist" aria-label="Filter insights by category" className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c.key === value;
            return (
              <Button
                key={c.key}
                id={`category-tab-${c.key}`}
                role="tab"
                aria-selected={active}
                aria-controls="insights-panel"
                onClick={() => onChange(c.key)}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); handleArrow(c.key, 1); }
                  if (e.key === 'ArrowLeft')  { e.preventDefault(); handleArrow(c.key, -1); }
                }}
                variant={active ? 'default' : 'secondary'}
                className={cn(
                  'h-9 rounded-full px-4 text-sm transition',
                  'focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                {c.label}
                {typeof c.count === 'number' ? (
                  <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-background px-1 text-xs text-muted-foreground border border-border">
                    {c.count}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
