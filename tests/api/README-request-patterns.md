---
title: API Route Testing - Request Object Patterns
description: Guide for creating proper Request objects in API route tests
last_updated: 2025-01-16
category: testing
status: published
---

# API Route Testing - Request Object Patterns

> **Critical**: Always use real `Request` instances with proper body serialization. Never create mock objects with `json: async () =>` for Request objects.

## TL;DR

- ✅ **DO**: Use `new Request()` with `JSON.stringify()` for request bodies
- ❌ **DON'T**: Create mock objects with `json: async () => ({...})`
- ✅ **DO**: Use `NextRequest` from `next/server` when testing Next.js routes
- ❌ **DON'T**: Mock Request methods that production code uses

## The Problem

Production code uses `validateJson()` which calls `readJsonOnce()` which uses `req.text()`. If tests create mock Request objects with only `json()` method, the tests will fail because `req.text()` doesn't exist.

### ❌ Incorrect Pattern

```typescript
// This will fail because production code calls req.text()
const req = {
  nextUrl: url,
  url: url.toString(),
  json: async () => ({
    page: { index: 0, size: 10 },
  }),
} as any;
```

### ✅ Correct Pattern

```typescript
// Production code can call req.text() successfully
const requestBody = {
  page: { index: 0, size: 10 },
};
const req = new Request('http://localhost/api/v1/entity/projects/query', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(requestBody),
});
(req as any).nextUrl = new URL(req.url);
```

## Request Creation Patterns

### POST Request with JSON Body

```typescript
import { NextRequest } from 'next/server';

const requestBody = {
  filter: { status: 'active' },
  sort: [{ field: 'name', dir: 'asc' }],
  page: { index: 0, size: 10 },
};

const req = new Request('http://localhost/api/v1/entity/projects/query', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(requestBody),
});

// For Next.js routes, add nextUrl
(req as any).nextUrl = new URL(req.url);
```

### GET Request with Query Parameters

```typescript
const url = new URL('http://localhost/api/v1/entity/projects');
url.searchParams.set('page', '0');
url.searchParams.set('pageSize', '10');

const req = {
  nextUrl: url,
  url: url.toString(),
} as NextRequest;
```

### Using NextRequest Directly

```typescript
import { NextRequest } from 'next/server';

const req = new NextRequest('http://localhost/api/v1/entity/projects/query', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ page: { index: 0, size: 10 } }),
});
```

## Common Patterns by Route Type

### Edge Routes (POST with body)

```typescript
const handler = mod.POST;
const requestBody = { /* your data */ };

const req = new Request('http://localhost/api/v1/endpoint', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(requestBody),
});
(req as any).nextUrl = new URL(req.url);

const res = await handler(req, { params: { /* route params */ } });
```

### Node.js Routes (GET with query params)

```typescript
const handler = mod.GET;
const url = new URL('http://localhost/api/v1/endpoint');
url.searchParams.set('param', 'value');

const req = {
  nextUrl: url,
  url: url.toString(),
} as NextRequest;

const res = await handler(req, { params: { /* route params */ } });
```

## Why This Matters

### Production Code Flow

```typescript
// lib/api/index.ts
export async function validateJson<T>(req: Request, schema: ZodSchema<T>) {
  const body = await readJsonOnce(req);  // ← Calls req.text()
  // ...
}

export async function readJsonOnce(req: Request) {
  const raw = await req.text();  // ← Requires real Request object
  // ...
}
```

### Test Failure Scenario

If you create a mock object:
```typescript
const req = { json: async () => ({ data: 'test' }) } as any;
```

When production code runs:
```typescript
await req.text()  // ❌ TypeError: req.text is not a function
```

## Best Practices

### ✅ DO

1. **Always use real Request objects** for POST/PUT/PATCH requests with bodies
2. **Serialize bodies with JSON.stringify()** before passing to Request constructor
3. **Add nextUrl for Next.js routes** when needed: `(req as any).nextUrl = new URL(req.url)`
4. **Use proper headers** including `content-type: application/json` for JSON bodies
5. **Match production patterns** - if production uses `req.text()`, test with real Request

### ❌ DON'T

1. **Don't mock Request methods** that production code uses (`text()`, `json()`, etc.)
2. **Don't create partial mock objects** with only `json()` method
3. **Don't assume Request API** - always check what production code actually calls
4. **Don't skip body serialization** - always use `JSON.stringify()` for JSON bodies

## Examples from Codebase

### ✅ Correct: Entity Query Test

```typescript
// tests/api/v1/entity-query.test.ts
it('should return 200 for valid authenticated request', async () => {
  const requestBody = {
    filter: { status: 'active' },
    sort: [{ field: 'name', dir: 'asc' }],
    page: { index: 0, size: 10 },
  };
  const req = new Request('http://localhost/api/v1/entity/projects/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  (req as any).nextUrl = new URL(req.url);

  const res = await handler(req, { params: { entity: 'projects' } });
  expect(res.status).toBe(200);
});
```

### ✅ Correct: User Route Test

```typescript
// tests/api/v1/user.test.ts
const req = new Request('http://localhost/api/v1/user', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    name: 'Test User',
  }),
});
```

## Testing Utilities

### Using Test Harnesses

```typescript
// tests/support/harness/request.ts
import { buildRequest } from '@tests/support/harness/request';

const req = buildRequest('/api/v1/entity/projects/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { page: { index: 0, size: 10 } },  // Automatically serialized
});
```

## Debugging Tips

### Check What Production Code Uses

```bash
# Search for how production code reads request bodies
rg "req\.text\(\)|req\.json\(\)|readJsonOnce|validateJson" lib/api/
```

### Verify Request Object

```typescript
// In your test, verify the Request has the methods you need
const req = new Request('...', { method: 'POST', body: JSON.stringify({}) });
expect(typeof req.text).toBe('function');  // ✅ Should pass
expect(typeof req.json).toBe('function');  // ✅ Should pass
```

## Related Documentation

- [API Route Guidelines](../../docs/api-routes.md) - Route implementation patterns
- [Test Harnesses](../support/harness/README.md) - Test utility patterns
- [API Testing README](./README.md) - General API testing patterns

## Summary

**Key Takeaway**: Production code uses `req.text()` via `readJsonOnce()`. Always create real `Request` instances with `JSON.stringify()` for request bodies. Mock objects will fail because they don't have the `text()` method.

---

_Last updated: 2025-01-16_
