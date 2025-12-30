/**
 * Shared helper functions for chat route tests
 */

import { mockClerkAuth } from '@/tests/support/mocks';
import { resolveRouteModule } from '../support/resolve-route';
import { mockGetTenantContext } from './shared-mocks';

// Single source of truth for authentication state
let currentUserId: string | null = "test-user-123";

/**
 * Helper to set auth state consistently across Clerk and tenant context mocks
 */
export function setAuth(userId: string | null) {
  currentUserId = userId;

  // Reset and update Clerk mock
  mockClerkAuth.getMock().mockReset();
  mockClerkAuth.setup({ userId });

  // Update tenant context to reflect current auth state
  mockGetTenantContext.mockImplementation(async (req?: any) => {
    const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
    // If no header, simulate session fallback by returning a default orgId
    // Tests that want to test MISSING_ORG_CONTEXT should explicitly mock rejection
    return { 
      orgId: orgId || 'default-session-org-id', 
      userId: currentUserId 
    };
  });
}

/**
 * Helper to import route module after resetModules, ensuring Clerk mock is re-registered
 */
export async function importChatRouteModule(authUserId: string | null = null) {
  const { vi } = await import('vitest');
  vi.resetModules();

  // Critical: re-register clerk mock after resetModules
  // This ensures the mock is available when the route handler imports auth()
  const { mockClerkAuth: reimportedMockClerkAuth } = await import('@/tests/support/mocks/clerk');
  
  // Re-apply auth state after mock is re-imported (explicitly set null for unauthenticated)
  reimportedMockClerkAuth.getMock().mockReset();
  // Explicitly pass userId (even if null) to override defaults
  reimportedMockClerkAuth.setup(authUserId === null ? { userId: null } : { userId: authUserId });
  
  // Also re-setup tenant context mock to match auth state
  mockGetTenantContext.mockImplementation(async (req?: any) => {
    const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
    return { 
      orgId: orgId || 'default-session-org-id', 
      userId: authUserId 
    };
  });

  const url = resolveRouteModule("ai/chat");
  if (!url) return null;

  return await import(url);
}
