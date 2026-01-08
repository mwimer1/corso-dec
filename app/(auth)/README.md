---
status: "active"
last_updated: "2026-01-07"
category: "documentation"
title: "(auth)"
description: "Documentation and resources for documentation functionality. Located in (auth)/."
---
[Back to App README](../README.md)

## Overview

The `(auth)` route group contains all authentication flows: separate sign-in and sign-up routes using Clerk's App Router components. After successful authentication, users are redirected to `/dashboard/chat` (the default dashboard landing page). Authenticated users attempting to access public marketing pages are automatically redirected to the dashboard by middleware.

## 📂 Directory Structure

```text
app/(auth)/
├── _theme.tsx                   # Auth theme provider - sets data-route-theme="auth"
├── layout.tsx                   # Layout wrapper with AuthNavbar and theme provider
├── loading.tsx                  # Group-level loading UI with RouteLoading component
├── error.tsx                    # Auth-specific error boundary
├── sign-in/                     # Sign-in flow (Clerk App Router)
│   └── [[...sign-in]]/page.tsx  # Server wrapper that renders Clerk SignIn client component
└── sign-up/                     # Sign-up flow (Clerk App Router)
    └── [[...sign-up]]/page.tsx  # Server wrapper that renders Clerk SignUp client component
```

## Key Behaviors

- **Auth theming**: `_theme.tsx` sets `data-route-theme="auth"` on `<html>` element
- **Public access**: No authentication required for these routes
- **Environment redirects**: Uses environment variables for post-authentication redirects
- **Consistent styling**: Both pages use the same `AuthShell` layout component
-- **Rendering model**: Server component wrapper that renders Clerk's client components. Do not add a module-level `'use client'` when exporting route config values (`runtime`, `dynamic`, `revalidate`).

## Clerk Integration

### Separate Auth Routes

The auth system uses separate routes for sign-in and sign-up, following Clerk's App Router best practices:

**Sign-In Route (`sign-in/[[...sign-in]]/page.tsx`)**
```tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignInPage() {
  const env = publicEnv ?? {};
  const signInPath = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in';
  const signUpUrl = env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up';
  const afterSignInUrl = env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? undefined;
  // Default redirect to dashboard chat (per next.config.mjs: /dashboard redirects to /dashboard/chat)
  const signInRedirectFallback = env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/dashboard/chat';

  return (
    <AuthShell titleSr="Sign in to your account">
      <SignIn
        routing="path"
        path={signInPath}
        signUpUrl={signUpUrl}
        redirectUrl={afterSignInUrl ?? signInRedirectFallback}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-surface text-foreground border border-border shadow-[var(--shadow-card)] rounded-xl',
            // ... styling
          },
        }}
      />
    </AuthShell>
  );
}
```

**Sign-Up Route (`sign-up/[[...sign-up]]/page.tsx`)**
```tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignUpPage() {
  const env = publicEnv ?? {};
  const signUpPath = env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up';
  const signInUrl = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in';
  const afterSignUpUrl = env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? undefined;
  // Default redirect to dashboard chat (MVP: onboarding disabled, per next.config.mjs: /dashboard redirects to /dashboard/chat)
  const signUpRedirectFallback = env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/dashboard/chat';

  return (
    <AuthShell titleSr="Create your account">
      <SignUp
        routing="path"
        path={signUpPath}
        signInUrl={signInUrl}
        redirectUrl={afterSignUpUrl ?? signUpRedirectFallback}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-surface text-foreground border border-border shadow-[var(--shadow-card)] rounded-xl',
            // ... styling
          },
        }}
      />
    </AuthShell>
  );
}
```

**Key Implementation Details:**
- Uses separate routes with catch-all patterns for proper Clerk routing
- Environment variables control redirect URLs with fallback to `/dashboard/chat` (default dashboard landing)
- Consistent appearance theming across both forms
- Client-side rendering required for Clerk components
- **Security**: Authenticated users are automatically redirected from public marketing pages to dashboard by middleware (see `middleware.ts`)

## Auth Components

Available from `@/components/auth` barrel:
- `AuthShell` - Card-based layout wrapper with centered background and responsive design
- `AuthNavbar` - Fixed header with logo for auth routes
- `ClerkLoading` - Loading spinner for auth flows with proper accessibility
- `FormError` - Error display component using AlertBox for consistent styling

## Route Configuration

Route configuration is handled via inline exports in layout and page files:

```ts
// app/(auth)/layout.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Configuration details:**
- **Runtime**: Node.js (required for Clerk compatibility)
- **Dynamic**: Force dynamic rendering (no static generation)
- **Revalidate**: No revalidation (always dynamic)
- **SEO**: Auth pages are not indexed (handled via metadata)

## Environment Variables

The auth pages use the following environment variables:

```bash
# Sign-in configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# Default redirects to dashboard chat (per next.config.mjs: /dashboard redirects to /dashboard/chat)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard/chat
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard/chat

# Sign-up configuration (MVP: onboarding disabled)
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/chat
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard/chat
```

## Error Handling

### Group Error Boundary (`error.tsx`)

```tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div role="alert" className="p-6">
      <h2 className="text-lg font-semibold">Authentication error</h2>
      <p className="text-sm opacity-80">{error.message}</p>
      <button onClick={reset} className="mt-4 inline-flex">Retry</button>
    </div>
  );
}
```

### Loading Component (`loading.tsx`)

```tsx
import { RouteLoading } from "@/components/ui";

export default function AuthLoading() {
  return <RouteLoading message="Loading authentication..." />;
}
```

The loading component uses the `RouteLoading` component which displays a spinner with an accessible message during route transitions.

## Development & Testing

### Local Development URLs
- **Sign-In**: `http://localhost:3000/sign-in` (Clerk sign-in form)
- **Sign-Up**: `http://localhost:3000/sign-up` (Clerk sign-up form)

### Testing Authentication Flow
```bash
# Start development server
pnpm dev

# Test new user flow: sign-up → dashboard
# 1. Visit http://localhost:3000/sign-up
# 2. Enter new email → Clerk shows sign-up form
# 3. Complete registration → redirects to /dashboard/chat

# Test returning user flow: sign-in → dashboard
# 1. Visit http://localhost:3000/sign-in
# 2. Enter existing email → Clerk shows sign-in form
# 3. Complete sign-in → redirects to /dashboard/chat

# Test authenticated user redirect from marketing pages
# 1. Sign in to the application
# 2. Visit http://localhost:3000/ (marketing home page)
# 3. Should be automatically redirected to /dashboard/chat by middleware
# 4. UserButton should never appear on public marketing pages

# Test cross-navigation between sign-in and sign-up
# 1. Visit http://localhost:3000/sign-in
# 2. Click "Sign up" link → redirects to /sign-up
# 3. Click "Sign in" link → redirects to /sign-in
```

## Related Documentation

- **Auth Components**: `components/auth/` - Reusable auth UI components
- **Clerk Integration**: `lib/integrations/clerk/` - Clerk configuration and utilities
- **Protected Routes**: `app/(protected)/README.md` - Authenticated application routes

## Security Considerations

- **Client-side validation**: Uses Clerk's built-in form validation
- **Secure redirects**: Uses Next.js client-side navigation for auth flows
- **Environment isolation**: Sensitive URLs configured via environment variables
- **Clerk security**: Leverages Clerk's enterprise-grade authentication platform
- **Cache prevention**: Route group prevents auth pages from being cached
- **Authenticated user redirect**: Middleware automatically redirects authenticated users from public marketing pages to `/dashboard/chat` (prevents auth UI from appearing on public pages)
- **Public page isolation**: UserButton component never renders on public marketing pages (landing/insights modes)

---

**Last updated:** 2025-10-07
