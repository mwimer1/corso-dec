// lib/shared/feature-flags/core.ts
import type { FeatureFlagConfig } from '@/types/shared';
import { simpleCacheManager } from '../cache/simple-cache';

/**
 * Feature flag system core implementation
 * Provides runtime feature toggling and gradual rollouts
 */

/**
 * Default feature flags - safe fallback when configuration fails
 */
export const DEFAULT_FLAGS: FeatureFlagConfig = {
  chat: {
    enabled: false,
    maxMessageLength: 2000,
    aiEnabled: false,
    streamingEnabled: false,
    fileUploadEnabled: false,
    features: {
      imageAnalysis: false,
      codeExecution: false,
      sqlGeneration: false,
      chartGeneration: false,
      multiLanguage: false,
    },
    limits: {
      maxHistoryLength: 50,
      maxConcurrentChats: 10,
      rateLimitPerMinute: 60,
    },
  },
  billing: {
    enabled: false,
    allowTrials: false,
    stripeEnabled: false,
    subscriptionManagement: false,
    features: {
      invoiceGeneration: false,
      paymentMethodManagement: false,
      prorationHandling: false,
      taxCalculation: false,
      multiCurrency: false,
    },
    limits: {
      maxTrialDays: 14,
      maxSeatsPerPlan: 10,
      invoiceRetentionDays: 365,
    },
  },
  analytics: {
    enabled: false,
    clickhouseEnabled: false,
    realtimeEnabled: false,
    exportEnabled: false,
    features: {
      customDashboards: false,
      advancedCharts: false,
      dataExport: false,
      scheduledReports: false,
      alerting: false,
    },
    limits: {
      maxQueryTimeout: 60000,
      maxRowsPerQuery: 10000,
      maxDashboards: 10,
      maxCharts: 20,
    },
  },
  security: {
    promptGuardEnabled: true, // Always enabled for security
    sqlScopeEnforcement: 'strict',
    turnstileEnabled: false,
    externalSSOEnabled: false,
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    features: {
      threatDetection: false,
      anomalyDetection: false,
      complianceReporting: false,
      auditTrails: false,
    },
  },
  ui: {
    darkModeEnabled: true,
    beta: {
      newDashboard: false,
      advancedCharts: false,
      aiInsights: false,
      collaborativeEditing: false,
    },
    customization: {
      themes: false,
      branding: false,
      layouts: false,
    },
    accessibility: {
      screenReader: false,
      highContrast: false,
      keyboardNavigation: false,
    },
  },
  integrations: {
    openai: {
      enabled: false,
      gpt4Enabled: false,
      visionEnabled: false,
      features: {
        sqlGeneration: false,
        chartGeneration: false,
        dataInsights: false,
        naturalLanguageQuery: false,
      },
    },
    intercom: {
      enabled: false,
      chatEnabled: false,
      features: {
        knowledgeBase: false,
        ticketManagement: false,
        liveChat: false,
      },
    },
    sentry: {
      enabled: false,
      performanceMonitoring: false,
      features: {
        errorTracking: false,
        performanceMetrics: false,
        releaseTracking: false,
        userFeedback: false,
      },
    },
    stripe: {
        enabled: false,
        features: {
            subscriptions: false,
            invoices: false,
            paymentMethods: false,
            taxHandling: false,
        }
    },
    clickhouse: {
        enabled: false,
        features: {
            realtime: false,
            aggregations: false,
            customQueries: false,
            dataExport: false,
        }
    }
  },
};

const FEATURE_FLAGS_CACHE_KEY = 'feature-flags';
const FEATURE_FLAGS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Server-provided feature flags loader (injected at runtime on server).
 * This indirection keeps the shared layer edge/client-safe by avoiding
 * direct imports from server-only modules.
 */
let _featureFlagsLoader: (() => Promise<FeatureFlagConfig> | FeatureFlagConfig) | null = null;

/** Register a server-only loader for feature flags (no-op on client/edge). */
export function registerFeatureFlagsLoader(
  loader: () => Promise<FeatureFlagConfig> | FeatureFlagConfig,
): void {
  _featureFlagsLoader = loader;
  // Invalidate cache so subsequent reads use the new loader
  simpleCacheManager.delete(FEATURE_FLAGS_CACHE_KEY);
}

/**
 * Build feature flags from environment variables using the data-driven factory
 */
function buildFeatureFlags(): FeatureFlagConfig | Promise<FeatureFlagConfig> {
  if (_featureFlagsLoader) {
    try {
      return _featureFlagsLoader();
    } catch (error) {
      console.error('Feature flags loader failed, using defaults', error);
      return DEFAULT_FLAGS;
    }
  }
  // Fallback when no server loader is registered (edge/client contexts)
  return DEFAULT_FLAGS;
}

/**
 * Get all feature flags - always returns complete FeatureFlags object
 * On ConfigLoader error, logs and falls back to DEFAULT_FLAGS
 */
export async function getFeatureFlags(): Promise<FeatureFlagConfig> {
  try {
    const cached = simpleCacheManager.get<FeatureFlagConfig>(FEATURE_FLAGS_CACHE_KEY);
    if (cached !== undefined) {
      return cached;
    }

    const flags = await buildFeatureFlags();
    simpleCacheManager.set(FEATURE_FLAGS_CACHE_KEY, flags, FEATURE_FLAGS_CACHE_TTL);
    return flags;
  } catch (error) {
    console.error('Failed to load feature flags, using defaults', error);
    return DEFAULT_FLAGS;
  }
}

/**
 * Helper function to traverse a nested object using dot notation path
 */
function traversePath(obj: unknown, path: string): unknown {
  return getNestedFeatureFlag(obj, path);
}

/**
 * Get nested feature flag value from object using dot notation path
 * Centralized helper to eliminate duplication across feature flag access patterns
 */
function getNestedFeatureFlag(flags: unknown, path: string): boolean | undefined {
  const pathParts = path.split('.');
  let current: unknown = flags;

  for (const part of pathParts) {
    current = (current as Record<string, unknown>)[part];
    if (current === undefined) {
      return undefined;
    }
  }

  return typeof current === 'boolean' ? current : undefined;
}

/**
 * Safely resolves a nested value and returns a boolean with default fallback.
 * Local helper to collapse repeated try/catch + undefined handling.
 */
function _resolveFlagOrDefault<T extends boolean>(flags: FeatureFlagConfig, featurePath: string, fallback: T): T {
  try {
    const value = traversePath(flags, featurePath);
    return (value === undefined ? fallback : Boolean(value)) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(featurePath: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  const value = _resolveFlagOrDefault(flags, featurePath, false);
  if (value === false) {
    // Preserve existing observability
    const raw = traversePath(flags, featurePath);
    if (raw === undefined) console.warn(`Feature flag path not found: ${featurePath}`);
  }
  return value;
}

/**
 * Get feature flag value with type safety
 */
export async function getFeatureValue<T>(featurePath: string, defaultValue: T): Promise<T> {
  const flags = await getFeatureFlags();
  try {
    const value = traversePath(flags, featurePath);
    if (value === undefined) {
      console.log(`Feature flag path not found, using default: ${featurePath}`);
      return defaultValue;
    }
    return value as T;
  } catch (error) {
    console.error(`Error getting feature flag value: ${featurePath}`, error);
    return defaultValue;
  }
}

/**
 * Refresh feature flags cache
 */
export async function refreshFeatureFlags(): Promise<void> {
  simpleCacheManager.delete(FEATURE_FLAGS_CACHE_KEY);
  await getFeatureFlags();
  console.log('Feature flags refreshed');
}

/**
 * Flatten nested object to primitive values for logging
 */
function flattenFeatureFlags(obj: Record<string, unknown> | FeatureFlagConfig, prefix = ''): Record<string, boolean | number | string> {
  let result: Record<string, boolean | number | string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      Object.assign(result, flattenFeatureFlags(value as Record<string, unknown>, newKey));
    } else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      const newKey = prefix ? `${prefix}.${key}` : key;
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Get feature flags for logging/debugging
 * Returns flat map of primitive flags (no nested objects)
 */
export async function getFeatureFlagsForLogging(): Promise<Record<string, boolean>> {
  const flags = await getFeatureFlags();
  const flattened = flattenFeatureFlags(flags);

  // Filter to only boolean values for logging
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(flattened)) {
    if (typeof value === 'boolean') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Convenience functions for common feature checks
 */
export const featureFlags = {
  // Chat features
  isChatEnabled: (): Promise<boolean> => isFeatureEnabled('chat.enabled'),
  isAIEnabled: (): Promise<boolean> => isFeatureEnabled('chat.aiEnabled'),
  isStreamingEnabled: (): Promise<boolean> => isFeatureEnabled('chat.streamingEnabled'),
  isPromptGuardEnabled: (): Promise<boolean> => isFeatureEnabled('security.promptGuardEnabled'),

  // Billing features
  isBillingEnabled: (): Promise<boolean> => isFeatureEnabled('billing.enabled'),
  isStripeEnabled: (): Promise<boolean> => isFeatureEnabled('billing.stripeEnabled'),
  areTrialsAllowed: (): Promise<boolean> => isFeatureEnabled('billing.allowTrials'),

  // Analytics features
  isAnalyticsEnabled: (): Promise<boolean> => isFeatureEnabled('analytics.enabled'),
  isClickHouseEnabled: (): Promise<boolean> => isFeatureEnabled('analytics.clickhouseEnabled'),
  isRealtimeEnabled: (): Promise<boolean> => isFeatureEnabled('analytics.realtimeEnabled'),

  // Security features
  isTurnstileEnabled: (): Promise<boolean> => isFeatureEnabled('security.turnstileEnabled'),
  isExternalSSOEnabled: (): Promise<boolean> => isFeatureEnabled('security.externalSSOEnabled'),

  // Integration features
  isOpenAIEnabled: (): Promise<boolean> => isFeatureEnabled('integrations.openai.enabled'),
  isIntercomEnabled: (): Promise<boolean> => isFeatureEnabled('integrations.intercom.enabled'),
  isSentryEnabled: (): Promise<boolean> => isFeatureEnabled('integrations.sentry.enabled'),

  // UI features (no beta flags currently active)
  isDarkModeEnabled: (): Promise<boolean> => isFeatureEnabled('ui.darkModeEnabled'),
};

