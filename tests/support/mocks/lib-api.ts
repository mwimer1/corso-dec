export const http = {
  success: (data: any) => ({ success: true, data }),
  error: (status: number, message: string) => ({ success: false, error: { message, code: `HTTP_${status}` } }),
};

export function withErrorHandlingEdge(fn: any) {
  return async (req: any) => {
    try {
      return await fn(req);
    } catch (err: any) {
      return new Response(JSON.stringify(http.error(500, err?.message ?? '')),{ status: 500, headers: { 'content-type': 'application/json' } });
    }
  };
}

export function withRateLimitEdge(fn: any) {
  // Simple pass-through for tests; can be extended to enforce limits
  return async (req: any) => {
    return fn(req);
  };
}

export const requireUserId = async () => ({ userId: 'test' });



