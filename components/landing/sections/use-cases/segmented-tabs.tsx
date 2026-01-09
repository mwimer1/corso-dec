'use client';

import { cn } from '@/styles';
import React, { useRef, useEffect } from 'react';

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
 * Includes keyboard navigation (Arrow keys, Home, End, Enter/Space).
 */
export function SegmentedTabs({
  value,
  onValueChange,
  items,
  ariaLabel,
  className,
  scrollable = false,
}: SegmentedTabsProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, items.length);
  }, [items.length]);

  const containerClasses = cn(
    'inline-flex items-center gap-1 rounded-full bg-muted/60 p-1',
    scrollable && 'overflow-x-auto pb-2 -mx-1 px-1',
    scrollable && '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
    className
  );

  const focusTab = (index: number) => {
    const button = buttonRefs.current[index];
    button?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      focusTab(nextIndex);
      onValueChange(items[nextIndex]?.value ?? '');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      focusTab(prevIndex);
      onValueChange(items[prevIndex]?.value ?? '');
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(0);
      onValueChange(items[0]?.value ?? '');
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(items.length - 1);
      onValueChange(items[items.length - 1]?.value ?? '');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onValueChange(items[index]?.value ?? '');
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={containerClasses}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        const tabId = `tab-${item.value}`;
        const panelId = `tabpanel-${item.value}`;
        return (
          <button
            key={item.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-pressed={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
