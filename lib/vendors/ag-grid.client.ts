'use client';

import { publicEnv } from '@/lib/shared/config/client';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';

let registered = false;

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
  if (publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE !== '1') {
    throw new Error(
      'EntityGrid uses rowModelType="serverSide" which requires AG Grid Enterprise. ' +
      'Set NEXT_PUBLIC_AGGRID_ENTERPRISE=1 in your environment variables.'
    );
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
export async function ensureAgGridReadyFor(mode: string): Promise<void> {
  ensureAgGridRegistered();
  
  // Additional validation for server-side mode
  if (mode === 'serverSide' && publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE !== '1') {
    throw new Error(
      'Server-side row model requires AG Grid Enterprise. ' +
      'Set NEXT_PUBLIC_AGGRID_ENTERPRISE=1 in your environment variables.'
    );
  }
  
  return;
}
