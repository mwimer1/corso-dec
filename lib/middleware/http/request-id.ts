// lib/middleware/http/request-id.ts
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
  let id: string | null | undefined =
    req?.headers.get('x-request-id') ||
    req?.headers.get('x-correlation-id') ||
    req?.headers.get('x-vercel-id') ||
    req?.headers.get('cf-ray');
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
  const response =
    res instanceof NextResponse
      ? res
      : new NextResponse(res.body, {
          status: res.status,
          headers: res.headers,
        });
  response.headers.set('X-Request-ID', requestId);
  return exposeHeader(response, 'X-Request-ID');
}

