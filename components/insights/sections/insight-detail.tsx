/* ------------------------------------------------------------------
   InsightDetail – full article body (moved from marketing sections)
------------------------------------------------------------------- */
"use client";

import {
    INSIGHT_HERO_HEIGHT,
    INSIGHT_HERO_SIZES,
    INSIGHT_HERO_WIDTH,
} from "@/components/insights/constants";
import { useArticleAnalytics } from "@/components/insights/hooks/use-article-analytics";
import { RelatedArticles } from "@/components/insights/widgets/related-articles";
import { SectionHeader } from "@/components/ui/patterns/section-header";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import { headingVariants } from "@/styles/ui/shared/typography-variants";
import type { InsightItem } from "@/types/marketing";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import type { Metadata } from "next";
import Image from "next/image";
import * as React from "react";

interface InsightDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** the article returned by `getInsightBySlug()` */
  initialData: InsightItem;
  /** Optional related articles to display */
  relatedArticles?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    imageUrl?: string;
    categories?: Array<{ name: string }>;
    publishDate?: string;
    author?: { name: string; slug: string };
    readingTime?: number;
  }>;
}

export const InsightDetail = React.forwardRef<
  HTMLDivElement,
  InsightDetailProps
>(({ initialData, relatedArticles = [], className, ...rest }, ref) => {
  const {
    title,
    content, // already rendered HTML from MD-rich-text
    categories,
    publishDate,
    author,
    imageUrl,
  } = initialData;

  const sanitizedContent = React.useMemo(() => {
    try {
      // Ensure target="_blank" links get rel="noopener" for security
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if ((node as unknown as Element).tagName === 'A') {
          const el = node as unknown as HTMLAnchorElement;
          const target = el.getAttribute('target');
          if (target === '_blank') {
            el.setAttribute('rel', 'noopener noreferrer nofollow ugc');
          }
        }
      });

      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p","h1","h2","h3","h4","h5","h6","ul","ol","li","a","strong","em","code","pre","blockquote","br","hr","div","span","img",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title"],
        ADD_ATTR: ["target"],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/)|#)/,
        FORBID_TAGS: ["script", "style"],
      });
    } catch {
      return content;
    }
  }, [content]);

  // Analytics: track view, scroll depth, and time-on-page
  useArticleAnalytics({
    slug: initialData.slug,
    title: initialData.title,
    categories: initialData.categories?.map((c: { name: string }) => c.name) ?? undefined,
    authorName: initialData.author?.name ?? undefined,
    publishDate: initialData.publishDate ?? null,
  });

  return (
    <article
      ref={ref}
      className={cn(
        containerMaxWidthVariants({ maxWidth: '4xl', centered: true }),
        "prose prose-gray max-w-none prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border",
        className,
      )}
      {...rest}
    >
      {/* Note: Structured data is now handled server-side in the page component for better SEO */}

      <header className={cn(headingVariants({ size: 'h1', align: 'center' }), "mb-8")}>
        {/* Article Header */}
        <div className="space-y-4">
          <SectionHeader
            title={title}
            subtitle={publishDate ? format(new Date(publishDate), "MMM d, yyyy") : undefined}
            align="left"
          />

          {author && (
            <div className="flex items-center gap-3">
              {author.avatar && (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-border"
                />
              )}
              <div className="space-y-1">
                <span className="text-sm font-medium text-foreground">Written by</span>
                <p className="text-sm text-muted-foreground">{author.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category: { slug: string; name: string }) => (
              <span
                key={category.slug}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {imageUrl && (
        <div className="relative mb-8 overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={title}
            width={INSIGHT_HERO_WIDTH}
            height={INSIGHT_HERO_HEIGHT}
            sizes={INSIGHT_HERO_SIZES}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      <section
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        className="mx-auto"
      />

      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <RelatedArticles articles={relatedArticles} />
        </div>
      )}
    </article>
  );
});

InsightDetail.displayName = "InsightDetail";

/**
 * Generate metadata for article pages - use in page components
 */
export function generateArticleMetadata(article: InsightItem): Metadata {
  const { title, publishDate, author, imageUrl, categories } = article;

  return {
    title,
    description: (article as any).description ?? `Read ${title} on Corso Insights`,
    authors: author?.name ? [{ name: author.name }] : undefined,
    other: publishDate ? { publishedTime: publishDate } : {},
    openGraph: {
      title,
      description: (article as any).description ?? `Read ${title} on Corso Insights`,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : [{ url: '/logo.svg', alt: 'Corso Logo' }],
      type: 'article',
      publishedTime: publishDate,
      authors: author?.name ? [author.name] : undefined,
      section: categories?.map((cat: { name: string }) => cat.name).join(', '),
      siteName: 'Corso Insights',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: (article as any).description ?? `Read ${title} on Corso Insights`,
      images: imageUrl ? [imageUrl] : ['/logo.svg'],
    },
    alternates: {
      canonical: `/insights/${article.slug}`,
    },
  };
}

export default InsightDetail;


