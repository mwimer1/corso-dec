// Available test support utilities
// @note: @tests/support is a TypeScript path alias (defined in tsconfig.base.json),
// not an npm package. Knip may flag this as "unlisted" but it's a false positive.
export * from '@tests/support/env-mocks';
export * from '@tests/support/harness/api-route-harness';
export * from '@tests/support/harness/node-mocks';
export * from '@tests/support/harness/request';
export * from './harness/render.tsx';

// Re-export centralized mocks (primary import surface)
export { buildClerkAuthState, mockClerkAuth, mockHeaders } from './mocks';

/**
 * @deprecated Use buildClerkAuthState from '@/tests/support/mocks' instead
 * Legacy helper for building Clerk auth state objects
 * 
 * This function is kept for backward compatibility but new code should use:
 * - mockClerkAuth.setup() for mocking in tests
 * - buildClerkAuthState() for constructing auth objects directly
 */
export function mockClerkAuthState(
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
 * @deprecated This function uses legacy mocking patterns. 
 * Prefer using mockClerkAuth.setup() directly in tests.
 * 
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
  const { expect } = await import('vitest');
  const { mockClerkAuth } = await import('./mocks');

  // Configure Clerk auth mock (uses global mock)
  mockClerkAuth.setup({
    userId: opts.userId ?? undefined,
    orgRole: opts.role ?? undefined,
  });

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



