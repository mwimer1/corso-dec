// Available test support utilities
export * from '@tests/support/env-mocks';
export * from '@tests/support/harness/api-route-harness';
export * from '@tests/support/harness/node-mocks';
export * from '@tests/support/harness/request';
export * from './harness/render.tsx';

/**
 * Mock Clerk authentication for testing RBAC
 */
export function mockClerkAuth(
  userId: string | null = 'test-user-123',
  role: string | null = 'member'
) {
  return {
    userId,
    sessionClaims: {
      publicMetadata: {
        role: role
      }
    }
  };
}

/**
 * Test helper for API route security testing
 */
export async function testApiSecurity(opts: {
  handler: (req: any) => Promise<any>;
  expectedStatus?: number;
  expectedErrorCode?: string;
  userId?: string | null;
  role?: string | null;
  method?: string;
  body?: any;
}) {
  const { vi } = await import('vitest');

  // Mock Clerk auth
  const authMock = vi.fn().mockResolvedValue(mockClerkAuth(opts.userId, opts.role));
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: authMock
  }));

  // Create test request (use health endpoint for basic connectivity testing)
  const req = new Request('http://localhost/api/health', {
    method: opts.method || 'GET',
    headers: { 'content-type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const result = await opts.handler(req as any);

  if (opts.expectedStatus) {
    expect(result.status).toBe(opts.expectedStatus);
  }

  if (opts.expectedErrorCode) {
    const body = await result.json();
    expect(body.error.code).toBe(opts.expectedErrorCode);
  }

  return result;
}



