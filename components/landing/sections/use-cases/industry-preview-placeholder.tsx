'use client';

import { cn } from '@/styles';
import { Building2, Hammer, Package, Shield } from 'lucide-react';
import React from 'react';
import type { UseCaseKey } from '@/lib/marketing/client';
import styles from './use-case-explorer.module.css';

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
 * IndustryPreviewPlaceholder - Enhanced placeholder with sophisticated visual design
 * Features industry-specific theming, layered backgrounds, and mock UI elements
 * to suggest functionality and create visual interest
 */
export function IndustryPreviewPlaceholder({
  industryKey,
  title,
  className,
}: IndustryPreviewPlaceholderProps) {
  const Icon = INDUSTRY_ICONS[industryKey];

  return (
    <div
      className={cn(styles['placeholderContainer'], className)}
      data-industry={industryKey}
      aria-label={`${title} preview placeholder`}
    >
      {/* Top section: Icon + title with enhanced styling */}
      <div className={styles['iconContainer']}>
        <div className={styles['iconWrapper']}>
          <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <p className={styles['iconTitle']}>{title}</p>
      </div>

      {/* Bottom section: Mock UI elements with industry-specific styling */}
      <div className={styles['mockElements']}>
        {/* Mock alert/notification row */}
        <div className={styles['mockRow']} aria-hidden="true">
          <div className={styles['mockIndicator']} />
          <div className={styles['mockBar']} style={{ maxWidth: '60%' }} />
          <div className={styles['mockBadge']} />
        </div>

        {/* Mock data row */}
        <div className={styles['mockRow']} aria-hidden="true">
          <div className={styles['mockIndicator']} />
          <div className={styles['mockBar']} style={{ maxWidth: '55%' }} />
          <div className={styles['mockBadge']} />
        </div>

        {/* Mock insight row */}
        <div className={styles['mockRow']} aria-hidden="true">
          <div className={styles['mockIndicator']} />
          <div className={styles['mockBar']} style={{ maxWidth: '70%' }} />
        </div>
      </div>
    </div>
  );
}

