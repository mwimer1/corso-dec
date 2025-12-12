/**
 * @fileoverview API Domain Barrel Export
 * @description Edge-safe API utilities with clear runtime boundaries.
 * @runtime Mixed (Edge-safe + Server-only exports)
 */
export * from './auth';
export * from './client';
export * from './edge';
export * from './response/http';
export * from './shared/edge-route';
// Export entity data function (re-export directly to keep barrel edge-safe)
export { getEntityPage } from './data';

// Validation utilities
    import type { ZodSchema } from 'zod';

export async function readJsonOnce(req: Request) {
  // Use text() to ensure the body is read exactly once
  const raw = await req.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Surface a stable reason; caller maps to 400
    throw new Error('INVALID_JSON');
  }
}

export async function validateJson<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; error: { message?: string } }
> {
  const body = await readJsonOnce(req);
  const parsed = schema.safeParse(body);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, error: { message: 'Invalid input' } };
}



// Auth helpers: server-only — do NOT re-export from the edge barrel.
// Import from '@/lib/auth/server' instead.

// Middleware wrappers (canonical sources)
    export { withErrorHandlingEdge, withRateLimitEdge } from '@/lib/middleware';
// Backwards compat: some routes import the wrapper as `withErrorHandling`
export { withErrorHandlingEdge as withErrorHandling } from '@/lib/middleware';

// Convenience re-export for HTTP helpers
export { http } from './response/http';


