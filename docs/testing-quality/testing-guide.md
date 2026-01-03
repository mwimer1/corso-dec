---
title: "Testing Quality"
description: "Documentation and resources for documentation functionality. Located in testing-quality/."
last_updated: "2026-01-03"
category: "documentation"
status: "active"
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

#### Component Testing with Providers

Use render harnesses from `tests/support/harness/render.tsx` for components that need context:

```typescript
import { renderWithProviders, renderWithAuth, renderWithQueryClient } from '@/tests/support/harness/render';
import { Component } from '@/components/component';

describe('Component', () => {
  it('renders with all providers', () => {
    // Use renderWithProviders for dashboard components needing full context
    renderWithProviders(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('renders with auth context only', () => {
    // Use renderWithAuth for components needing authentication but not dashboard context
    renderWithAuth(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('renders with React Query only', () => {
    // Use renderWithQueryClient for components needing data fetching but not auth
    renderWithQueryClient(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### Mocking Clerk in Component Tests

For components that use Clerk hooks (`useAuth`, `useUser`, etc.):

```typescript
import * as clerkModule from '@clerk/nextjs';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Clerk hooks at module level
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
  UserButton: ({ afterSignOutUrl }: { afterSignOutUrl: string }) => (
    <div data-testid="user-button" data-after-sign-out-url={afterSignOutUrl}>
      User Button
    </div>
  ),
}));

describe('AuthenticatedComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows content when authenticated', () => {
    // Mock authenticated state
    vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    render(<AuthenticatedComponent />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('shows sign-in prompt when unauthenticated', () => {
    // Mock unauthenticated state
    vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
      isSignedIn: false,
      userId: null,
    } as any);

    render(<AuthenticatedComponent />);
    expect(screen.getByText('Please sign in')).toBeInTheDocument();
  });
});
```

#### Data-TestId Conventions

Use `data-testid` attributes for stable element selection in tests:

```typescript
// In component code
<div data-testid="entity-grid">
  {/* Grid content */}
</div>

<div data-testid="entity-results-count">
  {count} results
</div>

// In tests
const gridContainer = screen.getByTestId('entity-grid');
const resultsCount = screen.getByTestId('entity-results-count');
expect(gridContainer).toBeInTheDocument();
expect(resultsCount).toHaveTextContent('10 results');
```

**Guidelines:**
- Use `data-testid` for elements that need stable test selectors
- Prefer semantic queries (`getByRole`, `getByLabelText`) when possible
- Use `data-testid` as fallback for complex or dynamic elements
- Follow kebab-case naming: `entity-grid`, `user-button`, `results-count`

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

#### Server-Side Clerk Mocking (API Routes)

For API routes that use `auth()` from `@clerk/nextjs/server`:

```typescript
// Mock at module level (before imports)
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: {
    users: {
      getOrganizationMembershipList: vi.fn().mockResolvedValue({ data: [] }),
    },
  },
}));

describe('API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user with member role
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      orgId: 'test-org-123',
      has: vi.fn().mockReturnValue(true), // Has required role
    });
  });

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    // Test expects 401
  });

  it('requires RBAC role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(false), // Lacks required role
    });
    // Test expects 403
  });

  it('checks specific role', async () => {
    const mockHas = vi.fn();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: mockHas,
    });

    // Test admin-only endpoint
    mockHas.mockReturnValue(false); // Not admin
    const res = await handler(req);
    expect(res.status).toBe(403);
    expect(mockHas).toHaveBeenCalledWith({ role: 'admin' });
  });
});
```

#### Client-Side Clerk Mocking (Components)

For components that use Clerk hooks:

```typescript
import * as clerkModule from '@clerk/nextjs';

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
  UserButton: ({ afterSignOutUrl }: { afterSignOutUrl: string }) => (
    <div data-testid="user-button">{afterSignOutUrl}</div>
  ),
}));

describe('Component', () => {
  it('handles authenticated state', () => {
    vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    render(<Component />);
    // Test authenticated behavior
  });
});
```

#### Using Testkit Utilities

```typescript
import { mockClerkAuth } from '@/tests/support/testkit';

// Setup authenticated user with role
const authContext = mockClerkAuth('user-id', 'member');

// Setup unauthenticated
const authContext = mockClerkAuth(null);
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

#### Async Test Issues
Common problems with async tests and solutions:

```typescript
// ❌ INCORRECT: Missing await
it('fetches data', () => {
  const result = fetchData();
  expect(result).toBeDefined(); // May fail - result is a Promise
});

// ✅ CORRECT: Proper async/await
it('fetches data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// ✅ CORRECT: Using waitFor for DOM updates
it('updates UI after data fetch', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

#### Module Cache Issues
When environment variables don't take effect:

```typescript
// ❌ INCORRECT: Module already cached
process.env.CORSO_USE_MOCK_DB = 'true';
const module = await import('@/lib/entities/pages'); // Uses cached version

// ✅ CORRECT: Reset modules first
beforeEach(() => {
  vi.resetModules(); // Clear module cache
  process.env.CORSO_USE_MOCK_DB = 'true';
});

// ✅ CORRECT: Use test-only reset function (faster)
import { __resetContentSourceForTests } from '@/lib/marketing/insights/source';

beforeEach(() => {
  process.env.CORSO_USE_MOCK_CMS = 'false';
  __resetContentSourceForTests(); // Targeted reset
});
```

## 🎭 End-to-End Testing with Playwright

### Setup & Configuration

Playwright tests are located in `tests/e2e/` and use the configuration in `playwright.config.ts`:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    env: {
      E2E_BYPASS_AUTH: 'true',
      NEXT_PUBLIC_AUTH_MODE: 'relaxed',
      CORSO_USE_MOCK_DB: 'true',
      DISABLE_RATE_LIMIT: 'true',
    },
  },
});
```

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm playwright test tests/e2e/dashboard-projects.smoke.test.ts

# Run in UI mode (interactive)
pnpm playwright test --ui

# Run in headed mode (see browser)
pnpm playwright test --headed
```

### Writing E2E Tests

#### Basic E2E Test Structure

```typescript
import { expect, test } from '@playwright/test';

test.describe('Dashboard Projects Page', () => {
  test('should load and display projects', async ({ page }) => {
    // Navigate to page
    await page.goto('/dashboard/projects');

    // Wait for network to be idle (all requests complete)
    await page.waitForLoadState('networkidle');

    // Use data-testid for stable element selection
    const gridContainer = page.getByTestId('entity-grid');
    await expect(gridContainer).toBeVisible({ timeout: 10000 });

    // Verify results are displayed
    const resultsCount = page.getByTestId('entity-results-count');
    await expect(resultsCount).toBeVisible();
    await expect(resultsCount.locator('text=results')).toBeVisible();
  });

  test('should handle invalid query parameters', async ({ page }) => {
    // Navigate with invalid params (should be ignored gracefully)
    await page.goto('/dashboard/projects?sortBy=invalid_field&filters=[{"field":"invalid"}]');

    await page.waitForLoadState('networkidle');

    // Page should still load successfully
    const gridContainer = page.getByTestId('entity-grid');
    await expect(gridContainer).toBeVisible({ timeout: 10000 });
  });
});
```

#### E2E Test Best Practices

**✅ DO:**
- Use `data-testid` attributes for stable element selection
- Wait for network idle before assertions (`waitForLoadState('networkidle')`)
- Use appropriate timeouts (default 10s for E2E)
- Test user workflows, not implementation details
- Verify page stability (no infinite loading states)

**❌ DON'T:**
- Rely on CSS selectors that may change
- Make assertions before page is ready
- Test internal state or implementation details
- Skip waiting for async operations
- Hardcode wait times (use `waitFor` or `waitForLoadState`)

#### E2E Environment Variables

E2E tests require specific environment variables (set automatically by `playwright.config.ts`):

```bash
E2E_BYPASS_AUTH=true              # Bypass authentication for E2E tests
NEXT_PUBLIC_AUTH_MODE=relaxed    # Use relaxed auth mode
ALLOW_RELAXED_AUTH=true          # Enable relaxed auth
CORSO_USE_MOCK_DB=true           # Use mock database
DISABLE_RATE_LIMIT=true          # Disable rate limiting
NEXT_PUBLIC_AGGRID_ENTERPRISE=1  # Enable AG Grid Enterprise features
```

### E2E Test Patterns

#### Testing Authentication Flows

```typescript
test('should redirect unauthenticated users to sign-in', async ({ page }) => {
  // Navigate to protected route
  await page.goto('/dashboard/projects');

  // Should redirect to sign-in (unless E2E_BYPASS_AUTH is set)
  await expect(page).not.toHaveURL(/\/sign-in/); // With bypass enabled
  // OR
  // await expect(page).toHaveURL(/\/sign-in/); // Without bypass
});
```

#### Testing Form Interactions

```typescript
test('should submit form and show success message', async ({ page }) => {
  await page.goto('/contact');

  // Fill form fields
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="message"]', 'Test message');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success message
  await expect(page.getByText('Thank you')).toBeVisible({ timeout: 5000 });
});
```

#### Testing Data Tables

```typescript
test('should display and filter entity data', async ({ page }) => {
  await page.goto('/dashboard/projects');

  // Wait for grid to load
  await page.waitForLoadState('networkidle');
  const grid = page.getByTestId('entity-grid');
  await expect(grid).toBeVisible();

  // Verify results count
  const resultsCount = page.getByTestId('entity-results-count');
  const countText = await resultsCount.textContent();
  expect(countText).toContain('results');
  expect(countText).not.toBe('0 results');

  // Verify no infinite spinners
  const spinners = page.locator('[role="progressbar"], [aria-busy="true"]');
  const spinnerCount = await spinners.count();
  expect(spinnerCount).toBeLessThan(3); // Allow some during initial load
});
```

## 🏭 Test Data & Factories

### Creating Test Data

Use consistent test data patterns:

```typescript
// ✅ CORRECT: Use realistic test data matching production schemas
const mockProject = {
  id: 'proj-123',
  name: 'Test Project',
  status: 'active',
  created_at: '2024-01-15T10:00:00Z',
  org_id: 'org-123',
};

// ✅ CORRECT: Use factories for complex objects
function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: `proj-${Date.now()}`,
    name: 'Test Project',
    status: 'active',
    created_at: new Date().toISOString(),
    org_id: 'org-123',
    ...overrides,
  };
}

// In tests
const project = createMockProject({ name: 'Custom Project' });
```

### Mock Database Data

When `CORSO_USE_MOCK_DB=true`, tests use JSON fixtures from `public/__mockdb__/`:

```typescript
// Mock DB automatically serves data from fixtures
// No need to mock getEntityPage() - it reads from JSON files
const result = await getEntityPage('projects', { page: 0, pageSize: 10 });
expect(result.data).toBeDefined();
expect(result.data.length).toBeGreaterThan(0);
```

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Mock Order Matters

**Problem:** Mocks must be set up before imports

```typescript
// ❌ INCORRECT: Import before mock
import { auth } from '@clerk/nextjs/server';
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// ✅ CORRECT: Mock before import
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));
// Import happens after mock is registered
```

### Pitfall 2: Async Operations Not Awaited

**Problem:** Forgetting to await async operations

```typescript
// ❌ INCORRECT: Missing await
it('fetches data', () => {
  const result = fetchData(); // Returns Promise
  expect(result.data).toBeDefined(); // Fails - result is Promise
});

// ✅ CORRECT: Proper async/await
it('fetches data', async () => {
  const result = await fetchData();
  expect(result.data).toBeDefined();
});
```

### Pitfall 3: Shared State Between Tests

**Problem:** Tests affecting each other due to shared state

```typescript
// ❌ INCORRECT: Shared mutable state
let counter = 0;
it('increments counter', () => {
  counter++;
  expect(counter).toBe(1);
});
it('increments counter again', () => {
  counter++; // May be 2 if previous test ran
  expect(counter).toBe(1); // Fails!
});

// ✅ CORRECT: Reset state in beforeEach
let counter = 0;
beforeEach(() => {
  counter = 0; // Reset before each test
});
```

### Pitfall 4: Not Cleaning Up Mocks

**Problem:** Mock state leaking between tests

```typescript
// ❌ INCORRECT: Mocks not cleared
describe('Component', () => {
  it('test 1', () => {
    mockAuth.mockReturnValue({ userId: 'user-1' });
    // Test code
  });
  it('test 2', () => {
    // mockAuth still returns user-1 from previous test!
  });
});

// ✅ CORRECT: Clear mocks in beforeEach
describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ userId: 'user-123' });
  });
});
```

### Pitfall 5: Testing Implementation Details

**Problem:** Testing how code works instead of what it does

```typescript
// ❌ INCORRECT: Testing implementation
it('calls fetch with correct URL', () => {
  const fetchSpy = vi.spyOn(global, 'fetch');
  render(<Component />);
  expect(fetchSpy).toHaveBeenCalledWith('/api/data');
});

// ✅ CORRECT: Testing behavior
it('displays data after loading', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Pitfall 6: Incorrect Timeout Handling

**Problem:** Tests timing out due to slow operations

```typescript
// ❌ INCORRECT: No timeout for slow operations
it('loads large dataset', async () => {
  const result = await loadLargeDataset(); // May take > 5s
  expect(result).toBeDefined();
});

// ✅ CORRECT: Set appropriate timeout
it('loads large dataset', async () => {
  const result = await loadLargeDataset();
  expect(result).toBeDefined();
}, 30_000); // 30 second timeout
```

## 📚 Related Documentation

- [Testing Strategy](./testing-strategy.md) - High-level testing approach
- [API Route Tests](../../tests/api/README.md) - API testing patterns
- [Security Tests](../../tests/security/README.md) - Security testing guidelines
- [Test Support](../../tests/support/README.md) - Test utilities and helpers
- [E2E Tests](../../tests/e2e/README.md) - End-to-end testing patterns

## 🏷️ Tags

`#testing` `#test-coverage` `#unit-tests` `#integration-tests` `#api-tests` `#component-tests` `#e2e-tests` `#playwright` `#security-tests` `#vitest` `#ci-cd`

---

Last updated: 2025-01-16
