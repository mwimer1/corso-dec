/* ------------------------------------------------------------------
   InsightDetail – full article body (moved from marketing sections)
------------------------------------------------------------------- */
"use client";

import { useArticleAnalytics } from "@/components/insights/hooks/use-article-analytics";
import { ArticleHeader } from "@/components/insights/widgets/article-header";
import { ArticleImage } from "@/components/insights/widgets/article-image";
import { Breadcrumbs } from "@/components/insights/widgets/breadcrumbs";
import { RelatedArticles } from "@/components/insights/widgets/related-articles";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { InsightItem } from "@/types/marketing";
import DOMPurify from "dompurify";
import type { Metadata } from "next";
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
  /** Optional breadcrumb items for navigation */
  breadcrumbs?: Array<{ label: string; href: string }>;
}

export const InsightDetail = React.forwardRef<
  HTMLDivElement,
  InsightDetailProps
>(({ initialData, relatedArticles = [], breadcrumbs, className, ...rest }, ref) => {
  const {
    title,
    content, // already rendered HTML from MD-rich-text
    categories,
    publishDate,
    updatedDate,
    author,
    imageUrl,
    readingTime,
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
        containerMaxWidthVariants({ maxWidth: '3xl', centered: true }),
        // Base prose styles
        "prose prose-gray max-w-none prose-lg",
        // Headings
        "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4",
        "prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
        "prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3",
        "prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2",
        // Paragraphs
        "prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4",
        // Links
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors",
        // Strong and emphasis
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground prose-em:italic",
        // Lists
        "prose-ul:my-6 prose-ul:space-y-2 prose-ul:list-disc prose-ul:pl-6",
        "prose-ol:my-6 prose-ol:space-y-2 prose-ol:list-decimal prose-ol:pl-6",
        "prose-li:text-foreground/90 prose-li:leading-relaxed prose-li:marker:text-primary",
        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-md prose-blockquote:not-italic",
        "prose-blockquote>p:text-foreground/80 prose-blockquote>p:mb-0",
        // Code
        "prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6",
        "prose-pre>code:bg-transparent prose-pre>code:p-0 prose-pre>code:text-sm",
        // Images
        "prose-img:rounded-lg prose-img:shadow-md prose-img:my-8 prose-img:border prose-img:border-border",
        // Horizontal rules
        "prose-hr:border-border prose-hr:my-8",
        // Spacing - responsive vertical spacing
        "space-y-6 sm:space-y-8",
        className,
      )}
      {...rest}
    >
      {/* Note: Structured data is now handled server-side in the page component for better SEO */}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      <ArticleHeader
        title={title}
        {...(publishDate && { publishDate })}
        {...(updatedDate && { updatedDate })}
        {...(readingTime && { readingTime })}
        {...(author && { author })}
        {...(categories && { categories })}
      />

      {imageUrl && (
        <ArticleImage
          src={imageUrl}
          alt={title}
          loading="lazy"
          priority={false}
        />
      )}

      <section
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        className="prose-content"
        aria-label="Article content"
        itemProp="articleBody"
      />

      {relatedArticles.length > 0 && (
        <aside 
          className="pt-8 sm:pt-12 border-t border-border mt-8 sm:mt-12"
          aria-label="Related content"
        >
          <RelatedArticles articles={relatedArticles} />
        </aside>
      )}
    </article>
  );
});

InsightDetail.displayName = "InsightDetail";

/**
 * Generate metadata for article pages - use in page components
 */
export function generateArticleMetadata(article: InsightItem): Metadata {
  const { title, publishDate, author, imageUrl, categories, description } = article;

  return {
    title,
    description: description ?? `Read ${title} on Corso Insights`,
    authors: author?.name ? [{ name: author.name }] : undefined,
    other: publishDate ? { publishedTime: publishDate } : {},
    openGraph: {
      title,
      description: description ?? `Read ${title} on Corso Insights`,
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
      description: description ?? `Read ${title} on Corso Insights`,
      images: imageUrl ? [imageUrl] : ['/logo.svg'],
    },
    alternates: {
      canonical: `/insights/${article.slug}`,
    },
  };
}

export default InsightDetail;


