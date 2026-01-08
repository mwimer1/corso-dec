import * as content from '@/lib/marketing/server';
import { describe, expect, it, vi } from 'vitest';

describe('getInsightsByCategory', () => {
  it('returns items sorted by publishDate and paginated', async () => {
    const mock = vi.spyOn(content, 'getAllInsights').mockResolvedValue([
      { slug: 'construction-analytics-trends', title: 'Construction Analytics Trends 2025', publishDate: '2025-01-01', categories: [{ name: 'Data', slug: 'data' }] },
      { slug: 'data-driven-decision-making', title: 'Data-Driven Decision Making in Construction', publishDate: '2025-03-01', categories: [{ name: 'Data', slug: 'data' }, { name: 'AI', slug: 'ai' }] },
      { slug: 'c', title: 'C', publishDate: '2023-12-01', categories: [{ name: 'AI', slug: 'ai' }] },
    ] as any);

    const { items, total, category } = await content.getInsightsByCategory({ slug: 'data', page: 1, pageSize: 10 });
    expect(total).toBe(2);
    expect(category?.name).toBe('Data');
    expect(items.map(i => i.slug)).toEqual(['data-driven-decision-making', 'construction-analytics-trends']);

    mock.mockRestore();
  });

  it('returns zero results for unknown slug', async () => {
    const mock = vi.spyOn(content, 'getAllInsights').mockResolvedValue([
      { slug: 'construction-analytics-trends', title: 'Construction Analytics Trends 2025', publishDate: '2025-01-01', categories: [{ name: 'Data', slug: 'data' }] },
    ] as any);

    const res = await content.getInsightsByCategory({ slug: 'unknown', page: 1, pageSize: 10 });
    expect(res.total).toBe(0);
    expect(res.category).toBeNull();

    mock.mockRestore();
  });
});

