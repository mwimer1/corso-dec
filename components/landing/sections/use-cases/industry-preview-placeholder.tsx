'use client';

import { cn } from '@/styles';
import { Building2, Hammer, Package, Shield } from 'lucide-react';
import React from 'react';
import type { UseCaseKey } from '@/lib/marketing/client';
import { industryPreviewContainerVariants } from './use-case-explorer.variants';

interface IndustryPreviewPlaceholderProps {
  industryKey: UseCaseKey;
  title: string;
  className?: string;
}

const INDUSTRY_ICONS: Record<UseCaseKey, React.ElementType> = {
  insurance: Shield,
  suppliers: Package,
  construction: Hammer,
  developers: Building2,
};

/**
 * IndustryPreviewPlaceholder - Designed placeholder that fills preview space
 * Shows industry icon, title, and mock UI elements to suggest functionality
 */
export function IndustryPreviewPlaceholder({
  industryKey,
  title,
  className,
}: IndustryPreviewPlaceholderProps) {
  const Icon = INDUSTRY_ICONS[industryKey];

  return (
    <div
      className={cn(
        industryPreviewContainerVariants(),
        'bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20',
        className
      )}
    >
      {/* Top section: Icon + title */}
      <div className="absolute inset-x-0 top-0 p-6 flex flex-col items-center justify-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-foreground text-center">{title}</p>
      </div>

      {/* Bottom section: Mock UI elements */}
      <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
        {/* Mock alert/notification row */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary/60" aria-hidden="true" />
          <div className="h-3 bg-foreground/10 rounded flex-1 max-w-[60%]" aria-hidden="true" />
          <div className="h-3 bg-primary/20 rounded w-12" aria-hidden="true" />
        </div>

        {/* Mock data row */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success/60" aria-hidden="true" />
          <div className="h-3 bg-foreground/10 rounded flex-1 max-w-[55%]" aria-hidden="true" />
          <div className="h-3 bg-success/20 rounded w-16" aria-hidden="true" />
        </div>

        {/* Mock insight row */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary/60" aria-hidden="true" />
          <div className="h-3 bg-foreground/10 rounded flex-1 max-w-[70%]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

