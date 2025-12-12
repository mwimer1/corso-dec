// lib/api/client.ts


async function parseJsonSafe(res: Response): Promise<unknown> {
  const headersObj: any = (res as any)?.headers;
  const contentType = typeof headersObj?.get === 'function' ? headersObj.get('content-type') || '' : '';
  if (contentType.includes('application/json')) {
    try {
      if (typeof (res as any)?.json === 'function') {
        return await (res as any).json();
      }
    } catch {
      // fall through to text
    }
  }
  try {
    if (typeof (res as any)?.text === 'function') {
      const text = await (res as any).text();
      return text;
    }
  } catch {
    // ignore
  }
  return undefined;
}

// ApiHttpError removed - was unused per audit
// Internal error handling kept for fetchJSON functions

async function handleApiError(res: Response): Promise<never> {
  const parsed = await parseJsonSafe(res);
  const code = typeof parsed === 'object' && parsed && 'error' in (parsed as any) && (parsed as any).error?.code
    ? String((parsed as any).error.code)
    : ('HTTP_' + res.status);
  const message =
    (typeof parsed === 'object' && parsed && 'error' in (parsed as any) && (parsed as any).error?.message
      ? String((parsed as any).error.message)
      : typeof parsed === 'object' && parsed && (parsed as any).message
        ? String((parsed as any).message)
        : typeof parsed === 'string' && parsed
          ? `${res.status} ${res.statusText || ''}: ${parsed.slice(0, 200)}`.trim()
          : `Query failed with status ${res.status}`);
  const requestId = (res as any)?.headers?.get?.('x-request-id') ?? undefined;

  // Create error object inline since ApiHttpError was removed
  const error = new Error(message) as any;
  error.name = 'ApiHttpError';
  error.status = res.status;
  if (code) error.code = code;
  if (requestId) error.requestId = requestId;
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

