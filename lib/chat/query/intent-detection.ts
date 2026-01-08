// lib/chat/query/intent-detection.ts
import type { QueryIntent, TableIntent } from '@/types/chat';

// Simple in-memory cache for intent detection
const intentCache = new Map<string, QueryIntent>();

/**
 * Detects the user's intent from a query string.
 *
 * @deprecated Simple keyword-based implementation. Intent detection is now handled by the chat API endpoint using OpenAI.
 * This function is kept for backward compatibility but may be removed in a future version.
 */
export async function detectQueryIntentWithCache(message: string): Promise<QueryIntent> {
  const key = message.trim().toLowerCase();
  const cached = intentCache.get(key);
  if (cached) return cached;

  const isHelp = key.includes('help') || key.includes('how to');
  const intent: QueryIntent = isHelp
    ? {
        type: 'help',
        confidence: 0.9,
        originalQuery: message,
        entities: { tables: [] },
      }
    : {
        type: 'data_query',
        confidence: 0.9,
        originalQuery: message,
        entities: { tables: [] },
      };

  intentCache.set(key, intent);

  // Simulate async boundary – this could be replaced by an API/LLM call
  await Promise.resolve();

  return intent;
}

/**
 * Infers table context from a query string.
 *
 * @deprecated Simple keyword-based implementation. Table inference is now handled by the chat API endpoint.
 * This function is kept for backward compatibility but may be removed in a future version.
 */
export function inferTableIntent(message: string): TableIntent {
  const key = message.trim().toLowerCase();

  // Simple keyword-based table inference
  if (key.includes('project') || key.includes('permit')) {
    return {
      type: 'projects' as const,
      confidence: 0.8,
      originalQuery: message,
    };
  }

  if (key.includes('subscription') || key.includes('billing')) {
    return {
      type: 'subscriptions' as const,
      confidence: 0.8,
      originalQuery: message,
    };
  }

  // Default to general data query
  return {
    type: 'general' as const,
    confidence: 0.5,
    originalQuery: message,
  };
}



