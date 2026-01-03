---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: "Api"
description: "Documentation and resources for documentation functionality. Located in api/."
---
# API Route Tests

> **Comprehensive testing of Next.js API routes, ensuring proper request handling, validation, and response formatting.**

## 📋 Quick Reference

**Key Points:**

- **Route Coverage**: Tests real API handlers under `app/api/` and `app/api/v1/`
- **Mock Strategy**: Comprehensive mocking of auth, database, and external services
- **Status Validation**: Tests all HTTP status codes (200, 4xx, 401/403, 429)
- **Request/Response**: Validates proper request parsing and response formatting

## 📑 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Testing Patterns](#testing-patterns)
- [Mock Setup](#mock-setup)
- [Best Practices](#best-practices)

---

## Overview

API route tests validate Next.js API handlers for correct behavior, error handling, and security. Tests are organized by API version and functionality, ensuring comprehensive coverage of all endpoints.

## Directory Structure

| Directory | Purpose | Coverage |
|-----------|---------|----------|
| `status/` | Health check and status endpoints | Runtime validation, response format |
| `v1/` | Version 1 API routes | Business logic, auth, validation |
| `public/` | Publicly accessible endpoints | CSP reports, public data |

### Current API Route Coverage

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/api/health` | `health.test.ts` | ✅ | Runtime boundary, response format |
| `/api/health/clickhouse` | `health-clickhouse.test.ts` | ✅ | ClickHouse health check |
| `/api/health` | `health.test.ts` | ✅ | Public health endpoint |
| `/api/health/clickhouse` | `health-clickhouse.test.ts` | ✅ | Public ClickHouse health |
| `/api/v1/ai/chat` | `chat-streaming.test.ts` | ✅ | AI chat streaming, auth, RBAC |
| `/api/v1/ai/generate-sql` | `../chat/generate-sql.route.*.test.ts` | ✅ | SQL generation (split into 6 test files) |
| `/api/v1/entity/{entity}` | `entity.get.test.ts` | ✅ | Entity base operations, pagination, filtering |
| `/api/v1/entity/{entity}/query` | `v1/entity-query.test.ts` | ✅ | Entity queries, pagination, filtering |
| `/api/v1/entity/{entity}/export` | `export.cors.test.ts` | ✅ | Entity exports, CORS handling |
| `/api/v1/query` | `v1/query.test.ts` | ✅ | Generic SQL query endpoint, auth, RBAC, tenant isolation |
| `/api/v1/user` | `v1/user.test.ts` | ✅ | User profile operations, validation |
| `/api/v1/csp-report` | `csp-report.cors.test.ts` | ✅ | Content Security Policy validation, CORS |
| `/api/v1/insights/search` | `v1/insights-search.test.ts` | ✅ | Search functionality, response format |
| `/api/v1/subscription/status` | `v1/subscription-status.test.ts` | ✅ | Route module loading, response type |
| `/api/internal/auth` | `internal/auth.webhook.test.ts` | ✅ | Clerk webhook handling, signature validation |

## Testing Patterns

### Route Module Testing
```typescript
import { resolveRouteModule } from "../../support/resolve-route";

describe("API v1: route", () => {
  it("loads route module and returns a Response", async () => {
    const url = resolveRouteModule("route-name");
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip
    const mod: any = await import(url);
    const handler = mod.POST ?? mod.GET;
    expect(typeof handler).toBe("function");
    const req = new Request("http://localhost/api/v1/route-name", {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify(payload) : undefined,
    });
    const res = await handler(req as any);
    expect(res).toBeInstanceOf(Response);
  }, 20_000);
});
```

### Runtime Boundary Validation
```typescript
describe('route runtime boundary', () => {
  it('declares correct runtime', () => {
    expect(routeModule.runtime).toBe('nodejs'); // or 'edge'
    expect(routeModule.dynamic).toBe('force-dynamic');
  });
});
```

### Mock Database Testing
```typescript
describe('API v1: dashboard entity (mock DB)', () => {
  beforeAll(() => {
    process.env.CORSO_USE_MOCK_DB = 'true';
  });

  it('returns paged rows from mock data', async () => {
    // Test with mock database implementation
  });
});
```

## Mock Setup

### Authentication Mocking
```typescript
import { vi } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Setup in beforeEach
mockAuth.mockResolvedValue({
  userId: TEST_USER_ID,
  orgId: TEST_ORG_ID,
});
```

### Database Mocking
```typescript
const mockQueryClickHouse = vi.fn();
vi.mock('@/lib/core/server', () => ({
  queryClickHouse: mockQueryClickHouse,
}));

// Setup expected responses
mockQueryClickHouse.mockResolvedValue([
  { id: 1, name: 'Test Data', org_id: TEST_ORG_ID }
]);
```

### External Service Mocking
```typescript
// Mock AI/LLM services for chat endpoints
vi.mock('@/lib/ai/service', () => ({
  generateSQL: vi.fn(),
  generateChart: vi.fn(),
}));
```

## Best Practices

### ✅ **Do**
- Test all HTTP methods (GET, POST, etc.) for each route
- Validate response status codes and content types
- Test error scenarios and edge cases
- Use realistic mock data that matches production schemas
- Verify authentication and authorization requirements
- Test rate limiting and security headers

### ❌ **Don't**
- Skip timeout handling (use `20_000` timeout for complex routes)
- Test implementation details rather than behavior
- Leave commented-out or unused test code
- Mock internal business logic unnecessarily

### Test Data Strategy
- Use realistic, varied test data
- Test boundary conditions (empty results, large datasets)
- Validate data transformation and formatting
- Ensure test data cleanup between tests

---

## 🎯 Key Takeaways

- **Comprehensive Coverage**: Test all routes, methods, and error scenarios
- **Realistic Mocking**: Use production-like data and responses
- **Security Validation**: Ensure proper auth and tenant isolation
- **Performance Awareness**: Include timeout handling for complex operations

## 📚 Related Documentation

- [API Route Guidelines](../../docs/api-routes.md) - Route implementation patterns
- [Authentication](../../docs/auth.md) - Auth implementation details
- [Database Layer](../../docs/database.md) - Database integration patterns

## 🏷️ Tags

`#api-testing` `#nextjs` `#security` `#tenant-isolation`

---

_Last updated: 2025-01-16_
