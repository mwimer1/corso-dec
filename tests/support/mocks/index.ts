/**
 * Centralized mock utilities for test suite
 * 
 * This is the primary import surface for test mocks.
 * 
 * Usage:
 * ```typescript
 * import { mockClerkAuth, mockHeaders } from '@/tests/support/mocks';
 * 
 * beforeEach(() => {
 *   mockClerkAuth.setup();
 *   mockHeaders.setup({ headers: { 'x-header': 'value' } });
 * });
 * ```
 */

export { buildClerkAuthState, mockClerkAuth, type ClerkAuthMockOptions } from './clerk';
// Export mockHeaders - using explicit re-export to ensure it's available
// This works around Vitest's alias system which maps 'next/headers' to next-headers.ts
export { mockHeaders, type NextHeadersMockOptions } from './next-headers';

// Re-export other existing mocks for convenience
export * from './atoms';
export * from './lib-api';
export * from './molecules';
export * from './next-cache';
export * from './next-navigation';
export * from './server-only';

