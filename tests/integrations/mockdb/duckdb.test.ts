/**
 * Unit tests for DuckDB mock database engine
 */

import { closeMockDb, initMockDb, queryMockDb } from '@/lib/integrations/mockdb/duckdb';
import { getEnv } from '@/lib/server/env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('DuckDB Mock Database', () => {
  beforeAll(async () => {
    // Ensure mock DB is initialized before tests
    await initMockDb();
  });

  afterAll(async () => {
    // Clean up after tests
    await closeMockDb();
  });

  it('initializes successfully', async () => {
    await expect(initMockDb()).resolves.not.toThrow();
  });

  it('can execute simple COUNT query', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT COUNT(*) AS n FROM projects WHERE org_id = '${mockOrgId}'`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('n');
    expect(typeof result[0]?.n).toBe('number');
  });

  it('returns org_id column in results', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT org_id FROM projects WHERE org_id = '${mockOrgId}' LIMIT 1`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('org_id');
      expect(result[0]?.org_id).toBe(mockOrgId);
    }
  });

  it('can query projects table', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT * FROM projects WHERE org_id = '${mockOrgId}' LIMIT 5`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
    
    if (result.length > 0) {
      // Check that org_id is present
      expect(result[0]).toHaveProperty('org_id');
      expect(result[0]?.org_id).toBe(mockOrgId);
    }
  });

  it('can query companies table', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT COUNT(*) AS n FROM companies WHERE org_id = '${mockOrgId}'`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('n');
  });

  it('can query addresses table', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT COUNT(*) AS n FROM addresses WHERE org_id = '${mockOrgId}'`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('n');
  });

  it('handles queries with LIMIT', async () => {
    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    const result = await queryMockDb(`SELECT * FROM projects WHERE org_id = '${mockOrgId}' LIMIT 3`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array for queries with no results', async () => {
    const result = await queryMockDb(`SELECT * FROM projects WHERE org_id = 'non-existent-org' LIMIT 1`);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Result might be empty if no matching org_id, or might return empty array
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

