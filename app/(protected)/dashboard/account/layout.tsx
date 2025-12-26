import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account | Dashboard | Corso',
  description: 'Manage your account settings and profile',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

