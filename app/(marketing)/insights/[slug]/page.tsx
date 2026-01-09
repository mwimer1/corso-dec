// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// app/(marketing)/insights/[slug]/page.tsx
// Server component page; contains metadata export
/* ------------------------------------------------------------------
   Insight Article Page (dynamic RSC)
   • Generates SEO metadata from fetched article
   • Uses safe, local interface to avoid mismatch with auto-generated types
------------------------------------------------------------------- */
import { PublicLayout } from "@/components";
import { InsightDetail } from "@/components/insights";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { resolveInsightImageUrl } from "@/components/insights/utils/image-resolver";
import { getEnv } from "@/lib/server/env";
import { getInsightBySlug, getRelatedInsights } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** @knipignore */
export const runtime = "nodejs";
// Use ISR for static content - revalidate every 5 minutes
/** @knipignore */
export const revalidate = 300; // 5 minutes

// Client component; dynamic not required

/** Build <title> + <meta> from fetched article. */
/** @knipignore */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInsightBySlug(slug);

  if (item) {
    const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL ?? 'https://getcorso.com';
    const description = item.description ?? `Read ${item.title} on Corso Insights`;
    const canonicalUrl = new URL(`/insights/${slug}`, siteUrl).toString();
    
    // Resolve image URL using shared resolver for consistency, then ensure absolute
    const resolvedImage = resolveInsightImageUrl(item);
    const absoluteImageUrl = new URL(resolvedImage, siteUrl).toString();

    return {
      title: `${item.title} | Corso Insights`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: item.title,
        description,
        url: canonicalUrl,
        type: 'article',
        images: [{ url: absoluteImageUrl, alt: item.title }],
        publishedTime: item.publishDate,
        authors: item.author?.name ? [item.author.name] : undefined,
        section: item.categories?.map((cat: { name: string }) => cat.name).join(', '),
        siteName: 'Corso Insights',
      },
      twitter: {
        card: 'summary_large_image',
        title: item.title,
        description,
        images: [absoluteImageUrl],
      },
    };
  }

  return { title: 'Insights Article | Corso', description: 'Read the latest insights on Corso.' };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getInsightBySlug(slug);

  if (!item) notFound();

  // Get related articles using the content service's unified logic
  // This ensures consistent scoring by category overlap and recency
  const relatedInsights = await getRelatedInsights(item, { limit: 3 });
  
  // Transform InsightPreview[] to match InsightDetail's expected shape
  const relatedArticles = relatedInsights.map(insight => ({
    slug: insight.slug,
    title: insight.title,
    ...(insight.description && { excerpt: insight.description }),
    ...(insight.imageUrl && { imageUrl: insight.imageUrl }),
    ...(insight.categories && { categories: insight.categories.map(cat => ({ name: cat.name, slug: cat.slug })) }),
    ...(insight.publishDate && { publishDate: insight.publishDate }),
    ...(insight.author && { author: { name: insight.author.name, slug: insight.author.name.toLowerCase().replace(/\s+/g, '-') } }),
    ...(insight.readingTime !== undefined && { readingTime: insight.readingTime }),
  }));

  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL ?? 'https://getcorso.com';
  const canonicalUrl = new URL(`/insights/${slug}`, siteUrl).toString();

  // Resolve image URL using shared resolver for consistency, then ensure absolute
  const resolvedImage = resolveInsightImageUrl(item);
  const absoluteImageUrl = new URL(resolvedImage, siteUrl).toString();

  // Normalize dates to ISO format (already ISO, but ensure consistency)
  // Validate dates are valid before converting to ISO string
  const datePublished = item.publishDate ? (() => {
    try {
      const date = new Date(item.publishDate);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    } catch {
      return item.publishDate; // Fallback to original if conversion fails
    }
  })() : undefined;
  
  const dateModified = (item.updatedDate ?? item.publishDate) ? (() => {
    try {
      const date = new Date(item.updatedDate ?? item.publishDate!);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    } catch {
      return item.updatedDate ?? item.publishDate; // Fallback to original if conversion fails
    }
  })() : undefined;

  // Extract keywords from categories (optional SEO enhancement)
  const keywords = item.categories?.map((cat: { name: string; slug: string }) => cat.name || cat.slug).filter(Boolean);

  // Generate structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.description ?? `Read ${item.title} on Corso Insights`,
    image: [absoluteImageUrl],
    datePublished,
    dateModified,
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    author: item.author?.name ? {
      '@type': 'Person',
      name: item.author.name,
      ...(item.author.avatar && { image: new URL(item.author.avatar, siteUrl).toString() })
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Corso',
      logo: {
        '@type': 'ImageObject',
        url: new URL('/logo.svg', siteUrl).toString()
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    url: canonicalUrl
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: new URL('/', siteUrl).toString()
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Insights',
        item: new URL('/insights', siteUrl).toString()
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.title,
        item: canonicalUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PublicLayout
        navMode="insights"
        navItems={getInsightsNavItems()}
        showReadingProgress={true}
      >
        <div className="py-8">
          <InsightDetail
            initialData={item}
            relatedArticles={relatedArticles}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Insights', href: '/insights' },
              { label: item.title, href: `/insights/${slug}` },
            ]}
          />
        </div>
      </PublicLayout>
    </>
  );
}
