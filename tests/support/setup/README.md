---
title: "Setup"
description: "Documentation and resources for documentation functionality. Located in support/setup/."
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
---
## Public Exports
| Support File | Type | Description |
|-------------|------|-------------|
| `vitest.global-setup` | Test support |  |
| `vitest.setup.dom` | Test support |  |
| `vitest.setup.node` | Test support |  |
| `vitest.setup.shared` | Test support |  |

## Public Exports
| Support File | Type | Description |
|-------------|------|-------------|
| `vitest.global-setup` | Test support |  |
| `vitest.setup.dom` | Test support |  |
| `vitest.setup.node` | Test support |  |
| `vitest.setup.shared` | Test support |  |


# Vitest Setup Configuration

> **Vitest setup and configuration files that establish testing environments for DOM, Node.js, and shared utilities.**

## 📋 Quick Reference

**Key Points:**

- **Environment Setup**: Separate configurations for DOM, Node.js, and global setup
- **Test Framework**: Vitest-specific setup and global test behaviors
- **Environment Variables**: Proper loading of test environment variables

## 📑 Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Key Features](#key-features)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The `tests/support/setup/` directory contains Vitest configuration files that set up different testing environments and provide shared utilities. These files ensure consistent test behavior across different runtime environments.

## Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `vitest.global-setup.ts` | Global setup | Environment variable loading, one-time setup |
| `vitest.setup.dom.ts` | DOM environment | Browser/DOM specific test setup |
| `vitest.setup.node.ts` | Node.js environment | Server-side test setup |
| `vitest.setup.shared.ts` | Shared utilities | Common test utilities and configurations |

## Key Features

### Global Setup Configuration
- **Environment Variables**: Loads `.env.test` file for test-specific configuration
- **One-Time Setup**: Runs once before all test workers start
- **Quiet Mode**: Suppresses dotenv output messages during testing

### Environment-Specific Setup
- **DOM Setup**: Configures browser environment for component testing
- **Node.js Setup**: Configures server environment for API testing
- **Shared Setup**: Common utilities used across all test environments

### Test Environment Consistency
- **Deterministic Environment**: Ensures consistent test environment variables
- **Error Handling**: Configures error handling for test scenarios
- **Global Mocks**: Sets up global mocks for testing

## Usage Examples

### Global Setup Configuration
```typescript
// tests/support/setup/vitest.global-setup.ts
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env.test file once before all test workers start
// This prevents the repeated dotenv messages from appearing in test output
config({
  path: resolve(process.cwd(), '.env.test'),
  quiet: true, // Suppress dotenv output messages
});

export default function globalSetup() {
  // This function runs once before all test workers
  // The dotenv config above is executed when this module is imported
  console.log('🔧 Test environment loaded (dotenv quiet mode)');
}
```

### DOM Environment Setup
```typescript
// tests/support/setup/vitest.setup.dom.ts
// Minimal DOM helpers; extend if you add testing-library.
// Vitest needs the vitest-specific entry to extend `expect` safely
import "@testing-library/jest-dom/vitest";

// (Optional) add tiny polyfills here if needed later
// e.g., globalThis.IS_REACT_ACT_ENVIRONMENT = true
```

### Shared Setup Utilities
```typescript
// tests/support/setup/vitest.setup.shared.ts
import { afterAll, beforeAll, vi } from "vitest";

// Ensure deterministic test env
beforeAll(() => {
  process.env.NODE_ENV = "test";
  // Silence noisy error logs from expected guard throws during tests
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as any)?.mockRestore?.();
});

// Light fetch stub; tests can override per-suite.
if (typeof fetch === "undefined") {
  // @ts-expect-error assignable in Node test env
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 200 }));
}
```

## Best Practices

### ✅ **Do**
- Load environment variables in global setup to avoid test pollution
- Use separate setup files for different environments (DOM vs Node.js)
- Configure error handling to match production behavior patterns
- Keep setup files minimal and focused on their specific environment

### ❌ **Don't**
- Load environment files in individual test files
- Mix DOM and Node.js setup in the same configuration
- Override global test environment variables in individual tests
- Add heavy polyfills or dependencies in setup files

### Configuration Patterns

#### Environment-Specific Setup
```typescript
// Use appropriate setup based on test type
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // Uses vitest.setup.dom.ts
    setupFiles: [
      './tests/support/setup/vitest.global-setup.ts',
      './tests/support/setup/vitest.setup.shared.ts',
      // vitest.setup.dom.ts is loaded automatically by jsdom environment
    ],
  },
});
```

#### Conditional Setup
```typescript
// Only apply DOM-specific setup when in browser environment
if (typeof window !== 'undefined') {
  // DOM-specific test setup
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }),
  });
}
```

---

## 🎯 Key Takeaways

- **Environment Isolation**: Separate setup files prevent environment conflicts
- **Global Consistency**: Shared setup ensures consistent test behavior
- **Minimal Overhead**: Setup files should be lightweight and focused
- **Test Reliability**: Proper environment configuration improves test reliability

## 📚 Related Documentation

- [Vitest Configuration](../../../vitest.config.ts) - Main Vitest configuration
- [Test Environment](../../../docs/test-environment.md) - Test environment setup guide
- [Testing Strategy](../../../docs/testing-strategy.md) - Overall testing approach

## 🏷️ Tags

`#vitest` `#test-setup` `#environment` `#configuration`

---

_Last updated: 2025-01-16_
