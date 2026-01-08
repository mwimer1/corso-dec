// Onboarding-pref checks removed for MVP
// import { getOnboardingPrefs } from '@/actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import ProtectedClientWrapper from './client';

export const runtime = 'nodejs';
// Prefer request-time auth checks in v6; avoid forcing global dynamic unless necessary
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Onboarding gating removed for MVP: authenticated users proceed to protected app

  return <ProtectedClientWrapper>{children}</ProtectedClientWrapper>;
}
