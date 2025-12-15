// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// app/(marketing)/insights/page.tsx
// This is a server component page. Keep server exports and render client components inside.
import { PublicLayout } from "@/components";
import { CategoryFilterClient, InsightsHero } from "@/components/insights";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { getAllInsights } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Changed to dynamic to support URL query params
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Insights | Corso",
  description:
    "Construction industry trends, market intelligence, and practical playbooks from Corso.",
  openGraph: {
    title: "Insights | Corso",
    description:
      "Construction industry trends, market intelligence, and practical playbooks from Corso.",
    type: "website",
  },
  alternates: {
    canonical: 'https://getcorso.com/insights',
  },
};

type InsightRecord = {
  slug: string; title: string; excerpt: string; date: string; category: string;
  imageUrl?: string | null; readingTime?: string;
};

// Transform InsightPreview to InsightRecord for the new components
function transformInsight(insight: any): InsightRecord {
  return {
    slug: insight.slug,
    title: insight.title,
    excerpt: insight.description || '',
    date: insight.publishDate ? new Date(insight.publishDate).toLocaleDateString() : '',
    category: insight.categories?.[0]?.name || 'General',
    imageUrl: insight.imageUrl,
    ...(insight.readingTime && { readingTime: `${insight.readingTime} min read` }),
  };
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'technology', label: 'Technology' },
  { key: 'market-analysis', label: 'Market Analysis' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'cost-management', label: 'Cost Management' },
  { key: 'safety', label: 'Safety' },
];

export default async function InsightsPage() {
  const rawItems = await getAllInsights();
  const items = rawItems.map(transformInsight);

  // counts for chips
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    const count = categoryCounts.get(item.category) ?? 0;
    categoryCounts.set(item.category, count + 1);
  }

  const counts = Object.fromEntries([
    ['all', items.length] as const,
    ...Array.from(categoryCounts.entries()).map(([cat, count]) => [cat, count] as const)
  ]);

  const categoriesWithCounts = CATEGORIES.map(c => ({
    key: c.key,
    label: c.label,
    count: counts[c.key] ?? 0
  }));

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()} showVerticalGuidelines>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InsightsHero
          title="Construction industry trends, market intel, and practical playbooks."
          description="Stay ahead with curated analysis of construction markets, technology, sustainability, and safety—written for busy teams."
        />
        <Suspense fallback={<div className="mt-6 h-12" />}>
          <CategoryFilterClient items={items} categories={categoriesWithCounts} />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
