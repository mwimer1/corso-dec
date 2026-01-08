// lib/api/client.ts

/**
 * Type guard to check if a value has a specific method.
 */
function hasMethod<T extends string>(
  obj: unknown,
  method: T
): obj is Record<T, (...args: unknown[]) => unknown> {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    method in obj &&
    typeof (obj as Record<string, unknown>)[method] === 'function'
  );
}

/**
 * Type guard to check if a value has a headers property with a get method.
 */
function hasHeadersWithGet(obj: unknown): obj is { headers: { get: (name: string) => string | null } } {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'headers' in obj &&
    obj.headers !== null &&
    typeof obj.headers === 'object' &&
    'get' in obj.headers &&
    typeof (obj.headers as { get: unknown }).get === 'function'
  );
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  // Safely check for headers.get method
  const contentType = hasHeadersWithGet(res) 
    ? (res.headers.get('content-type') || '')
    : '';
    
  if (contentType.includes('application/json')) {
    try {
      if (hasMethod(res, 'json')) {
        return await res.json();
      }
    } catch {
      // fall through to text
    }
  }
  try {
    if (hasMethod(res, 'text')) {
      return await res.text();
    }
  } catch {
    // ignore
  }
  return undefined;
}

// ApiHttpError removed - was unused per audit
// Internal error handling kept for fetchJSON functions

/**
 * Type guard to check if an object has an 'error' property with code and message.
 */
function isErrorResponse(obj: unknown): obj is { error: { code?: unknown; message?: unknown } } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'error' in obj &&
    obj.error !== null &&
    typeof obj.error === 'object'
  );
}

/**
 * Type guard to check if an object has a 'message' property.
 */
function hasMessage(obj: unknown): obj is { message: unknown } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'message' in obj
  );
}

async function handleApiError(res: Response): Promise<never> {
  const parsed = await parseJsonSafe(res);
  
  // Extract error code
  const code = isErrorResponse(parsed) && typeof parsed.error.code === 'string'
    ? parsed.error.code
    : `HTTP_${res.status}`;
  
  // Extract error message with multiple fallbacks
  let message: string;
  if (isErrorResponse(parsed) && typeof parsed.error.message === 'string') {
    message = parsed.error.message;
  } else if (hasMessage(parsed) && typeof parsed.message === 'string') {
    message = parsed.message;
  } else if (typeof parsed === 'string' && parsed) {
    message = `${res.status} ${res.statusText || ''}: ${parsed.slice(0, 200)}`.trim();
  } else {
    message = `Query failed with status ${res.status}`;
  }
  
  // Safely extract request ID from headers
  const requestId = hasHeadersWithGet(res)
    ? (res.headers.get('x-request-id') ?? undefined)
    : undefined;

  // Create error object with proper typing
  const error = new Error(message);
  error.name = 'ApiHttpError';
  
  // Use type-safe property assignment
  (error as Error & { status: number; code?: string; requestId?: string }).status = res.status;
  if (code) {
    (error as Error & { code: string }).code = code;
  }
  if (requestId) {
    (error as Error & { requestId: string }).requestId = requestId;
  }
  
  throw error;
}

/**
 * Typed wrapper around fetch that returns JSON and throws on !ok.
 * For client-side communication with the application's own API.
 */
export async function fetchJSON<T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    await handleApiError(res);
  }
  return res.json() as Promise<T>;
}

export async function postJSON<TRes = unknown, TReq = unknown>(
  url: string,
  body: TReq,
  init: RequestInit = {}
): Promise<TRes> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    await handleApiError(res);
  }
  return res.json() as Promise<TRes>;
}

