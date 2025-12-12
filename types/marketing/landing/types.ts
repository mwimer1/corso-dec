// types/marketing/landing/types.ts
// Landing-specific types, now organized under marketing domain.

/**
 * Market trend datapoint used by MarketInsightsSection and other charts.
 * Note: This is distinct from ClickHouse ChartDataPoint which has different fields
 * (timestamp/value vs year/projectCount/jobValue). This version is specifically
 * for marketing landing page visualizations.
 */
export interface ChartDataPoint {
  year: number;
  projectCount: number;
  jobValue: number;
}

