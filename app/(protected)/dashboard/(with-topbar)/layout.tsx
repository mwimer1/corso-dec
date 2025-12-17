// app/(protected)/dashboard/(with-topbar)/layout.tsx
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
import type { ReactNode } from "react";

/**
 * Layout for routes that SHOULD render the dashboard top bar.
 * Used for entity pages (projects, companies, addresses) and settings pages (account, subscription).
 */
export default function WithTopBarLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout showTopBar={true}>{children}</DashboardLayout>
  );
}
