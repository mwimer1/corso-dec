// app/(protected)/dashboard/layout.tsx
export const runtime = 'nodejs';
import { DashboardLayout } from "@/components/dashboard";
// DashboardProvider removed
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  // Server-side gate: boot to /sign-in if unauthenticated
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <DashboardLayout>{children}</DashboardLayout>
  );
}
