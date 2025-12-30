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
export { mockHeaders, type NextHeadersMockOptions } from './next-headers';

// Re-export other existing mocks for convenience
export * from './atoms';
export * from './lib-api';
export * from './molecules';
export * from './next-cache';
export * from './next-navigation';
export * from './server-only';

