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
import { guardSQL, SQLGuardError } from '@/lib/integrations/database/sql-guard';
import { queryMockDb } from '@/lib/integrations/mockdb';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { handleCors, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit } from '@/lib/middleware';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { getEnv } from '@/lib/server/env';
import { withTimeout } from '@/lib/server/utils/timeout';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';
import { z } from 'zod';

/**
 * Request body schema for chat endpoint.
 */
const BodySchema = z.object({
  content: z.string().min(1).max(2000),
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
  const tableContext = preferredTable 
    ? ` You have access to a database with a "${preferredTable}" table. Answer questions about this data using SQL queries when appropriate.`
    : ' You have access to a database with tables: projects, companies, and addresses. Answer questions about this data using SQL queries when appropriate.';
  
  return `You are Corso AI, an intelligent assistant that helps users explore and understand their data.${tableContext}

Guidelines:
- Answer questions clearly and concisely
- When asked about data, you can use the execute_sql function to run SQL queries
- Always ensure SQL queries are safe (SELECT-only, properly scoped)
- After executing a query, summarize the results in a user-friendly way
- Be helpful and professional
`;
}

/**
 * SQL execution function definition for OpenAI function calling
 */
const executeSqlFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'execute_sql',
    description: 'Execute a SQL SELECT query to retrieve data from the database. Only use this when the user asks for specific data or statistics.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL SELECT query to execute. Must be a safe SELECT query only.',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Executes SQL query and formats results
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation validation
 */
async function executeSqlAndFormat(sql: string, orgId: string): Promise<string> {
  try {
    const env = getEnv();
    // Determine if mock DB should be used (same logic as entity routes)
    // Default to mock in dev/test unless explicitly disabled; production defaults to real DB
    const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || 
                    (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
    
    // In mock mode, use mockOrgId from env for validation
    const expectedOrgId = useMock ? (env.CORSO_MOCK_ORG_ID ?? 'demo-org') : orgId;
    
    // Use SQL Guard for AST-based validation, org filter injection, and LIMIT enforcement
    const guarded = guardSQL(sql, {
      expectedOrgId,
      maxRows: 100, // Limit results to 100 rows for chat display
    });
    
    // Execute normalized SQL query with timeout
    // Route to mock DB or ClickHouse based on flag
    const queryTimeout = env.AI_QUERY_TIMEOUT_MS ?? 5000;
    const queryPromise = useMock 
      ? queryMockDb(guarded.sql)
      : clickhouseQuery(guarded.sql);
    
    const results = await withTimeout(queryPromise, queryTimeout);
    
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
    const rowCount = results.length;
    
    if (rowCount <= 5) {
      // Small result set - show all
      return `Found ${rowCount} result(s):\n${JSON.stringify(results, null, 2)}`;
    } else {
      // Large result set - show summary and first few rows
      const preview = results.slice(0, 3);
      return `Found ${rowCount} results (showing first 3):\n${JSON.stringify(preview, null, 2)}\n\n(Query was limited to 100 rows for display)`;
    }
  } catch (error) {
    // Handle SQLGuardError with user-friendly messages
    if (error instanceof SQLGuardError) {
      return `Query validation failed: ${error.message}`;
    }
    const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
    return `Error executing query: ${errorMessage}`;
  }
}

/**
 * Creates a streaming NDJSON response with function calling support
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
          if (choice.finish_reason === 'tool_calls' && functionCallId && functionName === 'execute_sql') {
            try {
              // Parse function arguments
              const args = JSON.parse(functionArguments) as { query: string };
              
              // Execute SQL with tenant isolation
              const sqlResults = await executeSqlAndFormat(args.query, orgId);
              
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

  // Parse mode prefix if present
  const { mode, cleanedContent } = parseModePrefix(body.content);
  const preferredTable = body.preferredTable || mode || null;

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

  // Create streaming completion with function calling
  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      tools: [executeSqlFunction],
      tool_choice: 'auto', // Let model decide when to use the function
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Create abort signal from request with overall timeout
    const abortController = new AbortController();
    req.signal?.addEventListener('abort', () => {
      abortController.abort();
    });
    
    // Apply overall request timeout (AI_TOTAL_TIMEOUT_MS)
    // Note: This timeout will abort the stream, which will cause createStreamResponse
    // to handle the abort and close the stream gracefully
    const totalTimeout = env.AI_TOTAL_TIMEOUT_MS ?? 60000;
    setTimeout(() => {
      abortController.abort();
    }, totalTimeout);

    return createStreamResponse(stream, client, model, messages, orgId, abortController.signal);
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
    { windowMs: 60_000, maxRequests: 30 }
  )
);

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}
