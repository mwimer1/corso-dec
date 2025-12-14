---
title: Tests
description: Documentation and resources for documentation functionality.
last_updated: '2025-12-14'
category: documentation
status: draft
---
# Test Suite

> **Comprehensive test suite for the Corso platform, ensuring code quality and functionality across all layers.**

## 📋 Quick Reference

**Key Points:**

- **Centralized Testing**: All tests live under `tests/` directory to maintain clean separation from source code
- **Component Isolation**: Tests use barrel imports (`@/...`) and avoid co-located test files
- **Runtime Boundaries**: Tests validate server/client boundary enforcement and runtime safety

## 📑 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Testing Strategy](#testing-strategy)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

The Corso test suite provides comprehensive coverage across all platform layers using Vitest. All tests are centralized under the `tests/` directory to maintain clean separation from source code and ensure consistent testing patterns.

### Architecture

The test suite follows a domain-first approach with comprehensive coverage:
- **Domain tests** organized by feature area (auth, chat, dashboard, etc.)
- **API route tests** for Next.js API endpoints and request/response validation
- **Component tests** for React UI components using jsdom environment with render harness utilities
- **Runtime boundary tests** for server/client separation and import discipline
- **Security tests** for authentication, authorization, and data protection
- **Core platform tests** for utilities, validation, and tooling
- **Integration tests** for third-party services and external APIs
- **Vendor tests** for third-party libraries and their integration

## Directory Structure

| Directory | Purpose | Environment | Notes |
|-----------|---------|-------------|-------|
| `api/` | API route tests | Node.js | Next.js API routes, request/response validation |
| `auth/` | Authentication and authorization tests | Node.js | RBAC, sign-in/sign-up, session management, validation |
| `chat/` | Chat and AI generation tests | Node.js/jsdom | Components, API routes, real-time features |
| `dashboard/` | Dashboard and data table tests | Node.js/jsdom | Components, query logic, data visualization, entity management |
| `insights/` | Insights and marketing content tests | Node.js/jsdom | Content service, category filters, analytics |
| `security/` | Security and validation tests | Node.js | Injection prevention, secret masking, rate limiting, auth |
| `core/` | Core platform and tooling tests | Node.js | Barrels, orphans audit, validation scripts, lib structure |
| `integrations/` | Third-party integration tests | Node.js | Supabase, external services, API integrations |
| `mocks/` | Mock data and utilities tests | Node.js | Test data validation, mock implementations |
| `vendors/` | Third-party library tests | Node.js | AG Grid, vendor-specific functionality |
| `runtime-boundary/` | Runtime boundary and import discipline tests | Node.js | Server/client separation, Edge compatibility |
| `fixtures/` | Test fixtures and mock data | - | Shared test data and setup files |
| `setup/` | Test environment setup | Node.js | Vitest configuration and global mocks |
| `support/` | Test utilities and harnesses | Node.js | Shared testing utilities, render harnesses, API harnesses |
| `__mocks__/` | Mock implementations for external dependencies | - | Centralized mocks for external libraries |

### Test Environment Selection

Tests automatically run in the appropriate environment based on file naming conventions:
- **`.dom.test.tsx`** - React component tests (jsdom environment)
- **`.test.ts`** - Node.js tests (Node environment) for API routes and business logic
- **`.node.test.ts`** - Explicit Node.js tests (when needed for clarity)
- **`.route.test.ts`** - API route tests (Node environment)
- **`.unit.test.ts`** - Pure unit tests (Node environment)

## Testing Strategy

### Domain-First Organization
- Tests organized by feature/domain (`auth/`, `dashboard/`, `chat/`, etc.)
- Each domain contains both component tests (`.dom.test.tsx`) and logic tests (`.test.ts`)
- Environment automatically selected based on file naming convention

### Component Testing (`.dom.test.tsx`)
- Uses **jsdom** environment for DOM manipulation
- Tests React components in isolation across all domains
- Validates accessibility, interactions, and rendering
- Located in domain folders (e.g., `tests/chat/chat-window.dom.test.tsx`)
- **Render Harness**: Use `renderWithProviders()`, `renderWithAuth()`, or `renderWithQueryClient()` for consistent provider setup

### API & Logic Testing (`.test.ts`)
- Tests Next.js API route handlers and business logic
- Validates request/response cycles and core functionality
- Covers authentication, validation, and error scenarios
- Uses Node.js environment for server-side testing
- Located in domain folders (e.g., `tests/auth/rbac-guards.test.ts`)

### Runtime Boundary Testing (`tests/core/`)
- Ensures server/client code separation
- Validates import discipline and runtime safety
- Prevents accidental server code in client bundles

## Best Practices

### ✅ **Do**
- Place all tests under `tests/` directory
- Use barrel imports (`@/components`, `@/lib`, etc.)
- Mock external dependencies appropriately
- Test both happy paths and error scenarios
- Validate accessibility attributes in component tests

### ❌ **Don't**
- Create co-located test files (e.g., `Button.spec.tsx`)
- Import server code in client-side tests
- Leave unused mocks or test utilities
- Skip edge cases or error handling tests

### Common Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Component Mock | Mock child components for isolation | `vi.mock('@/components/ui/molecules')` |
| API Route Test | Test route handlers directly | `import { GET } from '@/app/api/health/route'` |
| Runtime Boundary | Validate server/client separation | `tests/runtime-boundary/**/*.spec.ts` |
| Render Harness | Consistent component rendering with providers | `renderWithProviders(<Component />)` |
| API Harness | Simplified API route testing | `testApiRoute({ handler, method: 'POST', body: {...} })` |

## Development Guidelines

### File Organization
- Group related tests in subdirectories by feature/domain
- Use descriptive test names that explain the behavior being tested
- Organize test utilities in `tests/support/`
- Many subdirectories contain detailed READMEs with specific testing patterns and examples

### Naming Conventions
- `*.dom.test.tsx` for React component tests (jsdom environment)
- `*.test.ts` for API routes and business logic tests (Node environment)
- `*.route.test.ts` for API route tests (Node environment)
- `*.unit.test.ts` for pure unit tests (Node environment)
- `*.node.test.ts` for explicit Node.js tests

### Mock Strategy
- Use `tests/__mocks__/` for module-level mocks
- Mock external APIs and services
- Avoid over-mocking internal business logic

---

## 🎯 Key Takeaways

- **Domain-First Organization**: Tests organized by feature area for better maintainability
- **Environment Separation**: Automatic environment selection based on file naming conventions
- **Import Discipline**: Maintain server/client boundaries in tests
- **Comprehensive Coverage**: Test all layers from API routes to UI components
- **Consistent Patterns**: Standardized testing approaches across all domains

## 📚 Related Documentation

- [Vitest Configuration](../../vitest.config.ts) - Test runner setup
- [Testing Strategy](../../docs/testing-strategy.md) - High-level testing approach
- [Component Guidelines](../../docs/component-testing.md) - React component testing patterns

## 🏷️ Tags

`#testing` `#vitest` `#corso-platform` `#quality-assurance`

---

_Last updated: 2025-10-23 (Restructured to domain-first organization)_
