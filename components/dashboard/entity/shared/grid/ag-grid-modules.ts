/** Note: Indirectly consumed via EntityGrid component; allowlisted in unused-exports to avoid FP. */

'use client';

import { ensureAgGridRegistered } from "@/lib/vendors/ag-grid";
// Minimal module registration shim for AG Grid – delegates to vendor utility.
export function registerAgGridModules(): void {
  ensureAgGridRegistered();
}



