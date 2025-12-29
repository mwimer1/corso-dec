---
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Coding Standards & Best Practices

This document provides comprehensive coding standards and best practices for the Corso codebase, covering TypeScript, React, ESLint rules, and code quality guidelines.

## 🎯 Core Principles

### TypeScript First
- **Strict Mode**: Always enabled with `exactOptionalPropertyTypes: true`
- **No `any`**: Use `unknown` instead, with proper type guards
- **Explicit Types**: Provide types for exported functions and public APIs
- **Type Imports**: Use `import type` for type-only imports

### Code Quality
- **Consistent Formatting**: ESLint auto-fixes formatting issues
- **No Dead Code**: Remove unused exports and variables
- **Clear Naming**: Use descriptive, business-focused names
- **Single Responsibility**: Each function/component should do one thing well

### Security & Safety
- **Input Validation**: Always validate with Zod schemas
- **Error Handling**: Use structured error handling with proper types
- **Runtime Boundaries**: Respect client/server/edge boundaries
- **No Secrets**: Never commit secrets or use `process.env` directly

## 📋 TypeScript Standards

### Type Definitions

```typescript
// ✅ CORRECT: Explicit types for exports
export function processData(input: string): ProcessedData {
  // Implementation
}

// ✅ CORRECT: Type-only imports
import type { User } from '@/types/auth/user';

// ❌ INCORRECT: Using `any`
function processData(input: any): any {
  // Implementation
}

// ❌ INCORRECT: Missing return type
export function processData(input: string) {
  // Implementation
}
```

### Optional Properties

With `exactOptionalPropertyTypes: true`, avoid assigning `undefined`:

```typescript
// ✅ CORRECT: Conditional spreading
const opts = {
  ...(maybeTimeout ? { timeout: maybeTimeout } : undefined),
  retryOn429: true,
};

// ❌ INCORRECT: Direct undefined assignment
const opts = {
  timeout: maybeTimeout, // Error if maybeTimeout could be undefined
  retryOn429: true,
};
```

### Type Guards

```typescript
// ✅ CORRECT: Type guards for unknown
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

// Usage
const data: unknown = fetchData();
if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.email);
}
```

## ⚛️ React Standards

### Component Structure

```typescript
'use client'; // Required for client components

import type { ComponentProps } from 'react';
import { useState, useCallback } from 'react';

interface Props {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  const [state, setState] = useState<string>('');

  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Hooks Best Practices

```typescript
// ✅ CORRECT: Proper dependency arrays
useEffect(() => {
  fetchData(id);
}, [id]); // Include all dependencies

// ✅ CORRECT: useCallback for stable references
const handler = useCallback(() => {
  doSomething(value);
}, [value]);

// ❌ INCORRECT: Missing dependencies
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id' dependency

// ❌ INCORRECT: Unnecessary re-renders
const handler = () => {
  doSomething(value);
}; // Recreated on every render
```

### Server Components

```typescript
// ✅ CORRECT: Server component (default)
import { auth } from '@clerk/nextjs/server';
import { getEntityPage } from '@/lib/entities/pages';

export default async function Page() {
  const { userId } = await auth();
  const data = await getEntityPage('projects', { page: 0, pageSize: 10 });
  
  return <div>{/* Render data */}</div>;
}
```

## 🔧 ESLint Rules

### Critical Rules (Errors)

| Rule | Purpose | Example |
|------|---------|---------|
| `@typescript-eslint/no-unused-vars` | Prevent unused variables | `const unused = 1;` ❌ |
| `@typescript-eslint/no-explicit-any` | Prevent `any` types | `function fn(x: any)` ❌ |
| `corso/no-direct-process-env` | Enforce env helpers | `process.env.KEY` ❌ |
| `corso/require-zod-strict` | Enforce Zod validation | `Schema.parse()` without `.strict()` ❌ |
| `corso/no-server-in-client` | Runtime boundaries | Server import in client ❌ |

### Important Rules (Warnings)

| Rule | Purpose | Example |
|------|---------|---------|
| `no-console` | Limit console usage | `console.log()` in production ❌ |
| `react-hooks/exhaustive-deps` | Hook dependencies | Missing deps in useEffect ⚠️ |
| `@typescript-eslint/explicit-function-return-type` | Return types | Missing return type ⚠️ |

### Custom Corso Rules

| Rule | Purpose |
|------|---------|
| `corso/no-cross-domain-imports` | Prevent cross-domain leaf imports |
| `corso/no-deep-imports` | Enforce barrel imports |
| `corso/require-runtime-exports` | Require runtime declarations in API routes |
| `corso/no-server-only-in-client` | Prevent server code in client components |

## 📦 Import Organization

### Import Order

```typescript
// 1. External libraries
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

// 2. Type-only imports
import type { User } from '@/types/auth/user';
import type { NextRequest } from 'next/server';

// 3. Internal utilities
import { getEnv } from '@/lib/server/env';
import { logger } from '@/lib/monitoring';

// 4. Components
import { Button } from '@/atoms';
import { DashboardHeader } from '@/components/dashboard';

// 5. Relative imports
import { helper } from './helper';
```

### Barrel Imports

```typescript
// ✅ CORRECT: Use barrel imports
import { Button, Input } from '@/atoms';
import { getEnv } from '@/lib/server/env';

// ❌ INCORRECT: Deep imports
import { Button } from '@/components/ui/atoms/button/button';
import { getEnv } from '@/lib/server/env/env';
```

## 🚨 Error Handling

### Structured Errors

```typescript
import { ApplicationError } from '@/lib/shared/errors';
import { http } from '@/lib/api';

// ✅ CORRECT: Structured error handling
try {
  const result = await processData(input);
  return http.ok(result);
} catch (error) {
  if (error instanceof ApplicationError) {
    return http.error(error.statusCode, error.message, {
      code: error.code,
    });
  }
  logger.error('Unexpected error', { error });
  return http.error(500, 'Internal server error', {
    code: 'INTERNAL_ERROR',
  });
}
```

### Error Logging

```typescript
// ✅ CORRECT: Use logger utility
import { logger } from '@/lib/monitoring';

logger.error('Operation failed', {
  userId,
  operation: 'data-process',
  error: error.message,
});

// ❌ INCORRECT: Direct console usage in production
console.error('Operation failed', error);
```

## 🧪 Testing Standards

### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle errors', () => {
    // Test error scenarios
  });
});
```

### Test Coverage

- **Minimum**: 80% line coverage
- **Critical Paths**: 100% coverage
- **Error Cases**: All error paths tested

## 📝 Code Documentation

### JSDoc Comments

```typescript
/**
 * Processes user data and returns formatted result.
 *
 * @param userId - The user ID to process
 * @param options - Optional processing options
 * @returns Processed user data
 * @throws {ApplicationError} If user not found
 *
 * @example
 * ```typescript
 * const data = await processUser('user_123', { format: 'json' });
 * ```
 */
export async function processUser(
  userId: string,
  options?: ProcessOptions
): Promise<ProcessedUser> {
  // Implementation
}
```

### Public API Documentation

Mark public APIs with `@public` JSDoc tag:

```typescript
/**
 * @public
 * Core utility function for the design system
 */
export function cn(...classes: string[]): string {
  // Implementation
}
```

## 🎨 Naming Conventions

### Files and Directories

- **Components**: PascalCase (`Button.tsx`, `UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`, `validateInput.ts`)
- **Types**: camelCase with `.types.ts` suffix (`user.types.ts`)
- **Tests**: Same name with `.test.ts` or `.spec.ts` suffix

### Variables and Functions

- **Variables**: camelCase (`userName`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `processPayment`)
- **Components**: PascalCase (`UserCard`, `DashboardHeader`)
- **Types/Interfaces**: PascalCase (`User`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)

### Private/Internal

- Prefix with `_` for intentionally unused: `_unusedParam`
- Use `private` keyword for class members
- Mark internal functions with JSDoc `@internal`

## 🔍 Code Review Checklist

### Before Submitting PR

- [ ] All ESLint errors fixed
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No `console.log` in production code
- [ ] Proper error handling implemented
- [ ] Input validation with Zod schemas
- [ ] Runtime boundaries respected
- [ ] No hardcoded secrets
- [ ] Documentation updated if needed
- [ ] Code follows naming conventions

### Code Quality Checks

```bash
# Run all quality checks
pnpm quality:local

# Individual checks
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:cursor-rules
```

## 🚫 Common Anti-Patterns

### ❌ Don't Do This

```typescript
// Direct process.env access
const key = process.env.API_KEY;

// Using `any`
function process(data: any): any {
  return data;
}

// Missing error handling
const result = await fetchData();

// Console in production
console.log('Debug info', data);

// Deep imports
import { util } from '@/lib/shared/utils/helpers/util';

// Missing dependencies
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id'
```

### ✅ Do This Instead

```typescript
// Use environment helpers
import { getEnv } from '@/lib/server/env';
const key = getEnv().API_KEY;

// Proper types
function process<T>(data: T): ProcessedData<T> {
  return transform(data);
}

// Error handling
try {
  const result = await fetchData();
} catch (error) {
  logger.error('Failed to fetch', { error });
  throw new ApplicationError('Fetch failed', { cause: error });
}

// Use logger
logger.debug('Debug info', { data });

// Barrel imports
import { util } from '@/lib/shared';

// Complete dependencies
useEffect(() => {
  fetchData(id);
}, [id]);
```

## 📚 Related Documentation

- [ESLint Runtime Boundaries](eslint-runtime-boundaries.md) - Custom lint rules
- [TypeScript Guide](../typescript/typescript-guide.md) - TypeScript setup and configuration
- [Security Standards](../security/security-implementation.md) - Security patterns
- [Testing Strategy](../testing-quality/testing-strategy.md) - Testing guidelines

## 🔄 Continuous Improvement

### Regular Tasks

1. **Weekly**: Review and fix ESLint warnings
2. **Monthly**: Update dependencies and review deprecated patterns
3. **Quarterly**: Review and update coding standards
4. **As Needed**: Refactor based on new patterns or requirements

### Code Quality Metrics

- **ESLint Errors**: 0
- **ESLint Warnings**: < 10 (target: 0)
- **TypeScript Errors**: 0
- **Test Coverage**: ≥ 80%
- **Dead Code**: 0 unused exports

---

**Last Updated**: 2025-01-15  
**Maintained By**: Platform Team  
**Status**: Active
