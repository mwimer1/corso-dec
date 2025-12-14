---
title: "Architecture"
description: ">-"
last_updated: "2025-12-14"
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

## Billing
- **Current**: Clerk Billing with `<PricingTable />` and `useSubscription()` hook.
- Subscription management via `/dashboard/subscription` page.
- User profile includes Billing tab at `/dashboard/account` for invoice history and payment methods.
- Migrated from custom Stripe integration to Clerk Billing end-to-end.
