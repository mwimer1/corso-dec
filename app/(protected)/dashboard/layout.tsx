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
 */
export default async function Layout({ children }: { children: ReactNode }) {
  // Server-side gate: boot to /sign-in if unauthenticated
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <>{children}</>;
}
