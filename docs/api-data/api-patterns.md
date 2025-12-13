---
status: "draft"
title: "Api Data"
description: "Documentation and resources for documentation functionality. Located in api-data/."
category: "documentation"
last_updated: "2025-12-13"
---
# API Patterns & Data Fetching

This guide covers best practices for implementing secure, validated APIs, server actions, and data fetching patterns in Corso applications.

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
import { validateAuth, checkRateLimit } from '@/lib/actions';
import { updateUserProfile } from '@/lib/user/service';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function updateProfile(input: unknown) {
  // 1. Authenticate
  const { userId } = await validateAuth();

  // 2. Validate input
  const data = UpdateProfileSchema.parse(input);

  // 3. Rate limit
  await checkRateLimit(`profile:${userId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  });

  // 4. Delegate to business logic
  return updateUserProfile(userId, data);
}
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

#### Role-Based Access
```typescript
export async function adminAction(input: unknown) {
  const { userId } = await validateAuth();

  if (!hasRole(userId, 'admin')) {
    throw new ForbiddenError('Admin access required', 'INSUFFICIENT_PERMISSIONS');
  }

  // Proceed with admin operation
  return performAdminAction(input);
}
```

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

#### Rate Limit Implementation
```typescript
import { checkRateLimit } from '@/lib/actions';

// User actions (frequent)
await checkRateLimit(`user:${userId}`, { maxRequests: 30, windowMs: 60000 });

// Sensitive operations (restricted)
await checkRateLimit(`sensitive:${userId}`, { maxRequests: 5, windowMs: 300000 });
```

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

vi.mock('@/hooks', () => ({
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

- [Warehouse Query Hooks](../codebase-apis/warehouse-queries.md) - Detailed hook usage
- [API Security Patterns](../security/README.md) - Security implementation
- [Data Fetching Patterns](../api-data/api-patterns.md) - Current patterns (this document)

