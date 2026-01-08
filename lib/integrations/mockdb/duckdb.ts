// lib/integrations/mockdb/duckdb.ts
// Sprint 1: DuckDB mock database engine for SQL execution against JSON fixtures
import 'server-only';

import { getEnv } from '@/lib/server/env';
import { DuckDBInstance } from '@duckdb/node-api';
import * as fs from 'fs';
import * as path from 'path';

let _db: DuckDBInstance | null = null;
let _initialized = false;
let _initPromise: Promise<void> | null = null;

/**
 * Initialize DuckDB instance and load mock data from JSON fixtures.
 * Creates normalized views with org_id column for tenant isolation.
 * 
 * @throws {Error} If initialization fails (e.g., JSON files not found)
 */
export async function initMockDb(): Promise<void> {
  if (_initialized && _db) {
    return;
  }

  // Prevent concurrent initialization
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    try {
      // Create in-memory DuckDB instance
      _db = await DuckDBInstance.create(':memory:');
      const conn = await _db.connect();

    const env = getEnv();
    const mockOrgId = env.CORSO_MOCK_ORG_ID ?? 'demo-org';
    const publicDir = path.join(process.cwd(), 'public', '__mockdb__');

    // Helper to load JSON and create table
    const loadJsonTable = async (entityName: string) => {
      const jsonPath = path.join(publicDir, `${entityName}.json`);
      
      if (!fs.existsSync(jsonPath)) {
        throw new Error(`Mock DB: JSON file not found: ${jsonPath}`);
      }

      // Use DuckDB's read_json_auto to read JSON file directly from filesystem
      // Convert Windows paths to forward slashes for DuckDB compatibility
      const normalizedPath = jsonPath.replace(/\\/g, '/');
      
      // Escape single quotes in path
      const escapedPath = normalizedPath.replace(/'/g, "''");
      
      try {
        // Try to create table from JSON file using run() method
        await conn.run(`
          CREATE TABLE ${entityName}_raw AS 
          SELECT * FROM read_json_auto('${escapedPath}')
        `);
      } catch (loadError) {
        // If loading fails, create empty table with org_id
        await conn.run(`CREATE TABLE ${entityName}_raw AS SELECT '${mockOrgId.replace(/'/g, "''")}' AS org_id WHERE 1=0`);
      }

      // Create normalized view with org_id column prepended to all original columns
      await conn.run(`
        CREATE OR REPLACE VIEW ${entityName} AS
        SELECT 
          '${mockOrgId.replace(/'/g, "''")}' AS org_id,
          ${entityName}_raw.*
        FROM ${entityName}_raw
      `);
    };

    // Load all entity tables
    await loadJsonTable('projects');
    await loadJsonTable('companies');
    await loadJsonTable('addresses');

      conn.closeSync();
      _initialized = true;
    } catch (error) {
      _db = null;
      _initialized = false;
      throw new Error(`Failed to initialize mock DB: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      _initPromise = null;
    }
  })();

  return _initPromise;
}

/**
 * Execute SQL query against mock DuckDB database.
 * 
 * @param sql - SQL query to execute (SELECT only)
 * @returns Query results as array of row objects
 * @throws {Error} If database not initialized or query fails
 */
export async function queryMockDb(sql: string): Promise<any[]> {
  if (!_initialized || !_db) {
    await initMockDb();
  }

  if (!_db) {
    throw new Error('Mock DB not initialized');
  }

  try {
    const conn = await _db.connect();
    
    try {
      // Execute query - run() returns a materialized result
      const result = await conn.run(sql);
      
      // Use getRowObjects() to get all rows as objects with column names as keys
      const rows = await result.getRowObjects();
      
      return rows;
    } catch (queryError) {
      throw queryError;
    } finally {
      conn.closeSync();
    }
  } catch (error) {
    throw new Error(`Mock DB query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Close DuckDB connection and reset state (for testing/cleanup)
 */
export async function closeMockDb(): Promise<void> {
  if (_db) {
    try {
      _db.closeSync();
    } catch {
      // Ignore errors during cleanup
    }
    _db = null;
    _initialized = false;
    _initPromise = null;
  }
}

