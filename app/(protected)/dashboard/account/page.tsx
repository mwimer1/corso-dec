// Server component: Account page with client-side UserProfile component
/** @knipignore */
export const runtime = "nodejs";
/** @knipignore */
export const dynamic = "force-dynamic";
/** @knipignore */
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
