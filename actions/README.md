---
title: "Actions"
description: "Server-side actions for form submissions and simple mutations."
last_updated: "2025-01-03"
category: "actions"
status: "active"
---

## Overview

**1 active Next.js server action** for marketing form submissions. This directory contains server actions intended for direct component calls (form submissions and simple mutations).

**Note:** Chat processing, SQL generation, and entity queries have been migrated to API routes under `/app/api/v1/` for streaming support and OpenAPI documentation. See [Actions vs API Routes](../docs/architecture/actions-vs-api-routes.md) for guidance on when to use each pattern.

## Current Actions

| Action | Purpose | Import Path |
|--------|---------|-------------|
| `marketing/contact-form` | Contact form submission with bot protection | `@/actions` |

## When to Use Server Actions vs API Routes

### ✅ Use Server Actions When:
- **Form submissions** (like contact forms)
- **Simple mutations** from client components
- **Direct function calls** (no HTTP overhead needed)
- **Operations that don't need streaming**

### ✅ Use API Routes When:
- **HTTP endpoints** for external clients
- **Streaming responses** (NDJSON format)
- **OpenAPI documentation** required
- **Complex operations** with multiple steps
- **External integrations** (webhooks, third-party APIs)

**Example:** The contact form uses a server action because it's a simple form submission. Chat processing uses API routes (`/api/v1/ai/chat`) because it requires streaming NDJSON responses.

For detailed guidance, see [Actions vs API Routes](../docs/architecture/actions-vs-api-routes.md).

## Key Features

### 🔐 **Security First**
- **Bot Protection**: Turnstile verification for public forms
- **Rate Limiting**: IP-scoped rate limits for public actions
- **Input Validation**: Zod schemas at action boundaries
- **Error Handling**: Structured error responses

### 🎯 **Type Safe**
- **Zod Validation**: Runtime type checking
- **TypeScript**: Full type safety throughout
- **Schema Validation**: Input/output validation
- **Error Types**: Structured error handling

## Usage Pattern

### Contact Form Submission

```typescript
import { submitContactForm } from '@/actions';

// In a server component or form handler
const handleSubmit = async (data: ContactFormData) => {
  'use server';
  await submitContactForm({
    name: data.name,
    email: data.email,
    message: data.message,
    turnstileToken: data.turnstileToken, // Required for bot protection
  });
};
```

## How to Add a New Action

### 1. Create Action File

Create a new file in the appropriate domain directory:

```typescript
// actions/[domain]/[action-name].ts
'use server';

import { z } from 'zod';
import { validateInput, ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/actions';
import { withRateLimit } from '@/lib/middleware/http/rate-limit';
import { buildCompositeKey, ACTION_RATE_LIMITS } from '@/lib/ratelimiting';

// Define Zod schema
const ActionSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
});

type ActionInput = z.infer<typeof ActionSchema>;

// Export action function
export async function myNewAction(input: ActionInput) {
  // 1. Rate limiting (if needed)
  const ip = headers().get('cf-connecting-ip') ?? 'unknown';
  await withRateLimit(
    buildCompositeKey('domain:action', ip),
    ACTION_RATE_LIMITS.USER_ACTION
  );

  // 2. Validate input
  const validated = validateInput(ActionSchema, input, 'action context');

  // 3. Business logic
  try {
    // Your action logic here
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    throw new ApplicationError({
      message: 'Action failed',
      code: 'ACTION_ERROR',
      category: ErrorCategory.API,
      severity: ErrorSeverity.ERROR,
      originalError: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
```

### 2. Export from Index

Add the export to `actions/index.ts`:

```typescript
export * from './[domain]/[action-name]';
```

### 3. Validation Requirements

- ✅ **Zod schema** for all inputs
- ✅ **Rate limiting** for public actions (IP-scoped) or authenticated actions (user-scoped)
- ✅ **Error handling** using `ApplicationError` from `@/lib/actions`
- ✅ **Type safety** with TypeScript types inferred from Zod schemas

### 4. Error Handling

All actions should throw structured errors:

```typescript
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/actions';

throw new ApplicationError({
  message: 'Descriptive error message',
  code: 'ERROR_CODE',
  category: ErrorCategory.API,
  severity: ErrorSeverity.ERROR,
});
```

## Security Considerations

### Rate Limiting

```typescript
// Public action (IP-scoped)
const ip = headers().get('cf-connecting-ip') ?? 'unknown';
await withRateLimit(
  buildCompositeKey('marketing:contact', ip),
  ACTION_RATE_LIMITS.USER_ACTION
);

// Authenticated action (user-scoped)
const { userId } = await auth();
await withRateLimit(
  buildCompositeKey('user:action', userId),
  ACTION_RATE_LIMITS.USER_ACTION
);
```

### Input Validation

```typescript
// Always validate with Zod
const validated = validateInput(ActionSchema, input, 'action context');
```

## Migration History

### Removed Actions (Migrated to API Routes)

- **Chat processing**: Now at `/api/v1/ai/chat` (streaming NDJSON)
- **SQL generation**: Now at `/api/v1/ai/generate-sql`
- **Entity queries**: Now at `/api/v1/entity/[entity]/query`
- **Billing actions**: Removed (handled by Clerk Billing)

These were migrated to API routes to support:
- Streaming responses (NDJSON)
- OpenAPI documentation
- External client access
- Complex multi-step operations

## Related Documentation

- [Actions vs API Routes](../docs/architecture/actions-vs-api-routes.md) - Decision guide
- [API Routes](../app/api/README.md) - API route documentation
- [OpenAPI Specification](../api/README.md) - API specification
- `@/lib/actions` – Action utilities and helpers
- `@/lib/validators` – Input validation schemas

---

_Last updated: 2025-01-03_
