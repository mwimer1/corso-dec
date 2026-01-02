---
status: "active"
last_updated: "2026-01-02"
category: "documentation"
title: "Architecture"
description: "Documentation and resources for documentation functionality. Located in architecture/."
---
## Overview

This codebase uses two patterns for server-side operations:

- **Server Actions** (`'use server'`) - Feature-colocated, direct function calls from components
- **API Routes** (`route.ts`) in `/app/api` - HTTP endpoints with OpenAPI documentation

This guide explains when to use each pattern with concrete examples from our codebase.

**Important:** Server Actions are **feature-colocated** and should live with the feature (e.g., `app/(marketing)/contact/actions.ts`). Do not create or use a top-level `actions/` directory. The `lib/actions/` directory contains shared helper utilities only.

## Principles

### Server Actions (Feature-Colocated)
**Purpose:** Direct function calls from React components, optimized for form submissions and simple mutations.

**Location:** Server Actions are **colocated with the feature**:
- `app/(marketing)/contact/actions.ts` - Marketing contact form action
- `app/(protected)/dashboard/[feature]/actions.ts` - Dashboard feature actions
- Near the component that uses them (same route segment)

**Characteristics:**
- Zero HTTP overhead (direct function calls)
- Type-safe with TypeScript
- Automatic request/response handling by Next.js
- Best for: Form submissions, simple mutations, component-to-server communication
- **Feature-local**: Actions live with the feature, not in a top-level directory

**Important:** Do not create or use a top-level `actions/` directory. The `lib/actions/` directory contains shared helper utilities only (validation, error handling, etc.).

### API Routes (`/app/api`)
**Purpose:** Standard HTTP endpoints for external clients, streaming, and complex operations.

**Characteristics:**
- Standard HTTP protocol (GET, POST, etc.)
- OpenAPI documentation support
- Streaming response support (NDJSON)
- Best for: External integrations, streaming, webhooks, complex multi-step operations

## Decision Matrix

| Use Case | Pattern | Example in Codebase |
|----------|---------|-------------------|
| Form submission | **Server Action** | `app/(marketing)/contact/actions.ts` (after PR5.2) |
| Simple mutation from component | **Server Action** | Feature-colocated actions |
| Streaming responses (NDJSON) | **API Route** | `/api/v1/ai/chat` |
| SQL generation | **API Route** | `/api/v1/ai/generate-sql` |
| Entity queries | **API Route** | `/api/v1/entity/[entity]/query` |
| External client access | **API Route** | All `/api/v1/*` endpoints |
| Webhook handlers | **API Route** | `/api/internal/auth` (Clerk webhooks) |
| Health checks | **API Route** | `/api/health` |

## Examples from Codebase

### ✅ Server Action: Contact Form

**Location:** `app/(marketing)/contact/actions.ts` (after PR5.2 migration)

**Why Server Action:**
- Simple form submission
- Direct component call (no HTTP needed)
- No streaming required
- Internal use only
- **Feature-colocated**: Lives with the contact form feature

**Usage:**
```typescript
// app/(marketing)/contact/page.tsx
import { submitContactForm } from './actions';

const handleFormSubmit = async (data: ContactFormData) => {
  'use server';
  await submitContactForm(data);
};
```

**Note:** Server Actions are colocated with the feature. The marketing contact form action is located at `app/(marketing)/contact/actions.ts`.

**Key Features:**
- Bot protection (Turnstile)
- IP-scoped rate limiting
- Zod validation
- Structured error handling

### ✅ API Route: Chat Processing

**Location:** `app/api/v1/ai/chat/route.ts`

**Why API Route:**
- Streaming NDJSON responses required
- Complex multi-step operation
- OpenAPI documentation needed
- External client access possible

**Usage:**
```typescript
// Client calls via fetch
const response = await fetch('/api/v1/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ content, preferredTable }),
});

// Stream NDJSON chunks
const reader = response.body.getReader();
// ... process stream
```

**Key Features:**
- Streaming NDJSON format
- Authentication via Clerk
- Rate limiting (30/min)
- OpenAPI documented

### ✅ API Route: SQL Generation

**Location:** `app/api/v1/ai/generate-sql/route.ts`

**Why API Route:**
- External client access
- OpenAPI documentation
- Future: May need streaming
- Standard HTTP semantics

**Usage:**
```typescript
const response = await fetch('/api/v1/ai/generate-sql', {
  method: 'POST',
  body: JSON.stringify({ question: 'Show active projects' }),
});
```

### ✅ API Route: Entity Queries

**Location:** `app/api/v1/entity/[entity]/query/route.ts`

**Why API Route:**
- RESTful resource operations
- Pagination, filtering, sorting
- OpenAPI documentation
- External client access

**Usage:**
```typescript
const response = await fetch('/api/v1/entity/projects/query', {
  method: 'POST',
  body: JSON.stringify({
    page: { index: 0, size: 50 },
    sort: [{ field: 'name', dir: 'asc' }],
  }),
});
```

## Migration Guidance

### Moving from Server Action → API Route

**When to migrate:**
- Need streaming responses
- External clients need access
- OpenAPI documentation required
- Complex multi-step operations

**Steps:**
1. Create `app/api/v1/[path]/route.ts`
2. Add OpenAPI spec entry in `api/openapi.yml`
3. Update client code to use `fetch()` instead of direct function call
4. Remove action from feature location (e.g., `app/(marketing)/contact/actions.ts`)

**Example Migration:**
```typescript
// Before: Server Action
'use server';
export async function generateSQL(question: string) {
  // ... logic
}

// After: API Route
// app/api/v1/ai/generate-sql/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  // ... logic
  return http.ok({ sql: result });
}
```

### Moving from API Route → Server Action

**When to migrate:**
- Simple form submission
- No external client access needed
- No streaming required
- Direct component call sufficient

**Steps:**
1. Create action colocated with feature (e.g., `app/(marketing)/contact/actions.ts`)
2. Update component to import and call action directly
3. Remove API route
4. Update OpenAPI spec (remove endpoint)

**Note:** This migration is rare. Most operations stay as API routes once created.

## Production Rules

### Validation (Both Patterns)

**Required:**
- ✅ Zod schema for all inputs
- ✅ `.strict()` on schemas to reject extra fields
- ✅ Runtime validation at entry point

**Example:**
```typescript
const Schema = z.object({
  field: z.string().min(1),
}).strict();

const validated = validateInput(Schema, input, 'context');
```

### Authentication (Both Patterns)

**Server Actions:**
- Public actions: Bot protection (Turnstile) + IP rate limiting
- Authenticated actions: Use `auth()` from `@clerk/nextjs/server`

**API Routes:**
- Protected routes: `auth()` check, return `401` if missing
- Public routes: Mark with `x-public: true` in OpenAPI spec
- RBAC: Use `x-corso-rbac` extension in OpenAPI spec

### Rate Limiting (Both Patterns)

**Server Actions:**
```typescript
import { withRateLimit } from '@/lib/middleware/shared/rate-limit';
import { buildCompositeKey, ACTION_RATE_LIMITS } from '@/lib/ratelimiting';

await withRateLimit(
  buildCompositeKey('domain:action', identifier),
  ACTION_RATE_LIMITS.USER_ACTION
);
```

**API Routes:**
```typescript
import { withRateLimitEdge } from '@/lib/api';

export const POST = withRateLimitEdge(
  handler,
  { windowMs: 60_000, maxRequests: 30 }
);
```

### Error Format (Both Patterns)

**Server Actions:**
```typescript
throw new ApplicationError({
  message: 'Error message',
  code: 'ERROR_CODE',
  category: ErrorCategory.API,
  severity: ErrorSeverity.ERROR,
});
```

**API Routes:**
```typescript
import { http } from '@/lib/api';

return http.error(400, 'Error message', {
  code: 'ERROR_CODE',
  details: { /* structured details */ },
});
```

### Streaming Responses (API Routes Only)

**Content-Type:** `application/x-ndjson`

**Format:** Each line is a JSON object, newline-separated

**Example:**
```typescript
// Stream NDJSON chunks
const encoder = new TextEncoder();
const chunk = { data: 'value' };
controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
```

**See:** `app/api/v1/ai/chat/route.ts` for full implementation

## OpenAPI Documentation

**API Routes Only:**
- All `/api/v1/*` routes must be documented in `api/openapi.yml`
- Include request/response schemas
- Specify `x-corso-rbac` for protected routes
- Mark public routes with `x-public: true`
- Run `pnpm openapi:gen` after changes

**Server Actions:**
- Not documented in OpenAPI (internal use only)
- Documented inline with the feature or in feature-specific READMEs

## Testing Requirements

**Server Actions:**
- Unit test: Validation behavior (Zod)
- Unit test: Error handling
- Integration test: End-to-end form submission

**API Routes:**
- Unit test: Request validation
- Unit test: Authentication/authorization
- Integration test: HTTP request/response
- Integration test: Streaming (if applicable)

## Related Documentation

- [API Routes README](../../app/api/README.md) - API routes guide
- [OpenAPI Specification](../../api/README.md) - API specification
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns

**Note:** Server Actions are feature-colocated and do not have a separate top-level directory. See feature-specific documentation for action details.

---

_Last updated: 2025-01-03_
