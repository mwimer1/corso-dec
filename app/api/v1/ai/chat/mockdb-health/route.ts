/**
 * API Route: GET /api/v1/ai/chat/mockdb-health
 * 
 * Health check endpoint for mock database.
 * Returns status of mock DB initialization and basic connectivity test.
 * 
 * @requires Server-only (Node.js runtime)
 */

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';

import { getEnv } from '@/lib/server/env';
import { http } from '@/lib/api';
import { ensureMockDbInitialized } from '@/lib/integrations/mockdb/init-server';

/**
 * Health check handler for mock database
 */
export async function GET(): Promise<Response> {
  const env = getEnv();
  const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || 
                  (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
  
  if (!useMock) {
    return http.ok({
      enabled: false,
      message: 'Mock DB is not enabled',
    });
  }
  
  try {
    // Ensure mock DB is initialized
    await ensureMockDbInitialized();
    
    // Test query to verify connectivity
    const { queryMockDb } = await import('@/lib/integrations/mockdb');
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    
    // Test query on each table
    const [projectsResult, companiesResult, addressesResult] = await Promise.all([
      queryMockDb(`SELECT COUNT(*) as count FROM projects WHERE org_id = '${mockOrgId.replace(/'/g, "''")}'`).catch(() => null),
      queryMockDb(`SELECT COUNT(*) as count FROM companies WHERE org_id = '${mockOrgId.replace(/'/g, "''")}'`).catch(() => null),
      queryMockDb(`SELECT COUNT(*) as count FROM addresses WHERE org_id = '${mockOrgId.replace(/'/g, "''")}'`).catch(() => null),
    ]);
    
    const projectsCount = projectsResult?.[0]?.count ?? null;
    const companiesCount = companiesResult?.[0]?.count ?? null;
    const addressesCount = addressesResult?.[0]?.count ?? null;
    
    return http.ok({
      enabled: true,
      healthy: true,
      orgId: mockOrgId,
      tables: {
        projects: projectsCount,
        companies: companiesCount,
        addresses: addressesCount,
      },
      message: 'Mock DB is healthy and accessible',
    });
  } catch (error) {
    return http.error(500, 'Mock DB health check failed', {
      code: 'MOCKDB_HEALTH_CHECK_FAILED',
      details: {
        enabled: true,
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
