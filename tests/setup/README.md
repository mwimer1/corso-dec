---
title: "Setup"
description: "Documentation and resources for documentation functionality. Located in setup/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Test Setup Configuration

> **Vitest setup and configuration files that establish the testing environment and global test behaviors.**

## 📋 Quick Reference

**Key Points:**

- **Test Environment**: Configures Vitest testing framework and global setup
- **Mock Infrastructure**: Establishes mocks for external dependencies and Next.js APIs
- **Global Configuration**: Sets up test-wide configurations and utilities

## 📑 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Key Features](#key-features)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The `tests/setup/` directory contains the core configuration files that set up the testing environment for the entire test suite. These files establish mocks, configure Vitest, and provide the foundation for all tests to run consistently.

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `vitest.setup.ts` | Main test setup | Global mocks, Next.js API mocks, test utilities |

## Key Features

### Test Environment Configuration
- **Vitest Setup**: Configures the test runner and global test behavior
- **Next.js API Mocks**: Provides mocks for Next.js server components and APIs
- **External Dependency Mocks**: Mocks for Sentry, Clerk, and other external services
- **Global Test Utilities**: Common test utilities and helper functions

### Mock Infrastructure
- **Server-Only Mock**: Safely mocks `server-only` for test environments
- **Navigation Mocks**: Mocks Next.js navigation hooks and functions
- **Header/Cookie Mocks**: Mocks Next.js request/response handling
- **Error Handling**: Configures error handling for test scenarios

## Usage Examples

### Basic Test Setup
```typescript
import { ensureAgGridRegistered } from '@/lib/vendors/ag-grid.client';
import { vi } from 'vitest';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared/errors';

// Register AG Grid modules for tests (required for AG Grid v34+)
ensureAgGridRegistered();

// Stub server-only side-effect module
vi.mock('server-only', () => ({}), { virtual: true });

// next/navigation minimal stub
vi.mock('next/navigation', () => {
  const push = vi.fn();
  const replace = vi.fn();
  const prefetch = vi.fn();
  const refresh = vi.fn();
  return {
    useRouter: () => ({ push, replace, prefetch, refresh }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});
```

### Error Handling Configuration
```typescript
// Mock shared/errors to mirror production ApplicationError shape (accepts payload object)
vi.mock('@/lib/shared/errors', () => ({
  ApplicationError: class ApplicationError extends Error {
    code: string | undefined;
    category: any;
    severity: any;
    constructor(payload: any) {
      const message = (payload && typeof payload.message === 'string' && payload.message) ?? (typeof payload === 'string' ? payload : String(payload ?? ''));
      super(message);
      this.name = 'ApplicationError';
      this.code = payload?.code;
      this.category = payload?.category;
      this.severity = payload?.severity;
    }
  },
  ErrorCategory: {
    AUTHORIZATION: 'AUTHORIZATION',
    DATABASE: 'DATABASE',
    API: 'API',
    SECURITY: 'SECURITY'
  },
  ErrorSeverity: {
    CRITICAL: 'CRITICAL',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
  }
}));
```

### API Route Testing Setup
```typescript
// Mock lib/api barrel used by API routes in tests
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<any>();

  const http = {
    ok: (data: any) => ({
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true, data }),
    }),
    badRequest: (message: string, meta?: any) => ({
      status: 400,
      headers: new Headers(),
      json: async () => ({ success: false, error: message, code: meta?.code ?? undefined }),
    }),
    error: (status: number, message: string, meta?: any) => ({
      status,
      headers: new Headers(),
      json: async () => ({ success: false, error: message, meta }),
    }),
    noContent: () => ({
      status: 204,
      headers: new Headers(),
    }),
  };

  function withErrorHandlingEdge(fn: any) {
    return async (req: any) => {
      try {
        return await fn(req);
      } catch (err: any) {
        // diagnostic logging for test runs
        console.log('[withErrorHandlingEdge] caught error:', err, 'code:', err?.code, 'severity:', err?.severity);
        // Use ApplicationError-like shape if available
        const code = err?.code;
        const msg = err instanceof Error ? err.message : String(err ?? '');
        if (code === 'INTERNAL_DATABASE_ERROR' || err?.severity === 'CRITICAL') {
          return http.error(500, msg, { code });
        }
        return http.badRequest(msg, { code });
      }
    };
  }

  // Spread actual exports and override the specific functions needed for tests
  return {
    ...actual,
    http,
    withErrorHandlingEdge,
    withRateLimitEdge
  };
});
```

## Best Practices

### ✅ **Do**
- Set up comprehensive mocks for all external dependencies
- Configure error handling to match production behavior
- Use consistent mock patterns across all test files
- Document complex mock setups with clear comments
- Test that mocks behave correctly in different scenarios

### ❌ **Don't**
- Skip setting up critical external dependency mocks
- Leave console errors unhandled in test setup
- Create inconsistent mock behavior across tests
- Mock internal implementation details unnecessarily

### Testing Patterns

#### Mock Validation
```typescript
// Test that mocks are working correctly
it('validates mock behavior', () => {
  const mockFn = vi.fn();
  mockFn.mockResolvedValue('test');

  expect(mockFn).toHaveBeenCalledTimes(0);
  expect(mockFn()).resolves.toBe('test');
});
```

#### Setup Verification
```typescript
// Verify setup is working in actual tests
it('setup provides expected test utilities', () => {
  // Test can access mocked Next.js APIs
  const { useRouter } = require('next/navigation');
  const router = useRouter();

  expect(typeof router.push).toBe('function');
  expect(typeof router.replace).toBe('function');
});
```

---

## 🎯 Key Takeaways

- **Comprehensive Setup**: Test environment must mirror production as closely as possible
- **Consistent Mocks**: All tests should use the same mock patterns for reliability
- **Error Handling**: Proper error handling setup ensures tests catch real issues
- **Documentation**: Complex setups should be well-documented for maintenance

## 📚 Related Documentation

- [Vitest Configuration](../../../vitest.config.ts) - Vitest runner configuration
- [Test Strategy](../../../docs/testing-strategy.md) - Overall testing approach
- [Mock Guidelines](../../../docs/mock-strategy.md) - Mocking best practices

## 🏷️ Tags

`#test-setup` `#vitest` `#mocks` `#test-infrastructure`

---

_Last updated: 2025-01-16_
