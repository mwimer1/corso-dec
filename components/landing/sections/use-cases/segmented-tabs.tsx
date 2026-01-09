'use client';

import { cn } from '@/styles';
import React from 'react';

interface SegmentedTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
  /** Whether tabs should scroll horizontally (for mobile) */
  scrollable?: boolean;
}

/**
 * SegmentedTabs - Consistent segmented control pattern for industry and preview tabs.
 * Uses rounded-full pills with muted background, matching the design system.
 */
export function SegmentedTabs({
  value,
  onValueChange,
  items,
  ariaLabel,
  className,
  scrollable = false,
}: SegmentedTabsProps) {
  const containerClasses = cn(
    'inline-flex items-center gap-1 rounded-full bg-muted/60 p-1',
    scrollable && 'overflow-x-auto pb-2 -mx-1 px-1',
    scrollable && '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
    className
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={containerClasses}
    >
      {items.map((item) => {
        const selected = item.value === value;
        const tabId = `tab-${item.value}`;
        const panelId = `tabpanel-${item.value}`;
        return (
          <button
            key={item.value}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-pressed={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected
                ? 'bg-muted border-foreground/30 text-foreground font-semibold'
                : 'bg-background border-border text-foreground hover:border-foreground/20 hover:bg-muted/60'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
