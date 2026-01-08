'use client';

// Neutral pass-through; AuthShell handles centering/background.
import { AuthNavbar } from '@/components/auth';
import { SkipNavLink } from '@/components/ui/atoms';
import type { PropsWithChildren } from 'react';
import RouteThemeAuth from './_theme';

// Route configuration (runtime, dynamic, revalidate) is handled in page files, not client layouts.
// Client components cannot export route configuration - it must be in server components.

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
