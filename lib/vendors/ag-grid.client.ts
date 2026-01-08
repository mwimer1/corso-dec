'use client';

import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';

let registered = false;

/**
 * Checks if AG Grid Enterprise is properly configured.
 * 
 * Uses direct process.env access so Next.js can inline NEXT_PUBLIC_* variables
 * into the client bundle at build time.
 * 
 * @returns true if Enterprise is enabled, false otherwise
 */
 
export function isAgGridEnterpriseEnabled(): boolean {
  // Direct access allows Next.js to statically replace at build time
  // Using bracket notation to satisfy TypeScript index signature requirement
  const raw =
    process.env['NEXT_PUBLIC_AGGRID_ENTERPRISE'] ??
    process.env['NEXT_PUBLIC_AG_GRID_ENTERPRISE']; // optional legacy support

  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true';
}

/**
 * Gets a detailed error message for AG Grid Enterprise configuration issues.
 * 
 * @returns Formatted error message with actionable steps
 * @internal Used internally by ensureAgGridRegistered and ensureAgGridReadyFor
 */
function getAgGridEnterpriseErrorMessage(): string {
  // Direct access to show actual runtime value (will be undefined if not inlined)
  // Using bracket notation to satisfy TypeScript index signature requirement
  const currentValue =
    process.env['NEXT_PUBLIC_AGGRID_ENTERPRISE'] ??
    process.env['NEXT_PUBLIC_AG_GRID_ENTERPRISE'];
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  let message = 'AG Grid Enterprise is required for server-side row model but is not properly configured.\n\n';
  
  if (currentValue === undefined) {
    message += '❌ NEXT_PUBLIC_AGGRID_ENTERPRISE is not set in your environment variables.\n\n';
  } else {
    message += `❌ NEXT_PUBLIC_AGGRID_ENTERPRISE is set to "${currentValue}" but must be "1" or "true".\n\n`;
  }
  
  message += '📋 To fix this issue:\n';
  message += '   1. Create or update your .env.local file in the project root (or package directory in monorepos)\n';
  message += '   2. Add the following line:\n';
  message += '      NEXT_PUBLIC_AGGRID_ENTERPRISE=1\n';
  message += '   3. Fully restart your Next.js development server:\n';
  message += '      - Stop the dev server (Ctrl+C)\n';
  message += '      - Delete .next directory (optional but recommended)\n';
  message += '      - Start dev server again (pnpm dev)\n';
  message += '   4. Refresh this page\n\n';
  
  if (isDev) {
    message += '💡 Note: In Next.js, NEXT_PUBLIC_* variables are embedded at build time.\n';
    message += '   You must fully restart the dev server after adding or changing these variables.\n';
    message += '   If you\'re in a monorepo, ensure .env.local is in the package directory where you run "pnpm dev".\n';
  }
  
  return message;
}

/**
 * Registers AG Grid modules before any grid is instantiated.
 * 
 * This function must be called client-side only (browser context).
 * It registers all Enterprise modules, which includes ServerSideRowModelModule
 * required for rowModelType="serverSide".
 * 
 * @throws {Error} If Enterprise is disabled but server-side row model is used
 */
export function ensureAgGridRegistered(): void {
  if (registered) return;
  registered = true;

  // Fail fast if Enterprise is disabled but SSRM is required
  if (!isAgGridEnterpriseEnabled()) {
    const error = new Error(getAgGridEnterpriseErrorMessage());
    // Add a custom property to identify this error type using type-safe extension
    throw Object.assign(error, { code: 'AG_GRID_ENTERPRISE_NOT_CONFIGURED' }) as Error & { code: string };
  }

  // Set license key if provided (removes watermark/warnings in production)
  // Uses canonical name NEXT_PUBLIC_AGGRID_LICENSE_KEY (legacy NEXT_PUBLIC_AG_GRID_LICENSE_KEY supported)
  // Using bracket notation to satisfy TypeScript index signature requirement
  const licenseKey =
    process.env['NEXT_PUBLIC_AGGRID_LICENSE_KEY'] ??
    process.env['NEXT_PUBLIC_AG_GRID_LICENSE_KEY'];
  if (licenseKey) {
    LicenseManager.setLicenseKey(licenseKey);
  }

  // Register all Enterprise modules (includes ServerSideRowModelModule for SSRM)
  ModuleRegistry.registerModules([AllEnterpriseModule]);
}

/**
 * Ensures AG Grid is ready for a specific row model mode.
 * 
 * @param mode - Row model mode ('serverSide', 'clientSide', etc.)
 * @throws {Error} If Enterprise is required but not enabled
 */
 
export async function ensureAgGridReadyFor(mode: string): Promise<void> {
  ensureAgGridRegistered();
  
  // Additional validation for server-side mode
  if (mode === 'serverSide' && !isAgGridEnterpriseEnabled()) {
    const error = new Error(getAgGridEnterpriseErrorMessage());
    // Add a custom property to identify this error type using type-safe extension
    throw Object.assign(error, { code: 'AG_GRID_ENTERPRISE_NOT_CONFIGURED' }) as Error & { code: string };
  }
  
  return;
}
