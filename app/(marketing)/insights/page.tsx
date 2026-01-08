// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// app/(marketing)/insights/page.tsx
// This is a server component page. Keep server exports and render client components inside.
import { CategoryFilterClient, InsightsHero } from "@/components/insights";
import { InsightsLayout } from "@/components/insights/layout/insights-layout";
import { getAllInsights } from "@/lib/marketing/server";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const dynamic = "force-static";
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
    <InsightsLayout>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <InsightsHero
          title="Construction industry trends, market intel, and practical playbooks."
          description="Stay ahead with curated analysis of construction markets, technology, sustainability, and safety—written for busy teams."
        />
        <CategoryFilterClient items={items} categories={categoriesWithCounts} />
      </div>
    </InsightsLayout>
  );
}
