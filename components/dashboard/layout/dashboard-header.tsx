/** Note: Indirectly consumed via dashboard barrel; allowlisted in unused-exports to avoid FP. */

"use client";

import { cn } from '@/styles';
import * as React from 'react';

type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  sticky?: boolean;
  className?: string;
  /** When rendered directly under the global top bar, nudge up a pixel to avoid a stacked double border. */
  stackedUnderTopbar?: boolean;
};

export function DashboardHeader({ title, subtitle, left, right, sticky = true, className, stackedUnderTopbar = false }: DashboardHeaderProps) {
  return (
    <div
      role="region"
      aria-label="Dashboard header"
      className={cn(
        'w-full border-b bg-white/90 backdrop-blur',
        sticky && 'sticky top-0 z-10',
        stackedUnderTopbar && '-mt-px', // overlap the topbar's bottom border by 1px
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {left ? <div className="shrink-0">{left}</div> : null}
          {(title || subtitle) && (
            <div className="min-w-0">
              {title && <h2 className="text-lg md:text-2xl font-semibold leading-tight truncate">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}

