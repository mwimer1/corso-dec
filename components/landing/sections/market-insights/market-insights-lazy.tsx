"use client";

// src/components/landing/market-insights/market-insights-lazy.tsx
import React, { Suspense } from "react";

// Lazy load the MarketInsightsSection to avoid bundling Recharts on initial page load
const MarketInsightsSection = React.lazy(() =>
  import('./market-insights-section').then(module => ({
    default: module.MarketInsightsSection
  }))
);

interface LazyMarketInsightsSectionProps {
  /** Market data points for visualization */
  data?: Array<{
    year: number;
    projectCount: number;
    jobValue: number;
  }>;
  /** Available territory filters */
  territories?: string[];
  /** Available property type filters */
  propertyTypes?: string[];
  /** Controls rendering variant */
  controlsVariant?: "pills" | "dropdown";
  /** Dense mode trims spacing and hides slider bubbles */
  dense?: boolean;
  /** Keep statistics visible while adjusting controls (md+ only) */
  stickyMetrics?: boolean;
  /** Whether to apply internal container wrapper (default: true for backward compatibility) */
  withContainer?: boolean;
  /** CSS class name for the section wrapper */
  className?: string;
}

/**
 * Lazy-loaded MarketInsightsSection component
 *
 * This component lazy loads the MarketInsightsSection to prevent bundling
 * heavy dependencies (Recharts) on initial page load. The component will
 * only be loaded when this wrapper is rendered.
 */
export const LazyMarketInsightsSection: React.FC<LazyMarketInsightsSectionProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-surface rounded-xl shadow-sm border border-border p-8 mb-8 animate-pulse motion-reduce:animate-none motion-reduce:transition-none">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <MarketInsightsSection {...props} />
    </Suspense>
  );
};
