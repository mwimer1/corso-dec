---
title: "Harness"
description: "Documentation and resources for documentation functionality. Located in support/harness/."
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
## Public Exports
| Support File | Type | Description |
|-------------|------|-------------|
| `api-route-harness` | Test support |  |
| `node-mocks` | Test support |  |
| `render` | Test support |  |
| `request` | Test support |  |

## Public Exports
| Support File | Type | Description |
|-------------|------|-------------|
| `api-route-harness` | Test support |  |
| `node-mocks` | Test support |  |
| `request` | Test support |  |


# Test Harness Utilities

> **Test execution harnesses and utilities for API routes, Node.js mocks, and request handling.**

## 📋 Quick Reference

**Key Points:**

- **API Route Testing**: Harness for testing Next.js API route handlers
- **Node.js Mocks**: Mock utilities for Node.js built-in modules
- **Request Building**: Utilities for creating test requests

## 📑 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Key Features](#key-features)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The `tests/support/harness/` directory contains test harnesses and utilities that provide infrastructure for testing API routes, user interactions, and system integrations. These utilities handle common testing patterns and reduce boilerplate code.

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `api-route-harness.ts` | API route testing | Test harness for API route handlers |
| `node-mocks.ts` | Node.js mocking | Mock utilities for Node.js built-ins |
| `request.ts` | Request building | Next.js request creation utilities |

## Key Features

### API Route Testing Harness
- **Route Handler Testing**: Simplified testing of Next.js API route handlers
- **Request/Response Handling**: Unified request and response object creation
- **Test Assertions**: Streamlined assertion patterns for API responses

### Node.js Mock Infrastructure
- **Built-in Module Mocks**: Mocks for Node.js fs, child_process, and other built-ins
- **Mock Variants**: Different mock configurations for various testing scenarios
- **Type Safety**: TypeScript types for mock objects and utilities

### Request Building Utilities
- **Next.js Request Creation**: Proper Next.js Request object creation for testing
- **Header Management**: Easy header configuration for test requests
- **IP Spoofing**: Client IP configuration for testing region/rate limiting

## Usage Examples

### Testing API Routes
```typescript
import { testApiRoute } from '@tests/support/harness/api-route-harness';

await testApiRoute({
  handler: myApiHandler,
  method: 'POST',
  url: '/api/health',
  headers: { 'Content-Type': 'application/json' },
  body: { data: 'test' },
  assert: (res) => {
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  }
});
```

### Using Node.js Mocks
```typescript
import { installNodeMocks, createNodeMocks } from '@tests/support/harness/node-mocks';

// Install global mocks for Node.js built-ins
installNodeMocks('full');

// Create mock request/response objects
const { req, res } = createNodeMocks({
  req: { method: 'POST', headers: {} },
  res: { statusCode: 200 }
});
```

### Building Test Requests
```typescript
import { buildRequest } from '@tests/support/harness/request';

// Create Next.js Request for testing
const request = buildRequest('/api/users', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  ip: '192.168.1.100'
});
```

## Best Practices

### ✅ **Do**
- Use the API route harness for consistent API testing patterns
- Install appropriate Node.js mocks based on test requirements
- Build proper Next.js Request objects for route testing
- Document complex test scenarios and edge cases

### ❌ **Don't**
- Create ad-hoc mocks when harness utilities are available
- Skip mock cleanup between tests
- Use real external dependencies in unit tests
- Mix different mocking approaches inconsistently

### Testing Patterns

#### API Route Testing
```typescript
// Use the harness for consistent API testing
it('handles valid requests', async () => {
  await testApiRoute({
    handler: handler,
    body: { valid: 'data' },
    assert: (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });
});
```

#### Mock Management
```typescript
// Clean up mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Use appropriate mock variants
beforeAll(() => {
  installNodeMocks('fs-only'); // Only mock file system
});
```

---

## 🎯 Key Takeaways

- **Consistency**: Use harness utilities for consistent testing patterns
- **Simplicity**: Reduce boilerplate with pre-built test utilities
- **Reliability**: Well-tested harness utilities provide stable foundations
- **Maintainability**: Centralized utilities are easier to maintain and update

## 📚 Related Documentation

- [API Route Testing](../../../docs/api-testing.md) - API route testing guide
- [Mock Strategy](../../../docs/mock-strategy.md) - Mocking best practices
- [Test Utilities](../../../docs/test-utilities.md) - Testing utility documentation

## 🏷️ Tags

`#test-harness` `#api-testing` `#mocks` `#test-utilities`

---

_Last updated: 2025-01-16_
```typescript
import { renderWithProviders, renderWithQueryClient } from '@/tests/support/harness/render';

// For components needing React Query + Feature Flags
const { container } = renderWithProviders(<MyComponent />);

// For components needing only React Query
const { getByText } = renderWithQueryClient(<DataComponent />);
```

**Advanced Usage:**
```typescript
// Custom providers and initial state
const { result } = renderHookWithClient(
  () => true, // Feature flags removed
  { flags: { 'chat.enabled': true } }
);
```

### Menu Interaction (`menu.ts`)
Utilities for testing menu components and keyboard navigation.

**Basic Menu Testing:**
```typescript
import { openMenuAndFocusFirst, simulateMenuKeyboard, getMenuItems, NAV_KEYS } from '@tests/support/harness/menu';

it('navigates menu with keyboard', async () => {
  const { user, getByRole } = render(<MenuComponent />);

  // Open menu and focus first item
  const menuItems = await openMenuAndFocusFirst(user, {
    role: 'button',
    name: 'Open Menu'
  });

  // Navigate through menu
  await simulateMenuKeyboard(user, ['ArrowDown', 'ArrowDown', 'Enter'], 2);

  expect(menuItems[2]).toHaveAttribute('aria-selected', 'true');
});
```

**Menu Item Inspection:**
```typescript
// Get all menu items (handles MenuBar trigger offset)
const items = getMenuItems(); // All items
const itemsWithoutTrigger = getMenuItems(true); // Skip first trigger for MenuBar
```

### Keyboard Interaction (`keyboard.ts`)
Helpers for simulating keyboard events and navigation.

**Keyboard Sequences:**
```typescript
import { press, NAV_KEYS } from '@tests/support/harness/keyboard';

// Simulate key sequences
await press(user, ['ArrowDown', 'Enter']);

// Use predefined navigation keys
await press(user, [NAV_KEYS.open, NAV_KEYS.next, NAV_KEYS.close]);
```

**Menu Opening:**
```typescript
// Open regular menus
await openMenu(user, triggerElement);

// Open context menus
await openContextMenu(user, targetElement);
await expectActiveItem('Context Item');
```

### Request Building (`request.ts`)
Creates request objects for testing API endpoints and middleware.

**Basic Requests:**
```typescript
import { buildRequest } from '@tests/support/harness/request';

// Simple GET request
const getReq = buildRequest('/api/users');

// POST with headers and IP
const postReq = buildRequest('/api/webhook', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  ip: '192.168.1.100'
});
```

**Edge Runtime Testing:**
```typescript
// For testing Edge API routes
const edgeRequest = buildRequest('/api/edge-endpoint', {
  method: 'POST',
  headers: {
    'CF-Connecting-IP': '203.0.113.1',
    'X-Forwarded-For': '192.168.1.1'
  }
});
```

### Logger Mocking (`logger.ts`)
Provides mock logger instances for testing logging behavior.

**Basic Usage:**
```typescript
import { createLoggerMock } from '@tests/support/harness/logger';

const mockLogger = createLoggerMock();

// Spy on log calls
expect(mockLogger.info).toHaveBeenCalledWith('User logged in', { userId: '123' });
expect(mockLogger.error).toHaveBeenCalledWith('Database error', expect.any(Error));
```

### Chart Testing (`charts.tsx`)
Sample data and rendering helpers for chart components.

**Chart Data:**
```typescript
import { SAMPLE_BAR_DATA, SAMPLE_ANALYTICS_DATA } from '@tests/support/harness/charts';

// Use predefined sample data
const { container } = renderBarChart(<BarChart data={SAMPLE_BAR_DATA} />);
const { getByText } = renderAnalyticsChart(<AnalyticsChart data={SAMPLE_ANALYTICS_DATA} />);
```

**Custom Chart Testing:**
```typescript
// Render with custom data
const customData = [
  { name: 'Q1', value: 100 },
  { name: 'Q2', value: 150 }
];
const { container } = renderBarChart(<BarChart data={customData} />);
```

### Node.js Mocks (`node-mocks.ts`)
Mock utilities for Node.js built-in modules and external dependencies.

**File System Mocking:**
```typescript
import { mockFsWithPromises, mockFsExistsOnly } from '@tests/support/harness/node-mocks';

// Mock fs.promises methods
mockFsWithPromises();

// Mock only fs.existsSync
mockFsExistsOnly();
```

**Process and Child Process:**
```typescript
// Mock child_process.execSync
mockChildProcessExecSync();

// Mock glob operations
mockGlob();
```

## Testing Patterns

### Component Integration Testing
```typescript
import { renderWithProviders } from '@tests/support/harness/render';
import { openMenuAndFocusFirst } from '@tests/support/harness/menu';

it('handles user interactions', async () => {
  const { user, getByRole } = renderWithProviders(<NavigationMenu />);

  // Open menu
  await openMenuAndFocusFirst(user, {
    role: 'button',
    name: 'User Menu'
  });

  // Interact with menu items
  await user.click(getByRole('menuitem', { name: 'Profile' }));

  expect(mockRouter.push).toHaveBeenCalledWith('/profile');
});
```

### Keyboard Accessibility Testing
```typescript
import { press, NAV_KEYS } from '@tests/support/harness/keyboard';

it('supports keyboard navigation', async () => {
  const { user } = renderWithProviders(<AccessibleMenu />);

  // Focus trigger
  await user.tab();

  // Open menu
  await press(user, [NAV_KEYS.open]);

  // Navigate items
  await press(user, [NAV_KEYS.next, NAV_KEYS.next]);

  // Select item
  await press(user, [NAV_KEYS.open]);

  expect(selectedItem).toBe('Third Option');
});
```

### API Integration Testing
```typescript
import { buildRequest } from '@tests/support/harness/request';
import { execEdgeHandler } from '@tests/support/integration/middleware';

it('handles API requests', async () => {
  const request = buildRequest('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ip: '127.0.0.1'
  });

  const response = await execEdgeHandler(usersHandler, request);
  expect(response.status).toBe(201);
});
```

## Best Practices

### Rendering
- **Use appropriate wrappers**: Choose `renderWithProviders` vs `renderWithQueryClient` based on needs
- **Clean up after tests**: Ensure proper cleanup of rendered components
- **Mock external dependencies**: Avoid network calls and external API dependencies

### User Interactions
- **Realistic sequences**: Simulate actual user behavior, not just isolated events
- **Accessibility first**: Test keyboard navigation and screen reader compatibility
- **Async operations**: Wait for state updates and animations to complete

### Mock Management
- **Reset between tests**: Clear mocks to prevent test pollution
- **Realistic responses**: Mock responses should match actual API contracts
- **Error scenarios**: Test both success and failure paths

## Quality Assurance

### Consistency
- All harness utilities follow consistent naming patterns
- Error handling is standardized across utilities
- TypeScript types are properly defined and exported

### Performance
- Utilities are optimized to minimize test execution time
- Memory leaks are prevented through proper cleanup
- Reusable instances are cached where appropriate

### Test Coverage
- All harness utilities are tested themselves
- Edge cases and error conditions are covered
- Integration with other test utilities is verified
