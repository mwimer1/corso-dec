// lib/api/ai/chat/handler.ts
// Server-only main handler logic for AI chat endpoint

import 'server-only';

import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth-helpers';
import { mapTenantContextError } from '@/lib/api/tenant-context-helpers';
import { getTenantContext } from '@/lib/server';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { getEnv } from '@/lib/server/env';
import { logger } from '@/lib/monitoring';
import { parseChatRequest, processUserInput, type ChatRequest } from './request';
import { buildChatMessages, buildResponseInputItems } from './messages';
import { buildSystemPrompt } from './prompts';
import { getChatCompletionsTools } from './tools';
import { createResponsesStreamResponse, createStreamResponse, createErrorResponse } from './streaming';

/**
 * Main handler for chat requests.
 */
export async function handleChatRequest(req: NextRequest): Promise<Response> {
  // Authentication check
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    return authResult;
  }
  const { userId: _userId } = authResult;

  // Get tenant context for org isolation
  let tenantContext;
  try {
    tenantContext = await getTenantContext(req);
  } catch (error) {
    return mapTenantContextError(error);
  }
  const { orgId } = tenantContext;

  // Parse request body
  const parseResult = await parseChatRequest(req);
  if (parseResult instanceof Response) {
    return parseResult;
  }
  const body: ChatRequest = parseResult;

  // Process user input (sanitize and parse mode)
  const processResult = processUserInput(body);
  if (processResult instanceof Response) {
    return processResult;
  }
  const { content: cleanedContent, preferredTable } = processResult;

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
      const inputItems = buildResponseInputItems(body, cleanedContent);
      
      return createResponsesStreamResponse(
        systemPrompt,
        inputItems,
        model,
        orgId,
        req,
        abortController.signal,
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  }

  // Fallback to Chat Completions API
  try {
    const messages = buildChatMessages(body, cleanedContent, preferredTable);
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
    return createErrorResponse(error);
  }
}
