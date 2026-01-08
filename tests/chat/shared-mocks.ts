/**
 * Shared mock setup for chat and AI route tests
 * 
 * Centralizes common mocks (OpenAI, tenant context, SQL validation, ClickHouse)
 * to reduce duplication across split test files.
 */

import { vi } from 'vitest';

// Mock OpenAI client
export const mockCreateCompletion = vi.fn();
vi.mock('@/lib/integrations/openai/server', () => ({
  createOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  }),
}));

// Mock getTenantContext
export const mockGetTenantContext = vi.fn();
vi.mock('@/lib/server/db/tenant-context', () => ({
  getTenantContext: (req?: any) => mockGetTenantContext(req),
}));

// Mock validateSQLScope
export const mockValidateSQLScope = vi.fn();
vi.mock('@/lib/integrations/database/scope', () => ({
  validateSQLScope: (sql: string, expectedOrgId?: string) => mockValidateSQLScope(sql, expectedOrgId),
}));

// Mock clickhouseQuery
export const mockClickhouseQuery = vi.fn();
vi.mock('@/lib/integrations/clickhouse/server', () => ({
  clickhouseQuery: (sql: string) => mockClickhouseQuery(sql),
}));

// Mock getEnv
export const mockGetEnv = vi.fn();
vi.mock('@/lib/server/env', () => ({
  getEnv: () => mockGetEnv(),
}));

/**
 * Setup default mocks for chat/AI route tests
 */
export function setupDefaultMocks() {
  // Default: mock getEnv with RBAC enforcement enabled (default behavior)
  mockGetEnv.mockReturnValue({
    OPENAI_SQL_MODEL: 'gpt-4o-mini',
    NODE_ENV: 'test',
    AI_MAX_TOOL_CALLS: 3,
    AI_QUERY_TIMEOUT_MS: 5000,
    AI_TOTAL_TIMEOUT_MS: 60000,
    ENFORCE_AI_RBAC: true, // Default: enforced
  });

  // Default: mock tenant context with org ID from header
  mockGetTenantContext.mockImplementation(async (req?: any) => {
    const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
    return { 
      orgId: orgId || 'default-session-org-id', 
      userId: 'test-user-123' 
    };
  });

  // Default: mock validateSQLScope to pass (only check for unsafe patterns, not tenant isolation)
  mockValidateSQLScope.mockImplementation((sql: string, _expectedOrgId?: string) => {
    const s = sql.toLowerCase();
    // Check for unsafe SQL patterns
    if (/\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s)) {
      throw new Error('Unsafe SQL detected');
    }
  });

  // Default: mock clickhouseQuery to return empty results
  mockClickhouseQuery.mockResolvedValue([]);

  // Default: mock OpenAI streaming response
  mockCreateCompletion.mockResolvedValue({
    [Symbol.asyncIterator]: async function* () {
      yield {
        choices: [{
          delta: { content: 'Hello' },
          finish_reason: null,
        }],
      };
      yield {
        choices: [{
          delta: { content: ' there' },
          finish_reason: 'stop',
        }],
      };
    },
  });
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}
