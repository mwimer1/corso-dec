// app/(protected)/dashboard/(no-topbar)/layout.tsx
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
import type { ReactNode } from "react";

/**
 * Layout for routes that should NOT render the dashboard top bar.
 * Used for chat and other full-height content pages.
 */
export default function NoTopBarLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout showTopBar={false}>{children}</DashboardLayout>
  );
}
