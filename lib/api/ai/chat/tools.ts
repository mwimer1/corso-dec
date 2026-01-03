// lib/api/ai/chat/tools.ts
// Server-only tool definitions and handlers for AI chat endpoint

import 'server-only';

import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';
import { getSchemaJSON, getSchemaSummary, guardSQL, SQLGuardError } from '@/lib/integrations/database/sql-guard';
import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';
import { queryMockDb } from '@/lib/integrations/mockdb';
import { logToolCall, normalizeSQLForLogging } from '@/lib/integrations/openai/chat-logging';
import { getEnv } from '@/lib/server/env';
import { withTimeout } from '@/lib/server/utils/timeout';

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
 * Executes SQL query and formats results
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation validation
 * @param req - Optional request object for logging context
 */
export async function executeSqlAndFormat(sql: string, orgId: string, req?: NextRequest): Promise<string> {
  const startTime = performance.now();
  const normalizedSQL = normalizeSQLForLogging(sql);
  
  try {
    const env = getEnv();
    // Determine if mock DB should be used (same logic as entity routes)
    // Default to mock in dev/test unless explicitly disabled; production defaults to real DB
    const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || 
                    (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
    
    // In mock mode, use mockOrgId from env for validation
    const expectedOrgId = useMock ? (env.CORSO_MOCK_ORG_ID ?? 'demo-org') : orgId;
    
    // Security: Use SQL Guard for AST-based validation, org filter injection, and LIMIT enforcement
    // This is a critical security check - all AI-generated SQL must pass guardSQL validation
    // before execution. guardSQL performs AST parsing and blocks dangerous operations.
    let guarded;
    try {
      guarded = guardSQL(sql, {
        expectedOrgId,
        maxRows: 100, // Limit results to 100 rows for chat display
      });
    } catch (guardError) {
      // SQL Guard validation failed
      const durationMs = performance.now() - startTime;
      const reason = guardError instanceof SQLGuardError 
        ? guardError.code || 'VALIDATION_FAILED'
        : 'VALIDATION_FAILED';
      
      logToolCall({
        ...(req && { req }),
        orgId,
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
      
      return safeMessage;
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
        orgId,
        toolName: 'execute_sql',
        normalizedSQL,
        allowDenyReason: 'allowed',
        rowsReturned: rowCount,
        durationMs,
        success: true,
      });
      
      if (!results || results.length === 0) {
        return 'The query returned no results.';
      }
      
      // Format results as a readable summary
      if (results.length === 1) {
        const row = results[0] as Record<string, unknown>;
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
    } catch (dbError) {
      const durationMs = performance.now() - startTime;
      
      // Log database error (sanitized)
      logToolCall({
        ...(req && { req }),
        orgId,
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
      
      if (isTimeout) {
        return 'Query execution timed out. Please try a simpler query.';
      }
      
      // Generic error message (safe for users, detailed error already logged)
      return 'Error executing query: Database error occurred. Please try again or simplify your query.';
    }
  } catch (error) {
    const durationMs = performance.now() - startTime;
    
    // Log unexpected errors
    logToolCall({
      ...(req && { req }),
      orgId,
      toolName: 'execute_sql',
      normalizedSQL,
      allowDenyReason: 'error',
      durationMs,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Return safe generic error
    return 'Error executing query: An unexpected error occurred. Please try again.';
  }
}
