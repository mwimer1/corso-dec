'use client';

// Neutral pass-through; AuthShell handles centering/background.
import { AuthNavbar } from '@/components/auth';
import { SkipNavLink } from '@/components/ui/atoms';
import type { PropsWithChildren } from 'react';
import RouteThemeAuth from './_theme';

export const runtime = 'nodejs'; // client layout; avoid Edge hydration pitfalls

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipNavLink />
      <RouteThemeAuth />
      <AuthNavbar />
      {children}
    </>
  );
}
