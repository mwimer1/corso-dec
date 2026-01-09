'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilter } from './category-filter';
import { InsightsList } from './sections/insights-list';
import { Input } from '@/components/ui/atoms/input';
import { Select } from '@/components/ui/molecules/select';
import { Button } from '@/components/ui/atoms/button';
import { Search, X } from 'lucide-react';

import type { InsightPreview } from '@/types/marketing';

type SortOption = 'newest' | 'oldest' | 'title';

const VALID_SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'title'];

function CategoryFilterClient({ items, categories }: { items: InsightPreview[]; categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  
  // Initialize from URL or defaults
  const [active, setActive] = useState<string>(() => {
    // Validate category param exists in categories
    if (categoryParam && categories.some(c => c.key === categoryParam)) {
      return categoryParam;
    }
    return 'all';
  });

  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [sort, setSort] = useState<SortOption>(() => {
    return VALID_SORT_OPTIONS.includes(sortParam as SortOption) ? (sortParam as SortOption) : 'newest';
  });

  // Sync state with URL param changes (e.g., browser back/forward)
  useEffect(() => {
    if (categoryParam && categories.some(c => c.key === categoryParam)) {
      setActive(categoryParam);
    } else if (!categoryParam) {
      setActive('all');
    }
  }, [categoryParam, categories]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const validSort = VALID_SORT_OPTIONS.includes(sortParam as SortOption) ? (sortParam as SortOption) : 'newest';
    setSort(validSort);
  }, [sortParam]);

  // Helper to update URL params
  const updateUrlParams = useCallback((updates: { category?: string; q?: string; sort?: SortOption }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.category !== undefined) {
      if (updates.category === 'all') {
        params.delete('category');
      } else {
        params.set('category', updates.category);
      }
    }
    
    if (updates.q !== undefined) {
      if (updates.q === '') {
        params.delete('q');
      } else {
        params.set('q', updates.q);
      }
    }
    
    if (updates.sort !== undefined) {
      if (updates.sort === 'newest') {
        params.delete('sort');
      } else {
        params.set('sort', updates.sort);
      }
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  }, [searchParams, router]);

  // Filter and sort logic
  const filtered = useMemo(() => {
    let result = items;

    // Category filter - check ALL categories, not just first
    if (active !== 'all') {
      result = result.filter(i => {
        return i.categories?.some(cat => cat.slug === active) ?? false;
      });
    }

    // Search filter - case-insensitive search on title and description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(i => {
        const titleMatch = i.title.toLowerCase().includes(query);
        const descMatch = i.description?.toLowerCase().includes(query) ?? false;
        return titleMatch || descMatch;
      });
    }

    // Sort
    const ts = (d?: string | number | Date) => (d ? new Date(d).getTime() : 0);
    
    result = [...result].sort((a, b) => {
      if (sort === 'newest') {
        return ts(b.publishDate) - ts(a.publishDate);
      } else if (sort === 'oldest') {
        return ts(a.publishDate) - ts(b.publishDate);
      } else if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [items, active, searchQuery, sort]);

  const handleCategoryChange = (key: string) => {
    setActive(key);
    updateUrlParams({ category: key });
  };

  // Debounce search URL updates
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Debounce URL update for search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateUrlParams({ q: query });
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    updateUrlParams({ sort: newSort });
  };

  const handleClearFilters = () => {
    setActive('all');
    setSearchQuery('');
    setSort('newest');
    updateUrlParams({ category: 'all', q: '', sort: 'newest' });
  };

  // Check if any filters are active
  const hasActiveFilters = active !== 'all' || searchQuery.trim() !== '' || sort !== 'newest';

  // Get active category label for results summary
  const activeCategoryLabel = useMemo(() => {
    if (active === 'all') return null;
    return categories.find(c => c.key === active)?.label || null;
  }, [active, categories]);

  return (
    <>
      {/* Controls Row: Search + Sort + Clear */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              iconPadding
              size="md"
              className="w-full pl-9"
              aria-label="Search insights by title or description"
            />
          </div>

          {/* Sort Dropdown */}
          <Select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            size="md"
            className="w-full sm:w-[180px]"
            aria-label="Sort articles"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
          </Select>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="w-full sm:w-auto h-10"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Results Summary */}
        {filtered.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {searchQuery.trim() ? (
              <>
                <span className="font-medium">{filtered.length}</span> article{filtered.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                {activeCategoryLabel && (
                  <> • <span className="font-medium">{activeCategoryLabel}</span></>
                )}
              </>
            ) : (
              <>
                <span className="font-medium">{filtered.length}</span> article{filtered.length !== 1 ? 's' : ''}
                {activeCategoryLabel && (
                  <> • <span className="font-medium">{activeCategoryLabel}</span></>
                )}
              </>
            )}
          </div>
        )}
      </div>

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
        <InsightsList
          insights={filtered}
          {...(hasActiveFilters && { onClearFilters: handleClearFilters })}
        />
      </section>
    </>
  );
}

export { CategoryFilterClient };
