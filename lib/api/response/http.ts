type ErrorBody = { success: false; error: { code: string; message: string; details?: unknown } };
type OkBody<T> = { success: true; data: T };

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify({ success: true, data } as OkBody<T>), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers ?? {}) },
    ...init,
  });
}

export function badRequest(message: string, opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'VALIDATION_ERROR', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

export function forbidden(message = 'Forbidden', opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'FORBIDDEN', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 403,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

export function notFound(message = 'Not Found', opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'NOT_FOUND', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

export function noContent(init: ResponseInit = {}): Response {
  return new Response(null, { status: 204, ...(init ?? {}) });
}

export function error(status: number, message: string, opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? `ERROR_${status}`, message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

// fromZod removed - unused in application code

// Export for backward compatibility
export const http = {
  ok,
  badRequest,
  forbidden,
  notFound,
  noContent,
  error,
};



