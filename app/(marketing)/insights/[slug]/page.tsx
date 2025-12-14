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
import { getAllInsights, getInsightBySlug } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Client component; dynamic not required

/** Build <title> + <meta> from fetched article. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInsightBySlug(slug);

  if (item) {
    const description = item.description ?? `Read ${item.title} on Corso Insights`;
    const url = `https://getcorso.com/insights/${slug}`;
    const canonicalUrl = new URL(url, 'https://getcorso.com').toString();

    return {
      title: `${item.title} | Corso Insights`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: item.title,
        description,
        url: canonicalUrl,
        type: 'article',
        images: item.imageUrl ? [{ url: item.imageUrl, alt: item.title }] : [{ url: '/logo.svg', alt: 'Corso Logo' }],
        publishedTime: item.publishDate,
        authors: item.author?.name ? [item.author.name] : undefined,
        section: item.categories?.map((cat: { name: string }) => cat.name).join(', '),
        siteName: 'Corso Insights',
      },
      twitter: {
        card: 'summary_large_image',
        title: item.title,
        description,
        images: item.imageUrl ? [item.imageUrl] : ['/logo.svg'],
      },
    };
  }

  return { title: 'Insights Article | Corso', description: 'Read the latest insights on Corso.' };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getInsightBySlug(slug);

  if (!item) notFound();

  // Get related articles based on categories
  const allInsights = await getAllInsights();
  const relatedArticles = allInsights
    .filter(insight =>
      insight.slug !== slug && // Exclude current article
      insight.categories?.some((cat: { slug: string }) =>
        item.categories?.some((itemCat: { slug: string }) => itemCat.slug === cat.slug)
      )
    )
    .slice(0, 3); // Limit to 3 related articles

  const canonicalUrl = new URL(`/insights/${slug}`, 'https://getcorso.com').toString();

  // Generate structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.description ?? `Read ${item.title} on Corso Insights`,
    image: item.imageUrl ? [item.imageUrl] : ['/logo.svg'],
    datePublished: item.publishDate,
    dateModified: item.publishDate,
    author: item.author?.name ? {
      '@type': 'Person',
      name: item.author.name,
      ...(item.author.avatar && { image: item.author.avatar })
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Corso',
      logo: {
        '@type': 'ImageObject',
        url: 'https://getcorso.com/logo.svg'
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
        item: 'https://getcorso.com/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Insights',
        item: 'https://getcorso.com/insights'
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
        showVerticalGuidelines
      >
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <InsightDetail initialData={item} relatedArticles={relatedArticles} />
        </div>
      </PublicLayout>
    </>
  );
}
