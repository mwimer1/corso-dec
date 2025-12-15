import { Badge } from '@/components/ui/atoms';
import { cn } from '@/styles';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { InsightCardProps } from './types';

export function InsightCard({
  href,
  title,
  excerpt,
  image,
  category,
  author,
  date,
  readingTime,
  variant = 'standard',
  className
}: InsightCardProps & { className?: string }) {
  const displayDate = date ? new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : undefined;

  return (
    <article
      className={cn(
        'group h-full flex flex-col relative overflow-hidden rounded-2xl border border-border bg-card',
        'transition-shadow duration-200 hover:shadow-md focus-within:shadow-md',
        className
      )}
    >
      {image?.src && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {variant === 'overlay' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
          )}
          <Image
            src={image.src}
            alt={image.alt || title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col p-5">
        {category && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge color="secondary" className="rounded-full px-2 py-0 text-xs">
              {category}
            </Badge>
            {displayDate && (
              <>
                <span aria-hidden>•</span>
                <time dateTime={date}>{displayDate}</time>
              </>
            )}
            {readingTime && (
              <>
                <span aria-hidden>•</span>
                <span>{readingTime}</span>
              </>
            )}
          </div>
        )}

        <h3 className="text-lg font-semibold leading-snug flex-1">
          <Link
            href={href}
            className={cn(
              'block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
              variant === 'overlay' ? 'text-white hover:text-white/90' : 'hover:text-primary'
            )}
            aria-label={`Read article: ${title}`}
          >
            <span className={cn(
              'line-clamp-2',
              variant === 'overlay' && 'drop-shadow-lg'
            )}>
              {title}
            </span>
          </Link>
        </h3>

        {excerpt && (
          <p className={cn(
            'mt-2 line-clamp-3 text-sm flex-1',
            variant === 'overlay' ? 'text-white/90' : 'text-muted-foreground'
          )}>
            {excerpt}
          </p>
        )}

        <div className={cn(
          'mt-4 flex items-center gap-2 text-sm font-medium',
          variant === 'overlay' ? 'text-white' : 'text-primary'
        )}>
          <Link
            href={href}
            className="inline-flex items-center gap-1 transition-transform hover:translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Read more <ArrowRight className="h-4 w-4" />
          </Link>
          {author && (
            <span className="ml-auto text-xs text-muted-foreground">
              by <Link
                href={author.href || '#'}
                className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {author.name}
              </Link>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
