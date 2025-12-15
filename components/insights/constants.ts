// Centralized sizing for Insights hero/cover images (16:9)
export const INSIGHT_HERO_WIDTH = 1200 as const;
export const INSIGHT_HERO_HEIGHT = 675 as const;
export const INSIGHT_HERO_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' as const;

// If other ratios are added later, add parallel constants here and re-export via the barrel.

/**
 * Curated category list for UI ordering and label overrides.
 * This defines the featured categories and their display order.
 * Categories from content/CMS that aren't in this list will be appended dynamically.
 */
export const CATEGORIES_UI: Array<{ key: string; label: string }> = [
  { key: 'technology', label: 'Technology' },
  { key: 'market-analysis', label: 'Market Analysis' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'cost-management', label: 'Cost Management' },
  { key: 'safety', label: 'Safety' },
];

