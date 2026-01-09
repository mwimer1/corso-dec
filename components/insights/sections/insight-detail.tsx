/* ------------------------------------------------------------------
   InsightDetail – full article body (moved from marketing sections)
------------------------------------------------------------------- */
"use client";

import { useArticleAnalytics } from "@/components/insights/hooks/use-article-analytics";
import { resolveInsightImageUrl } from "@/components/insights/utils/image-resolver";
import { BackToTopButton } from "@/components/insights/widgets/article-utilities";
import { InsightHeaderBlock } from "@/components/insights/widgets/insight-header-block";
import { RelatedArticles } from "@/components/insights/widgets/related-articles";
import { TableOfContents } from "@/components/insights/widgets/table-of-contents";
import { cn } from "@/styles";
import { containerMaxWidthVariants, containerWithPaddingVariants } from "@/styles/ui/shared";
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

// NOTE: Do not add page-level CTAs to InsightDetail.
// The canonical marketing CTA is FooterCTA, rendered via:
// PublicLayout → FooterSystem → FooterCTA
// See: components/ui/organisms/footer-system/footer-cta.tsx

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
    keyTakeaways,
  } = initialData;

  // Setup DOMPurify hook once (idempotent - safe to call multiple times)
  React.useEffect(() => {
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
  }, []);

  // Base sanitization - deterministic, works on both server and client
  const baseSanitizedContent = React.useMemo(() => {
    try {
      let sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p","h1","h2","h3","h4","h5","h6","ul","ol","li","a","strong","em","code","pre","blockquote","br","hr","div","span","img",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title", "id"],
        ADD_ATTR: ["target"],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/)|#)/,
        FORBID_TAGS: ["script", "style"],
      });

      return sanitized;
    } catch {
      return content;
    }
  }, [content]);

  // Process content with DOM manipulation (client-side only to avoid hydration mismatch)
  const [sanitizedContent, setSanitizedContent] = React.useState(baseSanitizedContent);

  React.useEffect(() => {
    // Only process on client-side to avoid hydration mismatch
    if (typeof window === 'undefined' || !window.DOMParser) {
      return;
    }

    try {
      // Generate slug from heading text
      const generateSlug = (text: string): string => {
        return text
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
          .replace(/-+/g, '-') // Collapse repeated -
          .replace(/^-|-$/g, ''); // Strip leading/trailing -
      };

      // Ensure unique ID within document
      const ensureUniqueId = (baseId: string, usedIds: Set<string>, index: number): string => {
        if (!baseId) {
          return `section-${index}`;
        }
        
        let candidate = baseId;
        let counter = 2;
        
        while (usedIds.has(candidate)) {
          candidate = `${baseId}-${counter}`;
          counter++;
        }
        
        usedIds.add(candidate);
        return candidate;
      };

      const parser = new DOMParser();
      const doc = parser.parseFromString(baseSanitizedContent, "text/html");

      // De-dupe: Remove "Key takeaways" section from HTML if keyTakeaways exists
      if (keyTakeaways && keyTakeaways.length > 0) {
        const headings = doc.querySelectorAll("h2");
        
        for (const heading of headings) {
          const text = heading.textContent?.trim() || "";
          // Case-insensitive match for "Key takeaways" or similar variations
          if (/key\s+takeaways?/i.test(text)) {
            // Collect elements to remove: heading + all siblings until next H2
            const elementsToRemove: Element[] = [heading];
            let current: Element | null = heading.nextElementSibling;
            
            while (current && current.tagName !== "H2") {
              const next = current.nextElementSibling;
              elementsToRemove.push(current);
              current = next;
            }
            
            // Remove all collected elements
            const parent = heading.parentElement;
            if (parent) {
              elementsToRemove.forEach((el) => {
                parent.removeChild(el);
              });
            }
            
            break; // Only process first match
          }
        }
      }

      // Track used IDs to ensure uniqueness (after removing Key takeaways)
      const usedIds = new Set<string>();
      
      // Collect existing IDs from remaining elements
      const allElements = doc.querySelectorAll('[id]');
      allElements.forEach((el) => {
        const id = el.getAttribute('id');
        if (id) {
          usedIds.add(id);
        }
      });

      // Generate IDs for h2 and h3 headings that lack them
      const headings = doc.querySelectorAll("h2, h3");
      let headingIndex = 0;
      
      headings.forEach((heading) => {
        const existingId = heading.getAttribute('id');
        
        // Only generate ID if missing or empty
        if (!existingId || existingId.trim() === '') {
          const text = heading.textContent?.trim() || "";
          
          if (text) {
            const baseSlug = generateSlug(text);
            const finalId = ensureUniqueId(baseSlug, usedIds, headingIndex);
            heading.setAttribute('id', finalId);
            headingIndex++;
          } else {
            // Fallback for empty headings
            const fallbackId = ensureUniqueId('', usedIds, headingIndex);
            heading.setAttribute('id', fallbackId);
            headingIndex++;
          }
        }
      });
      
      const processed = doc.body.innerHTML;
      setSanitizedContent(processed);
    } catch {
      // If DOM parsing fails, keep the base sanitized content
      // This ensures we don't break rendering if something goes wrong
    }
  }, [baseSanitizedContent, keyTakeaways]);

  // Analytics: track view, scroll depth, and time-on-page
  useArticleAnalytics({
    slug: initialData.slug,
    title: initialData.title,
    categories: initialData.categories?.map((c: { name: string }) => c.name) ?? undefined,
    authorName: initialData.author?.name ?? undefined,
    publishDate: initialData.publishDate ?? null,
  });

  // Resolve image URL using shared resolver for consistency with list page
  const resolvedImageUrl = React.useMemo(
    () => resolveInsightImageUrl({ 
      ...(imageUrl && { imageUrl }), 
      ...(categories && { categories }) 
    }),
    [imageUrl, categories]
  );

  // Generate article URL for copy link button
  const articleUrl = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return `https://getcorso.com/insights/${initialData.slug}`;
  }, [initialData.slug]);

  return (
    <div
      ref={ref}
      className={cn(
        // Outer container: matches navbar/footer margins (7xl with lg padding)
        containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" }),
        className,
      )}
      {...rest}
    >
      {/* Desktop: Flex layout with article and TOC side by side */}
      <div className="lg:flex lg:items-start lg:gap-8">
        <article
          className={cn(
            // Inner container: max-w-3xl for optimal article readability
            containerMaxWidthVariants({ maxWidth: '3xl', centered: false }),
            "lg:flex-1 lg:min-w-0 lg:max-w-3xl",
          // Base prose styles
          "prose prose-gray max-w-none prose-lg",
          // Headings
          "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-4",
          "prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3",
          "prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2",
          // Paragraphs
          "prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4",
          // Links - underlined by default for accessibility (not color-only)
          "prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:underline-offset-4 prose-a:font-medium prose-a:transition-colors focus-visible:prose-a:outline-none focus-visible:prose-a:ring-2 focus-visible:prose-a:ring-ring focus-visible:prose-a:ring-offset-2 focus-visible:prose-a:rounded-sm",
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
          // Ensure anchored headings aren't hidden behind sticky nav
          "prose-headings:scroll-mt-20",
          // Spacing - responsive vertical spacing
          "space-y-6 sm:space-y-8",
        )}
      >
        {/* Note: Structured data is now handled server-side in the page component for better SEO */}
        {/* Breadcrumbs UI intentionally removed for a cleaner editorial detail page.
            SEO breadcrumbs (JSON-LD) are handled in the route and should remain unchanged. */}

        {/* Consolidated header block: back navigation, categories, title, metadata, and hero image */}
        <InsightHeaderBlock
          title={title}
          {...(publishDate && { publishDate })}
          {...(updatedDate && { updatedDate })}
          {...(readingTime && { readingTime })}
          {...(author && { author })}
          {...(categories && { categories })}
          {...(resolvedImageUrl && { heroImageUrl: resolvedImageUrl })}
          {...(initialData.heroCaption && { heroCaption: initialData.heroCaption })}
          {...(articleUrl && { articleUrl })}
          backHref="/insights"
        />

        {/* Structured Key Takeaways Block */}
        {keyTakeaways && keyTakeaways.length > 0 && (
          <div
            className={cn(
              "border-l-4 border-primary bg-primary/5 rounded-r-lg p-6 sm:p-8 my-8 not-prose",
              "key-takeaways-block"
            )}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4 mt-0">
              Key takeaways
            </h2>
            <ul className="space-y-3 text-foreground/90 list-none pl-0">
              {keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="flex items-start gap-3">
                  <span className="text-primary mt-1.5 flex-shrink-0" aria-hidden="true">
                    •
                  </span>
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Table of Contents - Mobile: above content (inside article) */}
        <TableOfContents content={sanitizedContent} variant="mobile" />

        <section
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          className={cn(
            "prose-content",
            // Allow full-width elements to break out of 3xl article container to outer 7xl container
            // Elements with .prose-full-width or data-full-width extend to outer container edges
            // Uses viewport-relative positioning to break out while respecting outer container padding
            "[&_.prose-full-width]:relative [&_.prose-full-width]:left-[calc(-50vw+50%)] [&_.prose-full-width]:w-screen [&_.prose-full-width]:max-w-[calc(80rem+2rem)] [&_.prose-full-width]:sm:max-w-[calc(80rem+3rem)] [&_.prose-full-width]:lg:max-w-[calc(80rem+4rem)]",
            "[&_[data-full-width]]:relative [&_[data-full-width]]:left-[calc(-50vw+50%)] [&_[data-full-width]]:w-screen [&_[data-full-width]]:max-w-[calc(80rem+2rem)] [&_[data-full-width]]:sm:max-w-[calc(80rem+3rem)] [&_[data-full-width]]:lg:max-w-[calc(80rem+4rem)]",
            // Key takeaways callout styling
            "[&_.key-takeaways-callout]:border-l-4 [&_.key-takeaways-callout]:border-primary [&_.key-takeaways-callout]:bg-primary/5 [&_.key-takeaways-callout]:rounded-r-lg [&_.key-takeaways-callout]:p-6 [&_.key-takeaways-callout]:sm:p-8 [&_.key-takeaways-callout]:my-8 [&_.key-takeaways-callout]:not-prose",
            "[&_.key-takeaways-callout_h2]:!mt-0 [&_.key-takeaways-callout_h2]:mb-4 [&_.key-takeaways-callout_h2]:text-foreground",
            "[&_.key-takeaways-callout_p]:text-foreground/90 [&_.key-takeaways-callout_ul]:text-foreground/90 [&_.key-takeaways-callout_ol]:text-foreground/90",
          )}
          aria-label="Article content"
          itemProp="articleBody"
        />

        {relatedArticles.length > 0 && (
          <aside 
            className={cn("mt-8 sm:mt-12")}
            aria-label="Related content"
          >
            <RelatedArticles articles={relatedArticles} />
          </aside>
        )}
        </article>

        {/* Desktop Table of Contents - Sticky sidebar outside article column */}
        <TableOfContents content={sanitizedContent} variant="desktop" />
      </div>

      {/* Back to top button - fixed position, appears after scrolling */}
      <BackToTopButton />
    </div>
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


