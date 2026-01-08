// lib/integrations/mockdb/init-server.ts
// Server-only helper to ensure mock DB is initialized at startup
import 'server-only';

import { getEnv } from '@/lib/server';
import { initMockDb } from './duckdb';
import { logger } from '@/lib/monitoring';

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Ensures mock DB is initialized if mock mode is enabled.
 * Safe to call multiple times - will only initialize once.
 * 
 * @throws {Error} If initialization fails
 */
export async function ensureMockDbInitialized(): Promise<void> {
  // If already initialized, return immediately
  if (initialized) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  const env = getEnv();
  const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || 
                  (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
  
  if (!useMock) {
    // Mock DB not enabled, mark as initialized to skip future checks
    initialized = true;
    return;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      logger.info('[MockDB] Initializing mock database...');
      await initMockDb();
      initialized = true;
      logger.info('[MockDB] Mock database initialized successfully');
    } catch (error) {
      logger.error('[MockDB] Failed to initialize mock database', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Reset state on failure so retry is possible
      initialized = false;
      initPromise = null;
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Reset initialization state (for testing/cleanup)
 */
export function resetMockDbInitState(): void {
  initialized = false;
  initPromise = null;
}
