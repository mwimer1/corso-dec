import * as content from '@/lib/marketing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getInsightsByCategory', () => {
  let getAllInsights: ReturnType<typeof vi.fn>;
  let getCategories: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getAllInsights = vi.fn().mockResolvedValue([
      { slug: 'construction-analytics-trends', title: 'Construction Analytics Trends 2025', publishDate: '2025-01-01', categories: [{ name: 'Data', slug: 'data' }] },
      { slug: 'data-driven-decision-making', title: 'Data-Driven Decision Making in Construction', publishDate: '2025-03-01', categories: [{ name: 'Data', slug: 'data' }, { name: 'AI', slug: 'ai' }] },
      { slug: 'c', title: 'C', publishDate: '2023-12-01', categories: [{ name: 'AI', slug: 'ai' }] },
    ] as any);
    getCategories = vi.fn().mockResolvedValue([
      { slug: 'data', name: 'Data' },
      { slug: 'ai', name: 'AI' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns items sorted by publishDate and paginated', async () => {
    const { items, total, category } = await content.getInsightsByCategory(
      { slug: 'data', page: 1, pageSize: 10 },
      { getAllInsights, getCategories }
    );
    
    expect(getAllInsights).toHaveBeenCalledTimes(1);
    expect(getCategories).toHaveBeenCalledTimes(1);
    expect(total).toBe(2);
    expect(category?.name).toBe('Data');
    expect(items.map(i => i.slug)).toEqual(['data-driven-decision-making', 'construction-analytics-trends']);
  });

  it('returns zero results for unknown slug', async () => {
    getCategories.mockResolvedValueOnce([
      { slug: 'data', name: 'Data' },
    ]);

    const res = await content.getInsightsByCategory(
      { slug: 'unknown', page: 1, pageSize: 10 },
      { getAllInsights, getCategories }
    );
    expect(res.total).toBe(0);
    expect(res.category).toBeNull();
  });
});

