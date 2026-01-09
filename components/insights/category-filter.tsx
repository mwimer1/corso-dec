'use client';

import { Button } from '@/components/ui/atoms';
import { Select } from '@/components/ui/molecules/select';
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
      <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3', className)}>
        {/* Mobile: Dropdown Select */}
        <div className="md:hidden">
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            aria-label="Filter insights by category"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
                {typeof c.count === 'number' ? ` (${c.count})` : ''}
              </option>
            ))}
          </Select>
        </div>

        {/* Desktop: Horizontal scrollable chips (no wrap) */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            role="tablist"
            aria-label="Filter insights by category"
            className="flex flex-nowrap gap-2 whitespace-nowrap py-1"
          >
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
                    'h-9 rounded-full px-4 text-sm transition flex-shrink-0',
                    'focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  {c.label}
                  {typeof c.count === 'number' ? (
                    <span className="ml-2 inline-flex items-center justify-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {c.count}
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
