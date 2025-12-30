import { vi } from 'vitest';

/**
 * Mock implementation of Clerk's auth() function
 * This is the actual mock function that will be called
 */
const mockAuthFn = vi.fn();

// Top-level module mock registration (Vitest best practice)
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuthFn(),
}));

/**
 * Configuration options for Clerk auth mock
 */
export interface ClerkAuthMockOptions {
  /** User ID (null for unauthenticated) */
  userId?: string | null;
  /** Organization ID */
  orgId?: string;
  /** Organization role (e.g., 'org:member', 'org:admin') */
  orgRole?: string;
  /** Session claims with public metadata */
  sessionClaims?: {
    publicMetadata?: Record<string, unknown>;
  };
  /** Custom has() function for role checking */
  has?: (role: string) => boolean;
}

/**
 * Default authenticated user configuration
 */
const DEFAULT_AUTH = {
  userId: 'test-user-123',
  orgId: 'test-org-123',
  orgRole: 'org:member',
  has: (role: string) => role === 'org:member' || role === 'member',
  sessionClaims: {
    publicMetadata: {
      role: 'org:member',
    },
  },
} as const satisfies ClerkAuthMockOptions;

/**
 * Centralized Clerk authentication mock utility
 * 
 * Usage:
 * ```typescript
 * import { mockClerkAuth } from '@/tests/support/mocks';
 * 
 * beforeEach(() => {
 *   mockClerkAuth.setup(); // Default authenticated member
 * });
 * 
 * // Override for specific tests
 * mockClerkAuth.setup({ userId: null }); // Unauthenticated
 * mockClerkAuth.setup({ orgRole: 'org:admin' }); // Admin user
 * ```
 */
export const mockClerkAuth = {
  /**
   * Get the underlying mock function for advanced usage
   */
  getMock(): ReturnType<typeof vi.fn> {
    return mockAuthFn;
  },

  /**
   * Configure the auth mock return value
   * @param options Configuration options (partial, merges with defaults)
   */
  setup(options: ClerkAuthMockOptions = {}): void {
    const config = {
      userId: options.userId ?? DEFAULT_AUTH.userId,
      orgId: options.orgId ?? DEFAULT_AUTH.orgId,
      orgRole: options.orgRole ?? DEFAULT_AUTH.orgRole,
      has: options.has ?? DEFAULT_AUTH.has,
      sessionClaims: {
        ...DEFAULT_AUTH.sessionClaims,
        ...options.sessionClaims,
        publicMetadata: {
          ...DEFAULT_AUTH.sessionClaims?.publicMetadata,
          ...options.sessionClaims?.publicMetadata,
          ...(options.orgRole && { role: options.orgRole }),
        },
      },
    };

    mockAuthFn.mockResolvedValue({
      userId: config.userId,
      orgId: config.orgId,
      has: config.has,
      sessionClaims: config.sessionClaims,
    });
  },

  /**
   * Reset the mock (clears call history and resets to defaults)
   */
  reset(): void {
    mockAuthFn.mockClear();
    this.setup();
  },

  /**
   * Clear mock call history without resetting return value
   */
  clear(): void {
    mockAuthFn.mockClear();
  },
};

/**
 * Legacy helper: Build a Clerk auth state object (for backward compatibility)
 * This is kept for tests that need to construct auth objects directly
 * 
 * @deprecated Prefer using mockClerkAuth.setup() instead
 */
export function buildClerkAuthState(
  userId: string | null = 'test-user-123',
  role: string | null = 'member'
) {
  return {
    userId,
    sessionClaims: {
      publicMetadata: {
        role: role,
      },
    },
  };
}

