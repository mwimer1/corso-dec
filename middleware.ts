import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Next.js Middleware Configuration
 *
 * IMPORTANT: Middleware execution order is critical for security and performance.
 * This middleware handles authentication and route protection for the entire application.
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

// Onboarding routes removed for MVP; no special-case matcher required
// const onboardingRoutes = createRouteMatcher(['/(auth)/onboarding(.*)']);

/**
 * Main middleware handler with Clerk authentication integration
 *
 * @param auth - Clerk authentication context
 * @param req - Next.js request object
 * @returns NextResponse with appropriate routing/redirect behavior
 *
 * Processing Flow:
 * 1. Check if route is public - if so, allow immediate access
 * 2. Verify user authentication - redirect to sign-in if not authenticated
 * 3. Validate onboarding status - redirect to onboarding if incomplete (MVP: disabled)
 * 4. Allow authenticated users to proceed to protected routes
 */
export const middleware = clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // Step 1: Allow public routes (including auth routes)
  // These routes are accessible without authentication for marketing and user onboarding
  if (publicRoutes(req)) return NextResponse.next();

  // Step 2: No special onboarding routing for MVP - authenticated users proceed
  // When onboarding is enabled, this would check onboarding completion status
  // if (userId && onboardingRoutes(req)) return NextResponse.next();

  // Step 3: Not signed in: redirect to sign-in for protected routes
  // This ensures all protected routes require authentication
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Step 4: Previously gated by onboarding claim; for MVP assume authenticated users are allowed
  // When onboarding is enabled, this would check:
  // const onboardComplete = (sessionClaims as any)?.metadata?.onboardingComplete;
  // if (!onboardComplete) { /* redirect to onboarding */ }

  return NextResponse.next();
});

/**
 * Middleware configuration for Next.js
 *
 * This config defines which routes the middleware should process.
 * IMPORTANT: The matcher order matters for performance and security.
 *
 * Current Configuration:
 * - First matcher: Catches all non-asset routes (pages, dynamic routes)
 * - Second matcher: Explicitly includes API routes for security processing
 *
 * Hidden Dependencies:
 * - Next.js middleware only runs on routes that match these patterns
 * - Excluded patterns (_next, static assets) are handled by Next.js directly
 * - API routes must be explicitly included for authentication checks
 */
export const config = {
  matcher: [
    // Catch all non-asset routes (pages, dynamic routes, etc.)
    // This ensures middleware processes all user-facing routes
    '/((?!_next|.*\\..*).*)',

    // Explicitly include API routes for authentication and security
    // Without this, API routes might bypass middleware checks
    '/(api)(.*)',
  ],
};


