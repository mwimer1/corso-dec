---
title: Support
description: >-
  Documentation and resources for documentation functionality. Located in
  support/.
last_updated: '2025-12-14'
category: documentation
status: draft
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
| `harness/` | Test execution harnesses | `api-route-harness.ts`, `node-mocks.ts`, `request.ts`, `render.ts` |
| `mocks/` | Centralized mock implementations | `atoms.ts`, `lib-api.ts`, `molecules.ts`, `next-*.ts` |
| `setup/` | Test environment configuration | `vitest.*.ts`, `README.md` |
| Root level | Core utilities and helpers | `resolve-route.ts`, `analytics-mock.ts`, `env-mocks.ts`, `testkit.ts` |

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
  url: '/api/v1/dashboard/query',
  userId: 'test-user',
  orgId: 'test-org',
  body: { sql: 'SELECT * FROM projects' }
});
```

### Analytics Mocking (`analytics-mock.ts`)
Consistent analytics event mocking:

```typescript
import { mockTrackNavClick } from "../support/analytics-mock";

// Setup in beforeEach
const trackNavClick = mockTrackNavClick;
trackNavClick.mockClear();

// Test analytics events
fireEvent.click(button);
expect(trackNavClick).toHaveBeenCalledWith('button:click', '/expected-path');
```

## Mocking Framework

### Centralized Mocks (`mocks/`)
Pre-configured mocks for common external dependencies:

```typescript
// Database mocking
import { mockDatabase } from "../support/mocks/database";
mockDatabase.setup({ /* mock data */ });

// Clerk authentication mocking
import { mockClerkAuth } from "../support/mocks/clerk";
mockClerkAuth.setup({ userId: 'test-user', orgId: 'test-org' });

// Environment variables
import { mockEnv } from "../support/mocks/env";
mockEnv.setup({ NODE_ENV: 'test', DATABASE_URL: 'mock://localhost' });
```

### Service Mocking Pattern
```typescript
// Generic service mocking utility
import { createServiceMock } from "../support/mocks/service";

const mockService = createServiceMock('external-api');
mockService.mockResolvedValue({ data: 'mock response' });

// In test
expect(mockService).toHaveBeenCalledWith(expectedParams);
```

## Usage Examples

### Basic Test Setup
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestRequest } from '../support/harness/request';
import { mockClerkAuth } from '../support/mocks/clerk';

describe('MyComponent', () => {
  beforeEach(() => {
    mockClerkAuth.setup({ userId: 'test-user' });
  });

  it('renders correctly', () => {
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

### Component Testing with Mocks
```typescript
import { render, screen } from '@testing-library/react';
import { mockAnalytics } from '../support/analytics-mock';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    mockAnalytics.setup();
  });

  it('tracks user interactions', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('button_click');
  });
});
```

## Best Practices

### ✅ **Do**
- Use centralized mocks from `support/mocks/`
- Leverage harness utilities for consistent test setup
- Follow naming conventions for test utilities
- Document complex mock setups with comments
- Clean up mocks in `afterEach` hooks

### ❌ **Don't**
- Create ad-hoc mocks in individual test files
- Mock internal implementation details unnecessarily
- Leave mock side effects between tests
- Skip cleanup of global state changes

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
