// Moved account page into dashboard so sidebar remains visible
"use client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AuthCard } from "@/components";
import nextDynamic from "next/dynamic";

const UserProfile = nextDynamic(
  () => import("@clerk/nextjs").then(mod => ({ default: mod.UserProfile })),
  {
    loading: () => (
      <div className="p-8">
        <div className="animate-pulse motion-reduce:animate-none motion-reduce:transition-none space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function DashboardAccountPage() {
  return (
    <AuthCard>
      <UserProfile
        routing="path"
        path="/dashboard/account"
        appearance={{
          elements: {
            card: "p-lg shadow-panel rounded-lg",
            rootBox: "w-full max-w-2xl",
          },
        }}
      />
    </AuthCard>
  );
}
