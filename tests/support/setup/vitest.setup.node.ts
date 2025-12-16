// Node.js specific test setup - server-side mocks

import { vi } from 'vitest';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '../../../lib/shared';

// Mock minimal lib/api barrel used by API routes in tests
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<any>();

  const http = {
    ok: (data: any) => ({
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true, data }),
    }),
    badRequest: (message: string, meta?: any) => ({
      status: 400,
      headers: new Headers(),
      json: async () => ({ success: false, error: { code: meta?.code ?? 'VALIDATION_ERROR', message } }),
    }),
    error: (status: number, message: string, meta?: any) => ({
      status,
      headers: new Headers(),
      json: async () => ({ success: false, error: { code: meta?.code ?? `ERROR_${status}`, message, details: meta?.details } }),
    }),
    noContent: () => ({
      status: 204,
      headers: new Headers(),
    }),
  };

  function withErrorHandlingEdge(fn: any) {
    return async (req: any) => {
      try {
        return await fn(req);
      } catch (err: any) {
        // diagnostic logging for test runs
        console.log('[withErrorHandlingEdge] caught error:', err, 'code:', err?.code, 'severity:', err?.severity);
        // Use ApplicationError-like shape if available
        const code = err?.code;
        const msg = err instanceof Error ? err.message : String(err ?? '');
        if (code === 'INTERNAL_DATABASE_ERROR' || err?.severity === 'CRITICAL') {
          return http.error(500, msg, { code });
        }
        return http.badRequest(msg, { code });
      }
    };
  }

  function withRateLimitEdge(fn: any) {
    return fn;
  }

  // Spread actual exports and override the specific functions needed for tests
  return {
    ...actual,
    http,
    withErrorHandlingEdge,
    withRateLimitEdge
  };
});

// Mock ClickHouse client for security tests
vi.mock('@/lib/integrations/clickhouse/client', () => ({
  clickhouseQuery: vi.fn().mockImplementation(async (sql: string) => {
    // Mock security validation behavior
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lowerSql = sql.toLowerCase();

    // Reject dangerous operations
    if (/(drop|insert|update|delete|truncate|alter|create|exec|execute)\b/i.test(sql)) {
      throw new Error('security validation failed: dangerous operation detected');
    }

    // Reject system table access
    if (/(system\.|information_schema)/i.test(sql)) {
      throw new Error('security validation failed: system tables not allowed');
    }

    // Reject UNION injection
    if (/\bunion\b/i.test(sql)) {
      throw new Error('security validation failed: UNION injection detected');
    }

    // Reject SQL comments
    if (/--|\/\*/.test(sql)) {
      throw new Error('security validation failed: SQL comments not allowed');
    }

    // Reject large limits
    if (/limit\s+(\d+)/i.test(sql)) {
      const match = sql.match(/limit\s+(\d+)/i);
      if (match && parseInt(match[1]) > 1000) {
        throw new Error('security validation failed: query limit too high');
      }
    }

    // Accept safe SELECT queries
    if (/^select\b/i.test(sql)) {
      return [{ id: 1, name: 'test' }];
    }

    throw new Error('security validation failed: only SELECT queries allowed');
  }),
}));

// Mock auth RBAC module used by API routes
vi.mock('@/lib/auth/authorization/roles', () => ({
  assertRole: (currentRole: string | null | undefined, required: string | string[]) => {
    const allowed = Array.isArray(required) ? required : [required];
    if (!allowed.includes(currentRole ?? '')) {
      throw new ApplicationError({
        message: 'Insufficient role permissions.',
        code: 'FORBIDDEN',
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.ERROR,
        context: { currentRole, required: allowed },
      });
    }
  },
  enforceRBAC: (_roles: any) => (handler: any) => handler,
  getUserRole: async (_userId: string | null) => 'member',
  hasRole: (_user: any, _role: any) => true,
  has: (params: { role?: string }) => (params?.role ? ['member', 'admin', 'owner'].includes(params.role) : true),
}));

// Mock auth server module used by API routes
vi.mock('@/lib/auth/server', () => ({
  requireAuthContext: async () => ({
    userId: 'test-user',
    has: (q: { role?: string }) => (q?.role ? ['member', 'admin', 'owner'].includes(q.role) : true)
  })
}));

// Mock server env access used by routes
vi.mock('@/lib/integrations/env', () => ({
  getEnv: () => ({
    CORSO_USE_MOCK_DB: 'false',
    OPENAI_RATE_LIMIT_PER_MIN: '30',
    CLICKHOUSE_URL: 'http://localhost:8123',
  }),
}));

// Mock feature flags used by routes
vi.mock('@/lib/integrations/feature-flags/feature-flags', () => ({
  DEFAULT_FLAGS: {
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
      promptGuardEnabled: true,
      sqlScopeEnforcement: 'strict',
      turnstileEnabled: false,
      externalSSOEnabled: false,
      maxUploadSize: 10 * 1024 * 1024,
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
  },
  getFeatureFlags: async () => ({
    analytics: { limits: { maxRowsPerQuery: 10000 } },
  }),
}));

// Note: do not mock '@/lib/security' here; prefer alias resolution to real barrel to avoid hoisting/import issues
// Provide a lightweight test mock for security guards used by API routes to avoid resolver issues.
vi.mock('@/lib/security', async (importOriginal) => {
  const actual = await importOriginal<any>();

  const DANGEROUS_RE = /\b(drop|insert|delete|update|truncate|alter|create)\b/i;
  const UNION_RE = /\bUNION\b/i;
  const SYSTEM_RE = /\b(system\.|information_schema)\b/i;
  const SQL_COMMENT_REGEX = /(--|\/\*).*?(\*\/)?/gs;

  function validateSQLScope(sql: string, expectedOrgId?: string) {
    if (!sql || typeof sql !== 'string' || !sql.trim()) {
      throw new Error('Invalid SQL input');
    }
    const norm = sql.toLowerCase();
    if (DANGEROUS_RE.test(norm) || SQL_COMMENT_REGEX.test(norm)) {
      // mimic ApplicationError payload shape
      throw new Error('Suspicious SQL patterns detected: DROP statement');
    }
    if (expectedOrgId && /from\s+\w+/i.test(sql) && !/where\s+org_id\s*=/.test(norm)) {
      throw new Error('Tenant isolation violation: org_id filter required for multi-tenant queries');
    }
    if (expectedOrgId) {
      const m = sql.match(/org_id\s*=\s*['"]?([^'"\s]+)/i);
      if (m && m[1] !== expectedOrgId) {
        throw new Error('Tenant isolation violation: org_id mismatch');
      }
    }
    if (UNION_RE.test(norm)) throw new Error('UNION injection');
    return;
  }

  function validateAIGeneratedSQL(sql: string, orgId?: string) {
    const trimmed = (sql || '').trim();
    const withoutTrailing = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
    if (withoutTrailing.includes(';')) {
      return { isValid: false, sanitizedSQL: '', securityIssues: ['Multi-statement queries are not allowed'] };
    }
    try {
      validateSQLScope(withoutTrailing, orgId);
      return { isValid: true, sanitizedSQL: withoutTrailing, securityIssues: [] };
    } catch (err) {
      return { isValid: false, sanitizedSQL: '', securityIssues: [err instanceof Error ? err.message : String(err)] };
    }
  }

  function validateSQLSecurity(sql: string, expectedOrgId?: string) {
    try {
      validateSQLScope(sql, expectedOrgId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { isValid: false, reason: `SQL validation failed: ${message}` };
    }
    const lower = (sql || '').toLowerCase();
    if (SYSTEM_RE.test(lower)) return { isValid: false, reason: 'Access to system tables not allowed' };
    if (!lower.startsWith('select')) return { isValid: false, reason: 'Only SELECT queries are allowed in ClickHouse' };
    if (DANGEROUS_RE.test(lower)) return { isValid: false, reason: 'Potentially dangerous SQL operation detected' };
    return { isValid: true, sanitizedSQL: sql };
  }

  // Spread actual exports and override the specific functions needed for tests
  return {
    ...actual,
    validateSQLScope,
    validateAIGeneratedSQL,
    validateSQLSecurity
  };
});


