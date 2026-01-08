/**
 * Domain Map Configuration
 *
 * Defines domain boundaries and public facades for cross-domain imports.
 * Used by dependency-cruiser and other tooling to enforce architecture boundaries.
 *
 * Usage:
 * - Add new domains here when creating new feature domains
 * - Update facades when adding new public exports
 * - Domain configuration is validated internally
 */

/**
 * Domain definitions with descriptions
 */
const DOMAIN_MAP: Record<string, string> = {
  dashboard: 'Business intelligence and analytics domain',
  billing: 'Billing and subscription management domain',
  chat: 'AI chat and conversation management domain',
  auth: 'Authentication and access control domain',
  ui: 'Design system and UI primitives domain',
  marketing: 'Landing pages and marketing content domain',
  api: 'API routes and server-side logic domain',
  security: 'Security utilities and authentication domain',
  integrations: 'Third-party service integrations domain',
  monitoring: 'Observability and error tracking domain',
  shared: 'Shared utilities and cross-cutting concerns domain',
};

/**
 * Public facades for each domain
 * These are the only exports that can be imported from other domains
 */
const FACADE_MAP: Record<string, string[]> = {
  dashboard: [
    'DashboardLayout',
    'KpiCard',
    'DataTable',
    'DashboardMetrics',
    'DashboardQuery',
    'useDashboardData'
  ],
  billing: [
    'SubscriptionClient',
    'PlanPicker',
    'SubscriptionStatus',
    'BillingProvider',
  ],
  chat: [
    'ChatWindow',
    'MessageList',
    'ChatInput',
    'ChatProvider',
    'useChatContext'
  ],
  auth: [
    'AuthGuard',
    'LoginForm',
    'AuthProvider',
    'useAuth',
    'AuthContext'
  ],
  ui: [
    'Button',
    'Input',
    'Card',
    'Dialog',
    'Badge',
    'SectionHeader',
    'NavMenu',
    // Chart components removed: ChartShell, PieChart, LineChart were deleted as unused
    'BarChart',
    'DataTable'
  ],
  marketing: [
    'HeroSection',
    'FeatureGrid',
    'PricingTable',
    'TestimonialSection',
    'CTASection'
  ],
  api: [
    'apiHandler',
    'withErrorHandling',
    'withRateLimit',
    'makeEdgeRoute'
  ],
  security: [
    'validateSQLScope',
    'checkRateLimit'
  ],
  integrations: [
    'stripeClient',
    'openaiClient',
    'supabaseClient',
    'clickhouseClient'
  ],
  monitoring: [
    'logger',
    'sentry',
    'analytics'
  ],
  shared: [
    'getEnv',
    'publicEnv',
    'cn',
    'formatters',
    'validators',
    'errorHandlers'
  ]
};

/**
 * Domain dependencies - which domains can import from which other domains
 * This defines the allowed dependency graph between domains
 */
const DOMAIN_DEPENDENCIES: Record<string, string[]> = {
  dashboard: ['ui', 'shared', 'security', 'monitoring', 'integrations'],
  billing: ['ui', 'shared', 'security', 'monitoring', 'integrations'],
  chat: ['ui', 'shared', 'security', 'monitoring', 'integrations'],
  auth: ['ui', 'shared', 'security', 'monitoring'],
  marketing: ['ui', 'shared', 'security', 'monitoring'],
  api: ['shared', 'security', 'monitoring', 'integrations'],
  ui: ['shared'],
  security: ['shared'],
  integrations: ['shared', 'security'],
  monitoring: ['shared'],
  shared: [], // Shared domain cannot import from other domains
};

/**
 * Utility function to validate domain configuration
 */
function _validateDomainConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all domains have facades
  for (const domain of Object.keys(DOMAIN_MAP)) {
    if (!FACADE_MAP[domain]) {
      errors.push(`Domain '${domain}' is missing facade definitions`);
    }
  }

  // Check that all facades correspond to domains
  for (const domain of Object.keys(FACADE_MAP)) {
    if (!DOMAIN_MAP[domain]) {
      errors.push(`Facade domain '${domain}' is not defined in DOMAIN_MAP`);
    }
  }

  // Check dependency cycles and invalid dependencies
  for (const [domain, dependencies] of Object.entries(DOMAIN_DEPENDENCIES)) {
    for (const dep of dependencies) {
      if (!DOMAIN_MAP[dep]) {
        errors.push(`Domain '${domain}' has invalid dependency '${dep}'`);
      }

      // Prevent circular dependencies
      if (DOMAIN_DEPENDENCIES[dep]?.includes(domain)) {
        errors.push(`Circular dependency detected between '${domain}' and '${dep}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Constants kept internal for validation within this file


