import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockEnv = { CORS_ALLOWED_ORIGINS: 'https://example.com' };

vi.mock('@/lib/api/edge', () => ({
  getEnvEdge: () => mockEnv,
}));

beforeEach(() => {
  mockEnv = { CORS_ALLOWED_ORIGINS: 'https://example.com' };
  vi.resetModules();
});

describe('CORS Middleware', () => {
  describe('corsHeaders', () => {
    it('includes Vary and sets Allow-Origin when origin provided', async () => {
      const { corsHeaders } = await import('@/lib/middleware/http/cors');
      const headers = corsHeaders('https://example.com');

      expect(headers['Vary']).toBe('Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    });

    it('includes Vary and omits Allow-Origin when origin missing', async () => {
      const { corsHeaders } = await import('@/lib/middleware/http/cors');
      const headers = corsHeaders();

      expect(headers['Vary']).toBe('Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('echoes requested method when provided', async () => {
      const { corsHeaders } = await import('@/lib/middleware/http/cors');
      const headers = corsHeaders('https://example.com', 'POST');
      expect(headers['Access-Control-Allow-Methods']).toBe('POST');
    });
  });

  describe('handleCors', () => {
    it('returns 204 for valid preflight request and echoes method', async () => {
      const { handleCors } = await import('@/lib/middleware/http/cors');

      const req = {
        method: 'OPTIONS',
        headers: {
          get: (k: string) => (k === 'origin' ? 'https://example.com' :
                               k === 'Access-Control-Request-Method' ? 'POST' : null),
        },
      } as any;

      const res = handleCors(req)!;
      expect(res.status).toBe(204);
      expect(res.headers.get('Vary')).toBe('Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST');
    });

    it('returns 403 for invalid origin in preflight', async () => {
      const { handleCors } = await import('@/lib/middleware/http/cors');

      // Allowed only example.com; request from malicious.com
      mockEnv = { CORS_ALLOWED_ORIGINS: 'https://example.com' };

      const req = {
        method: 'OPTIONS',
        headers: {
          get: (k: string) => (k === 'origin' ? 'https://malicious.com' :
                               k === 'Access-Control-Request-Method' ? 'POST' : null),
        },
      } as any;

      const res = handleCors(req)!;
      expect(res.status).toBe(403);
      expect(res.headers.get('Vary')).toBe('Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('returns null for non-preflight requests', async () => {
      const { handleCors } = await import('@/lib/middleware/http/cors');
      const req = { method: 'POST', headers: { get: () => null } } as any;
      const res = handleCors(req);
      expect(res).toBeNull();
    });
  });
});

