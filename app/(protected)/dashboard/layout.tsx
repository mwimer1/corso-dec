// app/(protected)/dashboard/layout.tsx
export const runtime = 'nodejs';
// DashboardProvider removed
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Root dashboard layout - handles authentication only.
 * 
 * Route groups handle their own layout rendering:
 * - (no-topbar)/layout.tsx - Chat and other full-height pages
 * - (with-topbar)/layout.tsx - Entity pages and settings pages
 * 
 * E2E Testing: When E2E_BYPASS_AUTH=true and NODE_ENV=test, bypasses auth check
 * to allow E2E tests to run without real Clerk authentication.
 */
export default async function Layout({ children }: { children: ReactNode }) {
  // E2E auth bypass (test-only, never in production)
  const e2eBypass = process.env['E2E_BYPASS_AUTH'] === 'true' && 
                    (process.env['NODE_ENV'] === 'test' || process.env['PLAYWRIGHT'] === '1');
  
  if (!e2eBypass) {
    // Normal auth check
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  // In E2E bypass mode, skip auth check and allow access

  return <>{children}</>;
}
