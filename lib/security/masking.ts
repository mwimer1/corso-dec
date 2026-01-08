/**
 * @file lib/security/masking.ts
 * 
 * Privacy-aware, selective data masking for logging. This module
 * provides utilities to redact sensitive information from log
 * entries while preserving important debugging context.
 */

/**
 * Recursively masks sensitive data in objects for secure logging
 *
 * @aiContext Essential security utility used across all logging, monitoring, and debugging operations to prevent sensitive data exposure. Critical for OpenAI request/response logging, ClickHouse query logging, and all system observability.
 * @businessValue Prevents accidental exposure of API keys, tokens, and secrets in logs. Essential for security compliance, prevents credential leaks, and enables safe debugging without compromising sensitive information.
 *
 * @description Recursively clones an arbitrary value while replacing sensitive fields
 * (`apiKey`, `token`, `secret`, `password`, `authorization`, etc.) with
 * `"***MASKED***"`. The function is intentionally generic so primitives (`null`,
 * `number`, `string`, etc.) pass straight through unchanged.
 *
 * - Non-sensitive identifiers are left intact for observability (e.g., userId in camelCase).
 *
 * Examples masked:
 *   { api_key: 'k', token: 't', user_id: 'u', userid: 'u' } -> ***MASKED***
 *
 * Examples NOT masked:
 *   { userId: 'abc123' } -> 'abc123'
 *
 * ⚠️ Key intent:
 *   - We ONLY treat snake_case `user_id` and lowercase `userid` as sensitive (often used for DB/transport fields).
 *   - We DO NOT treat camelCase `userId` as sensitive so it remains visible in logs for debugging.
 *     If you need to treat camelCase `userId` as sensitive in a specific context, mask it at the callsite.
 *
 * @example
 * ```typescript
 * // Object with sensitive data
 * const userData = {
 *   name: 'John Doe',
 *   apiKey: 'sk-1234567890',
 *   email: 'john@example.com',
 *   token: 'abc123',
 *   profile: {
 *     secret: 'my-secret-value'
 *   }
 * };
 *
 * const masked = maskSensitiveData(userData);
 * // Result:
 * // {
 * //   name: 'John Doe',
 * //   apiKey: '***MASKED***',
 * //   email: 'john@example.com',
 * //   token: '***MASKED***',
 * //   profile: { secret: '***MASKED***' }
 * // }
 *
 * // Primitives pass through unchanged
 * maskSensitiveData("hello") // "hello"
 * maskSensitiveData(42) // 42
 * maskSensitiveData(null) // null
 *
 * // Dates are preserved
 * maskSensitiveData(new Date()) // new Date() with same timestamp
 * ```
 *
 * @param meta - The data structure to mask (can be any type)
 *
 * @returns Cloned data structure with sensitive fields masked
 *
 * @since 1.0.0
 */
// NOTE:
// - Intentionally exclude camelCase `userId` from the sensitive list.
// - Keep (?!s) guard to avoid plural forms like "tokens"/"secrets".
// - Add a word boundary to reduce accidental matches inside longer identifiers.
const MASK = '***MASKED***' as const;
// Matches: api/key, token, secret, password, authorization, auth/header, userid (lowercase), user_id (snake_case)
// Excludes: userId (camelCase) - remains visible for debugging
function isSensitiveKey(key: string): boolean {
  // Case-insensitive patterns for common sensitive keys
  const caseInsensitivePatterns = [
    /\bapi[-_]?key(?!s)\b/i,
    /\btoken(?!s)\b/i,
    /\bsecret(?!s)\b/i,
    /\bpassword(?!s)\b/i,
    /\bauthorization(?!s)\b/i,
    /\bauth(header)?\b/i,
  ];

  // Case-sensitive patterns for specific sensitive field names
  const caseSensitivePatterns = [
    /\buserid\b/,
    /\buser_id\b/,
  ];

  return caseInsensitivePatterns.some(pattern => pattern.test(key)) ||
         caseSensitivePatterns.some(pattern => pattern.test(key));
}

export function maskSensitiveData<T = unknown>(input: T): T {
  if (!input || typeof input !== 'object') return input;

  // Handle Dates specially - they should pass through unchanged
  if (input instanceof Date) return input as T;

  // Handle arrays
  if (Array.isArray(input)) {
    return input.map(item => maskSensitiveData(item)) as T;
  }

  // Handle plain objects
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v && typeof v === 'object') {
      // Recurse into nested objects/arrays
      out[k] = maskSensitiveData(v);
    } else {
      out[k] = isSensitiveKey(k) ? MASK : v;
    }
  }
  return out as T;
} 
