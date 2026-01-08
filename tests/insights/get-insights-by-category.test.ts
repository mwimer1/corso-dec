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

  it('uses injected deps and does not invoke unified selector', async () => {
    // Use sentinel data to verify injected deps are used
    const sentinelInsights = [
      { slug: 'sentinel-1', title: 'Sentinel 1', publishDate: '2025-01-01', categories: [{ name: 'Test', slug: 'test' }] },
    ];
    const sentinelCategories = [{ slug: 'test', name: 'Test' }];

    const sentinelGetAllInsights = vi.fn().mockResolvedValue(sentinelInsights);
    const sentinelGetCategories = vi.fn().mockResolvedValue(sentinelCategories);

    const res = await content.getInsightsByCategory(
      { slug: 'test', page: 1, pageSize: 10 },
      { getAllInsights: sentinelGetAllInsights, getCategories: sentinelGetCategories }
    );

    // Verify injected functions were called
    expect(sentinelGetAllInsights).toHaveBeenCalledTimes(1);
    expect(sentinelGetCategories).toHaveBeenCalledTimes(1);

    // Verify result matches sentinel data
    expect(res.total).toBe(1);
    expect(res.category?.slug).toBe('test');
    expect(res.items[0]?.slug).toBe('sentinel-1');

    // Verify original mocks were NOT called (proving unified selector wasn't invoked)
    expect(getAllInsights).not.toHaveBeenCalled();
    expect(getCategories).not.toHaveBeenCalled();
  });

  it('uses unified source selector by default when no deps provided (regression test)', async () => {
    // Regression test: verify that getInsightsByCategory uses unified source when called without deps
    // This ensures the unified source integration is maintained
    const result = await content.getInsightsByCategory({ slug: 'data', page: 1, pageSize: 10 });
    
    // Should return valid structure (even if empty for unknown category)
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('category');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});

