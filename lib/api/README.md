---
title: "Api"
description: "Core lib utilities and functionality for the Corso platform. Located in api/."
category: "library"
last_updated: "2025-12-14"
status: "active"
---
# API Domain

Edge-safe API utilities with clear runtime boundaries for Next.js App Router routes. This domain provides HTTP response helpers, request validation, Edge environment access, and route composition utilities that work in Edge runtime.

## Overview

The `lib/api` domain provides Edge-compatible utilities for building API routes in Next.js. All exports are designed to work in Edge runtime, making them safe for use in routes that declare `export const runtime = 'edge'`.

### Key Responsibilities

- **HTTP Response Helpers**: Standardized response formatting with success/error structures
- **Request Validation**: Zod-based JSON validation for Edge routes
- **Edge Environment Access**: Safe access to Edge-compatible environment variables
- **Route Composition**: Utilities for composing Edge routes with validation and error handling
- **Client Utilities**: Fetch helpers for client-side API calls

## Directory Structure

```
lib/api/
├── index.ts              # Main barrel export (Edge-safe)
├── auth.ts               # Edge-safe auth barrel (intentionally empty)
├── client.ts             # Client-side fetch utilities
├── data.ts               # Entity data fetching (mock mode support)
├── edge.ts               # Edge environment access
├── response/
│   └── http.ts           # HTTP response helpers
└── shared/
    └── edge-route.ts     # Route composition utilities
```

## Public API

### HTTP Response Helpers (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `http.ok()` | Success response (200) | Function | `return http.ok({ data })` |
| `http.badRequest()` | Validation error (400) | Function | `return http.badRequest('Invalid input')` |
| `http.forbidden()` | Authorization error (403) | Function | `return http.forbidden('Access denied')` |
| `http.notFound()` | Resource not found (404) | Function | `return http.notFound('Resource missing')` |
| `http.error()` | Generic error response | Function | `return http.error(500, 'Server error')` |
| `http.noContent()` | No content response (204) | Function | `return http.noContent()` |

### Request Validation (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `readJsonOnce()` | Read request body once | Function | `const body = await readJsonOnce(req)` |
| `validateJson()` | Validate JSON with Zod schema | Function | `const result = await validateJson(req, schema)` |

### Edge Environment Access (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `getEnvEdge()` | Edge-safe environment access | Function | `const env = getEnvEdge()` |

### Route Composition (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `makeEdgeRoute()` | Compose Edge route with validation | Function | `export const POST = makeEdgeRoute({ schema, handler })` |
| `withErrorHandlingEdge()` | Error handling wrapper | Function | `export const POST = withErrorHandlingEdge(handler)` |
| `withRateLimitEdge()` | Rate limiting wrapper | Function | `export const POST = withRateLimitEdge(handler, { maxRequests: 30, windowMs: 60000 })` |

### Client Utilities (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `fetchJSON()` | Fetch with JSON parsing | Function | `const data = await fetchJSON<Type>(url)` |
| `postJSON()` | POST with JSON body | Function | `const result = await postJSON<Response, Request>(url, body)` |

### Entity Data (`@/lib/api`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `getEntityPage()` | Fetch paginated entity data | Function | `const page = await getEntityPage({ entity, page, pageSize, sort })` |

## Runtime Requirements

### Environment Support

- **Runtime**: Edge (primary) | Node.js (compatible)
- **Client Context**: Yes (client utilities only)
- **Server Context**: Yes (all utilities)

### Route Context Usage

```typescript
// Edge route example
export const runtime = 'edge';
import { http, validateJson } from '@/lib/api';
import { z } from 'zod';

const schema = z.object({ name: z.string() });

export async function POST(req: NextRequest) {
  const result = await validateJson(req, schema);
  if (!result.success) {
    return http.badRequest('Invalid input');
  }
  return http.ok({ message: `Hello ${result.data.name}` });
}
```

## Usage Examples

### Basic Edge Route with Validation

```typescript
import { makeEdgeRoute } from '@/lib/api';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const POST = makeEdgeRoute({
  schema,
  handler: async (req, data) => {
    // data is validated and typed
    return http.ok({ success: true, user: data });
  },
  rateLimit: { maxRequests: 30, windowMs: 60000 },
});
```

### Error Handling Wrapper

```typescript
import { withErrorHandlingEdge, http } from '@/lib/api';

export const POST = withErrorHandlingEdge(async (req: NextRequest) => {
  // Automatic error handling and logging
  const data = await req.json();
  return http.ok({ processed: data });
});
```

### Client-Side API Call

```typescript
import { fetchJSON, postJSON } from '@/lib/api';

// GET request
const data = await fetchJSON<{ users: User[] }>('/api/v1/users');

// POST request
const result = await postJSON<{ id: string }, { name: string }>(
  '/api/v1/users',
  { name: 'John' }
);
```

## Environment Variables

### Edge-Compatible Variables

The `getEnvEdge()` function provides access to a minimal set of Edge-safe environment variables:

- `NODE_ENV`: Runtime environment
- `CSP_FORWARD_URI`: CSP report forwarding
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN (public)
- `CSP_REPORT_LOG`: CSP logging configuration
- `CSP_REPORT_MAX_LOGS`: Maximum CSP logs
- `CORSO_USE_MOCK_DB`: Mock database flag
- `CORS_ORIGINS`: CORS allowed origins

**Important**: Server-only environment variables (like database URLs, API keys) are **not** available in Edge runtime. Use `@/lib/server/env` for server routes.

## Validation & Types

### Runtime Validation

- **Location**: Use Zod schemas directly with `validateJson()` or `makeEdgeRoute()`
- **Type Safety**: Inferred from Zod schemas

### Type Definitions

- **Response Types**: Defined in `lib/api/response/http.ts`
- **Edge Environment**: Defined in `lib/api/edge.ts`

## Security Considerations

### Edge Runtime Safety

- **No Node.js Modules**: All exports are Edge-compatible
- **No Server-Only Imports**: Never import from `@/lib/server` in Edge routes
- **Environment Isolation**: Only Edge-safe environment variables accessible

### Input Validation

- **Always Validate**: Use `validateJson()` or `makeEdgeRoute()` for all inputs
- **Zod Schemas**: Required for type-safe validation
- **Error Responses**: Use `http.badRequest()` for validation errors

## Related Documentation

- [API Patterns](../../docs/api-data/api-patterns.md) - API implementation patterns
- [Edge Runtime](../../docs/reference/edge-runtime.md) - Edge vs Node boundaries
- [Security Standards](../../docs/security/security-policy.md) - Security best practices

---

**Last updated:** 2025-12-13  
**Runtime:** Edge-compatible
