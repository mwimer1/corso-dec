import { getCategories, staticInsights } from '@/lib/marketing/server';
import { describe, expect, it } from 'vitest';

describe('content-service getCategories', () => {
  it('returns categories from static fallback when no content dir present', async () => {
    const cats = await getCategories();
    // Collect expected slugs from staticInsights
    const expected = new Set<string>();
    for (const s of staticInsights) {
      for (const c of s.categories ?? []) expected.add(c.slug);
    }

    for (const c of cats) {
      expect(expected.has(c.slug)).toBe(true);
    }
  });
});

