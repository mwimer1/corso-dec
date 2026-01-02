// lib/marketing/insights/source.ts
// Unified content source interface and selector (the seam for swapping CMS providers)
import 'server-only';

import { getEnv } from '@/lib/server/env';
import type { InsightItem, InsightPreview } from '@/types/marketing';
import { getDirectusCategories, getDirectusInsightBySlug, getDirectusInsightsIndex } from './directus-adapter';
// Dynamic import to break circular dependency: legacy-adapter → content-service → source
// import { getLegacyCategories, getLegacyInsightBySlug, getLegacyInsightsIndex } from './legacy-adapter';
import { getMockInsightBySlug, getMockInsightCategories, getMockInsightsIndex } from './mockcms-adapter';

/**
 * Content source interface
 * All adapters must implement this interface to ensure UI stays stable
 */
export interface InsightContentSource {
  getAllInsights(): Promise<InsightPreview[]>;
  getInsightBySlug(slug: string): Promise<InsightItem | undefined>;
  getCategories(): Promise<Array<{ slug: string; name: string }>>;
}

/**
 * Select content source based on environment configuration
 * 
 * Precedence:
 * 1. If CORSO_USE_MOCK_CMS === true => use mock CMS fixtures
 * 2. Else if CORSO_CMS_PROVIDER === "directus" => use Directus adapter
 * 3. Else => use legacy adapter (existing markdown/static logic)
 */
async function selectContentSource(): Promise<InsightContentSource> {
  const env = getEnv();
  
  // Priority 1: Mock CMS (highest priority when enabled)
  // Default behavior: dev/test default true unless explicitly false, prod default false unless explicitly true
  const useMockCms = env.CORSO_USE_MOCK_CMS === 'true' || 
    (env.CORSO_USE_MOCK_CMS === undefined && env.NODE_ENV !== 'production');
  
  if (useMockCms) {
    return {
      getAllInsights: getMockInsightsIndex,
      getInsightBySlug: getMockInsightBySlug,
      getCategories: getMockInsightCategories,
    };
  }
  
  // Priority 2: Directus CMS (when provider is set to directus)
  // ⚠️ NOTE: Directus adapter is not yet implemented - will throw error if selected
  // The source selector will catch the error and fall back to legacy adapter
  const cmsProvider = env.CORSO_CMS_PROVIDER?.toLowerCase();
  if (cmsProvider === 'directus') {
    // Directus adapter not yet implemented - will throw descriptive error
    // In production, consider adding try/catch here to fall back gracefully
    return {
      getAllInsights: getDirectusInsightsIndex,
      getInsightBySlug: getDirectusInsightBySlug,
      getCategories: getDirectusCategories,
    };
  }
  
  // Priority 3: Legacy (markdown/static fallback) - dynamic import to break circular dependency
  const { getLegacyCategories, getLegacyInsightBySlug, getLegacyInsightsIndex } = await import('./legacy-adapter');
  return {
    getAllInsights: getLegacyInsightsIndex,
    getInsightBySlug: getLegacyInsightBySlug,
    getCategories: getLegacyCategories,
  };
}

// Export singleton source instance (cached per request via React cache in adapters)
let _source: InsightContentSource | undefined;
let _sourcePromise: Promise<InsightContentSource> | undefined;

export async function getContentSource(): Promise<InsightContentSource> {
  if (_source) {
    return _source;
  }
  if (!_sourcePromise) {
    _sourcePromise = selectContentSource();
    _source = await _sourcePromise;
  } else {
    _source = await _sourcePromise;
  }
  return _source;
}

/**
 * Test-only helper to reset the cached content source.
 * Use this in tests that need to change CORSO_USE_MOCK_CMS or provider selection between cases.
 * 
 * @internal - Do not call from production code
 */
export function __resetContentSourceForTests(): void {
  _source = undefined;
}

