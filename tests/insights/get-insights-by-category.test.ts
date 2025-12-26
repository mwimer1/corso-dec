import * as contentService from '@/lib/marketing/insights/content-service';
import * as content from '@/lib/marketing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Disable mock CMS to use legacy adapter (which uses static data that matches our test mocks)
process.env.CORSO_USE_MOCK_CMS = 'false';

describe('getInsightsByCategory', () => {
  let mockGetAllInsights: ReturnType<typeof vi.spyOn>;
  let mockGetCategories: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on the actual module functions that getInsightsByCategory calls internally
    mockGetAllInsights = vi.spyOn(contentService, 'getAllInsights').mockResolvedValue([
      { slug: 'construction-analytics-trends', title: 'Construction Analytics Trends 2025', publishDate: '2025-01-01', categories: [{ name: 'Data', slug: 'data' }] },
      { slug: 'data-driven-decision-making', title: 'Data-Driven Decision Making in Construction', publishDate: '2025-03-01', categories: [{ name: 'Data', slug: 'data' }, { name: 'AI', slug: 'ai' }] },
      { slug: 'c', title: 'C', publishDate: '2023-12-01', categories: [{ name: 'AI', slug: 'ai' }] },
    ] as any);
    mockGetCategories = vi.spyOn(contentService, 'getCategories').mockResolvedValue([
      { slug: 'data', name: 'Data' },
      { slug: 'ai', name: 'AI' },
    ]);
  });

  afterEach(() => {
    mockGetAllInsights.mockRestore();
    mockGetCategories.mockRestore();
  });

  it('returns items sorted by publishDate and paginated', async () => {
    const { items, total, category } = await content.getInsightsByCategory({ slug: 'data', page: 1, pageSize: 10 });
    
    // Regression test: verify getAllInsights() is actually called
    expect(mockGetAllInsights).toHaveBeenCalled();
    expect(mockGetCategories).toHaveBeenCalled();
    expect(total).toBe(2);
    expect(category?.name).toBe('Data');
    expect(items.map(i => i.slug)).toEqual(['data-driven-decision-making', 'construction-analytics-trends']);
  });

  it('returns zero results for unknown slug', async () => {
    mockGetCategories.mockResolvedValueOnce([
      { slug: 'data', name: 'Data' },
    ]);

    const res = await content.getInsightsByCategory({ slug: 'unknown', page: 1, pageSize: 10 });
    expect(res.total).toBe(0);
    expect(res.category).toBeNull();
  });
});

