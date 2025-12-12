// lib/server/feature-flags/feature-flags.ts
import 'server-only';

// Note: Using console.log instead of logger to avoid circular dependencies in shared layer
import { simpleCacheManager } from '@/lib/shared';
import {
    featureFlags as coreFeatureFlags,
    getFeatureFlagsForLogging as coreGetFeatureFlagsForLogging,
    getFeatureValue as coreGetFeatureValue,
    isFeatureEnabled as coreIsFeatureEnabled,
    refreshFeatureFlags as coreRefreshFeatureFlags,
    DEFAULT_FLAGS,
    registerFeatureFlagsLoader
} from '@/lib/shared/feature-flags/core';
import type { FeatureFlagConfig } from '@/types/shared';
import { buildFeatureFlags as buildFlagsFromFactory } from './builder';

/**
 * Feature flag system using environment variables from /config
 * Provides runtime feature toggling and gradual rollouts
 */

/**
 * Build feature flags from environment variables using the data-driven factory
 */
function buildFeatureFlags(): FeatureFlagConfig {
  return buildFlagsFromFactory();
}

/**
 * Get all feature flags - always returns complete FeatureFlags object
 * On ConfigLoader error, logs and falls back to DEFAULT_FLAGS
 */
export async function getFeatureFlags(): Promise<FeatureFlagConfig> {
  try {
    const cached = simpleCacheManager.get<FeatureFlagConfig>('feature-flags');
    if (cached !== undefined) {
      return cached;
    }

    const flags = await buildFeatureFlags();
    simpleCacheManager.set('feature-flags', flags, 2 * 60 * 1000); // 2 minutes TTL
    return flags;
  } catch (error) {
    console.error('Failed to load feature flags, using defaults', error);
    return DEFAULT_FLAGS;
  }
}

// Register the server-specific loader with the core module
registerFeatureFlagsLoader(buildFeatureFlags);

// Re-export core functionality
export {
    DEFAULT_FLAGS, coreFeatureFlags as featureFlags, coreGetFeatureFlagsForLogging as getFeatureFlagsForLogging, coreGetFeatureValue as getFeatureValue, coreIsFeatureEnabled as isFeatureEnabled, coreRefreshFeatureFlags as refreshFeatureFlags
};

