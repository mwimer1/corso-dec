/**
 * Compat shim for legacy imports:
 *   import { ensureAgGridRegistered, ensureAgGridReadyFor } from "@/lib/vendors/ag-grid";
 *
 * Keep surface stable; do not introduce vendor runtime deps here.
 * If tests require side-effects, wire them behind try/catch in a follow-up.
 */

// no-op registration (compile-time compatibility)
export function ensureAgGridRegistered(): void {
  // Intentionally noop. Real registration (if required) should live in a vendor adapter.
}

// simple readiness gate for call-sites that `await` this
export async function ensureAgGridReadyFor(_mode: string): Promise<void> {
  // Intentionally resolve immediately to preserve async call sites.
  return;
}

