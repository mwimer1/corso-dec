// Auth Sign-In page. Keep config exports primitive and avoid named re-exports.
import { AuthShell, ClerkLoading } from '@/components/auth';
import { publicEnv } from '@/lib/shared/config/client';
import { ClerkLoaded, ClerkLoading as ClerkLoadingState, SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sign In | Corso',
  robots: 'noindex',
};

export default function SignInPage() {
  const env = publicEnv ?? {};
  const signInPath = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in';
  const signUpUrl = env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up';
  const afterSignInUrl = env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? undefined;
  // Default redirect to dashboard chat (per next.config.mjs: /dashboard redirects to /dashboard/chat)
  const signInRedirectFallback = env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/dashboard/chat';

  return (
    <AuthShell titleSr="Sign in to your account">
      <ClerkLoadingState>
        <div className="mx-auto w-full max-w-md text-foreground">
          <ClerkLoading />
        </div>
      </ClerkLoadingState>

      <ClerkLoaded>
        <div className="mx-auto w-full max-w-md text-foreground">
          {/* single border owned by the Clerk card */}
          <SignIn
            routing="path"
            path={signInPath}
            signUpUrl={signUpUrl}
            redirectUrl={afterSignInUrl ?? signInRedirectFallback}
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
