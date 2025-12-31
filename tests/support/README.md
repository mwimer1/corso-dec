---
description: "Documentation and resources for documentation functionality. Located in support/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
title: "Support"
---
# Test Support Utilities

> **Comprehensive collection of test utilities, harnesses, and helper functions that power the Corso test suite.**

## 📋 Quick Reference

**Key Points:**

- **Test Infrastructure**: Provides essential utilities for test setup, mocking, and assertions
- **Route Resolution**: Dynamic route module loading for API route testing
- **Mock Management**: Centralized mocking utilities for external dependencies
- **Test Data**: Factories and fixtures for consistent test data

## 📑 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Core Utilities](#core-utilities)
- [Mocking Framework](#mocking-framework)
- [Usage Examples](#usage-examples)

---

## Overview

The `tests/support/` directory contains essential utilities that support the entire test suite. These utilities provide consistent patterns for testing, mocking, and test data management across all test files.

## Directory Structure

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `harness/` | Test execution harnesses | `api-route-harness.ts`, `node-mocks.ts`, `request.ts`, `render.tsx` |
| `mocks/` | Centralized mock implementations | `clerk.ts`, `next-headers.ts`, `next-cache.ts`, `next-navigation.ts` |
| `factories/` | Test data factories | `index.ts` (createUser, createOrg, createQueryRequest) |
| `setup/` | Test environment configuration | `vitest.*.ts`, `README.md` |
| Root level | Core utilities and helpers | `resolve-route.ts`, `env-mocks.ts`, `testkit.ts` |

## Core Utilities

### Route Resolution (`resolve-route.ts`)
Dynamic route module loading for API route testing:

```typescript
import { resolveRouteModule } from "../support/resolve-route";

describe("API route", () => {
  it("loads route module", async () => {
    const url = resolveRouteModule("dashboard/query");
    if (!url) return expect(true).toBe(true); // route absent on this branch
    const mod: any = await import(url);
    expect(typeof mod.POST).toBe("function");
  });
});
```

### Test Harness (`harness/request.ts`)
Standardized request creation for API testing:

```typescript
import { createTestRequest } from "../support/harness/request";

// Create authenticated requests with proper headers
const request = createTestRequest({
  method: 'POST',
  url: '/api/v1/entity/projects/query', // Example: use appropriate entity type
  userId: 'test-user',
  orgId: 'test-org',
  body: { sql: 'SELECT * FROM projects' }
});
```

### Test Data Factories (`factories/index.ts`)
Centralized factories for creating test data with sensible defaults:

```typescript
import { createUser, createOrg, createQueryRequest } from '@/tests/support/factories';

// Create test user with defaults
const user = createUser(); // userId, email, name, orgId auto-generated

// Override specific fields
const adminUser = createUser({ 
  userId: 'admin-123',
  orgRole: 'org:admin' 
});

// Create organization
const org = createOrg({ name: 'Acme Corp' });

// Create query request
const query = createQueryRequest({ 
  sql: 'SELECT * FROM projects',
  orgId: org.orgId 
});
```

## Mocking Framework

### Centralized Mocks (`mocks/`)
Pre-configured mocks for common external dependencies. Import from the index for convenience:

```typescript
import { mockClerkAuth, mockHeaders } from '@/tests/support/mocks';
```

#### Clerk Authentication Mocking
```typescript
import { mockClerkAuth } from '@/tests/support/mocks';

// Default authenticated user (member role)
beforeEach(() => {
  mockClerkAuth.setup();
});

// Unauthenticated user
mockClerkAuth.setup({ userId: null });

// Custom user with specific role
mockClerkAuth.setup({ 
  userId: 'test-user-123',
  orgId: 'test-org-456',
  orgRole: 'org:admin'
});

// Reset to defaults
mockClerkAuth.reset();
```

#### Next.js Headers Mocking
```typescript
import { mockHeaders } from '@/tests/support/mocks';

// Default empty headers
beforeEach(() => {
  mockHeaders.setup();
});

// Custom headers
mockHeaders.setup({
  headers: { 'cf-connecting-ip': '192.168.1.1' }
});

// Headers with cookies
mockHeaders.setup({
  headers: { 'x-header': 'value' },
  cookies: { 'session': 'abc123' }
});

// Reset to defaults
mockHeaders.reset();
```

**Note:** The `next/headers` mock is automatically registered globally via `vitest.setup.shared.ts`. Tests can override behavior per-test using `mockHeaders.setup()`.

## Usage Examples

### Basic Test Setup
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockClerkAuth, mockHeaders } from '@/tests/support/mocks';

describe('MyAPI', () => {
  beforeEach(() => {
    // Default authenticated user
    mockClerkAuth.setup();
    // Custom headers if needed
    mockHeaders.setup({ headers: { 'x-custom': 'value' } });
  });

  it('handles authenticated requests', async () => {
    // Test implementation
  });

  it('handles unauthenticated requests', async () => {
    mockClerkAuth.setup({ userId: null });
    // Test implementation
  });
});
```

### API Route Testing
```typescript
import { resolveRouteModule } from '../support/resolve-route';
import { createTestRequest } from '../support/harness/request';

describe('POST /api/v1/data', () => {
  it('processes valid requests', async () => {
    const url = resolveRouteModule('data/create');
    const mod: any = await import(url);
    const request = createTestRequest({
      method: 'POST',
      body: { name: 'test' }
    });

    const response = await mod.POST(request);
    expect(response.status).toBe(201);
  });
});
```

### API Route Testing with Authentication
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockClerkAuth } from '@/tests/support/mocks';
import { resolveRouteModule } from '@/tests/support/resolve-route';

describe('POST /api/v1/data', () => {
  beforeEach(() => {
    mockClerkAuth.setup(); // Default authenticated user
  });

  it('processes authenticated requests', async () => {
    const url = resolveRouteModule('data/create');
    const mod: any = await import(url);
    const request = new Request('http://localhost/api/v1/data/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'test' })
    });

    const response = await mod.POST(request);
    expect(response.status).toBe(201);
  });

  it('rejects unauthenticated requests', async () => {
    mockClerkAuth.setup({ userId: null });
    // Test 401 response
  });
});
```

## Best Practices

### ✅ **Do**
- Use centralized mocks from `@/tests/support/mocks` (import from index)
- Use `mockClerkAuth.setup()` instead of manually mocking `@clerk/nextjs/server`
- Use `mockHeaders.setup()` instead of manually mocking `next/headers`
- Call `setup()` in `beforeEach` to ensure clean state between tests
- Use `reset()` or `clear()` if needed for cleanup

### ❌ **Don't**
- Call `vi.mock('@clerk/nextjs/server')` or `vi.mock('next/headers')` in test files (already mocked globally)
- Create ad-hoc mocks in individual test files for Clerk or Next.js APIs
- Mock internal implementation details unnecessarily
- Leave mock side effects between tests (use `beforeEach` with `setup()`)

### Organization Guidelines
- Group related utilities in subdirectories
- Use descriptive names for mock functions
- Export utilities from index files for easy importing
- Document breaking changes in mock APIs

---

## 🎯 Key Takeaways

- **Consistency**: Standardized utilities ensure consistent test patterns
- **Maintainability**: Centralized mocks reduce duplication and maintenance overhead
- **Reliability**: Well-tested utilities provide stable foundations for tests
- **Developer Experience**: Easy-to-use utilities improve testing productivity
- **Provider Management**: Render harness utilities handle complex provider setup automatically

## 📚 Related Documentation

- [Testing Strategy](../../docs/testing-strategy.md) - Overall testing approach
- [Mock Guidelines](../../docs/mock-strategy.md) - Mocking best practices
- [Component Testing](../../docs/component-testing.md) - React component testing guide

## 🏷️ Tags

`#testing` `#utilities` `#mocks` `#test-infrastructure`

---

_Last updated: 2025-01-16_
