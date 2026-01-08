'use client';

import { Badge } from '@/components/ui/atoms';
import { cn } from '@/styles';
import type { Industry } from './types';

interface UseCaseCardProps {
  industry: Industry;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  /** Whether this is the last card in an odd-count grid (should span full width on md+) */
  isLastInOddGrid?: boolean;
}

const MAX_VISIBLE_TAGS = 2;

export function UseCaseCard({
  industry,
  isSelected,
  onClick,
  className,
  isLastInOddGrid = false,
}: UseCaseCardProps) {
  // Get tags from impactMetrics (limit to MAX_VISIBLE_TAGS)
  const tags = industry.impactMetrics?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const remainingTagsCount = (industry.impactMetrics?.length ?? 0) - MAX_VISIBLE_TAGS;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base card styles
        'group relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-200',
        'text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Selected state: bg-muted + ring
        isSelected
          ? 'bg-muted border-foreground/20 ring-2 ring-ring ring-offset-2 shadow-md'
          : 'bg-background border-border hover:border-foreground/30 hover:shadow-md',
        // Hover elevation
        'hover:shadow-md hover:-translate-y-0.5',
        // Odd count spanning on md+
        isLastInOddGrid && 'md:col-span-2',
        className
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${industry.title} use case`}
    >
      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {industry.title}
      </h3>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {industry.subtitle}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          {tags.map((tag) => (
            <Badge key={tag} color="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {remainingTagsCount > 0 && (
            <Badge color="secondary" className="text-xs">
              +{remainingTagsCount}
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}
