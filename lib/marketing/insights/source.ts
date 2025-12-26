// lib/marketing/insights/source.ts
// Unified content source interface and selector (the seam for swapping CMS providers)
import 'server-only';

import { getEnv } from '@/lib/server/env';
import type { InsightItem, InsightPreview } from '@/types/marketing';
import { getDirectusCategories, getDirectusInsightBySlug, getDirectusInsightsIndex } from './directus-adapter';
import { getLegacyCategories, getLegacyInsightBySlug, getLegacyInsightsIndex } from './legacy-adapter';
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
function selectContentSource(): InsightContentSource {
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
  const cmsProvider = env.CORSO_CMS_PROVIDER?.toLowerCase();
  if (cmsProvider === 'directus') {
    return {
      getAllInsights: getDirectusInsightsIndex,
      getInsightBySlug: getDirectusInsightBySlug,
      getCategories: getDirectusCategories,
    };
  }
  
  // Priority 3: Legacy (markdown/static fallback)
  return {
    getAllInsights: getLegacyInsightsIndex,
    getInsightBySlug: getLegacyInsightBySlug,
    getCategories: getLegacyCategories,
  };
}

// Export singleton source instance (cached per request via React cache in adapters)
let _source: InsightContentSource | undefined;

export function getContentSource(): InsightContentSource {
  if (!_source) {
    _source = selectContentSource();
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

