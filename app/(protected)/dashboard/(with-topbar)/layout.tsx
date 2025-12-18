// app/(protected)/dashboard/(with-topbar)/layout.tsx
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
import type { ReactNode } from "react";

/**
 * Layout for entity pages (projects, companies, addresses) and settings pages (account, subscription).
 * 
 * Note: The top bar has been removed globally. This route group name is kept for organizational
 * purposes but no longer controls top bar rendering.
 */
export default function WithTopBarLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>{children}</DashboardLayout>
  );
}
