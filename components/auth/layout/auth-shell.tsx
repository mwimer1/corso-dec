import { AuthCard } from '@/components/ui/molecules';
import Image from 'next/image';
import * as React from 'react';

export function AuthShell({ children, titleSr }: { children: React.ReactNode; titleSr?: string }) {
  return (
    <main id="main-content" tabIndex={-1} className="relative grid min-h-[100svh] place-items-center bg-background px-4 pt-[calc(var(--space-4xl)+var(--space-sm)-var(--space-md))]">
      {/* Optional brand mark: uncomment and replace path if desired */}
      {false && (
        <a href="/" className="absolute left-6 top-6 z-10">
          <Image src="/logo.svg" alt="Brand" width={92} height={28} />
        </a>
      )}

      {/* Accessibility title for screen readers */}
      {titleSr && <h1 className="sr-only">{titleSr}</h1>}

      <div className="w-full max-w-md">
        <AuthCard variant="ghost" className="bg-transparent shadow-none p-0">
          {children}
        </AuthCard>
      </div>
    </main>
  );
}


