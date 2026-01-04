# Security Standards - Extended Documentation

This document contains extended examples, migration guides, and detailed patterns for security standards. For the concise rule, see [`.cursor/rules/security-standards.mdc`](../../.cursor/rules/security-standards.mdc).

## Extended Code Examples

### Clerk Authentication - Complete Example

```typescript
import { auth } from "@clerk/nextjs/server";
import { http } from "@/lib/api";

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, "Unauthorized", { code: "HTTP_401" });
  }
  return http.ok({ success: true });
}
```

### Clerk Onboarding & Session Claims

Prefer embedding `user.public_metadata` in Clerk session tokens via the Clerk Dashboard (Customize session token claims):

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

Server-side guards should read onboarding status from `auth().sessionClaims?.metadata?.onboardingComplete` when present. If the claim is missing, fall back to the existing persistence (e.g., `getOnboardingPrefs()`) until migration completes.

Ensure `middleware.ts` uses `clerkMiddleware()` so requests are decorated with Clerk session context and can be gated centrally.

Actions that mark onboarding complete should update Clerk `publicMetadata` (e.g., `clerkClient.users.updateUser(userId, { publicMetadata: { onboardingComplete: true } })`) so the flag becomes authoritative.

### Role-Based Access Control - Complete Example

```typescript
import { auth } from "@clerk/nextjs/server";
import { assertRole } from "@/lib/auth/roles";
import { http } from "@/lib/api";

const { userId } = await auth();
if (!userId) {
  return http.error(401, "Unauthorized", { code: "HTTP_401" });
}

// Get user role from session/clerk
const userRole = "admin"; // Replace with actual role retrieval
try {
  assertRole(userRole, "admin");
} catch {
  return http.error(403, "Insufficient permissions", { code: "FORBIDDEN" });
}
```

## Webhook Security - Detailed Patterns

### Stripe Webhook Verification

```typescript
import { stripe } from "@/lib/integrations/stripe";
import { getEnv } from "@/lib/shared/env";
import { http } from "@/lib/api";

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return http.badRequest("Missing signature", { code: "MISSING_SIGNATURE" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      getEnv().STRIPE_WEBHOOK_SECRET
    );
    // Process verified webhook
    return http.ok({ received: true });
  } catch {
    return http.badRequest("Invalid signature", { code: "INVALID_SIGNATURE" });
  }
}
```

### Clerk Webhook Verification

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { http } from "@/lib/api";

export async function POST(req: NextRequest): Promise<Response> {
  // CRITICAL: Read raw body as string (not JSON) to preserve signature integrity
  // Any re-serialization (JSON.parse/stringify) will invalidate the signature
  const rawBody = await req.text();
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return http.badRequest("Missing headers", { code: "MISSING_HEADERS" });
  }

  const wh = new Webhook(getEnv().CLERK_WEBHOOK_SECRET);
  try {
    // Verify signature using raw body string - must be exact as received
    wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
    // Process verified webhook
    return http.ok({ received: true });
  } catch {
    return http.badRequest("Invalid signature", { code: "INVALID_SIGNATURE" });
  }
}
```

## Error Handling - Detailed Patterns

### Error Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ }
}

// Error Response (standardized via helpers)
{
  "success": false,
  "error": "Invalid input provided",
  "code": "VALIDATION_ERROR",
  "details": { /* structured error details */ }
}
```

## Monitoring & Logging - Complete Examples

### Structured Logging

```typescript
import { logger } from "@/lib/monitoring";

logger.info("API request processed", {
  userId,
  operation: "data_query",
  duration: Date.now() - startTime,
  success: true,
});

logger.warn("Rate limit exceeded", {
  key,
  ip,
  userId,
  path: req.nextUrl.pathname,
});
```

### Security Event Logging

```typescript
logger.error("Security violation detected", {
  userId,
  ip,
  userAgent: req.headers.get("user-agent"),
  violation: "unauthorized_access",
  path: req.nextUrl.pathname,
});
```

## Clerk UI Contract (Dashboard)

- Render `UserButton` only inside `SignedIn` in the dashboard sidebar.
- **Critical**: `UserButton` must **never** appear on public marketing pages (landing/insights modes). Authenticated users accessing public pages are automatically redirected to `/dashboard/chat` by middleware.
- Force page routing for account settings: `userProfileMode="navigation"` and `userProfileUrl="/account"`.
- Configure menu items in order using `UserButton.MenuItems`:
  1) `manageAccount` (navigates to `/account`)
  2) Link: label "Manage Subscription" → `/subscription`
  3) `signOut` (redirects to `/` via `afterSignOutUrl`)
- Appearance: apply subtle popover elevation via `appearance={{ elements: { userButtonPopoverCard: "shadow-lg" } }}`.

## Authentication Redirect Behavior

### Post-Authentication Redirects
- **Sign-in/Sign-up**: Default redirect to `/dashboard/chat` (per `next.config.mjs`, `/dashboard` redirects to `/dashboard/chat`)
- **Environment variables**: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` control redirects, with fallback to `/dashboard/chat`
- **MVP**: Onboarding disabled, all authenticated users redirect to dashboard

### Authenticated User Redirects (Middleware)
- **Public marketing pages**: Authenticated users accessing public routes (`/`, `/pricing`, `/insights(.*)`, `/(marketing)(.*)`) are automatically redirected to `/dashboard/chat` by middleware (`middleware.ts`)
- **Purpose**: Prevents authenticated users from seeing marketing content and ensures auth UI (UserButton) never appears on public pages
- **Exception**: Auth routes (`/sign-in`, `/sign-up`) are excluded from redirect to allow authenticated users to access these pages if needed
- **Implementation**: Middleware checks authentication state before allowing access to public marketing routes
