import * as cspReport from '@/app/api/v1/csp-report/route';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock getEnvEdge
const mockGetEnvEdge = vi.fn();
vi.mock('@/lib/api/edge', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getEnvEdge: () => mockGetEnvEdge(),
  };
});

// Mock fetch for forwarding tests
const originalFetch = globalThis.fetch;
let fetchCalls: Array<{ url: string; options: RequestInit }> = [];

describe('CSP Report POST Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCalls = [];
    
    // Default env: no forwarding, production mode
    mockGetEnvEdge.mockReturnValue({
      NODE_ENV: 'production',
      CSP_FORWARD_URI: undefined,
      CSP_REPORT_LOG: undefined,
      CSP_REPORT_MAX_LOGS: undefined,
    });

    // Mock fetch to track calls
    globalThis.fetch = vi.fn(async (url: string | URL, options?: RequestInit) => {
      fetchCalls.push({ url: String(url), options: options || {} });
      return new Response(null, { status: 200 });
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Content Type: application/reports+json', () => {
    it('should accept valid Reporting API batch and return 204', async () => {
      const payload = [
        {
          type: 'csp-violation',
          body: {
            'violated-directive': 'script-src',
            'blocked-uri': 'https://evil.com/script.js',
            'source-file': 'https://example.com/page.html',
            'line-number': 42,
          },
        },
      ];

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/reports+json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should filter out non-csp-violation reports', async () => {
      const payload = [
        {
          type: 'other-report',
          body: { some: 'data' },
        },
        {
          type: 'csp-violation',
          body: {
            'violated-directive': 'script-src',
          },
        },
      ];

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/reports+json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
    });

    it('should return 400 for invalid report structure (results in empty reports)', async () => {
      const payload = [{ type: 'csp-violation' }]; // missing body - filters out, results in empty reports

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/reports+json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      // Invalid structure filters out, leaving empty reports array
      expect(body.error.code).toBe('EMPTY_CSP_REPORT');
    });

    it('should return 400 for empty batch (schema validation fails)', async () => {
      const payload: any[] = [];

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/reports+json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      // Empty array fails schema validation (min(1) requirement)
      expect(body.error.code).toBe('INVALID_CSP_REPORT');
    });
  });

  describe('Content Type: application/csp-report (Legacy)', () => {
    it('should accept legacy wrapped format and return 204', async () => {
      const payload = {
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js',
        },
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/csp-report' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should accept legacy format with application/json content-type if csp-report key exists', async () => {
      const payload = {
        'csp-report': {
          'violated-directive': 'script-src',
        },
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
    });

    it('should return 400 for invalid legacy format', async () => {
      const payload = { 'csp-report': { invalid: 'structure' } }; // missing required field

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/csp-report' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_CSP_REPORT');
    });
  });

  describe('Content Type: application/json (Permissive)', () => {
    it('should accept permissive JSON format and return 204', async () => {
      const payload = {
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
        'source-file': 'https://example.com/page.html',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 400 for invalid permissive format', async () => {
      const payload = { invalid: 'structure' }; // missing required field

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_CSP_REPORT');
    });
  });

  describe('Invalid JSON Handling', () => {
    it('should return 204 for invalid JSON (to avoid browser retries)', async () => {
      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {',
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 400 for empty body with unsupported content type check', async () => {
      // Empty body with no content-type header triggers unsupported content type check
      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        body: '',
      });

      const res = await cspReport.POST(req);
      // Content type check happens before JSON parsing
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
    });
  });

  describe('Unsupported Content Types', () => {
    it('should return 400 for unsupported content type', async () => {
      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'some text',
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
    });

    it('should return 400 for missing content type', async () => {
      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        body: JSON.stringify({ 'violated-directive': 'script-src' }),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
    });
  });

  describe('Forwarding to CSP_FORWARD_URI', () => {
    it('should forward reports when CSP_FORWARD_URI is set', async () => {
      const forwardUri = 'https://internal.example.com/csp-ingest';
      mockGetEnvEdge.mockReturnValue({
        NODE_ENV: 'production',
        CSP_FORWARD_URI: forwardUri,
        CSP_REPORT_LOG: undefined,
        CSP_REPORT_MAX_LOGS: undefined,
      });

      const payload = {
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);

      // Verify forwarding was attempted
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].url).toBe(forwardUri);
      expect(fetchCalls[0].options.method).toBe('POST');
      expect(fetchCalls[0].options.headers).toMatchObject({
        'content-type': 'application/json',
      });
      expect(fetchCalls[0].options.keepalive).toBe(true);

      // Verify forwarded body contains reports array
      const forwardedBody = JSON.parse(fetchCalls[0].options.body as string);
      expect(forwardedBody.reports).toBeDefined();
      expect(Array.isArray(forwardedBody.reports)).toBe(true);
      expect(forwardedBody.reports.length).toBe(1);
    });

    it('should not forward when CSP_FORWARD_URI is not set', async () => {
      mockGetEnvEdge.mockReturnValue({
        NODE_ENV: 'production',
        CSP_FORWARD_URI: undefined,
        CSP_REPORT_LOG: undefined,
        CSP_REPORT_MAX_LOGS: undefined,
      });

      const payload = {
        'violated-directive': 'script-src',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);

      // Verify no forwarding was attempted
      expect(fetchCalls.length).toBe(0);
    });

    it('should not throw if forwarding fails', async () => {
      const forwardUri = 'https://internal.example.com/csp-ingest';
      mockGetEnvEdge.mockReturnValue({
        NODE_ENV: 'production',
        CSP_FORWARD_URI: forwardUri,
        CSP_REPORT_LOG: undefined,
        CSP_REPORT_MAX_LOGS: undefined,
      });

      // Mock fetch to throw
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

      const payload = {
        'violated-directive': 'script-src',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should not throw, should return 204
      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
    });

    it('should forward multiple reports from batch', async () => {
      const forwardUri = 'https://internal.example.com/csp-ingest';
      mockGetEnvEdge.mockReturnValue({
        NODE_ENV: 'production',
        CSP_FORWARD_URI: forwardUri,
        CSP_REPORT_LOG: undefined,
        CSP_REPORT_MAX_LOGS: undefined,
      });

      const payload = [
        {
          type: 'csp-violation',
          body: { 'violated-directive': 'script-src' },
        },
        {
          type: 'csp-violation',
          body: { 'violated-directive': 'style-src' },
        },
      ];

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/reports+json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);

      expect(fetchCalls.length).toBe(1);
      const forwardedBody = JSON.parse(fetchCalls[0].options.body as string);
      expect(forwardedBody.reports.length).toBe(2);
    });
  });

  describe('Always 204 Contract', () => {
    it('should always return 204 on successful parsing (never 200)', async () => {
      const payload = {
        'violated-directive': 'script-src',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.status).not.toBe(200);
    });

    it('should include CORS header in 204 response', async () => {
      const payload = {
        'violated-directive': 'script-src',
      };

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await cspReport.POST(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});
