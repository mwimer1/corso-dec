---
status: "draft"
last_updated: "2025-12-30"
category: "documentation"
title: "Internal"
description: "Documentation and resources for documentation functionality. Located in api/internal/."
---
## Overview

Internal API routes handle **webhook processing**, **authentication events**, and **privileged operations** that are not exposed to the public API. These endpoints are excluded from OpenAPI documentation and require specific security considerations.

## Directory Structure

```text
app/api/internal/
├── README.md               # This documentation
└── auth/                   # Authentication webhooks
    └── route.ts            # POST /api/internal/auth (Clerk webhooks)
```

## Security & Access Control

### Authentication Requirements
- **All routes require authentication:** Clerk JWT tokens via `requireUserId()`
- **Organization context validation** where applicable
- **Rate limiting** applied per endpoint

### Webhook Security
- **Stripe Webhooks:** Signature verification using `stripe.webhooks.constructEvent()`
- **Clerk Webhooks:** Signature verification via Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) against `CLERK_WEBHOOK_SECRET`
- **Raw body consumption** (`await req.text()`) to preserve signature integrity before parsing JSON

### Rate Limiting

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/auth` | 100/min | 60s | Clerk webhook processing |

> Note: Internal billing routes have been removed in favor of the public `/api/v1` endpoints. All clients must use `/api/v1/*`.

## Runtime Configuration

### Node.js Runtime (Required)

All internal routes must declare Node runtime:
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

**Reasoning:**
- Clerk SDK requires Node.js for server-side operations
- Stripe webhook signature verification needs Node.js crypto
- Supabase admin client requires Node.js environment
- Webhook processing demands server-side security

### Implementation Notes (Clerk)
- Route: `app/api/internal/auth/route.ts`
- Runtime: `nodejs`; `dynamic = 'force-dynamic'`; `revalidate = 0`
- Verify signature using Svix `Webhook.verify(rawBody, headers)`
- Validate payload with Zod (`lib/validators/clerk-webhook.ts`)
- Dispatch to domain handler `lib/auth/clerk-webhook/handle-event.ts`
- CORS: implement `OPTIONS` using `handleCors()`

## Endpoint Specifications

### Authentication Webhook

| Method | Path | Runtime | Purpose | Rate Limit |
|--------|------|---------|---------|------------|
| POST | `/api/internal/auth` | Node.js | Process Clerk authentication events | 100/min |


## Error Handling Patterns

### Webhook Error Handling
```typescript
import { withErrorHandlingEdge } from '@/lib/api';

export const POST = withErrorHandlingEdge(async (req: NextRequest) => {
  // Handler logic with automatic error serialization
  return handler(req);
});
```

### Request Validation
```typescript
const RequestSchema = z.object({
  stripeCustomerId: z.string().min(1),
  // ... additional fields
});

const parsed = RequestSchema.safeParse(await req.json());
if (!parsed.success) {
  return http.badRequest('Invalid input', {
    code: 'VALIDATION_ERROR',
    details: parsed.error.flatten()
  });
}
```

## Key Dependencies

### Core Imports
```typescript
// Authentication & User Context
import { requireUserId } from '@/lib/auth/server'; // Server-only - import directly
import { auth, clerkClient } from '@clerk/nextjs/server';

// Validation Schemas
import {
  CustomerPortalOptionsSchema,
  CheckoutOptionsSchema,
  subscriptionSchema
} from '@/lib/validators/billing';

// API Response Types
import { http } from '@/lib/api';
import type {
  CustomerPortalOptions,
  CheckoutOptions,
  Subscription
} from '@/lib/validators/billing';
```

### Environment Variables
- `CLERK_SECRET_KEY` - Clerk server operations
- `STRIPE_SECRET_KEY` - Stripe API access
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `NEXT_PUBLIC_SUPABASE_URL` - Database operations
- `SUPABASE_SERVICE_ROLE_KEY` - Admin database access
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret (Svix) used to verify incoming webhooks

## Testing & Validation

### Test Coverage Requirements
- **Unit Tests:** Schema validation, error handling, rate limiting
- **Integration Tests:** Webhook signature verification, external API calls
- **Security Tests:** Unauthorized access, malformed payloads, rate limit enforcement

### Production Readiness Checklist
- [ ] Webhook signature verification implemented
- [ ] Rate limiting configured per endpoint
- [ ] Input validation with Zod schemas
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS required for webhook endpoints
- [ ] Structured logging for all operations
- [ ] Idempotent operations where applicable

## Related Documentation

- **API Security Patterns**: `docs/security/api.md`
- **Billing Integration**: `docs/integrations/stripe.md`
- **Authentication Flow**: `docs/auth/clerk-integration.md`
- **Webhook Processing**: `docs/api/webhooks.md`
- **Error Handling**: `docs/api/error-handling.md`

---

**Last updated:** 2025-10-04
