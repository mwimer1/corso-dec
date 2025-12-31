/**
 * API Route: POST /api/v1/ai/chat
 * 
 * Streams chat processing responses using OpenAI with NDJSON format.
 * 
 * @requires Node.js runtime for Clerk authentication and OpenAI integration
 * @requires Authentication via Clerk (userId required)
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/ai/chat
 * Body: { content: "How many projects in 2024?", preferredTable: "projects" }
 * Response: NDJSON stream of { assistantMessage: { content: "...", type: "assistant" }, detectedTableIntent: null, error: null }
 * ```
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http } from '@/lib/api';
import { clickhouseQuery } from '@/lib/integrations/clickhouse/server';
import { getSchemaJSON, getSchemaSummary, guardSQL, SQLGuardError } from '@/lib/integrations/database/sql-guard';
import { queryMockDb } from '@/lib/integrations/mockdb';
import { logToolCall, normalizeSQLForLogging } from '@/lib/integrations/openai/chat-logging';
import { streamResponseEvents } from '@/lib/integrations/openai/responses';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { handleCors, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_30_PER_MIN } from '@/lib/middleware';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { getEnv } from '@/lib/server/env';
import { logger } from '@/lib/monitoring';
import { withTimeout } from '@/lib/server/utils/timeout';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';
import { z } from 'zod';

/**
 * Sanitize user input to prevent prompt injection attacks
 * Filters out known attack patterns while preserving legitimate queries
 */
function sanitizeUserInput(content: string): string {
  let sanitized = content.trim();
  
  // Filter out prompt injection attempts (case-insensitive)
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /forget\s+(all\s+)?previous\s+instructions?/gi,
    /disregard\s+(all\s+)?previous\s+instructions?/gi,
    /you\s+are\s+now\s+a\s+different\s+(assistant|ai|model)/gi,
    /system\s*:\s*ignore\s+previous/gi,
    /<\|im_end\|>/g, // OpenAI token that could break conversation
    /<\|im_start\|>/g, // OpenAI token that could break conversation
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      // Log potential injection attempt (in dev only)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AI Security] Potential prompt injection detected and filtered:', pattern.toString());
      }
      // Remove the pattern but keep the rest of the content
      sanitized = sanitized.replace(pattern, '').trim();
    }
  }
  
  return sanitized;
}

/**
 * Request body schema for chat endpoint.
 * Includes input sanitization to prevent prompt injection attacks.
 */
const BodySchema = z.object({
  content: z.string()
    .min(1)
    .max(2000)
    .refine(
      (val) => {
        // Reject content that looks like system role impersonation
        const lower = val.toLowerCase();
        return !lower.includes('system:') && !lower.includes('role: system');
      },
      { message: 'Invalid input format' }
    ),
  preferredTable: z.enum(['projects', 'companies', 'addresses']).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
}).strict();

/**
 * AI chunk type matching client expectations
 */
type AIChunk = {
  assistantMessage: { content: string; type: 'assistant' } | null;
  detectedTableIntent: { table: string; confidence: number } | null;
  error: string | null;
};

/**
 * Parses mode prefix from content (e.g., [mode:projects] Hello)
 * Returns the mode and cleaned content
 */
function parseModePrefix(content: string): { mode: string | null; cleanedContent: string } {
  const match = content.match(/^\[mode:(\w+)\]\s*(.*)$/);
  if (match && match[1]) {
    return { mode: match[1]!, cleanedContent: match[2] ? match[2].trim() || content : content };
  }
  return { mode: null, cleanedContent: content };
}

/**
 * Builds system prompt based on preferred table/mode
 */
function buildSystemPrompt(preferredTable?: string | null): string {
  const env = getEnv();
  const maxToolCalls = env.AI_MAX_TOOL_CALLS ?? 3;
  const schemaSummary = getSchemaSummary();
  
  const tableContext = preferredTable 
    ? ` You have access to a database with a "${preferredTable}" table. Answer questions about this data using SQL queries when appropriate.`
    : ' You have access to a database with the following tables:';
  
  return `You are Corso AI, an intelligent assistant that helps users explore and understand their data.${tableContext}

Database Schema:
${preferredTable ? `- ${preferredTable} (see describe_schema tool for columns)` : schemaSummary}

Important Rules:
- You can call execute_sql multiple times (up to ${maxToolCalls} times per conversation turn) to perform multi-step analysis
- Prefer simple, iterative queries over one massive query for better performance and clarity
- Tenant scoping (org_id filtering) is enforced automatically - never include org_id in your queries
- Results are limited to 100 rows; if you need aggregates or counts, compute them in SQL using GROUP BY, COUNT, SUM, etc.
- Never attempt mutations (INSERT, UPDATE, DELETE, DROP, etc.) - only SELECT queries are allowed
- Never reveal raw SQL unless the user explicitly asks to see it
- After executing queries, summarize the results in a user-friendly way
- If you're unsure about column names or schema details, use the describe_schema tool first

Guidelines:
- Answer questions clearly and concisely
- When asked about data, use execute_sql to run SQL queries
- After executing queries, provide clear insights and summaries
- Be helpful and professional
`;
}

/**
 * SQL execution function definition for OpenAI function calling (Chat Completions API)
 */
const executeSqlFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
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
const describeSchemaFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
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
function getChatCompletionsTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return [executeSqlFunction, describeSchemaFunction];
}

/**
 * Executes schema description and returns JSON schema
 */
async function describeSchema(): Promise<string> {
  const schema = getSchemaJSON();
  return JSON.stringify(schema, null, 2);
}

/**
 * Executes SQL query and formats results
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation validation
 * @param req - Optional request object for logging context
 */
async function executeSqlAndFormat(sql: string, orgId: string, req?: NextRequest): Promise<string> {
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

/**
 * Creates a streaming NDJSON response using Responses API
 * @param instructions - System instructions/prompt
 * @param input - Input items for Responses API
 * @param model - Model name
 * @param orgId - Organization ID for tenant isolation
 * @param signal - Abort signal for cancellation
 */
function createResponsesStreamResponse(
  instructions: string,
   
  input: any[], // ResponseInputItem[] - using any due to pnpm multiple package version resolution
  model: string,
  orgId: string,
  req: NextRequest,
  signal?: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const env = getEnv();
        await streamResponseEvents(
          {
            model,
            instructions,
            input,
            maxToolCalls: env.AI_MAX_TOOL_CALLS ?? 3,
            parallelToolCalls: false,
            req,
            ...(signal && { signal }),
          },
          executeSqlAndFormat,
          orgId,
          (chunk) => {
            const jsonLine = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(jsonLine));
          },
        );
        controller.close();
      } catch (error) {
        const errorChunk: AIChunk = {
          assistantMessage: null,
          detectedTableIntent: null,
          error: error instanceof Error ? error.message : 'An error occurred',
        };
        try {
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'));
        } catch {
          // Ignore encoding errors
        }
        controller.close();
      }
    },
  });
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Creates a streaming NDJSON response with function calling support (Chat Completions API)
 * @param stream - OpenAI streaming response
 * @param client - OpenAI client for continuation requests
 * @param model - Model name
 * @param messages - Conversation messages
 * @param orgId - Organization ID for tenant isolation
 * @param signal - Abort signal for cancellation
 */
function createStreamResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  orgId: string,
  req: NextRequest,
  signal?: AbortSignal
): Response {
  const encoder = new TextEncoder();
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let accumulatedContent = '';
        let functionCallId: string | null = null;
        let functionName: string | null = null;
        let functionArguments = '';
        
        for await (const chunk of stream) {
          // Check if request was aborted
          if (signal?.aborted) {
            controller.close();
            return;
          }
          
          const choice = chunk.choices?.[0];
          if (!choice) continue;
          
          const delta = choice.delta;
          
          // Handle function calls
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.id) functionCallId = toolCall.id;
              if (toolCall.function?.name) functionName = toolCall.function.name;
              if (toolCall.function?.arguments) {
                functionArguments += toolCall.function.arguments;
              }
            }
            continue;
          }
          
          // Handle regular content
          if (delta?.content) {
            accumulatedContent += delta.content;
            
            // Send incremental chunk as NDJSON
            const aiChunk: AIChunk = {
              assistantMessage: {
                content: accumulatedContent,
                type: 'assistant',
              },
              detectedTableIntent: null,
              error: null,
            };
            
            const jsonLine = JSON.stringify(aiChunk) + '\n';
            controller.enqueue(encoder.encode(jsonLine));
          }
          
          // Check if function call is complete
          if (choice.finish_reason === 'tool_calls' && functionCallId && functionName) {
            try {
              // Handle describe_schema tool
              if (functionName === 'describe_schema') {
                const schemaResult = await describeSchema();
                
                // Continue conversation with schema result
                const continuationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                  ...messages,
                  {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                      id: functionCallId,
                      type: 'function',
                      function: {
                        name: 'describe_schema',
                        arguments: '{}',
                      },
                    }],
                  },
                  {
                    role: 'tool',
                    tool_call_id: functionCallId,
                    content: schemaResult,
                  },
                ];
                
                // Get response with schema information
                const continuationStream = await client.chat.completions.create({
                  model,
                  messages: continuationMessages,
                  tools: getChatCompletionsTools(),
                  tool_choice: 'auto',
                  stream: true,
                  temperature: 0.7,
                  max_tokens: 1000,
                });
                
                // Stream the continuation response (which may include execute_sql calls)
                let finalContent = accumulatedContent;
                for await (const contChunk of continuationStream) {
                  if (signal?.aborted) {
                    controller.close();
                    return;
                  }
                  
                  const contChoice = contChunk.choices?.[0];
                  if (!contChoice) continue;
                  
                  const contDelta = contChoice.delta;
                  
                  // Handle function calls in continuation
                  if (contDelta?.tool_calls) {
                    // Reset function call tracking for new call
                    functionCallId = null;
                    functionName = null;
                    functionArguments = '';
                    
                    for (const toolCall of contDelta.tool_calls) {
                      if (toolCall.id) functionCallId = toolCall.id;
                      if (toolCall.function?.name) functionName = toolCall.function.name;
                      if (toolCall.function?.arguments) {
                        functionArguments += toolCall.function.arguments;
                      }
                    }
                    continue;
                  }
                  
                  // Handle content in continuation
                  if (contDelta?.content) {
                    finalContent += contDelta.content;
                    
                    const contAiChunk: AIChunk = {
                      assistantMessage: {
                        content: finalContent,
                        type: 'assistant',
                      },
                      detectedTableIntent: null,
                      error: null,
                    };
                    
                    const contJsonLine = JSON.stringify(contAiChunk) + '\n';
                    controller.enqueue(encoder.encode(contJsonLine));
                  }
                  
                  // Handle completion with tool calls in continuation
                  if (contChoice.finish_reason === 'tool_calls' && functionCallId && functionName === 'execute_sql') {
                    // Execute SQL (nested tool call from continuation)
                    const args = JSON.parse(functionArguments) as { query: string };
                    const sqlResults = await executeSqlAndFormat(args.query, orgId);
                    
                    // Continue again with SQL results
                    const sqlContinuationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                      ...continuationMessages,
                      {
                        role: 'assistant',
                        content: null,
                        tool_calls: [{
                          id: functionCallId,
                          type: 'function',
                          function: {
                            name: 'execute_sql',
                            arguments: functionArguments,
                          },
                        }],
                      },
                      {
                        role: 'tool',
                        tool_call_id: functionCallId,
                        content: sqlResults,
                      },
                    ];
                    
                    const sqlContinuationStream = await client.chat.completions.create({
                      model,
                      messages: sqlContinuationMessages,
                      stream: true,
                      temperature: 0.7,
                      max_tokens: 1000,
                    });
                    
                    // Stream final response
                    for await (const sqlChunk of sqlContinuationStream) {
                      if (signal?.aborted) {
                        controller.close();
                        return;
                      }
                      
                      const sqlDelta = sqlChunk.choices?.[0]?.delta;
                      if (sqlDelta?.content) {
                        finalContent += sqlDelta.content;
                        
                        const sqlAiChunk: AIChunk = {
                          assistantMessage: {
                            content: finalContent,
                            type: 'assistant',
                          },
                          detectedTableIntent: null,
                          error: null,
                        };
                        
                        const sqlJsonLine = JSON.stringify(sqlAiChunk) + '\n';
                        controller.enqueue(encoder.encode(sqlJsonLine));
                      }
                    }
                    
                    // Send final chunk
                    const finalChunk: AIChunk = {
                      assistantMessage: {
                        content: finalContent,
                        type: 'assistant',
                      },
                      detectedTableIntent: null,
                      error: null,
                    };
                    controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + '\n'));
                    controller.close();
                    return;
                  }
                }
                
                // Send final chunk for describe_schema response
                const finalChunk: AIChunk = {
                  assistantMessage: {
                    content: finalContent,
                    type: 'assistant',
                  },
                  detectedTableIntent: null,
                  error: null,
                };
                controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + '\n'));
                controller.close();
                return;
              }
              
              // Handle execute_sql tool
              if (functionName === 'execute_sql') {
                // Parse function arguments
                const args = JSON.parse(functionArguments) as { query: string };
                
                // Execute SQL with tenant isolation (req passed for logging)
                const sqlResults = await executeSqlAndFormat(args.query, orgId, req);
              
                // Continue conversation with function result
                const continuationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                  ...messages,
                  {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                      id: functionCallId,
                      type: 'function',
                      function: {
                        name: 'execute_sql',
                        arguments: functionArguments,
                      },
                    }],
                  },
                  {
                    role: 'tool',
                    tool_call_id: functionCallId,
                    content: sqlResults,
                  },
                ];
              
                // Get final response with results
                const continuationStream = await client.chat.completions.create({
                  model,
                  messages: continuationMessages,
                  stream: true,
                  temperature: 0.7,
                  max_tokens: 1000,
                });
              
                // Stream the continuation response
                let finalContent = accumulatedContent;
                for await (const contChunk of continuationStream) {
                  if (signal?.aborted) {
                    controller.close();
                    return;
                  }
                  
                  const contDelta = contChunk.choices?.[0]?.delta;
                  if (contDelta?.content) {
                    finalContent += contDelta.content;
                    
                    const contAiChunk: AIChunk = {
                      assistantMessage: {
                        content: finalContent,
                        type: 'assistant',
                      },
                      detectedTableIntent: null,
                      error: null,
                    };
                    
                    const contJsonLine = JSON.stringify(contAiChunk) + '\n';
                    controller.enqueue(encoder.encode(contJsonLine));
                  }
                }
              
                // Send final chunk
                const finalChunk: AIChunk = {
                  assistantMessage: {
                    content: finalContent,
                    type: 'assistant',
                  },
                  detectedTableIntent: null,
                  error: null,
                };
                controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + '\n'));
                controller.close();
                return;
              }
            } catch (funcError) {
              // Error executing function - send error chunk
              const errorChunk: AIChunk = {
                assistantMessage: null,
                detectedTableIntent: null,
                error: funcError instanceof Error ? funcError.message : 'Function execution failed',
              };
              controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'));
              controller.close();
              return;
            }
          }
        }
        
        // No function call - send final chunk
        const finalChunk: AIChunk = {
          assistantMessage: {
            content: accumulatedContent,
            type: 'assistant',
          },
          detectedTableIntent: null,
          error: null,
        };
        controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + '\n'));
        controller.close();
      } catch (error) {
        // Send error chunk
        const errorChunk: AIChunk = {
          assistantMessage: null,
          detectedTableIntent: null,
          error: error instanceof Error ? error.message : 'An error occurred',
        };
        try {
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'));
        } catch {
          // Ignore encoding errors
        }
        controller.close();
      }
    },
  });
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Main handler for chat requests.
 */
const handler = async (req: NextRequest): Promise<Response> => {
  // Authentication check
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Get tenant context for org isolation
  let tenantContext;
  try {
    tenantContext = await getTenantContext(req);
  } catch (error) {
    // getTenantContext throws ApplicationError with appropriate codes
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      if (code === 'UNAUTHENTICATED') {
        return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
      }
      if (code === 'MISSING_ORG_CONTEXT') {
        return http.error(400, 'Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.', { code: 'MISSING_ORG_CONTEXT' });
      }
    }
    return http.error(400, 'Failed to determine organization context', { code: 'MISSING_ORG_CONTEXT' });
  }
  const { orgId } = tenantContext;

  // Parse request body
  let body: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return http.badRequest('Invalid request body', {
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }
    body = parsed.data;
  } catch (_error) {
    return http.badRequest('Invalid JSON', { code: 'INVALID_JSON' });
  }

  // Security: Sanitize user input to prevent prompt injection
  const sanitizedContent = sanitizeUserInput(body.content);
  if (!sanitizedContent) {
    return http.badRequest('Invalid input: content cannot be empty after sanitization', {
      code: 'VALIDATION_ERROR',
    });
  }

  // Parse mode prefix if present
  const { mode, cleanedContent } = parseModePrefix(sanitizedContent);
  // Treat 'auto' mode as null - let the AI determine which table to use
  const parsedMode = mode === 'auto' ? null : mode;
  const preferredTable = body.preferredTable || parsedMode || null;

  // Build messages array
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  
  // Add system prompt
  messages.push({
    role: 'system',
    content: buildSystemPrompt(preferredTable),
  });

  // Add conversation history (last 10 messages to avoid token limits)
  if (body.history && body.history.length > 0) {
    const recentHistory = body.history.slice(-10);
    for (const msg of recentHistory) {
      // Skip error messages from history
      if (msg.content.includes('⚠️')) continue;
      
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: cleanedContent,
  });

  // Get OpenAI client and model
  const env = getEnv();
  const client = createOpenAIClient();
  // Use SQL model for chat (or fallback to gpt-4o-mini)
  const model = env.OPENAI_SQL_MODEL || 'gpt-4o-mini';
  
  // Security: Warn if using unpinned model (model drift risk)
  // Pinned models (e.g., gpt-4-0613) ensure consistent behavior
  // Generic names (e.g., gpt-4) may change with OpenAI updates
  const pinnedModels = ['gpt-4-0613', 'gpt-4-0125', 'gpt-4-turbo-2024-04-09', 'gpt-4o-mini'];
  const isPinned = pinnedModels.some(pinned => model.includes(pinned) || model === pinned);
  if (!isPinned && env.NODE_ENV !== 'production') {
    logger.warn('[AI Security] Using unpinned model - results may vary with OpenAI updates', {
      model,
      recommended: 'Consider pinning to a specific model version for consistency',
    });
  }

  // Create abort signal from request with overall timeout
  const abortController = new AbortController();
  req.signal?.addEventListener('abort', () => {
    abortController.abort();
  });
  
  // Apply overall request timeout (AI_TOTAL_TIMEOUT_MS)
  const totalTimeout = env.AI_TOTAL_TIMEOUT_MS ?? 60000;
  setTimeout(() => {
    abortController.abort();
  }, totalTimeout);

  // Feature flag: Use Responses API if enabled
  if (env.AI_USE_RESPONSES === true) {
    try {
      // Convert messages to Responses API input format
      const systemPrompt = buildSystemPrompt(preferredTable);
      const inputItems: OpenAI.Responses.ResponseInputItem[] = [];
      
      // Add conversation history as messages (using EasyInputMessage format)
      if (body.history && body.history.length > 0) {
        const recentHistory = body.history.slice(-10);
        for (const msg of recentHistory) {
          // Skip error messages from history
          if (msg.content.includes('⚠️')) continue;
          
          if (msg.role === 'user' || msg.role === 'assistant') {
            // Use EasyInputMessage format - matches ResponseInputItem union type
            // Type assertion needed due to pnpm multiple package version resolution
            inputItems.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
            } as any as OpenAI.Responses.ResponseInputItem);
          }
        }
      }
      
      // Add current user message
      // Type assertion needed due to pnpm multiple package version resolution
      inputItems.push({
        role: 'user',
        content: cleanedContent,
      } as any as OpenAI.Responses.ResponseInputItem);
      
      return createResponsesStreamResponse(
        systemPrompt,
        inputItems,
        model,
        orgId,
        req,
        abortController.signal,
      );
    } catch (error) {
      // Handle Responses API errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
      
      // Return error as NDJSON chunk
      const errorChunk: AIChunk = {
        assistantMessage: null,
        detectedTableIntent: null,
        error: errorMessage,
      };
      
      return new Response(JSON.stringify(errorChunk) + '\n', {
        status: 500,
        headers: {
          'Content-Type': 'application/x-ndjson',
        },
      });
    }
  }

  // Fallback to Chat Completions API
  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      tools: getChatCompletionsTools(),
      tool_choice: 'auto', // Let model decide when to use the functions
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return createStreamResponse(stream, client, model, messages, orgId, req, abortController.signal);
  } catch (error) {
    // Handle OpenAI errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    
    // Return error as NDJSON chunk
    const errorChunk: AIChunk = {
      assistantMessage: null,
      detectedTableIntent: null,
      error: errorMessage,
    };
    
    return new Response(JSON.stringify(errorChunk) + '\n', {
      status: 500,
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    });
  }
};

export const POST = withErrorHandling(
  withRateLimit(
    async (req: NextRequest) => handler(req) as any,
    RATE_LIMIT_30_PER_MIN
  )
);

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}
