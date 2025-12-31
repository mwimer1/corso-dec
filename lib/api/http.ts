type ErrorBody = { success: false; error: { code: string; message: string; details?: unknown } };
type OkBody<T> = { success: true; data: T };

/**
 * Creates a successful HTTP 200 response with standardized format.
 * 
 * @param data - Response data payload
 * @param init - Optional ResponseInit for headers, status, etc.
 * @returns Response with JSON body: `{ success: true, data: T }`
 * 
 * @example
 * ```typescript
 * return ok({ userId: '123', name: 'John' });
 * // Returns: { success: true, data: { userId: '123', name: 'John' } }
 * ```
 */
export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify({ success: true, data } as OkBody<T>), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers ?? {}) },
    ...init,
  });
}

/**
 * Creates an HTTP 400 Bad Request response with standardized error format.
 * 
 * @param message - Human-readable error message
 * @param opts - Error options (code, details, headers)
 * @param init - Optional ResponseInit for additional configuration
 * @returns Response with JSON body: `{ success: false, error: { code, message, details? } }`
 * 
 * @example
 * ```typescript
 * return badRequest('Invalid input', { code: 'VALIDATION_ERROR', details: { field: 'email' } });
 * ```
 */
export function badRequest(message: string, opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'VALIDATION_ERROR', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

/**
 * Creates an HTTP 403 Forbidden response with standardized error format.
 * 
 * @param message - Human-readable error message (default: 'Forbidden')
 * @param opts - Error options (code, details, headers)
 * @param init - Optional ResponseInit for additional configuration
 * @returns Response with JSON body: `{ success: false, error: { code, message, details? } }`
 * 
 * @example
 * ```typescript
 * return forbidden('Insufficient permissions', { code: 'FORBIDDEN' });
 * ```
 */
export function forbidden(message = 'Forbidden', opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'FORBIDDEN', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 403,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

/**
 * Creates an HTTP 404 Not Found response with standardized error format.
 * 
 * @param message - Human-readable error message (default: 'Not Found')
 * @param opts - Error options (code, details, headers)
 * @param init - Optional ResponseInit for additional configuration
 * @returns Response with JSON body: `{ success: false, error: { code, message, details? } }`
 * 
 * @example
 * ```typescript
 * return notFound('Resource not found', { code: 'NOT_FOUND' });
 * ```
 */
export function notFound(message = 'Not Found', opts: { code?: string; details?: unknown; headers?: HeadersInit } = {}, init: ResponseInit = {}): Response {
  const body: ErrorBody = { success: false, error: { code: opts.code ?? 'NOT_FOUND', message, details: opts.details } };
  return new Response(JSON.stringify(body), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}), ...(init.headers ?? {}) },
    ...init,
  });
}

/**
 * Creates an HTTP 204 No Content response.
 * 
 * @param init - Optional ResponseInit for headers, etc.
 * @returns Response with no body and 204 status
 * 
 * @example
 * ```typescript
 * return noContent(); // For OPTIONS requests or successful deletions
 * ```
 */
export function noContent(init: ResponseInit = {}): Response {
  return new Response(null, { status: 204, ...(init ?? {}) });
}

/**
 * Creates a generic HTTP error response with standardized format.
 * 
 * @param status - HTTP status code (e.g., 401, 500)
 * @param message - Human-readable error message
 * @param opts - Error options (code, details, headers)
 * @param init - Optional ResponseInit for additional configuration
 * @returns Response with JSON body: `{ success: false, error: { code, message, details? } }`
 * 
 * @example
 * ```typescript
 * return error(401, 'Unauthorized', { code: 'HTTP_401' });
 * return error(500, 'Internal server error', { code: 'INTERNAL_ERROR' });
 * ```
 */
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
