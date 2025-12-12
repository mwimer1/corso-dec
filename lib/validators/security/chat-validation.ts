// lib/validators/security/chat-validation.ts
// RELOCATED from `types/validators/security/chat-validation.ts` on 2025-01-28

// Keep validators pure: no shared ApplicationError or logger here
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* 🔒 Security – prohibited content patterns                           */
/* ------------------------------------------------------------------ */

const PROHIBITED_PATTERNS: readonly RegExp[] = Object.freeze([
  /* SQL injection */
  /\b(?:DROP|DELETE|INSERT|ALTER|TRUNCATE)\s+(?:TABLE|DATABASE)\b/i,
  /\b(?:EXEC|EXECUTE)\s+(?:IMMEDIATE|PROCEDURE)\b/i,
  /\bsys\.(?:exec|execute|xp_)\w+\b/i,
  /\bxp_cmdshell\b/i,
  /\b(?:UNION|INTERSECT|EXCEPT)\s+(?:ALL\s+)?SELECT\b/i,

  /* XSS / script injection */
  /javascript:\s*[^"'\s]+/i,
  /on\w+\s*=\s*["'][^"']+["']/i,

  /* Path traversal */
  /\.\.\/|\.\.\\|\.\.[\/\\]/,

  /* Command injection */
  /[;&|`$]\s*(?:cat|ls|rm|wget|curl|nc|bash|sh)\b/i,
]);

const hasScriptTag = (content: string): boolean => {
  // Simple regex-based script tag detection for client-side compatibility
  return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content);
};

const containsProhibitedContent = (content: string): boolean =>
  hasScriptTag(content) || PROHIBITED_PATTERNS.some((rx) => rx.test(content));

/* ------------------------------------------------------------------ */
/* 📝 Schema                                                           */
/* ------------------------------------------------------------------ */

const UserMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, { message: 'Message cannot be empty' })
      .max(1000, {
        message: 'Message exceeds maximum length of 1000 characters',
      })
      .refine((v) => !containsProhibitedContent(v), {
        message: 'Message contains prohibited content for security reasons',
      })
      .refine((v) => !/^\s*$/.test(v), {
        message: 'Message cannot contain only whitespace',
      }),
  })
  .strict();

type ValidatedUserMessage = z.infer<typeof UserMessageSchema>;

/* ------------------------------------------------------------------ */
/* 🎯 Error-code model                                                */
/* ------------------------------------------------------------------ */

type ValidationErrorCode =
  | 'EMPTY'
  | 'TOO_LONG'
  | 'PROHIBITED_CONTENT'
  | 'WHITESPACE_ONLY'
  | 'INVALID';

/**
 * @public
 */
export type ChatValidationResult =
  | { success: true; data: ValidatedUserMessage }
  | {
      success: false;
      error: {
        message: string;
        code: ValidationErrorCode;
        details?: z.ZodIssue[];
      };
    };

/* ------------------------------------------------------------------ */
/* 🛠️ Helpers                                                         */
/* ------------------------------------------------------------------ */

const getErrorCode = (msg: string): ValidationErrorCode => {
  if (msg.includes('empty')) return 'EMPTY';
  if (msg.includes('maximum length')) return 'TOO_LONG';
  if (msg.includes('prohibited content')) return 'PROHIBITED_CONTENT';
  if (msg.includes('whitespace')) return 'WHITESPACE_ONLY';
  return 'INVALID';
};

/* ------------------------------------------------------------------ */
/* ✅ Primary validator                                               */
/* ------------------------------------------------------------------ */

/**
 * @public
 */
export function validateUserMessage(content: string): ChatValidationResult {
  try {
    const parsed = UserMessageSchema.safeParse({ content });

    if (parsed.success) {
      return { success: true, data: parsed.data };
    }

    const first = parsed.error.errors[0];
    const message = first?.message ?? 'Invalid message format';
    const code = getErrorCode(message);

    return {
      success: false,
      error: { message, code, details: parsed.error.errors },
    };
  } catch (err) {
    // Preserve legacy behavior: convert unknown error into a standardized failure
    const message = err instanceof Error ? err.message : 'Unexpected validation error';
    return {
      success: false,
      error: { message, code: 'INVALID' },
    };
  }
}

/* ------------------------------------------------------------------ */
/* Legacy shim removed - use validateUserMessage instead             */
/* ------------------------------------------------------------------ */ 

