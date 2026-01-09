// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// app/(marketing)/insights/page.tsx
// This is a server component page. Keep server exports and render client components inside.
import { FullWidthSection, PublicLayout } from "@/components";
import { CategoryFilterClient, InsightsHero } from "@/components/insights";
import { CATEGORIES_UI } from "@/components/insights/constants";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { getAllInsights, getCategories } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { Suspense } from "react";

/** @knipignore */
export const runtime = "nodejs";
// Use ISR for static content - revalidate every 5 minutes
// This allows URL query params while still benefiting from caching
/** @knipignore */
export const revalidate = 300; // 5 minutes

/** @knipignore */
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

export default async function InsightsPage() {
  const rawItems = await getAllInsights();
  const dynamicCategories = await getCategories();

  // Build counts map from actual content - count ALL categories per item, not just first
  const categoryCounts = new Map<string, number>();
  for (const item of rawItems) {
    // Iterate through all categories for each item
    for (const cat of item.categories || []) {
      const slug = cat.slug || 'general';
      const count = categoryCounts.get(slug) ?? 0;
      categoryCounts.set(slug, count + 1);
    }
  }

  // Start with curated categories (in UI order) with their counts
  const curatedWithCounts = CATEGORIES_UI.map(c => ({
    key: c.key,
    label: c.label,
    count: categoryCounts.get(c.key) ?? 0
  }));

  // Find categories from content/CMS that aren't in the curated list
  const newCategories = dynamicCategories
    .filter(cat => !CATEGORIES_UI.some(curated => curated.key === cat.slug))
    .map(cat => ({
      key: cat.slug,
      label: cat.name,
      count: categoryCounts.get(cat.slug) ?? 0
    }));

  // Combine: "All" first, then curated (in order), then new categories
  // Filter out categories with 0 counts
  const categoriesWithCounts = [
    { key: 'all', label: 'All', count: rawItems.length },
    ...curatedWithCounts.filter(c => c.count > 0),
    ...newCategories.filter(c => c.count > 0)
  ];

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()}>
      <FullWidthSection
        padding="hero"
        containerMaxWidth="7xl"
        containerPadding="lg"
      >
        <InsightsHero
          title="Construction industry trends, market intel, and practical playbooks."
          description="Stay ahead with curated analysis of construction markets, technology, sustainability, and safety—written for busy teams."
        />
      </FullWidthSection>

      <FullWidthSection
        padding="md"
        containerMaxWidth="7xl"
        containerPadding="lg"
      >
        <Suspense fallback={<div className="h-12" />}>
          <CategoryFilterClient items={rawItems} categories={categoriesWithCounts} />
        </Suspense>
      </FullWidthSection>
    </PublicLayout>
  );
}
