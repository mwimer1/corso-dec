/**
 * Integration tests for executeSqlAndFormat SQL guard enforcement
 * 
 * Verifies that invalid SQL never reaches the ClickHouse/mockDB executor.
 * Uses real guardSQL but mocks clickhouseQuery and queryMockDb to verify they're never called with invalid SQL.
 */

import { SQLGuardError } from '@/lib/integrations/database/sql-guard';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeSqlAndFormat } from '@/lib/api/ai/chat/tools';

// IMPORTANT: Do NOT mock guardSQL - we want to use the real implementation
// This ensures we test the actual guard logic

// Mock clickhouseQuery to verify it's never called with invalid SQL
const mockClickhouseQuery = vi.fn();
vi.mock('@/lib/integrations/clickhouse/server', () => ({
  clickhouseQuery: (...args: any[]) => mockClickhouseQuery(...args),
}));

// Mock queryMockDb to verify it's never called with invalid SQL
const mockQueryMockDb = vi.fn();
vi.mock('@/lib/integrations/mockdb', () => ({
  queryMockDb: (...args: any[]) => mockQueryMockDb(...args),
}));

// Mock getEnv to control mock DB vs real DB path
const mockGetEnv = vi.fn();
vi.mock('@/lib/server/env', () => ({
  getEnv: () => mockGetEnv(),
}));

// Mock logToolCall (not critical for guard verification)
vi.mock('@/lib/integrations/openai/chat-logging', () => ({
  logToolCall: vi.fn(),
  normalizeSQLForLogging: (sql: string) => sql,
}));

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

// Mock withTimeout (simple passthrough for tests)
vi.mock('@/lib/server/utils/timeout', () => ({
  withTimeout: async (promise: Promise<any>) => promise,
}));

describe('executeSqlAndFormat - SQL Guard Integration', () => {
  const TEST_ORG_ID = 'test-org-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: use real DB (not mock)
    mockGetEnv.mockReturnValue({
      CORSO_USE_MOCK_DB: 'false',
      CORSO_MOCK_ORG_ID: 'demo-org',
      NODE_ENV: 'test',
      AI_QUERY_TIMEOUT_MS: 5000,
    });
    // Default: mock successful query execution
    mockClickhouseQuery.mockResolvedValue([
      { id: 1, name: 'Project 1', status: 'active' },
    ]);
    mockQueryMockDb.mockResolvedValue([
      { id: 1, name: 'Project 1', status: 'active' },
    ]);
  });

  describe('Guard prevents destructive SQL from reaching executor (real DB)', () => {
    it('should reject DROP TABLE and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat('DROP TABLE projects', TEST_ORG_ID);
      
      expect(result).toContain('Query validation failed');
      expect(result).toMatch(/DROP|validation failed/i);
      
      // CRITICAL: Verify clickhouseQuery was NEVER called (guard prevented execution)
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject INSERT and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'INSERT INTO projects (name) VALUES (\'test\')',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject UPDATE and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'UPDATE projects SET name = \'hacked\' WHERE id = 1',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject DELETE and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'DELETE FROM projects WHERE id = 1',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject ALTER TABLE and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'ALTER TABLE projects ADD COLUMN malicious BOOLEAN',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard prevents system table access from reaching executor (real DB)', () => {
    it('should reject system table access and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'SELECT * FROM system.tables',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard prevents multi-statement queries from reaching executor (real DB)', () => {
    it('should reject multi-statement queries and never call clickhouseQuery', async () => {
      const result = await executeSqlAndFormat(
        'SELECT * FROM projects; DROP TABLE projects',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard prevents destructive SQL from reaching executor (mock DB)', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue({
        CORSO_USE_MOCK_DB: 'true',
        CORSO_MOCK_ORG_ID: 'demo-org',
        NODE_ENV: 'test',
        AI_QUERY_TIMEOUT_MS: 5000,
      });
    });

    it('should reject DROP TABLE and never call queryMockDb', async () => {
      const result = await executeSqlAndFormat('DROP TABLE projects', TEST_ORG_ID);
      
      expect(result).toContain('Query validation failed');
      
      // CRITICAL: Verify queryMockDb was NEVER called (guard prevented execution)
      expect(mockQueryMockDb).not.toHaveBeenCalled();
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject INSERT and never call queryMockDb', async () => {
      const result = await executeSqlAndFormat(
        'INSERT INTO projects (name) VALUES (\'test\')',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockQueryMockDb).not.toHaveBeenCalled();
    });
  });

  describe('Guard allows valid SQL to reach executor (real DB)', () => {
    it('should allow valid SELECT with org filter and call clickhouseQuery', async () => {
      const validSQL = 'SELECT * FROM projects';
      const result = await executeSqlAndFormat(validSQL, TEST_ORG_ID);
      
      // Should return formatted results (not error message)
      expect(result).not.toContain('Query validation failed');
      expect(result).toBeTruthy();
      
      // CRITICAL: Verify clickhouseQuery WAS called (guard passed, execution proceeded)
      expect(mockClickhouseQuery).toHaveBeenCalledTimes(1);
      // guardSQL normalizes and injects org_id, so the SQL passed to executor will be normalized
      const calledSQL = mockClickhouseQuery.mock.calls[0]?.[0];
      expect(calledSQL).toBeTruthy();
      expect(typeof calledSQL).toBe('string');
    });

    it('should allow valid SELECT with COUNT and call clickhouseQuery', async () => {
      const validSQL = 'SELECT COUNT(*) as count FROM projects';
      const result = await executeSqlAndFormat(validSQL, TEST_ORG_ID);
      
      expect(result).not.toContain('Query validation failed');
      expect(mockClickhouseQuery).toHaveBeenCalledTimes(1);
    });

    it('should allow valid SELECT with WHERE and call clickhouseQuery', async () => {
      const validSQL = 'SELECT * FROM projects WHERE status = \'active\'';
      const result = await executeSqlAndFormat(validSQL, TEST_ORG_ID);
      
      expect(result).not.toContain('Query validation failed');
      expect(mockClickhouseQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Guard allows valid SQL to reach executor (mock DB)', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue({
        CORSO_USE_MOCK_DB: 'true',
        CORSO_MOCK_ORG_ID: 'demo-org',
        NODE_ENV: 'test',
        AI_QUERY_TIMEOUT_MS: 5000,
      });
    });

    it('should allow valid SELECT and call queryMockDb', async () => {
      const validSQL = 'SELECT * FROM projects';
      const result = await executeSqlAndFormat(validSQL, TEST_ORG_ID);
      
      expect(result).not.toContain('Query validation failed');
      
      // CRITICAL: Verify queryMockDb WAS called (guard passed, execution proceeded)
      expect(mockQueryMockDb).toHaveBeenCalledTimes(1);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard rejects disallowed tables', () => {
    it('should reject queries on disallowed tables and never call executor', async () => {
      const result = await executeSqlAndFormat(
        'SELECT * FROM users',
        TEST_ORG_ID
      );
      
      expect(result).toContain('Query validation failed');
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });
});
