// Insights domain barrel – public surface for insights-related components

// Types
export type { Category, CategoryFilterProps, InsightCardProps } from './types';

// Layout components for insights pages
export * from './layout/insights-section';
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

// Default exports for layout components
export { default as InsightsSection } from './layout/insights-section';
export { default as InsightsNavbar } from './layout/navbar';

// Default exports for main content components
export { default as InsightDetail } from './sections/insight-detail';
export { default as InsightsList } from './sections/insights-list';



