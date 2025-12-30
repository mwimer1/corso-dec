---
title: "Typescript"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
description: "Documentation and resources for documentation functionality. Located in typescript/."
---
# TypeScript Guide

> **Complete guide to TypeScript usage, type safety, and best practices for the Corso codebase**

## 📋 Quick Reference

**Key Commands:**
```bash
# Type checking
pnpm typecheck

# Fast type checking (tooling only)
pnpm typecheck:fast

# Production type checking
pnpm typecheck:prod

# Clean and rebuild
pnpm typecheck:clean
```

## 🎯 TypeScript Configuration

### Strict Mode Settings

The codebase uses **strict TypeScript** with the following settings enabled:

**Base Configuration** (`config/typescript/tsconfig.base.json`):
```json
{
  "strict": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

**Key Features:**
- **`strict: true`**: Enables all strict type checking options
- **`exactOptionalPropertyTypes: true`**: Prevents `undefined` in optional properties
- **`noUncheckedIndexedAccess: true`**: Requires checking array/object access
- **`noImplicitAny: true`**: Prevents implicit `any` types

### Project Structure

**Multi-Project Setup:**
- `tsconfig.app.json` - Next.js application code
- `tsconfig.components.json` - UI components
- `tsconfig.lib.json` - Libraries and utilities
- `tsconfig.testing.json` - Test files
- `tsconfig.tooling.json` - Build tools and scripts

## 🔒 Type Safety Standards

### Zero Tolerance for `any`

**ESLint Rule:** `@typescript-eslint/no-explicit-any: error`

**❌ INCORRECT:**
```typescript
function processData(data: any): any {
  return data;
}
```

**✅ CORRECT: Use `unknown` with type guards**
```typescript
function processData(data: unknown): ProcessedData {
  if (isProcessedData(data)) {
    return data;
  }
  throw new Error('Invalid data');
}

function isProcessedData(value: unknown): value is ProcessedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value
  );
}
```

### Explicit Return Types

**✅ CORRECT: Always specify return types for exported functions**
```typescript
export function getUser(id: string): User | null {
  // Implementation
}
```

**❌ INCORRECT: Missing return type**
```typescript
export function getUser(id: string) {
  // Implementation - return type inferred
}
```

### Type-Only Imports

**✅ CORRECT: Use `import type` for type-only imports**
```typescript
import type { User } from '@/types/auth/user';
import { requireUserId } from '@/lib/auth/server';
```

**❌ INCORRECT: Regular import for types**
```typescript
import { User } from '@/types/auth/user'; // Type-only, should use import type
```

## 📝 Type Definitions

### Interface vs Type Alias

**Use Interfaces for:**
- Object shapes that may be extended
- Public APIs
- Component props

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

interface UserProps {
  user: User;
  onUpdate?: (user: User) => void;
}
```

**Use Type Aliases for:**
- Unions and intersections
- Mapped types
- Utility types

```typescript
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = User & { status: Status };
type UserKeys = keyof User;
```

### Optional Properties with `exactOptionalPropertyTypes`

**✅ CORRECT: Conditional spreading**
```typescript
interface Config {
  timeout?: number;
  retry: boolean;
}

const config: Config = {
  ...(maybeTimeout ? { timeout: maybeTimeout } : undefined),
  retry: true,
};
```

**❌ INCORRECT: Direct undefined assignment**
```typescript
const config: Config = {
  timeout: maybeTimeout, // Error if maybeTimeout could be undefined
  retry: true,
};
```

### Index Signatures

**✅ CORRECT: Use `Record<string, unknown>` for dynamic data**
```typescript
interface Metadata {
  [key: string]: unknown;
}

// Or use Record utility type
type Metadata = Record<string, unknown>;
```

**❌ INCORRECT: Using `any`**
```typescript
interface Metadata {
  [key: string]: any; // Use unknown instead
}
```

## 🛡️ Type Guards

### Custom Type Guards

**✅ CORRECT: Type guard functions**
```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as { id?: unknown }).id === 'string' &&
    'email' in value &&
    typeof (value as { email?: unknown }).email === 'string'
  );
}

// Usage
const data: unknown = fetchData();
if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.email);
}
```

### Zod Schema Validation

**✅ CORRECT: Use Zod for runtime validation**
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

function processUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

## 🔄 Generic Types

### Generic Constraints

**✅ CORRECT: Proper generic constraints**
```typescript
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
  
  async save(user: User): Promise<User> {
    // Implementation
  }
}
```

**❌ INCORRECT: Unconstrained generics**
```typescript
interface Repository<T> {
  findById(id: any): Promise<T | null>; // Avoid any
}
```

## 🎨 React TypeScript Patterns

### Component Props

**✅ CORRECT: Explicit prop types**
```typescript
'use client';

import type { ComponentProps } from 'react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {label}
    </button>
  );
}
```

### Extending Component Props

**✅ CORRECT: Use `ComponentProps` utility**
```typescript
import type { ComponentProps } from 'react';

interface CustomButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary';
}

export function CustomButton({ variant, ...props }: CustomButtonProps) {
  return <button {...props} data-variant={variant} />;
}
```

### Hooks with Types

**✅ CORRECT: Typed custom hooks**
```typescript
interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUser(userId: string): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUser(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { user, loading, error, refetch };
}
```

## 🚫 Common Pitfalls

### Avoiding `as any`

**❌ INCORRECT: Type assertions with `any`**
```typescript
const data = response as any;
const value = data.someProperty;
```

**✅ CORRECT: Proper type narrowing**
```typescript
const data = response as unknown;
if (isValidResponse(data)) {
  const value = data.someProperty; // Type-safe
}
```

### Array Access Safety

**With `noUncheckedIndexedAccess: true`:**
```typescript
// ❌ INCORRECT: Unsafe array access
const first = items[0]; // Type: T | undefined

// ✅ CORRECT: Check before access
const first = items[0];
if (first !== undefined) {
  // Use first safely
}

// ✅ CORRECT: Use optional chaining
const first = items[0] ?? defaultValue;
```

### Object Property Access

**With `noPropertyAccessFromIndexSignature: true`:**
```typescript
interface Config {
  [key: string]: unknown;
}

// ❌ INCORRECT: Direct property access
const value = config.timeout; // Error

// ✅ CORRECT: Index access
const value = config['timeout'];

// ✅ CORRECT: Type guard
if ('timeout' in config && typeof config['timeout'] === 'number') {
  const timeout = config['timeout']; // Type-safe
}
```

## 📚 Advanced Patterns

### Discriminated Unions

**✅ CORRECT: Use discriminated unions for type safety**
```typescript
type ApiResponse =
  | { status: 'success'; data: User }
  | { status: 'error'; message: string };

function handleResponse(response: ApiResponse) {
  if (response.status === 'success') {
    console.log(response.data); // TypeScript knows data exists
  } else {
    console.log(response.message); // TypeScript knows message exists
  }
}
```

### Mapped Types

**✅ CORRECT: Use mapped types for transformations**
```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

### Conditional Types

**✅ CORRECT: Use conditional types for complex logic**
```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type ApiResult<T> = T extends string
  ? { value: T; length: number }
  : { value: T };
```

## 🧪 Testing with TypeScript

### Type-Safe Test Utilities

**✅ CORRECT: Typed test helpers**
```typescript
import type { User } from '@/types/auth/user';

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

describe('UserService', () => {
  it('should create user', () => {
    const user = createMockUser({ email: 'custom@example.com' });
    expect(user.email).toBe('custom@example.com');
  });
});
```

## 🔍 Type Checking Workflow

### Development

```bash
# Fast feedback during development
pnpm typecheck:fast

# Full type check
pnpm typecheck
```

### Pre-Commit

```bash
# Run before committing
pnpm typecheck && pnpm lint && pnpm test
```

### CI/CD

```bash
# Production-grade type checking
pnpm typecheck:prod
```

## 📖 Related Documentation

- [Coding Standards](../development/coding-standards.md) - General coding standards
- [Testing Strategy](../testing-quality/testing-strategy.md) - Testing with TypeScript
- [API Patterns](../api-data/api-patterns.md) - API type safety

---

**Last updated:** 2025-01-15
