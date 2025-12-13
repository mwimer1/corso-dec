---
title: "Auth"
description: "Core lib utilities and functionality for the Corso platform. Located in auth/."
category: "library"
last_updated: "2025-12-13"
status: "active"
---
# Authentication Domain

Authentication, role-based access control, and billing access control with Clerk v6. This domain provides server-side authentication guards, client-safe Clerk utilities, and authorization helpers for the Corso platform.

## Overview

The `lib/auth` domain provides comprehensive authentication and authorization utilities built on Clerk v6. It includes server-only authentication guards, client-safe Clerk hooks, role-based access control, and appearance configuration.

### Key Responsibilities

- **Server-Side Authentication**: Guards and utilities for protected routes and server actions
- **Client-Side Integration**: React hooks and components for Clerk authentication
- **Role-Based Access Control**: RBAC utilities for authorization checks
- **Clerk Configuration**: Appearance and UI configuration for Clerk components

## Directory Structure

```
lib/auth/
├── index.ts                    # Client-safe barrel exports
├── server.ts                    # Server-only exports (Node.js runtime)
├── client.ts                    # Client-safe Clerk utilities
├── clerk-appearance.ts          # Clerk UI appearance configuration
└── authorization/
    └── roles.ts                 # RBAC role checking utilities
```

## Public API

### Client-Safe Exports (`@/lib/auth`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `clerkAppearance` | Clerk UI appearance config | Object | Used in Clerk components |
| Client utilities | Clerk hooks and components | Various | Import from `@/lib/auth/client` |
| `hasRole()` | Check user role (client-safe) | Function | `const isAdmin = hasRole(userId, 'admin')` |
| `assertRole()` | Assert user has required role (throws) | Function | `assertRole(userRole, ['admin', 'owner'])` |

### Server-Only Exports (`@/lib/auth/server`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `requireUserId()` | Require authenticated user (deprecated) | Function | `const userId = await requireUserId()` |

**Note**: `requireUserId()` is deprecated. Use `auth()` from `@clerk/nextjs/server` directly:

```typescript
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
if (!userId) return http.error(401, 'Unauthorized');
```

## Runtime Requirements

### Environment Support

- **Runtime**: Node.js (server utilities) | Client (Clerk hooks)
- **Client Context**: Yes (Clerk hooks and appearance config)
- **Server Context**: Yes (authentication guards)

### Route Context Usage

```typescript
// Server route with authentication
import { auth } from '@clerk/nextjs/server';
import { http } from '@/lib/api';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  
  // Process authenticated request
  return http.ok({ userId });
}
```

## Usage Examples

### Server-Side Authentication Guard

```typescript
import { auth } from '@clerk/nextjs/server';
import { http } from '@/lib/api';

export async function POST(req: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  
  // Process request for authenticated user
  const data = await req.json();
  return http.ok({ success: true, userId });
}
```

### Role-Based Access Control

```typescript
import { auth } from '@clerk/nextjs/server';
import { hasRole } from '@/lib/auth/authorization/roles';
import { http } from '@/lib/api';

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized');
  }
  
  // Check for admin role
  if (!hasRole(userId, 'admin')) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }
  
  // Admin-only operation
  return http.ok({ deleted: true });
}
```

### Client-Side Clerk Integration

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/auth';

export function UserProfile() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Welcome, {user.firstName}!</div>;
}
```

### Clerk Appearance Configuration

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  );
}
```

## Environment Variables

### Required Variables

| Variable | Purpose | Validation | Default |
|----------|---------|------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Required | N/A |
| `CLERK_SECRET_KEY` | Clerk secret key (server-only) | Required | N/A |

### Configuration Access

```typescript
// Server-side access
import { getEnv } from '@/lib/server/env';
const clerkKey = getEnv().CLERK_SECRET_KEY;

// Client-side access (public key only)
import { publicEnv } from '@/lib/shared/config/client';
const publishableKey = publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

## Validation & Types

### Runtime Validation

- **Authentication**: Handled by Clerk middleware and `auth()` function
- **Authorization**: Role checks via `hasRole()` utility

### Type Definitions

- **Clerk Types**: Provided by `@clerk/nextjs` package
- **Role Types**: Defined in `lib/auth/authorization/roles.ts`

## Security Considerations

### Authentication Patterns

- **Server-Side Guards**: Always check `auth()` in server routes and actions
- **Client-Side Checks**: Use Clerk hooks for UI state, but validate server-side
- **Session Validation**: Clerk handles session validation automatically

### Authorization Patterns

- **Role-Based Access**: Use `hasRole()` for permission checks
- **Tenant Isolation**: Ensure all queries are scoped to user's organization
- **Error Handling**: Return appropriate HTTP status codes (401, 403)

### Best Practices

1. **Never Trust Client**: Always validate authentication server-side
2. **Use Structured Errors**: Return `http.error()` with appropriate codes
3. **Log Security Events**: Log authentication failures and authorization denials
4. **Rate Limiting**: Apply rate limits to authentication endpoints

## Migration from Legacy Patterns

### Before (Deprecated)

```typescript
import { requireUserId } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(); // Throws on failure
  // Process request
}
```

### After (Recommended)

```typescript
import { auth } from '@clerk/nextjs/server';
import { http } from '@/lib/api';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  // Process request
}
```

## Related Documentation

- [Authentication Patterns](../../docs/security/auth-patterns.md) - Comprehensive auth guide
- [Security Standards](../../docs/security/security-policy.md) - Security best practices
- [API Patterns](../../docs/api-data/api-patterns.md) - API implementation patterns

---

**Last updated:** 2025-12-13  
**Runtime:** Node.js (server) | Client (hooks)
