// lib/middleware/shared/request-id.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { exposeHeader } from './headers';

// Removed unused requestId wrapper function
// Request ID functionality is handled by getRequestId() and addRequestIdHeader()
// which are integrated into withErrorHandlingEdge and withRateLimitEdge wrappers

/**
 * Get an existing request ID from headers or generate one if missing.
 * - Prefers `x-request-id`, then `x-correlation-id`.
 * - Uses `crypto.randomUUID()` when available; falls back to `uuid`.
 * - Attempts to set the header back on the request for downstream consumers.
 */
export function getRequestId(req?: Request | NextRequest): string {
  // Priority: x-request-id > x-correlation-id > platform IDs (x-vercel-id, cf-ray) > generated
  const headers = req?.headers;
  let id: string | null | undefined =
    headers?.get('x-request-id') ||
    headers?.get('x-correlation-id') ||
    headers?.get('x-vercel-id') ||
    headers?.get('cf-ray');
  if (!id || typeof id !== 'string') {
    try {
      const globalCrypto: any = (globalThis as any)?.crypto;
      id = typeof globalCrypto?.randomUUID === 'function' ? globalCrypto.randomUUID() : uuid();
    } catch {
      id = uuid();
    }
  }
  // Best-effort: set normalized header for downstream usage
  try { if (id) (req as NextRequest | undefined)?.headers.set('x-request-id', id); } catch { /* readonly in some runtimes */ }
  return String(id);
}

export function addRequestIdHeader(res: Response | NextResponse, requestId: string): NextResponse {
  if (res instanceof NextResponse) {
    res.headers.set('X-Request-ID', requestId);
    return exposeHeader(res, 'X-Request-ID');
  }

  // Clone to avoid stream-lock issues
  const cloned = res.clone();

  const next = new NextResponse(cloned.body ?? null, {
    status: cloned.status,
    statusText: cloned.statusText,
    headers: cloned.headers,
  });

  next.headers.set('X-Request-ID', requestId);
  return exposeHeader(next, 'X-Request-ID');
}
