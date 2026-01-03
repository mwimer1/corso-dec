// lib/api/ai/chat/streaming.ts
// Server-only streaming response creation for AI chat endpoint

import 'server-only';

import type { NextRequest } from 'next/server';
import type OpenAI from 'openai';
import { streamResponseEvents } from '@/lib/integrations/openai/responses';
import { executeSqlAndFormat, describeSchema } from './tools';
import { getChatCompletionsTools } from './tools';

/**
 * AI chunk type matching client expectations
 */
export type AIChunk = {
  assistantMessage: { content: string; type: 'assistant' } | null;
  detectedTableIntent: { table: string; confidence: number } | null;
  error: string | null;
};

/**
 * Creates a streaming NDJSON response using Responses API
 * @param instructions - System instructions/prompt
 * @param input - Input items for Responses API
 * @param model - Model name
 * @param orgId - Organization ID for tenant isolation
 * @param signal - Abort signal for cancellation
 */
export function createResponsesStreamResponse(
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
        const { getEnv } = await import('@/lib/server/env');
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
export function createStreamResponse(
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
                    const sqlResults = await executeSqlAndFormat(args.query, orgId, req);
                    
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
 * Create error response as NDJSON chunk
 */
export function createErrorResponse(error: unknown): Response {
  const errorChunk: AIChunk = {
    assistantMessage: null,
    detectedTableIntent: null,
    error: error instanceof Error ? error.message : 'Failed to process chat request',
  };
  
  return new Response(JSON.stringify(errorChunk) + '\n', {
    status: 500,
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
  });
}
