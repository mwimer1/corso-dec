/**
 * @fileoverview Tests for Node.js error handling wrapper
 * @description Verifies request ID propagation and error handling consistency
 */

import { withErrorHandlingNode } from '@/lib/middleware/node/with-error-handling-node';
import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

describe('withErrorHandlingNode', () => {
  it('attaches X-Request-ID header on success', async () => {
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      return NextResponse.json({ success: true, data: { test: true } });
    });

    const req = new NextRequest('http://localhost/test', {
      headers: { 'x-request-id': 'test-request-123' },
    });

    const res = await handler(req);
    expect(res.headers.get('X-Request-ID')).toBe('test-request-123');
    expect(res.headers.get('Access-Control-Expose-Headers')).toContain('X-Request-ID');
    
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { test: true } });
  });

  it('generates request ID if not present in headers', async () => {
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      return NextResponse.json({ success: true });
    });

    const req = new NextRequest('http://localhost/test');

    const res = await handler(req);
    const requestId = res.headers.get('X-Request-ID');
    expect(requestId).toBeTruthy();
    expect(requestId?.length).toBeGreaterThan(0);
  });

  it('attaches X-Request-ID header on error', async () => {
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      throw new Error('Test error');
    });

    const req = new NextRequest('http://localhost/test', {
      headers: { 'x-request-id': 'error-request-456' },
    });

    const res = await handler(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers.get('X-Request-ID')).toBe('error-request-456');
    
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Test error',
    });
  });

  it('converts errors to standardized ApiError format', async () => {
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      throw new Error('Database connection failed');
    });

    const req = new NextRequest('http://localhost/test');
    const res = await handler(req);
    const body = await res.json();

    expect(body).toMatchObject({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Database connection failed',
      },
    });
  });

  it('preserves error response shape from fail() helper', async () => {
    // Verify the wrapper uses fail() which returns the expected shape
    // Now verify wrapper produces same shape
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      throw new Error('Test');
    });

    const req = new NextRequest('http://localhost/test');
    const res = await handler(req);
    const body = await res.json();

    // Should have same structure as fail() response
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });

  it('handles undefined request gracefully', async () => {
    const handler = withErrorHandlingNode(async (_req: NextRequest) => {
      return NextResponse.json({ success: true });
    });

    // @ts-expect-error - testing undefined request handling
    const res = await handler(undefined);
    expect(res.headers.get('X-Request-ID')).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

