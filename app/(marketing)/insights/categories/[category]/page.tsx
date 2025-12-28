import { PublicLayout } from '@/components';
import { InsightsList } from '@/components/insights';
import { getInsightsNavItems } from '@/components/insights/layout/nav.config';
import { getInsightsByCategory } from '@/lib/marketing/server';
import { trackEvent } from '@/lib/shared/analytics/track';
import type { Metadata } from 'next';

export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: cat } = await params;
  return { title: `${cat} | Corso Insights`, description: `Insights in category ${cat}` };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  // Use unified getInsightsByCategory for consistent sorting, validation, and pagination
  const { items: filtered, category: categoryInfo } = await getInsightsByCategory({
    slug: category,
    page: 1,
    pageSize: 1000, // Show all items for category pages (no pagination UI yet)
  });

  const handleResultClick = (slug: string, position: number) => {
    trackEvent('category_result_click', { slug, position, category });
  };

  // Use category name from unified source if available, otherwise fallback to slug
  const categoryDisplayName = categoryInfo?.name || category;

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-4">Category: {categoryDisplayName}</h1>
      </div>
      <InsightsList insights={filtered} onResultClick={handleResultClick} />
    </PublicLayout>
  );
}


