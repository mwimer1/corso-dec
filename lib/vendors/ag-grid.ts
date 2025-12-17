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
export { ensureAgGridReadyFor, ensureAgGridRegistered } from './ag-grid.client';

