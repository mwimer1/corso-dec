---
title: "Internal"
description: "Documentation and resources for documentation functionality. Located in api/internal/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
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
- **Webhook signature verification:** All routes use webhook signature verification (Svix/Clerk)
- **No user authentication:** Webhooks are authenticated via cryptographic signatures, not user tokens
- **Rate limiting** applied per endpoint

### Webhook Security
- **Clerk Webhooks:** Signature verification via Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) or `clerk-signature` header against `CLERK_WEBHOOK_SECRET`
- **Raw body consumption** (`await req.text()`) to preserve signature integrity before parsing JSON
- **Signature validation:** Uses `svix.Webhook.verify()` to validate incoming webhook payloads

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
- Svix webhook signature verification needs Node.js crypto
- Webhook processing demands server-side security

### Implementation Notes (Clerk)
- Route: `app/api/internal/auth/route.ts`
- Runtime: `nodejs`; `dynamic = 'force-dynamic'`; `revalidate = 0`
- **Raw body verification**: Read body via `req.text()` (not `req.json()`) to preserve signature integrity
- Verify signature using Svix `Webhook.verify(rawBody, headers)` with the exact raw body string
- **Critical**: Signature verification must use the raw body string as received - any re-serialization (JSON.parse/stringify) will invalidate the signature
- Validate payload with Zod (`lib/validators/clerk-webhook.ts`) after signature verification
- Error handling: `withErrorHandlingNode` wrapper for consistent error responses (does NOT read body)
- Rate limiting: `withRateLimitNode` wrapper (100 requests per minute) (does NOT read body)
- CORS: implement `OPTIONS` using `handleCors()`

## Endpoint Specifications

### Authentication Webhook

| Method | Path | Runtime | Purpose | Rate Limit |
|--------|------|---------|---------|------------|
| POST | `/api/internal/auth` | Node.js | Process Clerk authentication events | 100/min |


## Error Handling Patterns

### Webhook Error Handling
```typescript
import { withErrorHandlingNode, withRateLimitNode } from '@/lib/middleware';

const handler = async (req: NextRequest): Promise<Response> => {
  // Read raw body for signature verification
  const payload = await req.text();
  // ... webhook verification logic
  return http.noContent();
};

export const POST = withErrorHandlingNode(
  withRateLimitNode(handler, { windowMs: 60_000, maxRequests: 100 })
);
```

### Request Validation
```typescript
// Webhook payload validation (after signature verification)
const ClerkEventEnvelope = z.object({
  type: z.string(),
  object: z.string(),
  id: z.string().optional(),
});

const evt = wh.verify(payload, headers);
ClerkEventEnvelope.parse({ type: evt.type, object: evt.object, id: evt.id });
```

## Key Dependencies

### Core Imports
```typescript
// Webhook Signature Verification
import { Webhook } from 'svix';
import type { WebhookRequiredHeaders } from 'svix';

// Validation Schemas
import { ClerkEventEnvelope } from '@/lib/validators/clerk-webhook';

// API Response Types
import { http } from '@/lib/api';

// Middleware
import { withErrorHandlingNode, withRateLimitNode } from '@/lib/middleware';
```

### Environment Variables
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
- **Authentication Flow**: `docs/auth/clerk-integration.md`
- **Webhook Processing**: `docs/api/webhooks.md`
- **Error Handling**: `docs/api/error-handling.md`

---

**Last updated:** 2025-01-XX
