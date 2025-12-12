'use client';

import { AppErrorBoundary } from '@/components';
import type { PropsWithChildren } from 'react';

export default function ProtectedClientWrapper({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>{children}</AppErrorBoundary>
  );
}


