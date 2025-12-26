import { AuthCard } from "@/components";
import { SubscriptionClient } from "@/components/billing";

// App Router segment config — must be top-level literals
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardSubscriptionPage() {
  return (
    <AuthCard>
      <SubscriptionClient />
    </AuthCard>
  );
}

