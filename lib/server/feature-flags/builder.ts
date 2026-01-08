// lib/server/feature-flags/builder.ts
import { getEnv } from '@/lib/server/env';
import type { FeatureFlagConfig } from '@/types/shared';
import 'server-only';

/**
 * Domain flag definitions - maps each domain to its flag configurations
 */
const DOMAIN_FLAG_DEFINITIONS = {
  chat: [
    {
      path: 'enabled',
      compute: envHas('OPENAI_API_KEY'),
      defaultValue: false,
    },
    {
      path: 'maxMessageLength',
      compute: portionOfNumber('OPENAI_TOKENS_WARN_THRESHOLD', 0.25, 2000),
      defaultValue: 2000,
    },
    {
      path: 'aiEnabled',
      compute: envHas('OPENAI_API_KEY'),
      defaultValue: false,
    },
    {
      path: 'streamingEnabled',
      compute: previewOrNonProd,
      defaultValue: false,
    },
    {
      path: 'fileUploadEnabled',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.imageAnalysis',
      compute: nonProd,
      defaultValue: false,
    },
    {
      path: 'features.codeExecution',
      compute: nonProd,
      defaultValue: false,
    },
    {
      path: 'features.sqlGeneration',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.chartGeneration',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.multiLanguage',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'limits.maxHistoryLength',
      compute: always(50),
      defaultValue: 50,
    },
    {
      path: 'limits.maxConcurrentChats',
      compute: prodElse(10, 50),
      defaultValue: 10,
    },
    {
      path: 'limits.rateLimitPerMinute',
      compute: (env: any) => (env['OPENAI_RATE_LIMIT_PER_MIN'] as any) || 60,
      defaultValue: 60,
    },
  ],

  billing: [
    {
      path: 'enabled',
      compute: envHas('STRIPE_SECRET_KEY'),
      defaultValue: false,
    },
    {
      path: 'allowTrials',
      compute: nonProd,
      defaultValue: false,
    },
    {
      path: 'stripeEnabled',
      compute: (env: any) => !!(env as any).STRIPE_SECRET_KEY && !!(env as any).STRIPE_WEBHOOK_SECRET,
      defaultValue: false,
    },
    {
      path: 'subscriptionManagement',
      compute: envHas('STRIPE_SECRET_KEY'),
      defaultValue: false,
    },
    {
      path: 'features.invoiceGeneration',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.paymentMethodManagement',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.prorationHandling',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.taxCalculation',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'features.multiCurrency',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'limits.maxTrialDays',
      compute: always(14),
      defaultValue: 14,
    },
    {
      path: 'limits.maxSeatsPerPlan',
      compute: always(100),
      defaultValue: 10,
    },
    {
      path: 'limits.invoiceRetentionDays',
      compute: always(365),
      defaultValue: 365,
    },
  ],

  analytics: [
    {
      path: 'enabled',
      compute: envHas('CLICKHOUSE_URL'),
      defaultValue: false,
    },
    {
      path: 'clickhouseEnabled',
      compute: (env: any) => !!(env as any).CLICKHOUSE_URL && !!(env as any).CLICKHOUSE_PASSWORD,
      defaultValue: false,
    },
    {
      path: 'realtimeEnabled',
      compute: (env: any, isProd: boolean) => !!(env as any).CLICKHOUSE_URL && !isProd,
      defaultValue: false,
    },
    {
      path: 'exportEnabled',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.customDashboards',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.advancedCharts',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.dataExport',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.scheduledReports',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'features.alerting',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'limits.maxQueryTimeout',
      compute: always(60000),
      defaultValue: 60000,
    },
    {
      path: 'limits.maxRowsPerQuery',
      compute: always(10000),
      defaultValue: 10000,
    },
    {
      path: 'limits.maxDashboards',
      compute: always(10),
      defaultValue: 10,
    },
    {
      path: 'limits.maxCharts',
      compute: always(20),
      defaultValue: 20,
    },
  ],

  security: [
    {
      path: 'promptGuardEnabled',
      compute: always(true), // Always enabled for security
      defaultValue: true,
    },
    {
      path: 'sqlScopeEnforcement',
      compute: (_env: any, isProd: boolean) => { void _env; return isProd ? 'strict' : 'permissive'; },
      defaultValue: 'strict',
    },
    {
      path: 'turnstileEnabled',
      compute: envHas('TURNSTILE_SECRET_KEY'),
      defaultValue: false,
    },
    {
      path: 'externalSSOEnabled',
      compute: (env: any) => (env as any).ENABLE_EXTERNAL_SSO === 'true',
      defaultValue: false,
    },
    {
      path: 'maxUploadSize',
      compute: (_env: any, isProd: boolean) => { void _env; return isProd ? 10 * 1024 * 1024 : 50 * 1024 * 1024; },
      defaultValue: 10 * 1024 * 1024,
    },
    {
      path: 'features.threatDetection',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.anomalyDetection',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'features.complianceReporting',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'features.auditTrails',
      compute: always(true),
      defaultValue: false,
    },
  ],

  ui: [
    {
      path: 'darkModeEnabled',
      compute: always(true),
      defaultValue: true,
    },
    {
      path: 'beta.newDashboard',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'beta.advancedCharts',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'beta.aiInsights',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'beta.collaborativeEditing',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'customization.themes',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'customization.branding',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'customization.layouts',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'accessibility.screenReader',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'accessibility.highContrast',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'accessibility.keyboardNavigation',
      compute: always(true),
      defaultValue: false,
    },
  ],

  integrations: [
    // OpenAI integration
    {
      path: 'openai.enabled',
      compute: envHas('OPENAI_API_KEY'),
      defaultValue: false,
    },
    {
      path: 'openai.gpt4Enabled',
      compute: (env: any) => !!(env as any).OPENAI_API_KEY && anyIncludes(['OPENAI_SQL_MODEL', 'OPENAI_CHART_MODEL'], 'gpt-4')(env as any),
      defaultValue: false,
    },
    {
      path: 'openai.visionEnabled',
      compute: (env: any, isProd: boolean) => !!(env as any).OPENAI_API_KEY && !isProd,
      defaultValue: false,
    },
    {
      path: 'openai.features.sqlGeneration',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'openai.features.chartGeneration',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'openai.features.dataInsights',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'openai.features.naturalLanguageQuery',
      compute: always(true),
      defaultValue: false,
    },
    // Intercom feature flags removed for MVP
    // Sentry integration
    {
      path: 'sentry.enabled',
      compute: envHas('SENTRY_DSN'),
      defaultValue: false,
    },
    {
      path: 'sentry.performanceMonitoring',
      compute: (env: any, isProd: boolean) => !!(env as any).SENTRY_DSN && isProd,
      defaultValue: false,
    },
    {
      path: 'sentry.features.errorTracking',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'sentry.features.performanceMetrics',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'sentry.features.releaseTracking',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'sentry.features.userFeedback',
      compute: always(false),
      defaultValue: false,
    },
    // Stripe integration
    {
      path: 'stripe.enabled',
      compute: envHas('STRIPE_SECRET_KEY'),
      defaultValue: false,
    },
    {
      path: 'stripe.features.subscriptions',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'stripe.features.invoices',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'stripe.features.paymentMethods',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'stripe.features.taxHandling',
      compute: always(false),
      defaultValue: false,
    },
    // ClickHouse integration
    {
      path: 'clickhouse.enabled',
      compute: envHas('CLICKHOUSE_URL'),
      defaultValue: false,
    },
    {
      path: 'clickhouse.features.realtime',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'clickhouse.features.aggregations',
      compute: always(true),
      defaultValue: false,
    },
    {
      path: 'clickhouse.features.customQueries',
      compute: always(false),
      defaultValue: false,
    },
    {
      path: 'clickhouse.features.dataExport',
      compute: always(true),
      defaultValue: false,
    },
  ],
};

/**
 * Set a nested property on an object using a dot-notation path
 */
function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;

  // Navigate to the parent object, creating intermediate objects as needed
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;

    current = ensureNestedObject(current, key);
  }

  // Set the final property
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Helper to ensure a nested object exists at the given key
 */
function ensureNestedObject(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  if (!(key in obj) || typeof obj[key] !== 'object' || obj[key] === null) {
    obj[key] = {};
  }
  return obj[key] as Record<string, unknown>;
}


/**
 * Helper to get environment context for flag computation
 */
function getEnvironmentContext() {
  return {
    env: getEnv(),
    isProd: getEnv().NODE_ENV === 'production',
    isPreview: getEnv().NEXT_PUBLIC_STAGE === 'preview',
  };
}

/**
 * Helper to process a single flag definition with error handling
 */
function processFlagDefinition(
  definition: any,
  result: Record<string, unknown>,
  domain: string,
  environment: ReturnType<typeof getEnvironmentContext>
): void {
  try {
    const value = definition.compute(environment.env, environment.isProd, environment.isPreview);
    setNestedProperty(result, definition.path, value);
  } catch (error) {
    console.warn(`Failed to compute flag ${domain}.${definition.path}, using default:`, error);
    setNestedProperty(result, definition.path, definition.defaultValue);
  }
}

/**
 * Build all feature flags using the data-driven factory
 */
export function buildFeatureFlags(): FeatureFlagConfig {
  const result: Record<string, unknown> = {};

  for (const domain of Object.keys(DOMAIN_FLAG_DEFINITIONS) as string[]) {
    const environment = getEnvironmentContext();
    const definitions = DOMAIN_FLAG_DEFINITIONS[domain as keyof typeof DOMAIN_FLAG_DEFINITIONS];
    const domainResult: Record<string, unknown> = {};

    for (const definition of definitions) {
      processFlagDefinition(definition, domainResult, domain, environment);
    }

    result[domain] = domainResult;
  }

  return result as FeatureFlagConfig;
}

/* -------------------------------------------------------------------------- */
/* Local helpers to reduce repeated compute patterns                          */
/* -------------------------------------------------------------------------- */

type Env = ReturnType<typeof getEnv>;

function always<T>(value: T) {
  return (_env: Env, _isProd: boolean, _isPreview: boolean) => value as unknown;
}

function nonProd(_env: Env, isProd: boolean) {
  return !isProd;
}

function previewOrNonProd(_env: Env, isProd: boolean, isPreview: boolean) {
  return !isProd || isPreview;
}

function prodElse<T>(prodValue: T, nonProdValue: T) {
  return (_env: Env, isProd: boolean) => (isProd ? prodValue : nonProdValue) as unknown;
}

function envHas(key: keyof Env | string) {
  return (env: Env) => Boolean((env as Record<string, unknown>)[key as string]);
}

function anyIncludes(keys: (keyof Env | string)[], substring: string) {
  return (env: Env) => keys.some((k) => {
    const value = (env as Record<string, unknown>)[k as string];
    return typeof value === 'string' && value.includes(substring);
  });
}

function portionOfNumber(key: keyof Env | string, portion: number, fallback: number) {
  return (env: Env) => {
    const raw = (env as Record<string, unknown>)[key as string];
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) ? Math.floor(num * portion) : fallback;
  };
}

