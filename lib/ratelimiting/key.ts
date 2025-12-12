// lib/rate-limiting/key.ts

/**
 * Build a composite rate‑limit key from ordered parts.
 * Falsy parts are skipped to avoid accidental separators.
 */
export function buildCompositeKey(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(':');
}



