'use client';

import { useMemo, useState } from 'react';
import { CategoryFilter } from './category-filter';
import { InsightsList } from './sections/insights-list';

function CategoryFilterClient({ items, categories }: { items: any[]; categories: any[] }) {
  const [active, setActive] = useState<string>('all');
  const filtered = useMemo(() => {
    if (active === 'all') return items;
    return items.filter(i => i.category === active);
  }, [items, active]);

  return (
    <>
      <CategoryFilter
        categories={categories}
        value={active}
        onChange={(key: string) => setActive(key)}
        className="mt-4"
        stickyOffsetClassName="top-20"  // Match header height to prevent overlap
      />
      <section aria-label="Articles" className="py-8">
        <InsightsList insights={filtered} />
      </section>
    </>
  );
}

export { CategoryFilterClient };
