// lib/api/ai/chat/tools.ts
// Server-only tool definitions and handlers for AI chat endpoint

import 'server-only';

import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';
import { getSchemaJSON, guardSQL, SQLGuardError } from '@/lib/integrations/database/sql-guard';
import { queryMockDb } from '@/lib/integrations/mockdb';
import { logToolCall, normalizeSQLForLogging } from '@/lib/integrations/openai/chat-logging';
import { getEnv } from '@/lib/server/env';
import { withTimeout } from '@/lib/server/utils/timeout';
import type { ColumnDef } from '@/types/chat';
import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';

/**
 * SQL execution function definition for OpenAI function calling (Chat Completions API)
 */
export const executeSqlFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'execute_sql',
    description: 'Execute a SQL SELECT query to retrieve data from the database. Only SELECT queries are allowed. Results are limited to 100 rows. Tenant scoping is automatically enforced. Use this when the user asks for specific data or statistics. You can call this function multiple times (up to the limit) for multi-step analysis.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL SELECT query to execute. Must be SELECT-only. Allowed tables: projects, companies, addresses. Results are limited to 100 rows. Use aggregates (COUNT, SUM, etc.) in SQL if you need summary statistics.',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Schema description function definition for OpenAI function calling (Chat Completions API)
 * Optional tool to help the model understand available columns
 */
export const describeSchemaFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'describe_schema',
    description: 'Get the schema (available tables and columns) for the database. Use this if you\'re unsure about column names or need to understand the database structure before writing queries.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

/**
 * Get available tools for Chat Completions API
 */
export function getChatCompletionsTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return [executeSqlFunction, describeSchemaFunction];
}

/**
 * Executes schema description and returns JSON schema
 */
export async function describeSchema(): Promise<string> {
  const schema = getSchemaJSON();
  return JSON.stringify(schema, null, 2);
}

/**
 * Structured result from SQL execution
 */
export interface SqlExecutionResult {
  formattedForModel: string;      // Current text format for LLM
  rows: Array<Record<string, unknown>>; // Raw rows from DB
  columns: ColumnDef[];            // Derived from row keys/schema
  rowCount: number;
  isTabular: boolean;              // true when should render as table
  detectedTables: string[];        // Tables referenced in the SQL query (FROM/JOIN)
}

/**
 * Infer column type from a value
 */
function inferColumnType(value: unknown): string {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  return 'string';
}

/**
 * Derive columns from rows
 */
function deriveColumns(rows: Array<Record<string, unknown>>): ColumnDef[] {
  if (rows.length === 0) return [];
  
  // Use first row to determine column names and types
  const firstRow = rows[0]!;
  const columnNames = Object.keys(firstRow);
  
  return columnNames.map(name => ({
    name,
    type: inferColumnType(firstRow[name]),
  }));
}

/**
 * Determine if results should be rendered as a table
 */
function isTabularResult(rows: Array<Record<string, unknown>>): boolean {
  if (rows.length === 0) return false;
  
  const firstRow = rows[0]!;
  const keyCount = Object.keys(firstRow).length;
  
  // Tabular if: has at least 1 row AND (row has >= 2 keys OR multiple rows)
  return rows.length >= 1 && (keyCount >= 2 || rows.length > 1);
}

/**
 * Convert detected tables array to detectedTableIntent format
 * @param detectedTables - Array of table names from SQL query
 * @returns detectedTableIntent object or null
 */
export function createDetectedTableIntent(detectedTables: string[]): { table: string; confidence: number } | null {
  if (detectedTables.length === 0) {
    return null;
  }
  
  if (detectedTables.length === 1) {
    // Exactly one table: high confidence
    return { table: detectedTables[0]!, confidence: 1 };
  }
  
  // Multiple tables: pick first table with lower confidence
  // This allows the UI to show table context even for JOIN queries,
  // while indicating uncertainty with lower confidence
  return { table: detectedTables[0]!, confidence: 0.5 };
}

/**
 * Format results as text for the model (preserves existing behavior)
 */
function formatResultsForModel(results: Array<Record<string, unknown>>, rowCount: number): string {
  if (results.length === 0) {
    return 'The query returned no results.';
  }
  
  // Format results as a readable summary
  if (results.length === 1) {
    const row = results[0]!;
    const keys = Object.keys(row);
    if (keys.length === 1) {
      // Single value result (e.g., COUNT(*))
      return `Result: ${String(row[keys[0]!])}`;
    }
  }
  
  // Multiple rows - create a summary
  if (rowCount <= 5) {
    // Small result set - show all
    return `Found ${rowCount} result(s):\n${JSON.stringify(results, null, 2)}`;
  } else {
    // Large result set - show summary and first few rows
    const preview = results.slice(0, 3);
    return `Found ${rowCount} results (showing first 3):\n${JSON.stringify(preview, null, 2)}\n\n(Query was limited to 100 rows for display)`;
  }
}

/**
 * Execute SQL and return structured result
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation validation (nullable for personal-scope users)
 * @param req - Optional request object for logging context
 */
export async function executeSqlWithStructure(sql: string, orgId: string | null, req?: NextRequest): Promise<SqlExecutionResult> {
  const startTime = performance.now();
  const normalizedSQL = normalizeSQLForLogging(sql);
  
  try {
    const env = getEnv();
    // Determine if mock DB should be used (same logic as entity routes)
    // Default to mock in dev/test unless explicitly disabled; production defaults to real DB
    const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || 
                    (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
    
    // In mock mode, use mockOrgId from env for validation
    // For personal-scope users (orgId is null), expectedOrgId is undefined (no org filter enforcement)
    const effectiveOrgId = useMock ? (env.CORSO_MOCK_ORG_ID ?? 'demo-org') : orgId;
    
    // Security: Use SQL Guard for AST-based validation, org filter injection, and LIMIT enforcement
    // This is a critical security check - all AI-generated SQL must pass guardSQL validation
    // before execution. guardSQL performs AST parsing and blocks dangerous operations.
    // When orgId is null (personal-scope), org filter injection is skipped (expectedOrgId omitted)
    let guarded;
    try {
      const guardOptions: { maxRows: number; expectedOrgId?: string } = {
        maxRows: 100, // Limit results to 100 rows for chat display
      };
      // Only include expectedOrgId if orgId is present (for exactOptionalPropertyTypes compatibility)
      if (effectiveOrgId) {
        guardOptions.expectedOrgId = effectiveOrgId;
      }
      guarded = guardSQL(sql, guardOptions);
    } catch (guardError) {
      // SQL Guard validation failed
      const durationMs = performance.now() - startTime;
      const reason = guardError instanceof SQLGuardError 
        ? guardError.code || 'VALIDATION_FAILED'
        : 'VALIDATION_FAILED';
      
      logToolCall({
        ...(req && { req }),
        orgId: orgId ?? 'personal', // Use 'personal' as placeholder for logging when orgId is null
        toolName: 'execute_sql',
        normalizedSQL,
        allowDenyReason: reason,
        durationMs,
        success: false,
        error: guardError instanceof Error ? guardError : new Error(String(guardError)),
      });
      
      // Return safe user-friendly error message
      const safeMessage = guardError instanceof SQLGuardError
        ? `Query validation failed: ${guardError.message}`
        : 'Query validation failed: Invalid SQL query';
      
      return {
        formattedForModel: safeMessage,
        rows: [],
        columns: [],
        rowCount: 0,
        isTabular: false,
        detectedTables: [],
      };
    }
    
    // Execute normalized SQL query with timeout
    // Route to mock DB or ClickHouse based on flag
    const queryTimeout = env.AI_QUERY_TIMEOUT_MS ?? 5000;
    let queryPromise;
    try {
      queryPromise = useMock 
        ? queryMockDb(guarded.sql)
        : clickhouseQuery(guarded.sql);
      
      const results = await withTimeout(queryPromise, queryTimeout);
      const durationMs = performance.now() - startTime;
      const rowCount = results?.length ?? 0;
      
      // Log successful execution
      logToolCall({
        ...(req && { req }),
        orgId: orgId ?? 'personal', // Use 'personal' as placeholder for logging when orgId is null
        toolName: 'execute_sql',
        normalizedSQL,
        allowDenyReason: 'allowed',
        rowsReturned: rowCount,
        durationMs,
        success: true,
      });
      
      const rows = (results ?? []) as Array<Record<string, unknown>>;
      const columns = deriveColumns(rows);
      const isTabular = isTabularResult(rows);
      const formattedForModel = formatResultsForModel(rows, rowCount);
      
      // Extract detected tables from guardSQL metadata
      const detectedTables = guarded.metadata.tablesUsed || [];
      
      return {
        formattedForModel,
        rows,
        columns,
        rowCount,
        isTabular,
        detectedTables,
      };
    } catch (dbError) {
      const durationMs = performance.now() - startTime;
      
      // Log database error (sanitized)
      logToolCall({
        ...(req && { req }),
        orgId: orgId ?? 'personal', // Use 'personal' as placeholder for logging when orgId is null
        toolName: 'execute_sql',
        normalizedSQL,
        allowDenyReason: 'allowed', // Validation passed, but execution failed
        durationMs,
        success: false,
        error: dbError instanceof Error ? dbError : new Error(String(dbError)),
      });
      
      // Return safe error message (don't leak DB internals)
      const isTimeout = dbError instanceof Error && 
                       (dbError.message.includes('timeout') || dbError.message.includes('Timeout'));
      
      let errorMessage: string;
      if (isTimeout) {
        errorMessage = 'Query execution timed out. Please try a simpler query.';
      } else {
        // Check if this is a mock DB error and provide helpful guidance
        const isMockError = useMock && dbError instanceof Error && 
                           (dbError.message.includes('Mock DB') || 
                            dbError.message.includes('not found') ||
                            dbError.message.includes('JSON file'));
        
        if (isMockError) {
          errorMessage = 'Mock database error: Please check that JSON files exist in public/__mockdb__/ and are valid JSON. The mock DB may need to be initialized.';
        } else {
          // Generic error message (safe for users, detailed error already logged)
          errorMessage = 'Error executing query: Database error occurred. Please try again or simplify your query.';
        }
      }
      
      return {
        formattedForModel: errorMessage,
        rows: [],
        columns: [],
        rowCount: 0,
        isTabular: false,
        detectedTables: [],
      };
    }
  } catch (error) {
    const durationMs = performance.now() - startTime;
    
    // Log unexpected errors
    logToolCall({
      ...(req && { req }),
      orgId: orgId ?? 'personal', // Use 'personal' as placeholder for logging when orgId is null
      toolName: 'execute_sql',
      normalizedSQL,
      allowDenyReason: 'error',
      durationMs,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Return safe generic error
    return {
      formattedForModel: 'Error executing query: An unexpected error occurred. Please try again.',
      rows: [],
      columns: [],
      rowCount: 0,
      isTabular: false,
      detectedTables: [],
    };
  }
}

/**
 * Executes SQL query and formats results (backwards compatible wrapper)
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation validation (nullable for personal-scope users)
 * @param req - Optional request object for logging context
 */
export async function executeSqlAndFormat(sql: string, orgId: string | null, req?: NextRequest): Promise<string> {
  const result = await executeSqlWithStructure(sql, orgId, req);
  return result.formattedForModel;
}
