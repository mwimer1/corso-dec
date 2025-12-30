---
title: Testing Quality
description: >-
  Documentation and resources for documentation functionality. Located in
  testing-quality/.
last_updated: '2025-12-30'
category: documentation
status: draft
---
# Testing Guide

> **Complete guide to testing practices, patterns, and workflows in the Corso codebase.**

## 📋 Quick Reference

**Key Commands:**
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci

# Run security tests
pnpm test:security

# Run specific test file
pnpm vitest run tests/api/v1/user.test.ts

# Watch mode
pnpm vitest --watch
```

## 🎯 Testing Philosophy

### Test Pyramid
- **Unit Tests (Base)**: Fast, isolated tests for pure functions and utilities
- **Integration Tests (Middle)**: Tests for API routes, database interactions, and cross-module functionality
- **Component Tests (Middle)**: React component behavior and accessibility
- **E2E Tests (Top)**: Full user workflows (when needed)

### Domain-First Organization
Tests are organized by feature domain (auth, dashboard, chat, insights, security, core) rather than test type, making it easy to find and maintain tests for specific features.

## 📁 Test Organization

### Directory Structure
```
tests/
├── api/              # API route tests
├── auth/             # Authentication & authorization tests
├── chat/             # Chat & AI generation tests
├── dashboard/        # Dashboard & data table tests
├── insights/         # Insights & marketing content tests
├── security/         # Security & validation tests
├── core/             # Core platform & tooling tests
├── support/          # Test utilities and harnesses
└── setup/            # Test environment setup
```

### File Naming Conventions
- **`.dom.test.tsx`** - React component tests (jsdom environment)
- **`.test.ts`** - Node.js tests (API routes, utilities, business logic)
- **`.route.test.ts`** - API route integration tests
- **`.unit.test.ts`** - Pure unit tests for utilities

## 🧪 Writing Tests

### API Route Testing

#### Basic Structure
```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveRouteModule } from '../support/resolve-route';

// Mock authentication
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe('API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(true),
    });
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const url = resolveRouteModule('v1/route');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/route', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('HTTP_401');
  });
});
```

#### Testing Authentication & RBAC
```typescript
it('should return 403 when user lacks required role', async () => {
  mockAuth.mockResolvedValue({
    userId: 'test-user-123',
    has: vi.fn().mockReturnValue(false), // No required role
  });

  const res = await handler(req);
  expect(res.status).toBe(403);
  const data = await res.json();
  expect(data.error.code).toBe('FORBIDDEN');
});
```

#### Testing Input Validation
```typescript
it('should return 400 for invalid input', async () => {
  const req = new Request('http://localhost/api/v1/route', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ invalid: 'data' }),
  });

  const res = await handler(req);
  expect(res.status).toBe(400);
  const data = await res.json();
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('VALIDATION_ERROR');
});
```

#### Testing Rate Limiting
```typescript
it('should enforce rate limits', async () => {
  // Make requests up to the limit
  for (let i = 0; i < 30; i++) {
    const res = await handler(req);
    expect(res.status).toBe(200);
  }

  // Exceed limit - expect 429
  const res = await handler(req);
  expect(res.status).toBe(429);
  const data = await res.json();
  expect(data.error.code).toBe('RATE_LIMITED');
});
```

### Component Testing

#### Basic Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '@/components/component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### Accessibility Testing
```typescript
import { axe } from 'vitest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Security Testing

#### SQL Injection Prevention
```typescript
it('should reject dangerous SQL operations', async () => {
  const dangerousQueries = [
    'DROP TABLE users',
    'TRUNCATE TABLE users',
    'DELETE FROM users',
  ];

  for (const query of dangerousQueries) {
    const res = await handler(createRequest({ sql: query }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_SQL');
  }
});
```

#### Secret Masking
```typescript
it('should mask sensitive data in logs', () => {
  const testData = {
    apiKey: 'sk-1234567890abcdef',
    userId: 'user123',
    safeField: 'this is safe',
  };

  const masked = maskSensitiveData(testData);
  expect(masked.apiKey).toBe('***MASKED***');
  expect(masked.userId).toBe('***MASKED***');
  expect(masked.safeField).toBe('this is safe');
});
```

## 📊 Coverage Requirements

### Coverage Thresholds
All new code must meet these coverage thresholds:
- **Lines**: ≥ 80%
- **Functions**: ≥ 75%
- **Branches**: ≥ 70%
- **Statements**: ≥ 80%

### Running Coverage
```bash
# Generate coverage report
pnpm test:coverage

# Coverage report location
# ./coverage/index.html (HTML report)
# ./coverage/lcov.info (LCOV format for CI)
```

### Coverage Exclusions
The following are excluded from coverage:
- Test files themselves
- Configuration files
- Type definitions
- Documentation
- Build artifacts

## 🔧 Test Utilities

### Mocking Authentication
```typescript
import { mockClerkAuth } from '@/tests/support/testkit';

// Setup authenticated user
mockClerkAuth('user-id', 'member');

// Setup unauthenticated
mockClerkAuth(null);
```

### ESM Mocking & Dependency Injection

#### The Problem with `vi.spyOn()` in ESM

Under ESM (ECMAScript Modules), `vi.spyOn()` has limitations when spying on functions from the same module:

- **Module namespace immutability**: ESM exports are immutable, so spies may not reliably intercept calls
- **Direct function binding**: When a function calls another function from the same module via direct binding (not through the module namespace), spies won't intercept
- **Module caching**: Modules are cached, so environment variable changes may not take effect if the module was already loaded

#### Solution: Dependency Injection

For functions that need to be testable, prefer dependency injection over spying:

```typescript
// ✅ CORRECT: Accept optional dependencies
export async function getInsightsByCategory(
  params: GetByCategoryParams,
  deps: { getAllInsights?: typeof getAllInsights; getCategories?: typeof getCategories } = {}
) {
  const getAllInsightsFn = deps.getAllInsights ?? getAllInsights;
  const getCategoriesFn = deps.getCategories ?? getCategories;
  
  // Use injected deps or fall back to default implementation
  const categories = await getCategoriesFn();
  const allInsights = await getAllInsightsFn();
  // ... rest of implementation
}
```

**In tests:**
```typescript
// ✅ CORRECT: Inject mock functions directly
const mockGetAllInsights = vi.fn().mockResolvedValue([...]);
const mockGetCategories = vi.fn().mockResolvedValue([...]);

const result = await getInsightsByCategory(
  { slug: 'data' },
  { getAllInsights: mockGetAllInsights, getCategories: mockGetCategories }
);

expect(mockGetAllInsights).toHaveBeenCalled();
```

#### Testing Source Selection & Module Singletons

When testing code that uses module-level singletons (e.g., cached source selection), you may need to reset the singleton:

```typescript
import { __resetContentSourceForTests } from '@/lib/marketing/insights/source';

beforeEach(() => {
  // Disable mock CMS to use legacy adapter
  process.env.CORSO_USE_MOCK_CMS = 'false';
  // Reset cached source so environment change takes effect
  __resetContentSourceForTests();
});

afterEach(() => {
  delete process.env.CORSO_USE_MOCK_CMS;
  __resetContentSourceForTests();
});
```

**Alternative: Module Reset (slower but more thorough)**
```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.resetModules(); // Clears module cache (slower but more thorough)
  process.env.CORSO_USE_MOCK_CMS = 'false';
});
```

#### When to Use Each Approach

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **Dependency Injection** | Testing functions that call other functions | Deterministic, fast, no module cache issues | Requires code changes |
| **`vi.spyOn()`** | Testing cross-module calls or external dependencies | No code changes needed | May not work with same-module calls in ESM |
| **`__resetContentSourceForTests()`** | Testing source selection or singleton behavior | Fast, targeted reset | Requires test-only helper function |
| **`vi.resetModules()`** | Testing module-level state changes | Thorough, clears all module cache | Slower, may break other tests |

### Creating Test Requests
```typescript
import { createTestRequest } from '@/tests/support/harness/request';

const req = createTestRequest({
  method: 'POST',
  url: '/api/v1/route',
  userId: 'test-user',
  body: { data: 'test' },
});
```

### Resolving Route Modules
```typescript
import { resolveRouteModule } from '@/tests/support/resolve-route';

const url = resolveRouteModule('v1/route');
if (!url) return; // Route doesn't exist on this branch

const mod = await import(url);
const handler = mod.POST;
```

## ✅ Best Practices

### Do
- ✅ Test all HTTP methods for each route
- ✅ Validate response status codes and content types
- ✅ Test error scenarios and edge cases
- ✅ Use realistic mock data matching production schemas
- ✅ Verify authentication and authorization requirements
- ✅ Test rate limiting and security headers
- ✅ Write tests that are independent and can run in any order
- ✅ Use descriptive test names that explain what is being tested
- ✅ Clean up mocks between tests (use `beforeEach`)

### Don't
- ❌ Skip timeout handling (use `20_000` timeout for complex routes)
- ❌ Test implementation details rather than behavior
- ❌ Leave commented-out or unused test code
- ❌ Mock internal business logic unnecessarily
- ❌ Use `console.log` in tests (use proper assertions)
- ❌ Write tests that depend on external services
- ❌ Share mutable state between tests

## 🚀 CI/CD Integration

### Quality Gates
All tests must pass before code can be merged:
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Coverage thresholds met
- ✅ No security test failures
- ✅ No flaky tests

### Test Reports
- **JUnit XML**: `reports/vitest-junit.xml` (for CI)
- **Coverage HTML**: `coverage/index.html` (local viewing)
- **Coverage LCOV**: `coverage/lcov.info` (for CI coverage tools)

## 🐛 Debugging Tests

### Running Specific Tests
```bash
# Run single test file
pnpm vitest run tests/api/v1/user.test.ts

# Run tests matching pattern
pnpm vitest run --grep "authentication"

# Run in watch mode
pnpm vitest --watch tests/api/
```

### Common Issues

#### Test Timeouts
If tests are timing out, increase the timeout:
```typescript
it('slow test', async () => {
  // test code
}, 30_000); // 30 second timeout
```

#### Mock Not Working
Ensure mocks are set up before imports:
```typescript
// ✅ CORRECT: Mock before import
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// ❌ INCORRECT: Import before mock
import { auth } from '@clerk/nextjs/server';
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));
```

#### Flaky Tests
- Ensure tests are independent
- Use `beforeEach` to reset state
- Avoid relying on timing or external services
- Use proper async/await patterns

## 📚 Related Documentation

- [Testing Strategy](./testing-strategy.md) - High-level testing approach
- [API Route Tests](../../tests/api/README.md) - API testing patterns
- [Security Tests](../../tests/security/README.md) - Security testing guidelines
- [Test Support](../../tests/support/README.md) - Test utilities and helpers

## 🏷️ Tags

`#testing` `#test-coverage` `#unit-tests` `#integration-tests` `#api-tests` `#component-tests` `#security-tests` `#vitest` `#ci-cd`

---

Last updated: 2025-01-15
