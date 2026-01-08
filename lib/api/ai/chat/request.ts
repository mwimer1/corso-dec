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
  modelTier: z.enum(['auto', 'fast', 'thinking', 'pro']).optional().default('auto'),
  deepResearch: z.boolean().optional().default(false),
}).strict();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Valid modes for mode prefix
 */
const VALID_MODES = ['projects', 'companies', 'addresses', 'auto'] as const;

type ValidMode = typeof VALID_MODES[number];

/**
 * Check if a mode string is valid (case-insensitive)
 */
function isValidMode(mode: string): mode is ValidMode {
  return VALID_MODES.includes(mode.toLowerCase() as ValidMode);
}

/**
 * Parses mode prefix from content (e.g., [mode:projects] Hello)
 * Returns the mode (normalized to lowercase) and cleaned content.
 * Returns null for mode if prefix is invalid or not present.
 * Case-insensitive matching.
 */
export function parseModePrefix(content: string): { mode: string | null; cleanedContent: string } {
  // Case-insensitive regex match
  const match = content.match(/^\[mode:(\w+)\]\s*(.*)$/i);
  if (match && match[1]) {
    const modeValue = match[1]!;
    
    // Validate mode against known modes
    if (isValidMode(modeValue)) {
      // Valid mode - return normalized (lowercase) mode and cleaned content
      const cleanedContent = match[2] ? match[2].trim() || content : content;
      return { mode: modeValue.toLowerCase(), cleanedContent };
    }
    
    // Invalid mode - log warning but don't throw
    // Return null mode and keep the full content (user sees their input as-is)
    return { mode: null, cleanedContent: content };
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
  
  // Mode prefix takes precedence over preferredTable
  // If mode is 'auto', fall back to preferredTable or null
  // If mode is valid and not 'auto', use it (overrides preferredTable)
  // If mode is null (invalid or not present), use preferredTable or null
  const parsedMode = mode && isValidMode(mode)
    ? (mode.toLowerCase() === 'auto' ? null : mode.toLowerCase())
    : null;
  const preferredTable = parsedMode ?? body.preferredTable ?? null;

  return {
    content: cleanedContent,
    preferredTable,
  };
}
