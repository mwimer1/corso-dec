/**
 * Legacy compatibility shim - re-exports from client adapter.
 * 
 * @deprecated Import directly from "@/lib/vendors/ag-grid.client" in client components.
 * This file is kept for backward compatibility with test setups and server-side code.
 * 
 * Note: In client components, prefer importing from ag-grid.client.ts directly
 * to ensure proper 'use client' boundary.
 */

// Re-export from client adapter (client components should import directly)
// eslint-disable-next-line import/no-unused-modules -- Exports are used in test files (tests/support/setup/vitest.setup.shared.ts, tests/dashboard/ag-grid-modules.test.ts)
export { ensureAgGridReadyFor, ensureAgGridRegistered } from './ag-grid.client';

