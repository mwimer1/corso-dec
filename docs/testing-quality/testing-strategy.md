---
title: "Testing Quality"
description: "Documentation and resources for documentation functionality. Located in testing-quality/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Testing Strategy & Best Practices

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [🧪 Testing Strategy & Best Practices](#-testing-strategy--best-practices)
- [📋 Quick Reference](#-quick-reference)
- [🔧 Test Setup & Configuration](#-test-setup--configuration)
  - [Vitest Environment Configuration](#vitest-environment-configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🧪 Testing Strategy & Best Practices

> **Note:** This is the primary guide for all testing within the Corso platform.
> It provides a high-level overview and links to detailed documentation for each test type.
> For the main test suite, see [tests/README.md](../../tests/README.md).

## 📋 Quick Reference

Our testing strategy ensures code is reliable, secure, and performant. We follow a domain-first approach,
organized by feature areas (auth, dashboard, chat, insights, security, core) rather than test types.
All tests are run in our CI/CD pipeline to maintain quality.

### Testing Commands
```bash
# Run full test suite
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm vitest run tests/auth/rbac-guards.unit.test.ts

# Run tests in watch mode
pnpm vitest --watch

# Run security-focused tests
pnpm test:security
```

**Key Principles:**

- **Test Pyramid:** Strong base of fast, reliable unit tests, followed by integration tests, and a smaller number of end-to-end tests.
- **Domain-First Organization:** Tests are organized by feature domain (auth, dashboard, chat, insights, security, core)
  mirroring the application's domain structure for easy navigation and maintenance.
- **Automation & Gating:** All tests are automated and serve as quality gates in the CI/CD pipeline. No code is merged without passing all tests.
- **Security First:** Dedicated security testing harness to proactively identify and prevent vulnerabilities.

### RBAC & Security Testing

**Testing Protected API Endpoints:**
```bash
# API routes with authentication/rate limiting require proper headers
# Test files should include authentication context
import { createTestAuth } from '@/tests/support/auth';

describe('Protected API Routes', () => {
  it('should require authentication', async () => {
    // Test without auth - expect 401
    const response = await fetch('/api/protected/route');
    expect(response.status).toBe(401);
  });

  it('should validate RBAC permissions', async () => {
    // Test with insufficient permissions - expect 403
    const { headers } = createTestAuth('user', 'viewer'); // Insufficient role
    const response = await fetch('/api/admin/route', { headers });
    expect(response.status).toBe(403);
  });
});
```

**Testing Validation Errors:**
```bash
# Zod validation errors should be properly tested
import { ApplicationError } from '@/lib/shared/errors';

it('should validate input schemas', async () => {
  // Test invalid input - expect validation error
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ invalid: 'data' })
  });

  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('VALIDATION_ERROR');
});
```

**Testing Rate Limiting:**
```bash
# Rate limiting should be tested for proper behavior
it('should enforce rate limits', async () => {
  // Make requests up to the limit
  for (let i = 0; i < 30; i++) {
    const response = await fetch('/api/rate-limited');
    expect(response.status).toBe(200);
  }

  // Exceed limit - expect 429
  const response = await fetch('/api/rate-limited');
  expect(response.status).toBe(429);
});
```

## 🔧 Test Setup & Configuration

### Vitest Environment Configuration

**vitest-env.d.ts**:
```typescript
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
/// <reference types="@testing-library/jest-dom" />

import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  export interface Assertion extends AxeMatchers, TestingLibraryMatchers<string, Element> {}
  export interface AsymmetricMatchersContaining extends AxeMatchers, TestingLibraryMatchers<string, Element> {}
}
```bash

**Setup Files**:
```typescript
// tests/support/setup/vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
```bash

### Critical Testing Patterns

#### 1. Accessibility Testing (Required)

```typescript
import { axe } from 'vitest-axe';

describe('ComponentName', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ComponentName />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```bash

#### 2. Component Testing with TypeScript

```typescript
import { TablePro } from '@/components/dashboard';
import { render, screen } from '@testing-library/react';
import type { ValidationResult } from '@/types/validators';

describe('TablePro', () => {
  it('renders table with proper types', () => {
    render(<TablePro columns={[]} data={[]} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
```bash

#### 3. Async Hook Testing
### Duplication Monitoring and Shared Factories

- Generated component tests must use factories from `tests/support/test-factories/component-test-factory.ts`.
- Prefer hook/provider factories where applicable:
  - `tests/support/test-factories/hook-test-factory.ts`
  - `tests/support/test-factories/provider-test-factory.tsx`
- Run duplication scans locally and in CI:
  - `pnpm jscpd:tests`
- The generator `scripts/tests/generate-component-tests.ts` now emits factory-based tests by default.

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTableData } from '@/hooks';

describe('useTableData', () => {
  it('handles prefetching correctly', async () => {
    const { result } = renderHook(() => useTableData('test-table', vi.fn()));
    await waitFor(() => {
      expect(result.current.prefetchPage).toBeDefined();
    });
  });
});
```bash

## 📊 Test Coverage & Metrics

### Current Test Statistics
- **Tests organized by domain:** auth, dashboard, chat, insights, security, core
- **Environment-aware naming:** `.dom.test.tsx` for React components, `.test.ts` for Node.js tests
- **Coverage Target:** 85% lines, 80% branches, 85% functions

### Coverage Requirements

All new code must meet these coverage thresholds:
```javascript
// vitest.unit.ts coverage configuration
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 85,
    branches: 80,
    functions: 85,
    statements: 85
  },
}
```bash

## 🔒 Security Testing Patterns

### Input Validation Testing

```typescript
describe('Security Validation', () => {
  it('prevents XSS in user input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    render(<ContactForm defaultValue={maliciousInput} />);
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });

  it('validates schema with malformed data', () => {
    const invalidData = { detectedTableIntent: undefined };
    expect(() => generateSQLParams.parse(invalidData)).toThrow();
  });
});

### Type Safety Testing

```typescript
describe('Type Safety Validation', () => {
  it('handles strict typing correctly', () => {
    // Test that components properly handle typed data
    const typedData: AnalyticsDataPoint[] = [
      { date: '2024-01-01', value: 100, category: 'sales' }
    ];
    render(<AnalyticsChart data={typedData} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('validates API response types', () => {
    // Test that API responses match expected types
    const mockResponse: CompletionResponse = {
      id: 'cmpl-test',
      object: 'text_completion',
      created: 1234567890,
      model: 'gpt-4o-mini',
      choices: [{ index: 0, text: 'Test response', finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };
    expect(mockResponse.choices[0].text).toBe('Test response');
  });
});
```

## 🎯 Type Safety & Strict Typing Practices

### Strict Typing Standards

Corso enforces strict TypeScript typing with zero tolerance for `any` usage:

**Key Principles:**
- **No explicit `any`**: Use `unknown` instead of `any` for untyped values, then validate with Zod schemas or type guards
- **Proper type definitions**: Define interfaces for API responses, component props, and data structures
- **Type-first development**: Write types before implementation to catch issues early
- **Generic constraints**: Use generics with proper constraints rather than loose typing

### Preferred Patterns

#### ✅ CORRECT: Unknown + Type Guards

```typescript
// Use unknown for untyped external data
export function processExternalData(data: unknown): ProcessedData {
  // Validate and transform using Zod or type guards
  const validated = externalDataSchema.parse(data);
  return transformToProcessedData(validated);
}
```

#### ✅ CORRECT: Proper Interface Definitions

```typescript
// Define specific interfaces for component props
interface AnalyticsChartProps {
  data: AnalyticsDataPoint[];
  onHover?: (point: AnalyticsDataPoint) => void;
  height?: number;
  // ... other props
}

export function AnalyticsChart({ data, onHover }: AnalyticsChartProps) {
  // TypeScript ensures data is properly typed
  data.forEach(point => {
    console.log(point.value); // ✅ Type safe
    console.log(point.unknownField); // ❌ TypeScript error
  });
}
```

#### ❌ INCORRECT: Using any

```typescript
// Avoid this pattern
function processData(data: any): any {
  return data; // ❌ No type safety
}
```

### ESLint Rules for Type Safety

The project enforces strict typing with these ESLint rules:
- `@typescript-eslint/no-explicit-any`: Ban explicit `any` usage
- `@typescript-eslint/no-unsafe-function-type`: Ban unsafe function types
- `@typescript-eslint/no-empty-object-type`: Ban empty object types

### Testing Type Safety

```typescript
describe('Type Safety', () => {
  it('enforces strict typing in components', () => {
    // This should fail type checking if types are incorrect
    const typedProps: AnalyticsChartProps = {
      data: [{ date: '2024-01-01', value: 100 }], // ✅ Correct type
      // height: '400' // ❌ Would cause TypeScript error
    };
    render(<AnalyticsChart {...typedProps} />);
  });

  it('validates API response types', () => {
    const mockAPIResponse = {
      id: 'cmpl-test',
      object: 'text_completion',
      // Missing required fields should cause type errors
    } as CompletionResponse; // ❌ TypeScript error for missing fields

    const completeResponse: CompletionResponse = {
      id: 'cmpl-test',
      object: 'text_completion',
      created: 1234567890,
      model: 'gpt-4o-mini',
      choices: [],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    }; // ✅ Complete type
  });
});
```
```bash

### Authentication Testing

```typescript
describe('Auth Integration', () => {
  it('handles async auth properly', async () => {
    const mockAuth = vi.fn().mockResolvedValue({ userId: 'test-123' });
    vi.mocked(auth).mockImplementation(mockAuth);
    render(<AuthenticatedComponent />);
    await waitFor(() => {
      expect(mockAuth).toHaveBeenCalled();
    });
  });
});
```bash

### Protected Route Testing

```typescript
describe('OrganizationProfilePage', () => {
  it('redirects unauthenticated users to sign-in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null });
    // ...test logic
  });
});
```bash

## 🚀 Performance Testing

Performance testing is currently handled through bundle size monitoring and build performance metrics.
Dedicated performance regression tests are identified as a gap for future implementation.
Performance-related tests are integrated within the existing integration test suite.

## 🏗️ Test Organization Principles

### **Domain-First Organization**
Tests are organized by feature domain rather than test type:
- **`tests/auth/`** - Authentication, authorization, RBAC, and session management
- **`tests/dashboard/`** - Dashboard UI, data tables, entity management, and analytics
- **`tests/chat/`** - Chat interface, AI generation, and real-time features
- **`tests/insights/`** - Content management, category filters, and marketing analytics
- **`tests/security/`** - Security validation, injection prevention, and secret masking
- **`tests/core/`** - Core utilities, barrel management, and platform tooling

### **Environment-Aware File Naming**
- **`.dom.test.tsx`** - React component tests (JSDOM environment)
- **`.test.ts`** - Node.js tests (API routes, utilities, business logic)
- **`.route.test.ts`** - API route integration tests
- **`.unit.test.ts`** - Pure unit tests for utilities and guards

### **Shared Infrastructure**
- **`tests/support/`** - Centralized test utilities, builders, mocks, and setup
- **`tests/fixtures/`** - Test data and mock implementations
- **`tests/setup/`** - Vitest configuration and global test setup

## 📚 Test Organization

### Directory Structure

```bash
tests/
├── auth/                     # Authentication & authorization tests
│   ├── rbac-guards.unit.test.ts
│   ├── sign-in.revalidate.test.ts
│   ├── sign-in.runtime.test.ts
│   └── sign-up.runtime.test.ts
├── dashboard/                # Dashboard & data table tests
│   ├── a11y-skip-link.dom.test.tsx
│   ├── ag-grid-registration.test.ts
│   ├── barrel-server-leak.test.ts
│   ├── cancellation.test.ts
│   ├── columns-selection.test.ts
│   ├── entity-columns-registry.test.ts
│   ├── query-keys.test.ts
│   ├── url-sync.test.ts
│   └── use-client.test.ts
├── chat/                     # Chat & AI generation tests
│   ├── chat-composer.client.dom.test.tsx
│   ├── chat-table.dom.test.tsx
│   ├── chat-window.dom.test.tsx
│   ├── chat-window.hydration-boundary.dom.test.tsx
│   ├── composer.a11y.dom.test.tsx
│   ├── follow-up-chips.dom.test.tsx
│   ├── generate-chart.route.test.ts
│   ├── generate-sql.route.test.ts
│   ├── process.route.test.ts
│   └── runtime-boundary.test.ts
├── insights/                 # Insights & marketing content tests
│   ├── category-filter.dom.test.tsx
│   ├── content-service.test.ts
│   ├── get-insights-by-category.test.ts
│   └── image-sizes.test.ts
├── security/                 # Security & validation tests
│   ├── ai-secret-masking.test.ts
│   └── clickhouse-injection.test.ts
├── core/                     # Core platform & tooling tests
│   ├── api-barrel.test.ts
│   ├── constants-barrel.test.ts
│   ├── lib-mocks-barrel.test.ts
│   ├── lib-structure-validator.test.ts
│   ├── orphans-audit.test.ts
│   ├── runtime-boundaries.test.ts
│   └── sql-guards.test.ts
└── support/                  # Test infrastructure and utilities
    ├── env-mocks.ts
    ├── harness/
    │   ├── api-route-harness.ts
    │   ├── node-mocks.ts
    │   └── request.ts
    ├── resolve-route.ts
    ├── setup/
    │   ├── vitest.global-setup.ts
    │   ├── vitest.setup.dom.ts
    │   ├── vitest.setup.node.ts
    │   └── vitest.setup.shared.ts
    └── testkit.ts
```

## 🎯 Running Tests

### Command Reference

```bash
pnpm test                               # Orchestrated: runs all domain tests
pnpm test --filter "pattern"            # Filter by test name or file across all domains

# Per-domain runners (when needed)
pnpm vitest run tests/auth/             # Run all auth domain tests
pnpm vitest run tests/dashboard/        # Run all dashboard domain tests
pnpm vitest run tests/chat/             # Run all chat domain tests

# Watch modes
pnpm vitest --watch                     # Watch mode across all domains
pnpm vitest run tests/chat/ --watch     # Watch mode for specific domain

# Coverage
pnpm test:coverage                      # Full coverage report across all domains

# Storybook Test Runner (component interactions in headless browser)
pnpm prestorybook:test           # One-time: install Playwright browsers (idempotent)
pnpm storybook                   # Dev server
pnpm storybook:test              # Builds Storybook and runs test runner (pre-hook installs browsers)

# Windows local static run (alternative):
pnpm build-storybook
pnpm dlx http-server storybook-static -p 6106 -s   # terminal A
pnpm exec test-storybook --url http://127.0.0.1:6106  # terminal B
```bash

#### Notes
- The default `pnpm test` runs all domain tests sequentially.
- Tests are automatically assigned to the correct environment based on file naming:
  - `.dom.test.tsx` files run in JSDOM environment (React components)
  - `.test.ts` files run in Node.js environment (API routes, utilities)
- Passing `--filter "pattern"` narrows execution to matching files/tests across all domains.

#### Troubleshooting: duplicate tests
- Symptom: the total test count appears roughly doubled with no individual tests executing.
- Solution: Use `pnpm test` (the orchestrated runner) rather than running Vitest directly.
- The test suite uses a single `vitest.config.ts` with environment-aware project configuration.

### CI/CD Integration

All tests are run in CI/CD. PRs must pass all quality gates: lint, typecheck, tests, security, and performance.

Storybook in CI:
- Workflow: `.github/workflows/visual.yml` (storybook job) runs `pnpm ci:storybook` (build + test runner)
\- Chromatic visual testing removed for MVP; restore workflow and secret if re-enabling later

## 🛠️ Common Testing Patterns

- **Error Boundary Testing:** Ensure app error boundaries catch and report errors as expected using `app-error-boundary`.
- **Form Validation Testing:** Validate form logic, error messages, and edge cases.

## 📚 Related Documentation

- [Testing Guide](./testing-guide.md) - **Complete testing guide with examples, patterns, and best practices**
- [API Route Tests](../../tests/api/README.md) - API testing patterns and examples
- [Security Tests](../../tests/security/README.md) - Security testing guidelines
- [Test Support](../../tests/support/README.md) - Test utilities and helpers

## 🏷️ Tags

`#testing` `#quality-assurance` `#unit-tests` `#integration-tests` `#security-tests` `#performance-tests` `#vitest` `#ci-cd`

---

Last updated: 2025-10-21
