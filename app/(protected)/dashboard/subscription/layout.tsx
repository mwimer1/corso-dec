import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription | Dashboard | Corso',
  description: 'Manage your subscription and billing',
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

