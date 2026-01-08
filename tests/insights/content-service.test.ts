import { getCategories, staticInsights } from '@/lib/marketing/server';
import { __resetContentSourceForTests } from '@/lib/marketing/insights/source';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('content-service getCategories', () => {
  beforeEach(() => {
    // Disable mock CMS to use legacy adapter (which uses staticInsights)
    process.env.CORSO_USE_MOCK_CMS = 'false';
    // Reset cached source so environment change takes effect
    __resetContentSourceForTests();
  });

  afterEach(() => {
    delete process.env.CORSO_USE_MOCK_CMS;
    __resetContentSourceForTests();
  });

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

