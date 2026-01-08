// lib/api/ai/chat/handler.ts
// Server-only main handler logic for AI chat endpoint

import 'server-only';

import type { NextRequest } from 'next/server';
import { requireAnyRoleForAI } from '@/lib/api/auth-helpers';
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
import { checkDeepResearchLimit, incrementDeepResearchUsage } from './usage-limits';
import { http } from '@/lib/api';

/**
 * Maps model tier selection to actual OpenAI model.
 * 
 * @param tier - User-selected model tier ('auto', 'fast', 'thinking', 'pro')
 * @param env - Environment configuration
 * @returns OpenAI model identifier
 */
function mapModelTierToOpenAIModel(
  tier: 'auto' | 'fast' | 'thinking' | 'pro',
  env: ReturnType<typeof getEnv>
): string {
  // Default model from env (SQL model or fallback to gpt-4o-mini)
  const defaultModel = env.OPENAI_SQL_MODEL || 'gpt-4o-mini';
  
  switch (tier) {
    case 'auto':
      // Use default model (current behavior)
      return defaultModel;
    case 'fast':
      // Fast model: use gpt-4o-mini for speed
      return 'gpt-4o-mini';
    case 'thinking':
      // Thinking model: use gpt-4o for better reasoning
      // Prefer gpt-4o (or pinned version) if available, fallback to default
      if (env.OPENAI_SQL_MODEL?.includes('gpt-4o') && !env.OPENAI_SQL_MODEL.includes('mini')) {
        return env.OPENAI_SQL_MODEL;
      }
      // Fallback to gpt-4o if not set in env
      return 'gpt-4o';
    case 'pro':
      // Pro model: use best available model
      // Prefer gpt-4o (or pinned version like gpt-4o-2024-08-06), fallback to default
      if (env.OPENAI_SQL_MODEL?.includes('gpt-4o') && !env.OPENAI_SQL_MODEL.includes('mini')) {
        return env.OPENAI_SQL_MODEL;
      }
      // Use pinned gpt-4o version for production stability
      return 'gpt-4o-2024-08-06';
    default:
      return defaultModel;
  }
}

/**
 * Main handler for chat requests.
 */
export async function handleChatRequest(req: NextRequest): Promise<Response> {
  // Authentication and RBAC enforcement (member or higher role required)
  // Support both 'member'/'org:member' and 'admin'/'org:admin' and 'owner'/'org:owner' formats
  // Feature flag ENFORCE_AI_RBAC can disable RBAC (default: enforced)
  const authResult = await requireAnyRoleForAI(
    ['member', 'org:member', 'admin', 'org:admin', 'owner', 'org:owner'],
    '/api/v1/ai/chat'
  );
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

  // Check Deep Research usage limits if enabled
  const deepResearch = body.deepResearch ?? false;
  if (deepResearch) {
    const limitCheck = await checkDeepResearchLimit(req);
    if (limitCheck instanceof Response) {
      return limitCheck; // Error response from limit check
    }
    
    if (!limitCheck.allowed) {
      return http.error(429, 'Deep Research usage limit exceeded', {
        code: 'DEEP_RESEARCH_LIMIT_EXCEEDED',
        details: {
          limit: limitCheck.limit,
          currentUsage: limitCheck.currentUsage,
          remaining: limitCheck.remaining,
        },
      });
    }
    
    // Increment usage immediately after successful check to reduce race condition window
    // This ensures concurrent requests see the updated count. If processing fails,
    // the quota is still consumed (acceptable trade-off for quota integrity).
    // The UI disables send button during processing, which mitigates most race cases.
    incrementDeepResearchUsage(req).catch((err) => {
      logger.error('[Handler] Failed to increment Deep Research usage before processing', { error: err });
      // If increment fails, we still proceed - better to allow the request than block on tracking error
    });
  }

  // Get OpenAI client and model
  const env = getEnv();
  const client = createOpenAIClient();
  
  // Map modelTier to actual OpenAI model
  // Override to 'pro' tier when Deep Research is enabled
  const modelTier = deepResearch ? 'pro' : (body.modelTier ?? 'auto');
  const model = mapModelTierToOpenAIModel(modelTier, env);
  
  // Security: Warn if using unpinned model (model drift risk)
  // Pinned models (e.g., gpt-4o-2024-08-06) ensure consistent behavior
  // Generic names (e.g., gpt-4o) may change with OpenAI updates
  const pinnedModels = [
    'gpt-4o-2024-08-06', // Latest gpt-4o pinned version
    'gpt-4o-mini', // Always pinned
    'gpt-4-0613', // Legacy pinned
    'gpt-4-0125', // Legacy pinned
    'gpt-4-turbo-2024-04-09', // Legacy pinned
  ];
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
  // Deep Research requests need more time for comprehensive analysis
  const baseTimeout = env.AI_TOTAL_TIMEOUT_MS ?? 60000;
  const totalTimeout = deepResearch ? Math.max(baseTimeout, 120000) : baseTimeout;
  setTimeout(() => {
    abortController.abort();
  }, totalTimeout);

  // Feature flag: Use Responses API if enabled
  if (env.AI_USE_RESPONSES === true) {
    try {
      // Convert messages to Responses API input format
      const systemPrompt = buildSystemPrompt(preferredTable, deepResearch);
      const inputItems = buildResponseInputItems(body, cleanedContent);
      
      const response = await createResponsesStreamResponse(
        systemPrompt,
        inputItems,
        model,
        orgId,
        req,
        abortController.signal,
      );
      
      // Usage already incremented before processing (see above)
      return response;
    } catch (error) {
      return createErrorResponse(error);
    }
  }

  // Fallback to Chat Completions API
  try {
    const messages = buildChatMessages(body, cleanedContent, preferredTable, deepResearch);
    const stream = await client.chat.completions.create({
      model,
      messages,
      tools: getChatCompletionsTools(),
      tool_choice: 'auto', // Let model decide when to use the functions
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = await createStreamResponse(stream, client, model, messages, orgId, req, abortController.signal);
    
    // Usage already incremented before processing (see above)
    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}
