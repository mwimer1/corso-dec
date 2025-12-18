// app/(protected)/dashboard/(no-topbar)/layout.tsx
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
import type { ReactNode } from "react";

/**
 * Layout for chat and other full-height content pages.
 * 
 * Note: The top bar has been removed globally. This route group name is kept for organizational
 * purposes but no longer controls top bar rendering.
 */
export default function NoTopBarLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>{children}</DashboardLayout>
  );
}
