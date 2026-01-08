// app/(protected)/dashboard/layout.tsx
/** @knipignore */
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Root dashboard layout - handles authentication and wraps all dashboard pages with DashboardLayout.
 * 
 * All dashboard routes (chat, entities, account, subscription) share the same layout wrapper.
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

  return <DashboardLayout>{children}</DashboardLayout>;
}
