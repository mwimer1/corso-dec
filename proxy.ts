import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Next.js Proxy Configuration (formerly Middleware)
 *
 * IMPORTANT: Proxy execution order is critical for security and performance.
 * This proxy handles authentication and route protection for the entire application.
 *
 * Dependencies:
 * - Clerk authentication must be initialized in the app
 * - Public routes must be defined here for proper access control
 * - Onboarding logic (when enabled) depends on Clerk session claims configuration
 *
 * Route Processing Order (Critical):
 * 1. Public route check - allows unauthenticated access to marketing/auth pages
 * 2. Authentication check - verifies user identity via Clerk
 * 3. Onboarding check - validates onboarding completion (currently disabled for MVP)
 * 4. Protected route access - allows authenticated users to proceed
 *
 * Hidden Dependencies:
 * - Clerk session claims must be configured in Clerk Dashboard for onboarding metadata
 * - Onboarding status relies on `user.publicMetadata.onboardingComplete` flag
 * - Route matchers depend on exact path patterns in the Next.js app structure
 *
 * Note: In Next.js 16, middleware.ts was renamed to proxy.ts and runs in Node.js runtime
 * (not Edge runtime). Clerk's clerkMiddleware() remains compatible with this change.
 */

const publicRoutes = createRouteMatcher([
  '/',
  '/health',
  '/sitemap.xml',
  '/pricing',
  '/insights(.*)',
  '/(marketing)(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public/(.*)',
]);

// Marketing routes that should redirect authenticated users to dashboard
// Excludes auth routes (/sign-in, /sign-up) which are handled separately
const marketingRoutes = createRouteMatcher([
  '/',
  '/pricing',
  '/insights(.*)',
  '/(marketing)(.*)',
]);

// Onboarding routes removed for MVP; no special-case matcher required
// const onboardingRoutes = createRouteMatcher(['/(auth)/onboarding(.*)']);

/**
 * Main proxy handler with Clerk authentication integration
 *
 * @param auth - Clerk authentication context
 * @param req - Next.js request object
 * @returns NextResponse with appropriate routing/redirect behavior
 *
 * Processing Flow:
 * 1. Redirect authenticated users from marketing pages to dashboard (prevents auth UI on public pages)
 * 2. Allow public routes (including auth routes) - unauthenticated access to marketing/auth pages
 * 3. Verify user authentication - redirect to sign-in if not authenticated
 * 4. Validate onboarding status - redirect to onboarding if incomplete (MVP: disabled)
 * 5. Allow authenticated users to proceed to protected routes
 */
export const proxy = clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const url = req.nextUrl.clone();

  // Step 1: Redirect authenticated users away from marketing pages to dashboard
  // This ensures authenticated users don't see marketing content or auth UI on public pages
  if (userId && marketingRoutes(req)) {
    // Exclude auth routes from redirect (users should be able to access sign-in/sign-up even when authenticated)
    if (!url.pathname.startsWith('/sign-in') && !url.pathname.startsWith('/sign-up')) {
      url.pathname = '/dashboard/chat';
      return NextResponse.redirect(url);
    }
  }

  // Step 2: Allow public routes (including auth routes)
  // These routes are accessible without authentication for marketing and user onboarding
  if (publicRoutes(req)) return NextResponse.next();

  // Step 3: No special onboarding routing for MVP - authenticated users proceed
  // When onboarding is enabled, this would check onboarding completion status
  // if (userId && onboardingRoutes(req)) return NextResponse.next();

  // Step 4: Not signed in: redirect to sign-in for protected routes
  // This ensures all protected routes require authentication
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Step 5: Previously gated by onboarding claim; for MVP assume authenticated users are allowed
  // When onboarding is enabled, this would check:
  // const onboardComplete = (sessionClaims as any)?.metadata?.onboardingComplete;
  // if (!onboardComplete) { /* redirect to onboarding */ }

  return NextResponse.next();
});

/**
 * Proxy configuration for Next.js
 *
 * This config defines which routes the proxy should process.
 * IMPORTANT: The matcher order matters for performance and security.
 *
 * Current Configuration:
 * - First matcher: Catches all non-asset routes (pages, dynamic routes)
 * - Second matcher: Explicitly includes API routes for security processing
 *
 * Hidden Dependencies:
 * - Next.js proxy only runs on routes that match these patterns
 * - Excluded patterns (_next, static assets) are handled by Next.js directly
 * - API routes must be explicitly included for authentication checks
 */
export const config = {
  matcher: [
    // Catch all non-asset routes (pages, dynamic routes, etc.)
    // This ensures proxy processes all user-facing routes
    '/((?!_next|.*\\..*).*)',

    // Explicitly include API routes for authentication and security
    // Without this, API routes might bypass proxy checks
    '/(api)(.*)',
  ],
};
