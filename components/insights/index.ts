// Insights domain barrel – public surface for insights-related components

// Types
export type { Category, CategoryFilterProps, InsightCardProps } from './types';

// Layout components for insights pages
export * from './layout/nav.config';
export * from './layout/navbar';

// Main content components (moved to sections)
export * from './sections/insight-detail';
export * from './sections/insights-list';

// SEO utilities
export { generateArticleMetadata } from './sections/insight-detail';

// Supporting infrastructure
export * from './hooks/use-article-analytics';

// Constants
export * from './constants';

// Canonical card component
export * from './insight-card';

// Category filter component
export * from './category-filter';

// Hero component
export * from './insights-hero';

// Client components
export * from './insights-client';



