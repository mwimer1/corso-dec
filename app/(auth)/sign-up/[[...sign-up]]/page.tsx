// Auth Sign-Up page. Same constraints as sign-in.

import { AuthShell, ClerkLoading } from '@/components/auth';
import { publicEnv } from '@/lib/shared/config/client';
import { ClerkLoaded, ClerkLoading as ClerkLoadingState, SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sign Up | Corso',
  robots: 'noindex',
};

export default function SignUpPage() {
  const env = publicEnv ?? {};
  const signUpPath = env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up';
  const signInUrl = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in';
  const afterSignUpUrl = env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? undefined;
  // Default redirect to dashboard chat (MVP: onboarding disabled, per next.config.mjs: /dashboard redirects to /dashboard/chat)
  const signUpRedirectFallback = env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/dashboard/chat';

  return (
    <AuthShell titleSr="Create your account">
      <ClerkLoadingState>
        <div className="mx-auto w-full max-w-md text-foreground">
          <ClerkLoading />
        </div>
      </ClerkLoadingState>

      <ClerkLoaded>
        <div className="mx-auto w-full max-w-md text-foreground">
          {/* single border owned by the Clerk card */}
          <SignUp
            routing="path"
            path={signUpPath}
            signInUrl={signInUrl}
            redirectUrl={afterSignUpUrl ?? signUpRedirectFallback}
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-surface text-foreground border border-border shadow-[var(--shadow-card)] rounded-xl',
                headerTitle: 'text-2xl font-semibold',
                headerSubtitle: 'text-sm text-muted-foreground',
                socialButtonsBlockButton: 'bg-surface border border-border hover:bg-surface/80',
                dividerLine: 'bg-border',
                dividerText: 'text-muted-foreground',
                formButtonPrimary:
                  'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40',
              },
            }}
          />
        </div>
      </ClerkLoaded>
    </AuthShell>
  );
}

// No re-exports from this file.
