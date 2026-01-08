/**
 * Feature configuration interfaces
 * Defines feature flags and feature-specific configurations that lib modules can use
 */

export interface FeatureFlagConfig {
  chat: ChatFeatureConfig;
  billing: BillingFeatureConfig;
  analytics: AnalyticsFeatureConfig;
  security: SecurityFeatureConfig;
  ui: UIFeatureConfig;
  integrations: IntegrationFeatureConfig;
  /** Allow dynamic feature paths */
  [key: string]: unknown;
}

interface ChatFeatureConfig {
  enabled: boolean;
  maxMessageLength: number;
  aiEnabled: boolean;
  streamingEnabled: boolean;
  fileUploadEnabled: boolean;
  features: {
    imageAnalysis: boolean;
    codeExecution: boolean;
    sqlGeneration: boolean;
    chartGeneration: boolean;
    multiLanguage: boolean;
  };
  limits: {
    maxHistoryLength: number;
    maxConcurrentChats: number;
    rateLimitPerMinute: number;
  };
}

interface BillingFeatureConfig {
  enabled: boolean;
  allowTrials: boolean;
  stripeEnabled: boolean;
  subscriptionManagement: boolean;
  features: {
    invoiceGeneration: boolean;
    paymentMethodManagement: boolean;
    prorationHandling: boolean;
    taxCalculation: boolean;
    multiCurrency: boolean;
  };
  limits: {
    maxTrialDays: number;
    maxSeatsPerPlan: number;
    invoiceRetentionDays: number;
  };
}

interface AnalyticsFeatureConfig {
  enabled: boolean;
  clickhouseEnabled: boolean;
  realtimeEnabled: boolean;
  exportEnabled: boolean;
  features: {
    customDashboards: boolean;
    advancedCharts: boolean;
    dataExport: boolean;
    scheduledReports: boolean;
    alerting: boolean;
  };
  limits: {
    maxQueryTimeout: number;
    maxRowsPerQuery: number;
    maxDashboards: number;
    maxCharts: number;
  };
}

interface SecurityFeatureConfig {
  promptGuardEnabled: boolean;
  sqlScopeEnforcement: 'strict' | 'permissive';
  turnstileEnabled: boolean;
  externalSSOEnabled: boolean;
  maxUploadSize: number;
  features: {
    threatDetection: boolean;
    anomalyDetection: boolean;
    complianceReporting: boolean;
    auditTrails: boolean;
  };
}

interface UIFeatureConfig {
  darkModeEnabled: boolean;
  beta: {
    newDashboard: boolean;
    advancedCharts: boolean;
    aiInsights: boolean;
    collaborativeEditing: boolean;
  };
  customization: {
    themes: boolean;
    branding: boolean;
    layouts: boolean;
  };
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    keyboardNavigation: boolean;
  };
}

interface IntegrationFeatureConfig {
  openai: {
    enabled: boolean;
    gpt4Enabled: boolean;
    visionEnabled: boolean;
    features: {
      sqlGeneration: boolean;
      chartGeneration: boolean;
      dataInsights: boolean;
      naturalLanguageQuery: boolean;
    };
  };
  intercom: {
    enabled: boolean;
    chatEnabled: boolean;
    features: {
      knowledgeBase: boolean;
      ticketManagement: boolean;
      liveChat: boolean;
    };
  };
  sentry: {
    enabled: boolean;
    performanceMonitoring: boolean;
    features: {
      errorTracking: boolean;
      performanceMetrics: boolean;
      releaseTracking: boolean;
      userFeedback: boolean;
    };
  };
  stripe: {
    enabled: boolean;
    features: {
      subscriptions: boolean;
      invoices: boolean;
      paymentMethods: boolean;
      taxHandling: boolean;
    };
  };
  clickhouse: {
    enabled: boolean;
    features: {
      realtime: boolean;
      aggregations: boolean;
      customQueries: boolean;
      dataExport: boolean;
    };
  };
}

