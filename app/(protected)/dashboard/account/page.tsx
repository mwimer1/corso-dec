// Server component: Account page with client-side UserProfile component
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AuthCard } from "@/components";
import { UserProfileClient } from "./user-profile-client";

export default function DashboardAccountPage() {
  return (
    <AuthCard>
      <UserProfileClient />
    </AuthCard>
  );
}
