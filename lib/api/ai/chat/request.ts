// lib/api/ai/chat/request.ts
// Server-only request parsing and validation for AI chat endpoint

import 'server-only';

import { sanitizeUserInput } from '@/lib/security/prompt-injection';
import { http } from '@/lib/api';
import { z } from 'zod';

/**
 * Request body schema for chat endpoint.
 * Includes input sanitization to prevent prompt injection attacks.
 */
export const ChatRequestSchema = z.object({
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

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Parses mode prefix from content (e.g., [mode:projects] Hello)
 * Returns the mode and cleaned content
 */
export function parseModePrefix(content: string): { mode: string | null; cleanedContent: string } {
  const match = content.match(/^\[mode:(\w+)\]\s*(.*)$/);
  if (match && match[1]) {
    return { mode: match[1]!, cleanedContent: match[2] ? match[2].trim() || content : content };
  }
  return { mode: null, cleanedContent: content };
}

/**
 * Parse and validate chat request body
 */
export async function parseChatRequest(req: Request): Promise<ChatRequest | Response> {
  try {
    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return http.badRequest('Invalid request body', {
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  } catch {
    return http.badRequest('Invalid JSON', { code: 'INVALID_JSON' });
  }
}

/**
 * Sanitize and process user input
 * Returns sanitized content and preferred table, or error response
 */
export function processUserInput(
  body: ChatRequest
): { content: string; preferredTable: string | null } | Response {
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

  return {
    content: cleanedContent,
    preferredTable,
  };
}
