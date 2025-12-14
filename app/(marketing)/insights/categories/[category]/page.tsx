import { PublicLayout } from '@/components';
import { InsightsList } from '@/components/insights';
import { getInsightsNavItems } from '@/components/insights/layout/nav.config';
import { getAllInsights } from '@/lib/marketing/server';
import { trackEvent } from '@/lib/shared/analytics/track';
import type { Metadata } from 'next';

export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const cat = params.category;
  return { title: `${cat} | Corso Insights`, description: `Insights in category ${cat}` };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { category } = params;
  const all = await getAllInsights();
  const filtered = all.filter((i) => (i.categories ?? []).some((c: { slug: string }) => c.slug === category));

  const handleResultClick = (slug: string, position: number) => {
    trackEvent('category_result_click', { slug, position, category });
  };

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()} showVerticalGuidelines>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Category: {category}</h1>
          <InsightsList insights={filtered} onResultClick={handleResultClick} />
        </div>
      </div>
    </PublicLayout>
  );
}


