---
title: "Architecture"
description: "Documentation and resources for documentation functionality. Located in architecture/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Auth & Account Surfaces (Clerk v6)

## Prebuilt Clerk Components in Use
- SignIn / SignUp (hosted UIs)
- UserProfile at `/dashboard/account` with `routing="path"`
- UserButton in dashboard sidebar with custom menu:
  - Manage account → `/dashboard/account` (page navigation)
  - Manage Subscription → `/dashboard/subscription`
  - Sign out → redirects to `/`

## Protected Routes
- All protected app routes use Node.js runtime: `export const runtime = 'nodejs'`.
- Server-side gate via `auth()` in layouts/pages; client components never call server `auth()`.

## Sidebar UserButton Contract
- Wrap in `SignedIn` only.
- Configure:
  - `userProfileMode="navigation"`
  - `userProfileUrl="/dashboard/account"`
  - `afterSignOutUrl="/"`
  - `appearance={{ elements: { userButtonPopoverCard: 'shadow-lg' } }}` for popover elevation.
- Use `UserButton.MenuItems` to order items deterministically.
- **Critical**: UserButton must **only** render in the dashboard sidebar (`components/dashboard/sidebar/sidebar-user-profile.tsx`). It must **never** appear on public marketing pages (landing/insights modes).

## Authentication Redirect Behavior

### Post-Authentication Redirects
- **Sign-in**: Redirects to `/dashboard/chat` (default dashboard landing page, per `next.config.mjs`)
- **Sign-up**: Redirects to `/dashboard/chat` (MVP: onboarding disabled)
- **Fallback**: If environment variables are not set, defaults to `/dashboard/chat`

### Authenticated User Redirects (Middleware)
- **Public marketing pages**: Authenticated users accessing public marketing routes (`/`, `/pricing`, `/insights(.*)`, `/(marketing)(.*)`) are automatically redirected to `/dashboard/chat` by middleware
- **Purpose**: Prevents authenticated users from seeing marketing content and ensures auth UI (UserButton) never appears on public pages
- **Implementation**: See `middleware.ts` - redirects authenticated users from marketing routes before allowing access
- **Exception**: Auth routes (`/sign-in`, `/sign-up`) are excluded from redirect to allow authenticated users to access these pages if needed

## Billing
- **Current**: Clerk Billing with `<PricingTable />` and `useSubscription()` hook.
- Subscription management via `/dashboard/subscription` page.
- User profile includes Billing tab at `/dashboard/account` for invoice history and payment methods.
- Migrated from custom Stripe integration to Clerk Billing end-to-end.
