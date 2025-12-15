'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilter } from './category-filter';
import { InsightsList } from './sections/insights-list';

function CategoryFilterClient({ items, categories }: { items: any[]; categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  // Initialize from URL or default to 'all'
  const [active, setActive] = useState<string>(() => {
    // Validate category param exists in categories
    if (categoryParam && categories.some(c => c.key === categoryParam)) {
      return categoryParam;
    }
    return 'all';
  });

  // Sync state with URL param changes (e.g., browser back/forward)
  useEffect(() => {
    if (categoryParam && categories.some(c => c.key === categoryParam)) {
      setActive(categoryParam);
    } else if (!categoryParam) {
      setActive('all');
    }
  }, [categoryParam, categories]);

  const filtered = useMemo(() => {
    if (active === 'all') return items;
    return items.filter(i => i.category === active);
  }, [items, active]);

  const handleCategoryChange = (key: string) => {
    setActive(key);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'all') {
      params.delete('category');
    } else {
      params.set('category', key);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      <CategoryFilter
        categories={categories}
        value={active}
        onChange={handleCategoryChange}
        className="mt-6"
        stickyOffsetClassName="top-20"  // Match header height to prevent overlap
      />
      <section
        id="insights-panel"
        role="tabpanel"
        aria-label="Articles"
        aria-labelledby={`category-tab-${active}`}
        className="py-8"
      >
        <InsightsList insights={filtered} />
      </section>
    </>
  );
}

export { CategoryFilterClient };
