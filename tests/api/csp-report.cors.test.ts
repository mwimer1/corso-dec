import * as cspReport from '@/app/api/v1/csp-report/route';
import { describe, expect, it } from 'vitest';

describe('csp-report CORS', () => {
  it('OPTIONS handler exists and is callable', async () => {
    // Test that the OPTIONS handler is properly exported and callable
    expect(typeof cspReport.OPTIONS).toBe('function');

    const req = new Request('http://localhost/api/v1/csp-report', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    // The OPTIONS handler should return a response (either CORS response or noContent)
    const res = await cspReport.OPTIONS(req);
    expect(res).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });

  it('OPTIONS handler returns appropriate status codes', async () => {
    const req = new Request('http://localhost/api/v1/csp-report', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://test.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    const res = await cspReport.OPTIONS(req);
    // Should return either 204 (CORS allowed) or 403 (CORS denied)
    expect([204, 403]).toContain(res.status);
  });

  it('OPTIONS handler includes required Vary header', async () => {
    const req = new Request('http://localhost/api/v1/csp-report', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const res = await cspReport.OPTIONS(req);
    expect(res.headers.get('Vary')).toBe('Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  });
});

