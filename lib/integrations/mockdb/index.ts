// lib/integrations/mockdb/index.ts
// Sprint 1: DuckDB mock database engine
import 'server-only';

export { initMockDb, queryMockDb, closeMockDb } from './duckdb';
export { ensureMockDbInitialized, resetMockDbInitState } from './init-server';

