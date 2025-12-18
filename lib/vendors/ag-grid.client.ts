'use client';

import { publicEnv } from '@/lib/shared/config/client';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';

let registered = false;

/**
 * Checks if AG Grid Enterprise is properly configured.
 * 
 * @returns true if Enterprise is enabled, false otherwise
 */
// eslint-disable-next-line import/no-unused-modules -- Used in components/dashboard/entity/shared/grid/entity-grid.tsx
export function isAgGridEnterpriseEnabled(): boolean {
  return publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE === '1';
}

/**
 * Gets a detailed error message for AG Grid Enterprise configuration issues.
 * 
 * @returns Formatted error message with actionable steps
 * @internal Used internally by ensureAgGridRegistered and ensureAgGridReadyFor
 */
function getAgGridEnterpriseErrorMessage(): string {
  const currentValue = publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE;
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  let message = 'AG Grid Enterprise is required for server-side row model but is not properly configured.\n\n';
  
  if (currentValue === undefined) {
    message += '❌ NEXT_PUBLIC_AGGRID_ENTERPRISE is not set in your environment variables.\n\n';
  } else {
    message += `❌ NEXT_PUBLIC_AGGRID_ENTERPRISE is set to "${currentValue}" but must be exactly "1".\n\n`;
  }
  
  message += '📋 To fix this issue:\n';
  message += '   1. Create or update your .env.local file in the project root\n';
  message += '   2. Add the following line:\n';
  message += '      NEXT_PUBLIC_AGGRID_ENTERPRISE=1\n';
  message += '   3. Restart your Next.js development server (required for NEXT_PUBLIC_* variables)\n';
  message += '   4. Refresh this page\n\n';
  
  if (isDev) {
    message += '💡 Note: In Next.js, NEXT_PUBLIC_* variables are embedded at build time.\n';
    message += '   You must restart the dev server after adding or changing these variables.\n';
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
// eslint-disable-next-line import/no-unused-modules -- Exported and used via re-exports in ag-grid.ts and ag-grid-modules.ts
export function ensureAgGridRegistered(): void {
  if (registered) return;
  registered = true;

  // Fail fast if Enterprise is disabled but SSRM is required
  if (!isAgGridEnterpriseEnabled()) {
    const error = new Error(getAgGridEnterpriseErrorMessage());
    // Add a custom property to identify this error type
    (error as any).code = 'AG_GRID_ENTERPRISE_NOT_CONFIGURED';
    throw error;
  }

  // Set license key if provided (removes watermark/warnings in production)
  const licenseKey = publicEnv.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;
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
// eslint-disable-next-line import/no-unused-modules -- Used in components/dashboard/entity/shared/grid/entity-grid.tsx
export async function ensureAgGridReadyFor(mode: string): Promise<void> {
  ensureAgGridRegistered();
  
  // Additional validation for server-side mode
  if (mode === 'serverSide' && !isAgGridEnterpriseEnabled()) {
    const error = new Error(getAgGridEnterpriseErrorMessage());
    (error as any).code = 'AG_GRID_ENTERPRISE_NOT_CONFIGURED';
    throw error;
  }
  
  return;
}
