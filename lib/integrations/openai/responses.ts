// lib/integrations/openai/responses.ts
// Sprint 3: OpenAI Responses API streaming adapter with multi-tool loop support
import 'server-only';

import { getSchemaJSON } from '@/lib/integrations/database/sql-guard';
import { logToolLoopTermination } from '@/lib/integrations/openai/chat-logging';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { getEnv } from '@/lib/server/env';
import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';

/**
 * Tool definition for execute_sql in Responses API format
 */
export const executeSqlTool: OpenAI.Responses.FunctionTool = {
  type: 'function',
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
    additionalProperties: false, // Strict schema - reject unknown properties
  },
  strict: true, // Enforce strict parameter validation
};

/**
 * Tool definition for describe_schema in Responses API format
 */
export const describeSchemaTool: OpenAI.Responses.FunctionTool = {
  type: 'function',
  name: 'describe_schema',
  description: 'Get the schema (available tables and columns) for the database. Use this if you\'re unsure about column names or need to understand the database structure before writing queries.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  strict: true,
};

/**
 * Get available tools for Responses API
 */
export function getResponsesApiTools(): OpenAI.Responses.Tool[] {
  return [executeSqlTool, describeSchemaTool];
}

/**
 * Options for streaming Responses API
 */
export interface StreamResponseEventsOptions {
  model: string;
  instructions: string;
  input: OpenAI.Responses.ResponseInputItem[];
  tools?: OpenAI.Responses.Tool[];
  maxToolCalls?: number;
  parallelToolCalls?: boolean;
  signal?: AbortSignal;
  req?: NextRequest; // NextRequest for logging context
}

/**
 * Function to execute SQL (provided by caller)
 * @param sql - SQL query to execute
 * @param orgId - Organization ID for tenant isolation
 * @param req - Optional request object for logging context
 */
export type ExecuteSqlFunction = (sql: string, orgId: string, req?: NextRequest) => Promise<string>;

/**
 * Event handler for streaming NDJSON chunks
 */
export type StreamChunkHandler = (chunk: {
  assistantMessage: { content: string; type: 'assistant' } | null;
  detectedTableIntent: { table: string; confidence: number } | null;
  error: string | null;
}) => void;

/**
 * Streams Responses API events and handles multi-tool loop
 * 
 * @param options - Streaming options including model, instructions, input, tools
 * @param executeSql - Function to execute SQL queries
 * @param orgId - Organization ID for tenant isolation
 * @param onChunk - Callback to emit NDJSON chunks to client
 * @returns Promise that resolves when streaming completes
 */
export async function streamResponseEvents(
  options: StreamResponseEventsOptions,
  executeSql: ExecuteSqlFunction,
  orgId: string,
  onChunk: StreamChunkHandler,
): Promise<void> {
  const {
    model,
    instructions,
    input: initialInput,
    tools = getResponsesApiTools(),
    maxToolCalls = 3,
    parallelToolCalls = false,
    signal,
    req,
  } = options;

  const env = getEnv();
  const client = createOpenAIClient();
  
  // Current input items (grows with function call outputs)
  let currentInput: OpenAI.Responses.ResponseInputItem[] = [...initialInput];
  let toolCallCount = 0;
  let accumulatedText = '';
  const loopStartTime = performance.now();

  while (true) {
    // Check if aborted
    if (signal?.aborted) {
      const durationMs = performance.now() - loopStartTime;
      const logOptions: Parameters<typeof logToolLoopTermination>[0] = {
        orgId,
        reason: 'aborted',
        toolCallCount,
        maxToolCalls,
        durationMs,
      };
      if (req) logOptions.req = req;
      logToolLoopTermination(logOptions);
      return;
    }

    // Check tool call limit
    if (toolCallCount >= maxToolCalls) {
      const durationMs = performance.now() - loopStartTime;
      const logOptions: Parameters<typeof logToolLoopTermination>[0] = {
        orgId,
        reason: 'max_tool_calls',
        toolCallCount,
        maxToolCalls,
        durationMs,
      };
      if (req) logOptions.req = req;
      logToolLoopTermination(logOptions);
      
      // Send final accumulated text if any (with explanation about max steps)
      const finalMessage = accumulatedText 
        ? `${accumulatedText}\n\n(Note: Reached maximum query steps limit of ${maxToolCalls}.)`
        : `I've reached the maximum number of query steps (${maxToolCalls}). Please ask a simpler question or break it into multiple queries.`;
      
      onChunk({
        assistantMessage: { content: finalMessage, type: 'assistant' },
        detectedTableIntent: null,
        error: null,
      });
      return;
    }

    try {
      // Create Responses API request with streaming
      const stream = await client.responses.create({
        model,
        instructions,
        input: currentInput,
        tools,
        stream: true,
        parallel_tool_calls: parallelToolCalls,
        max_tool_calls: maxToolCalls - toolCallCount, // Remaining tool calls
      } as OpenAI.Responses.ResponseCreateParamsStreaming);

      // Track function calls from this response
      const pendingFunctionCalls: Array<{
        callId: string;
        name: string;
        argumentsBuffer: string;
        argumentsDone: boolean;
      }> = [];

      let currentCallId: string | null = null;
      let currentCallName: string | null = null;
      let currentCallArguments = '';
      let hasFunctionCall = false;

      // Process streaming events
      for await (const event of stream) {
        if (signal?.aborted) {
          return;
        }

        // Handle response.output_text.delta events (text streaming)
        if (event.type === 'response.output_text.delta') {
          const textEvent = event as OpenAI.Responses.ResponseTextDeltaEvent;
          accumulatedText += textEvent.delta;
          
          // Emit incremental text chunks
          onChunk({
            assistantMessage: { content: accumulatedText, type: 'assistant' },
            detectedTableIntent: null,
            error: null,
          });
        }

        // Handle response.output_item.added events (function calls)
        if (event.type === 'response.output_item.added') {
          const itemAddedEvent = event as OpenAI.Responses.ResponseOutputItemAddedEvent;
          const item = itemAddedEvent.item;
          if (item && typeof item === 'object' && 'type' in item && item.type === 'function_call') {
            const funcCallItem = item as OpenAI.Responses.ResponseFunctionToolCallItem;
            hasFunctionCall = true;
            currentCallId = funcCallItem.call_id;
            currentCallName = funcCallItem.name;
            currentCallArguments = funcCallItem.arguments || '';
            
            pendingFunctionCalls.push({
              callId: funcCallItem.call_id,
              name: funcCallItem.name,
              argumentsBuffer: funcCallItem.arguments || '',
              argumentsDone: true, // Arguments come with the item in Responses API
            });
          }
        }

        // Handle response.function_call_arguments.delta events (for incremental argument streaming)
        if (event.type === 'response.function_call_arguments.delta') {
          const argsEvent = event as OpenAI.Responses.ResponseFunctionCallArgumentsDeltaEvent;
          if (currentCallId && currentCallName) {
            currentCallArguments += argsEvent.delta;
            // Update the pending function call
            const pendingCall = pendingFunctionCalls.find(c => c.callId === currentCallId);
            if (pendingCall) {
              pendingCall.argumentsBuffer = currentCallArguments;
            }
          }
        }

        // Handle response.function_call_arguments.done events
        if (event.type === 'response.function_call_arguments.done') {
          const argsDoneEvent = event as OpenAI.Responses.ResponseFunctionCallArgumentsDoneEvent;
          if (currentCallId && currentCallName) {
            currentCallArguments = argsDoneEvent.arguments;
            const pendingCall = pendingFunctionCalls.find(c => c.callId === currentCallId);
            if (pendingCall) {
              pendingCall.argumentsDone = true;
              pendingCall.argumentsBuffer = currentCallArguments;
            }
          }
        }
      }

      // After stream completes, process any function calls
      if (hasFunctionCall && pendingFunctionCalls.length > 0) {
        // Process function calls sequentially
        for (const funcCall of pendingFunctionCalls) {
          if (signal?.aborted) {
            return;
          }

          // Check tool call limit again before processing
          if (toolCallCount >= maxToolCalls) {
            // Append a message telling model to finalize
            currentInput.push({
              type: 'function_call_output',
              call_id: funcCall.callId,
              output: 'Maximum tool calls reached. Please provide a final answer based on the information you have.',
            } as OpenAI.Responses.ResponseInputItem);
            break;
          }

          try {
            // Handle describe_schema function (no arguments needed)
            if (funcCall.name === 'describe_schema') {
              const schemaResult = getSchemaJSON();
              const schemaJson = JSON.stringify(schemaResult, null, 2);
              
              // Append function call output to input
              currentInput.push({
                type: 'function_call_output',
                call_id: funcCall.callId,
                output: schemaJson,
              } as OpenAI.Responses.ResponseInputItem);
              
              toolCallCount++;
            } else if (funcCall.name === 'execute_sql') {
              // Parse function arguments for execute_sql
              let args: { query: string };
              try {
                args = JSON.parse(funcCall.argumentsBuffer) as { query: string };
              } catch (parseError) {
                // Invalid JSON - append error output
                currentInput.push({
                  type: 'function_call_output',
                  call_id: funcCall.callId,
                  output: `Error: Invalid function arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
                } as OpenAI.Responses.ResponseInputItem);
                toolCallCount++;
                continue;
              }
              
              if (args.query) {
                // Execute SQL function (pass req for logging context)
                const sqlResult = await executeSql(args.query, orgId, req);
                
                // Append function call output to input
                currentInput.push({
                  type: 'function_call_output',
                  call_id: funcCall.callId,
                  output: sqlResult,
                } as OpenAI.Responses.ResponseInputItem);
                
                toolCallCount++;
              } else {
                currentInput.push({
                  type: 'function_call_output',
                  call_id: funcCall.callId,
                  output: 'Error: Missing query parameter',
                } as OpenAI.Responses.ResponseInputItem);
                toolCallCount++;
              }
            } else {
              // Unknown function
              currentInput.push({
                type: 'function_call_output',
                call_id: funcCall.callId,
                output: `Error: Unknown function '${funcCall.name}'`,
              } as OpenAI.Responses.ResponseInputItem);
              toolCallCount++;
            }
          } catch (execError) {
            // Error executing function - append error output
            const errorMessage = execError instanceof Error ? execError.message : String(execError);
            currentInput.push({
              type: 'function_call_output',
              call_id: funcCall.callId,
              output: `Error executing function: ${errorMessage}`,
            } as OpenAI.Responses.ResponseInputItem);
            toolCallCount++;
          }
        }

        // Continue loop to make another Responses API call with updated input
        accumulatedText = ''; // Reset accumulated text for next iteration
        continue;
      }

      // No function calls - stream completed, we're done
      // Final chunk was already emitted in the loop above
      const durationMs = performance.now() - loopStartTime;
      const logOptions: Parameters<typeof logToolLoopTermination>[0] = {
        orgId,
        reason: 'completed',
        toolCallCount,
        maxToolCalls,
        durationMs,
      };
      if (req) logOptions.req = req;
      logToolLoopTermination(logOptions);
      return;
    } catch (error) {
      // Handle errors
      const durationMs = performance.now() - loopStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to process response';
      
      // Log error termination
      const errorType = error instanceof Error 
        ? (error.name === 'AbortError' ? 'timeout' : 'openai_error')
        : 'openai_error';
      
      const logOptions: Parameters<typeof logToolLoopTermination>[0] = {
        orgId,
        reason: errorType as 'timeout' | 'openai_error',
        toolCallCount,
        maxToolCalls,
        durationMs,
        error: error instanceof Error ? error : new Error(String(error)),
      };
      if (req) logOptions.req = req;
      logToolLoopTermination(logOptions);
      
      // Return safe error message (don't leak OpenAI API details)
      const safeErrorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'Request timed out. Please try again with a simpler query.'
        : 'An error occurred while processing your request. Please try again.';
      
      onChunk({
        assistantMessage: null,
        detectedTableIntent: null,
        error: safeErrorMessage,
      });
      return;
    }
  }
}
