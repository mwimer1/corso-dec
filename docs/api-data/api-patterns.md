---
title: "Api Data"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# API Patterns & Data Fetching

This guide covers best practices for implementing secure, validated APIs, server actions, and data fetching patterns in Corso applications.

## 🏗️ API Route Runtime Selection

### ⚠️ CRITICAL: Runtime Declaration & Wrapper Matching

**Always declare the runtime** in API route handlers and use the matching wrapper. Next.js defaults to Edge if not specified, which can cause failures if Node.js code is used.

**Quick Reference:**
- **Edge Runtime**: `export const runtime = 'edge';` → Use `withErrorHandlingEdge`, `withRateLimitEdge` from `@/lib/api`
- **Node.js Runtime**: `export const runtime = 'nodejs';` → Use `withErrorHandlingNode`, `withRateLimitNode` from `@/lib/middleware`

**When to use Edge:**
- Fast, stateless endpoints (health checks, CSP reports, public APIs)
- No database access, no Clerk `auth()`, no Node.js-only features

**When to use Node.js:**
- Database operations, Clerk authentication, webhooks
- Any route requiring Node.js-only features

See [Error Handling Guide](../error-handling/error-handling-guide.md) and [Security Implementation](../security/security-implementation.md) for detailed examples.

## 🏗️ Server Actions Patterns

### Core Principles

**Server Actions Rules:**
- Always start with `'use server'`
- 5-15 lines maximum per action
- Authenticate, validate, rate-limit, then delegate
- Throw structured errors, never generic ones
- Use Zod schemas for all input validation

### Basic Structure

#### Template Pattern
```typescript
'use server';

import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { withRateLimitNode } from '@/lib/middleware';
import { updateUserProfile } from '@/lib/user/service';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

// For API routes, use wrapper pattern:
// ⚠️ CRITICAL: Always declare runtime and use matching wrapper
// Note: This example uses Node.js runtime for Clerk authentication
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Node wrappers from @/lib/middleware for Node.js routes
import { withRateLimitNode, withErrorHandlingNode } from '@/lib/middleware';

export const POST = withErrorHandlingNode(
  withRateLimitNode(
    async (req: NextRequest) => {
      // 1. Authenticate
      const { userId } = await auth();
      if (!userId) {
        return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
      }

      // 2. Validate input
      const body = await req.json();
      const data = UpdateProfileSchema.parse(body);

      // 3. Delegate to business logic
      const result = await updateUserProfile(userId, data);
      return http.ok(result);
    },
    { maxRequests: 10, windowMs: 60_000 } // 1 minute
  )
);
```

### Authentication & Authorization

#### Auth Validation
```typescript
import { auth } from '@clerk/nextjs/server';

export async function validateAuth() {
  const { userId, orgId } = await auth();
  if (!userId) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  }
  return { userId, orgId };
}
```

#### Role-Based Access Control (RBAC)

**Important**: Use Clerk's `has({ role })` method for role checks. Never use deprecated `hasRole()` utilities.

```typescript
import { auth } from '@clerk/nextjs/server';

export async function adminAction(input: unknown) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  }
  
  // ✅ CORRECT: Use Clerk's has({ role }) method
  if (!has({ role: 'admin' })) {
    throw new ForbiddenError('Admin access required', 'INSUFFICIENT_PERMISSIONS');
  }

  // Proceed with admin operation
  return performAdminAction(input);
}
```

**Available Roles**: `'member'`, `'admin'`, `'owner'`, `'viewer'`, `'service'` (see OpenAPI RBAC configuration)

### Input Validation

#### Zod Schema Patterns
```typescript
// Simple validation
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

// Complex validation with transforms
const ProcessDataSchema = z.object({
  data: z.string().transform((val) => JSON.parse(val)),
  options: z.object({
    format: z.enum(['json', 'csv']),
    includeMetadata: z.boolean().default(false),
  }).optional(),
});
```

### Rate Limiting

#### Rate Limit Implementation (API Routes)

⚠️ **CRITICAL**: Always declare the runtime in route handlers and use the matching wrapper from either `@/lib/api` (Edge) or `@/lib/middleware` (Node). Mismatching runtime and wrapper will cause runtime errors.

**Edge Runtime Example:**
```typescript
// ⚠️ Always declare runtime for Edge routes
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Edge wrappers from @/lib/api for Edge routes
import { withRateLimitEdge, withErrorHandlingEdge } from '@/lib/api';

export const POST = withErrorHandlingEdge(
  withRateLimitEdge(
    async (req: NextRequest) => {
      // Handler implementation
    },
    { maxRequests: 30, windowMs: 60_000 }
  )
);
```

**Node.js Runtime Example:**
```typescript
// ⚠️ Always declare runtime for Node.js routes
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Node wrappers from @/lib/middleware for Node.js routes
import { withRateLimitNode, withErrorHandlingNode } from '@/lib/middleware';

export const POST = withErrorHandlingNode(
  withRateLimitNode(
    async (req: NextRequest) => {
      // Handler implementation
    },
    { maxRequests: 30, windowMs: 60_000 }
  )
);
```

**Import Locations:**
- Edge wrappers: `@/lib/api` or `@/lib/middleware`
- Node wrappers: `@/lib/middleware` only

### Error Handling

#### Structured Error Types
```typescript
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, code: string, public fieldErrors?: any[]) {
    super(message, code, { fieldErrors });
  }
}
```

## 📊 Data Fetching Patterns

### Warehouse Query Hooks

For detailed warehouse query patterns, see the [canonical warehouse queries guide](../codebase-apis/warehouse-queries.md).

#### Conditional Queries

##### Enabled/Disabled Queries
```typescript
const { data } = useWarehouseQuery(
  'SELECT * FROM projects',
  { enabled: isReady }
);
```

##### Dependent Queries
```typescript
// Query runs only after user data is available
const { data: userData } = useWarehouseQuery(
  'SELECT * FROM users WHERE id = ?',
  { enabled: !!userId }
);

// Dependent query
const { data: projectsData } = useWarehouseQuery(
  'SELECT * FROM projects',
  { enabled: !!userData }
);
```

### Optimistic Updates

#### Mutation with Optimistic Update
```typescript
function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onMutate: async (newProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['projects']);

      // Optimistically update
      queryClient.setQueryData(['projects'], (old) => [...old, newProject]);

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      // Revert on error
      queryClient.setQueryData(['projects'], context.previousProjects);
    },
    onSettled: () => {
      // Always refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Performance Optimization

#### Query Splitting
```typescript
// ✅ Split large queries for better caching
const { data: summary } = useWarehouseQueryCached(
  ['projects-summary'],
  'SELECT COUNT(*), status FROM projects GROUP BY status'
);

const { data: details } = useWarehouseQueryCached(
  ['projects-details', page],
  'SELECT * FROM projects LIMIT ? OFFSET ?'
);
```

#### Background Refetching
```typescript
const { data, isFetching } = useWarehouseQuery(
  'SELECT * FROM projects',
  {
    refetchOnWindowFocus: true,    // Refetch when window regains focus
    refetchOnReconnect: true,      // Refetch on network reconnect
    refetchInterval: 5 * 60 * 1000 // Background refetch every 5 minutes
  }
);
```

### Cache Management

#### Manual Cache Updates
```typescript
const queryClient = useQueryClient();

// Update specific query
queryClient.setQueryData(['projects', projectId], updatedProject);

// Invalidate related queries
queryClient.invalidateQueries({ queryKey: ['projects'] });

// Remove specific cache entry
queryClient.removeQueries({ queryKey: ['projects', projectId]});
```

### Server State vs Client State

#### Server State (React Query)
- Data from APIs, databases
- Cached, synchronized, shared
- Requires network requests
- Managed by React Query

#### Client State (useState, Zustand)
- UI state, form data, local interactions
- Not cached, not shared between sessions
- No network requests
- Managed by component state

```typescript
// ✅ Server state - cached API data
const { data: projects } = useWarehouseQuery('SELECT * FROM projects');

// ✅ Client state - local UI state
const [selectedProject, setSelectedProject] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

## 🔄 Migration from Legacy Patterns

### From Direct Fetch
```typescript
// ❌ OLD: Direct fetch (no caching, error handling)
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/query', { body: JSON.stringify({ sql }) })
    .then(res => res.json())
    .then(setData);
}, [sql]);

// ✅ NEW: Warehouse hooks (caching, error handling, type safety)
const { data, isLoading, error } = useWarehouseQuery<MyData>(
  'SELECT * FROM my_table'
);
```

### From Custom Hooks
```typescript
// ❌ OLD: Custom hook without proper caching
function useCustomData() {
  return useSWR('/api/custom', fetcher);
}

// ✅ NEW: Consistent warehouse pattern
function useCustomData() {
  return useWarehouseQueryCached(
    ['custom-data'],
    'SELECT * FROM custom_table',
    { staleTime: 5 * 60 * 1000 }
  );
}
```

## 🧪 Testing Patterns

### Mock Queries
```typescript
import { vi } from 'vitest';

// Mock hooks from their domain locations, e.g.:
// vi.mock('@/components/ui/hooks/use-arrow-key-navigation', () => ({
  useWarehouseQuery: vi.fn(() => ({
    data: mockProjects,
    isLoading: false,
    error: null
  }))
}));
```

### Test Query Behavior
```typescript
describe('ProjectList', () => {
  it('displays loading state', () => {
    vi.mocked(useWarehouseQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    });

    render(<ProjectList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## 🛡️ Security Considerations

### CSRF Protection
```typescript
// Server action includes CSRF token automatically
// For custom forms, include the token
import { csrf } from '@/lib/security/csrf';

export async function secureAction(formData: FormData) {
  const token = formData.get('csrfToken') as string;
  await csrf.verify(token);

  // Proceed with action
}
```

### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

export async function createPost(input: CreatePostInput) {
  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(input.content);

  return createPostInDb({ ...input, content: sanitizedContent });
}
```

## 📚 Related Documentation

- [API Design Guide](../api/api-design-guide.md) - Complete OpenAPI documentation workflow, endpoint creation, and type generation
- [Warehouse Query Hooks](../codebase-apis/warehouse-queries.md) - Detailed hook usage
- [API Security Patterns](../security/README.md) - Security implementation
- [Data Fetching Patterns](../api-data/api-patterns.md) - Current patterns (this document)
