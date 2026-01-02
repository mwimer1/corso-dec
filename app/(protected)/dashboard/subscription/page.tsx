import { AuthCard } from "@/components";
import { SubscriptionClient } from "@/components/billing";

// App Router segment config — must be top-level literals
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

export default function DashboardSubscriptionPage() {
  return (
    <AuthCard>
      <SubscriptionClient />
    </AuthCard>
  );
}

