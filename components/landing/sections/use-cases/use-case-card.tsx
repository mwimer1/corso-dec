'use client';

import { Badge } from '@/components/ui/atoms';
import { cn } from '@/styles';
import type { UseCase } from './types';

interface UseCaseCardProps {
  useCase: UseCase;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const MAX_VISIBLE_TAGS = 2;

export function UseCaseCard({
  useCase,
  isSelected,
  onClick,
  className,
}: UseCaseCardProps) {
  // Get tags from outputs (limit to MAX_VISIBLE_TAGS)
  const tags = useCase.outputs.slice(0, MAX_VISIBLE_TAGS);
  const remainingTagsCount = useCase.outputs.length - MAX_VISIBLE_TAGS;
  const Icon = useCase.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base card styles
        'group relative flex flex-col gap-3 p-5 rounded-xl border transition-colors transition-shadow duration-200',
        'text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Selected state: bg-muted + subtle ring
        isSelected
          ? 'bg-muted/40 border-foreground/20 ring-1 ring-ring/20 shadow-md'
          : 'bg-background border-border hover:border-foreground/30 hover:shadow-md',
        className
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${useCase.title} workflow`}
    >
      {/* Icon Container */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {useCase.title}
          </h3>
        </div>
      </div>

      {/* One-liner */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {useCase.oneLiner}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mt-auto min-h-[1.5rem]">
        {tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <Badge key={tag} color="default" className="text-xs rounded-full">
                {tag}
              </Badge>
            ))}
            {remainingTagsCount > 0 && (
              <Badge color="default" className="text-xs rounded-full">
                +{remainingTagsCount} more
              </Badge>
            )}
          </>
        ) : (
          <span className="sr-only">No tags</span>
        )}
      </div>
    </button>
  );
}
