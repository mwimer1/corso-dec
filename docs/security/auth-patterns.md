---
status: "draft"
title: "Security"
description: "Documentation and resources for documentation functionality. Located in security/."
category: "documentation"
last_updated: "2025-12-13"
---
# Authentication Patterns

This guide covers authentication patterns using Clerk, including server/client boundaries, security practices, and single-tenant considerations.

## Clerk Integration

### Server-Side Authentication
```typescript
import { auth } from '@clerk/nextjs/server';

// ✅ Good: Server-side auth validation
export async function getUserData() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return { userId };
}
```

#### Client-Side Authentication
```typescript
'use client';

import { useUser, useAuth } from '@clerk/nextjs';

// ✅ Good: Client-side auth state
function UserProfile() {
  const { user } = useUser();
  const { signOut } = useAuth();

  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Security Boundaries

#### Server-Only Code Protection
```typescript
// lib/auth/server-only.ts
import 'server-only';
import { auth } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');
  return { userId };
}
```

#### Client-Safe Wrappers
```typescript
// lib/auth/client-safe.ts
import { useUser } from '@clerk/nextjs';

export function useAuthUser() {
  const { user, isLoaded } = useUser();
  return { user, isLoaded };
}
```

### Single-Tenant Patterns

#### User Data Access
```typescript
export async function getUserData(userId: string) {
  const { userId: authenticatedUserId } = await auth();

  // Ensure user can only access their own data
  if (authenticatedUserId !== userId) {
    throw new Error('Access denied');
  }

  return getDataForUser(userId);
}
```

#### Role-Based Access Control
```typescript
import { hasRole } from '@/lib/auth/roles';

export async function adminOnlyAction() {
  const { userId } = await auth();

  if (!hasRole(userId, 'admin')) {
    throw new Error('Admin access required');
  }

  return performAdminAction();
}
```

### Route Protection

#### Protected Route Pattern
```typescript
// app/(protected)/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <Dashboard userId={userId} />;
}
```

#### Middleware Protection
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/', '/pricing', '/contact'],
  afterAuth(auth, req) {
    if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
      return Response.redirect(new URL('/sign-in', req.url));
    }
  }
});
```

### Webhook Security

#### Clerk Webhook Verification
```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const payload = wh.verify(body, {
    'svix-id': headersList.get('svix-id')!,
    'svix-timestamp': headersList.get('svix-timestamp')!,
    'svix-signature': headersList.get('svix-signature')!,
  });

  // Process verified webhook
  return Response.json({ received: true });
}
```

### Session Management

#### Session Validation
```typescript
export async function validateSession() {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;

  // Check session expiry
  const now = Math.floor(Date.now() / 1000);
  if (sessionClaims.exp < now) {
    throw new Error('Session expired');
  }

  return { userId, sessionClaims };
}
```

#### Session Refresh
```typescript
'use client';

import { useAuth } from '@clerk/nextjs';

function SessionRefresher() {
  const { getToken } = useAuth();

  useEffect(() => {
    const refreshToken = async () => {
      try {
        await getToken({ skipCache: true });
      } catch (error) {
        // Handle refresh failure
        signOut();
      }
    };

    const interval = setInterval(refreshToken, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [getToken]);

  return null;
}
```

### Security Best Practices

#### CSRF Protection
```typescript
import { getCsrfToken } from '@/lib/security/csrf';

export async function POST(req: Request) {
  const csrfToken = req.headers.get('x-csrf-token');
  const expectedToken = await getCsrfToken();

  if (!csrfToken || csrfToken !== expectedToken) {
    throw new Error('CSRF token mismatch');
  }

  // Process request
}
```

#### Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for');
  const limited = await checkRateLimit(`auth:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (limited) {
    throw new Error('Too many requests');
  }

  // Process authentication
}
```

### Error Handling

#### Authentication Errors
```typescript
export class AuthError extends ApplicationError {
  constructor(message: string, code: string) {
    super(message, 'AUTH_ERROR', { code });
  }
}

export async function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: 401 }
    );
  }

  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Testing Patterns

#### Mock Authentication
```typescript
import { vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({
    userId: 'test-user-id'
  }))
}));
```

#### Auth Integration Tests
```typescript
describe('Authentication', () => {
  it('requires authentication for protected routes', async () => {
    // Mock unauthenticated state
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(401);
  });

  it('allows access with valid authentication', async () => {
    // Mock authenticated state
    vi.mocked(auth).mockResolvedValue({
      userId: 'user-123'
    });

    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(200);
  });
});
```

### Performance Considerations

#### Auth Caching
```typescript
// Cache user data to reduce database calls
const userCache = new Map<string, UserData>();

export async function getCachedUserData(userId: string) {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  const userData = await fetchUserData(userId);
  userCache.set(userId, userData);

  // Expire cache after 5 minutes
  setTimeout(() => userCache.delete(userId), 5 * 60 * 1000);

  return userData;
}
```

#### Lazy Loading Auth State
```typescript
'use client';

import { useUser } from '@clerk/nextjs';

function AuthAwareComponent() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return user ? <AuthenticatedView /> : <SignInPrompt />;
}
```

---

**Related Documentation:**
- [API Patterns & Data Fetching](../api-data/api-patterns.md)
- [Development Setup Guide](../development/setup-guide.md)
- [Security Policy](security-policy.md)

