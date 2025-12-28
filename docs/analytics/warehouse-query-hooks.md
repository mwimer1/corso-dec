---
title: "Analytics"
description: "Documentation and resources for documentation functionality. Located in analytics/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
> Refer to the canonical warehouse query rules: [`docs/codebase-apis/warehouse-queries.md`](../codebase-apis/warehouse-queries.md).

## Overview

These hooks consume the canonical warehouse endpoints/patterns. Avoid duplicating query rules here; keep this page focused on hook usage.

### Key Benefits

- **🔒 Security-First**: All queries use parameterized queries and input validation
- **⚡ Performance Optimized**: Intelligent caching with configurable stale times
- **🔧 Type-Safe**: Full TypeScript support with generic type parameters
- **🚀 Developer Experience**: Simple APIs with comprehensive error handling
- **🏗️ Architecturally Sound**: Clean separation between UI and data access layers

---

## Hook Architecture

### Three-Tier Architecture

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │   Domain Hooks   │    │   Base Hooks    │
│                 │    │                  │    │                 │
│ useWarehouseQuery   │◄──┤ useWarehouseQuery   │◄──┤ useWarehouseQueryBase
│ useWarehouseQueryCached │  │ useWarehouseQueryCached│  │ createWarehouseQueryHook
│ useDynamicGridData │    │                  │    │ executeWarehouseQuery
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Hook Hierarchy

1. **Base Hooks** - Core functionality would be domain-colocated if implemented
2. **Domain Hooks** - Pre-configured for common use cases, domain-colocated (e.g., `components/dashboard/hooks/`)
3. **UI Components** - Consume hooks for data rendering

---

## Base Hooks (`useWarehouseQueryBase`)

The foundation hook for all warehouse queries. Use this for advanced use cases requiring custom configuration.

### Signature

```typescript
function useWarehouseQueryBase<T = unknown>(options: WarehouseQueryBaseOptions<T>): UseQueryResult<T[], Error>
```

### Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `sql` | `string` | ✅ | - | The SQL query to execute |
| `queryKey` | `readonly string[]` | ✅ | - | React Query cache key |
| `options` | `QueryOpts<T>` | ❌ | `{}` | React Query options |
| `autoLimit` | `boolean` | ❌ | `true` | Add LIMIT 1000 if no LIMIT clause |
| `staleTime` | `number` | ❌ | `0` | Cache stale time in milliseconds |

### Basic Usage

```typescript
// Note: Warehouse query hooks would be domain-colocated if implemented
// import { useWarehouseQueryBase } from '@/components/dashboard/hooks/use-warehouse-query-base';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
}

function ProjectsList() {
  const { data, isLoading, error } = useWarehouseQueryBase<Project>({
    sql: 'SELECT * FROM projects',
    queryKey: ['projects'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### Advanced Configuration

```typescript
const { data } = useWarehouseQueryBase({
  sql: 'SELECT * FROM large_table',
  queryKey: ['large-table'],
  autoLimit: false, // Disable auto-limit for large queries
  staleTime: 10 * 60 * 1000, // 10 minutes
  options: {
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
});
```

---

## Domain Hooks

Pre-configured hooks for common use cases. These wrap the base hook with sensible defaults.

### `useWarehouseQuery`

For simple queries where you want automatic cache key generation based on the SQL.

```typescript
// Note: Warehouse query hooks would be domain-colocated if implemented
// import { useWarehouseQuery } from '@/components/dashboard/hooks/use-warehouse-query';

const { data, isLoading, error } = useWarehouseQuery<Project>(
  'SELECT * FROM projects',
  { staleTime: 5 * 60 * 1000 }
);
```

**Cache Key**: `['clickhouse', sql]` (automatic)

### `useWarehouseQueryCached`

For complex queries with custom cache keys and 1-hour default stale time.

```typescript
// Note: Warehouse query hooks would be domain-colocated if implemented
// import { useWarehouseQueryCached } from '@/components/dashboard/hooks/use-warehouse-query-cached';

const { data, isLoading, error } = useWarehouseQueryCached<Project>(
  ['projects', filters], // Custom cache key
  'SELECT * FROM projects WHERE status = ?',
  { staleTime: 30 * 60 * 1000 } // 30 minutes (optional override)
);
```

**Cache Key**: `['clickhouse', ...cacheKey, sql]` (custom)
**Default Stale Time**: 1 hour (60 × 60 × 1000 ms)

### `useDynamicGridData`

For pre-configured dashboard grids that map to specific ClickHouse tables.

```typescript
// Note: Warehouse query hooks would be domain-colocated if implemented
// import { useDynamicGridData } from '@/components/dashboard/hooks/use-dynamic-grid-data';

const { data, isLoading, error } = useDynamicGridData('projects');

// With options
const { data, isLoading, error } = useDynamicGridData('companies', {
  enabled: !!isReady
});
```

**Supported Grid Types**: `projects`, `companies`, `addresses`, `chat`

**Grid Configuration**: Each grid has pre-configured SQL, columns, and filtering options defined in `GRID_TABLE_MAP`.

---

## Factory Pattern (`createWarehouseQueryHook`)

Create custom warehouse query hooks with pre-configured behavior.

```typescript
// Note: Warehouse query hooks would be domain-colocated if implemented
// import { createWarehouseQueryHook } from '@/components/dashboard/hooks/create-warehouse-query-hook';

const useAnalyticsQuery = createWarehouseQueryHook({
  staleTime: 10 * 60 * 1000, // 10 minutes
  autoLimit: true,
  makeKey: ({ sql, cacheKey = [] }) => ['analytics', ...cacheKey, sql],
});

// Use the custom hook
const { data } = useAnalyticsQuery<Metric>(
  'SELECT * FROM metrics'
);
```

---

## Security & Validation

### Automatic Security

All warehouse queries automatically:
- ✅ **Authenticate** via Clerk-protected API endpoints
- ✅ **Validate** SQL for security and injection prevention (single-tenant)
- ✅ **Rate limit** (60 queries/minute per user)

### SQL Injection Prevention

```typescript
// ✅ CORRECT: Server-side parameterization
const { data } = useWarehouseQuery(
  'SELECT * FROM projects WHERE status = ?'
);

// ❌ INCORRECT: Client-side string interpolation (vulnerable)
const sql = `SELECT * FROM projects WHERE status = '${status}'`; // DANGEROUS
```

### Input Validation

All SQL queries are validated for:
- **Parameter safety**: Only parameterized queries are allowed
- **SQL injection prevention**: Dangerous patterns are blocked
- **Query complexity limits**: Large result sets are automatically limited

---

## Performance Optimization

### Cache Key Strategies

#### Effective Cache Keys
```typescript
// ✅ Specific, stable keys
const key = ['projects', status, priority];

// ✅ Include all query parameters
const key = ['projects', { status, priority, dateRange }];
```

#### Ineffective Cache Keys
```typescript
// ❌ Too broad (poor cache utilization)
const key = ['all-projects'];

// ❌ Unstable (new key every render)
const key = ['projects', Date.now()];
```

### Stale Time Configuration

| Data Type | Recommended Stale Time | Default Hook | Rationale |
|-----------|----------------------|--------------|-----------|
| Real-time data | `0` | `useWarehouseQuery` | Always fresh |
| User actions | `30 * 1000` (30s) | `useWarehouseQuery` | Recent changes |
| Dashboard data | `5 * 60 * 1000` (5min) | `useWarehouseQuery` | Balance freshness/performance |
| Static config | `60 * 60 * 1000` (1hr) | `useWarehouseQueryCached` | Rarely changes |

```typescript
// Real-time data (always fresh)
const { data: sessions } = useWarehouseQuery(
  'SELECT * FROM user_sessions'
  // staleTime: 0 (default)
);

// Dashboard data (5-minute cache)
const { data: metrics } = useWarehouseQuery(
  'SELECT * FROM metrics',
  { staleTime: 5 * 60 * 1000 }
);

// Static configuration (1-hour cache - use cached hook for better defaults)
const { data: config } = useWarehouseQueryCached(
  ['app-config'],
  'SELECT * FROM config'
  // staleTime: 60 * 60 * 1000 (default)
);
```

### Auto-Limit Protection

By default, queries without `LIMIT` clauses automatically get `LIMIT 1000`:

```typescript
// User query: SELECT * FROM projects
// Server executes: SELECT * FROM projects LIMIT 1000
```

Disable for intentional large queries:

```typescript
const { data } = useWarehouseQueryBase({
  sql: 'SELECT * FROM projects',
  queryKey: ['all-projects'],
  autoLimit: false // Explicit large query
});
```

---

## Error Handling

### Complete Error States

```typescript
function DataComponent() {
  const { data, isLoading, error, refetch } = useWarehouseQuery(
    'SELECT * FROM projects'
  );

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state with retry
  if (error) {
    return (
      <ErrorMessage
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState message="No projects found" />;
  }

  // Success state
  return <DataGrid data={data} />;
}
```

### Error Types

| Error Type | Cause | User Message |
|------------|-------|--------------|
| Network Error | API unreachable | "Unable to load data. Check your connection." |
| Authentication Error | Not logged in | "Please log in to view this data." |
| Authorization Error | Insufficient permissions | "You don't have permission to view this data." |
| SQL Error | Invalid query | "There was an error processing your request." |
| Rate Limit | Too many requests | "Too many requests. Please try again later." |

### Error Recovery

```typescript
const { data, error, refetch } = useWarehouseQuery(
  'SELECT * FROM projects',
  {
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes('Unauthorized')) return false;
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
    onError: (err) => {
      // Log to monitoring service
      console.error('Warehouse query failed:', err);
    }
  }
);
```

---

## Type Safety

### Generic Type Usage

```typescript
interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
}

// ✅ Type-safe usage
const { data } = useWarehouseQuery<Project>(
  'SELECT id, name, status, created_at FROM projects'
);

// TypeScript knows: data is Project[] | undefined
data?.forEach(project => {
  console.log(project.name); // ✅ Type safe
  console.log(project.unknownField); // ❌ TypeScript error
});
```

### Union Types

```typescript
type SearchResult = Project | Company | Contact;

const { data } = useWarehouseQuery<SearchResult>(
  'SELECT * FROM search_results WHERE query = ?'
);

// TypeScript enforces union type safety
data?.forEach(result => {
  if ('project_type' in result) {
    // It's a Project
    console.log(result.project_type);
  }
});
```

### Type Guards

```typescript
function isProject(result: SearchResult): result is Project {
  return 'project_type' in result;
}

const { data } = useWarehouseQuery<SearchResult>('...');

data?.forEach(result => {
  if (isProject(result)) {
    console.log(result.project_type); // ✅ Type safe
  }
});
```

---

## Advanced Patterns

### Conditional Queries

```typescript
const { data } = useWarehouseQuery(
  'SELECT * FROM projects',
  {
    enabled: isReady, // Only run when conditions are met
  }
);
```

### Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

### Debounced Search

```typescript
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useWarehouseQueryCached(
    ['search', debouncedQuery],
    'SELECT * FROM items WHERE name LIKE ?',
    {
      enabled: debouncedQuery.length > 2, // Only search after 3+ chars
    }
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <div>Searching...</div>}
      {data && <SearchResults results={data} />}
    </div>
  );
}
```

### Infinite Scroll

```typescript
function useInfiniteProjects() {
  return useInfiniteQuery({
    queryKey: ['projects-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;
      return executeWarehouseQuery<Project>(
        `SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [PAGE_SIZE, offset]
      );
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === PAGE_SIZE ? pages.length : undefined;
    },
  });
}
```

---

## Migration Guide

### From Direct Fetch

```typescript
// ❌ OLD: Direct fetch (no caching, error handling)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/query', {
    method: 'POST',
    body: JSON.stringify({ sql })
  })
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
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

### From jQuery AJAX

```typescript
// ❌ OLD: jQuery AJAX (no TypeScript, manual error handling)
$.ajax({
  url: '/api/query',
  method: 'POST',
  data: { sql },
  success: (data) => setData(data),
  error: (err) => setError(err)
});

// ✅ NEW: Modern React hooks
const { data, isLoading, error } = useWarehouseQuery<MyData>(sql);
```

---

## API Reference

### `useWarehouseQueryBase`

**Parameters:**
- `sql: string` - The SQL query to execute
- `queryKey: readonly string[]` - React Query cache key
- `options?: QueryOpts<T>` - Optional React Query configuration
- `autoLimit?: boolean` - Auto-add LIMIT 1000 (default: true)
- `staleTime?: number` - Cache stale time (default: 0)

**Returns:** `UseQueryResult<T[], Error>` - React Query result object

### `createWarehouseQueryHook`

**Parameters:**
- `defaults: WarehouseQueryHookDefaults` - Hook configuration

**Returns:** Factory function for creating warehouse query hooks

### `executeWarehouseQuery`

**Parameters:**
- `sql: string` - The SQL query to execute

**Returns:** `Promise<T[]>` - Array of query results

**Throws:** `Error` when query fails

---

## Troubleshooting

### Common Issues

#### Query Not Executing
```typescript
// ❌ Empty SQL string disables query
const { data } = useWarehouseQuery(''); // Won't execute

// ✅ Valid SQL enables query
const { data } = useWarehouseQuery('SELECT * FROM projects'); // Will execute
```

#### Cache Key Changing
```typescript
// ❌ Unstable cache key causes re-fetching
const { data } = useWarehouseQueryCached(
  ['projects', Date.now()], // New key every render
  'SELECT * FROM projects'
);

// ✅ Stable cache key
const { data } = useWarehouseQueryCached(
  ['projects'], // Stable key
  'SELECT * FROM projects'
);
```

#### Memory Leaks
```typescript
// ❌ Infinite stale time prevents cleanup
const { data } = useWarehouseQuery('SELECT * FROM large_table', {
  staleTime: Infinity // Never cleans up
});

// ✅ Reasonable stale time
const { data } = useWarehouseQuery('SELECT * FROM large_table', {
  staleTime: 30 * 60 * 1000 // 30 minutes
});
```

### Performance Issues

#### Slow Queries
```typescript
// Add database indexes for frequently filtered columns
-- ClickHouse index recommendation
ALTER TABLE projects ADD INDEX idx_status status TYPE bloom_filter GRANULARITY 64;
```

#### Excessive Re-renders
```typescript
// ✅ Memoize expensive operations
const processedData = useMemo(() =>
  data?.map(item => expensiveOperation(item)),
  [data]
);

// ✅ Debounce user input
const debouncedQuery = useDebounce(query, 300);
```

### Debugging

#### Query Inspection
```typescript
const { data, isLoading, error } = useWarehouseQuery(
  'SELECT * FROM projects',
  {
    onSuccess: (data) => console.log('Query succeeded:', data),
    onError: (error) => console.error('Query failed:', error),
  }
);
```

#### Network Inspection
```typescript
// Check browser network tab for:
// - API endpoint: /api/v1/entity/{entity}/query (for entity queries)
// - Request payload: { page: { index: 0, size: 50 }, sort: [...], filter: {...} }
// - Response: { success: true, data: { rows: [...], columns: [...], total: 100 } }
```

---

## Related Documentation

- [ClickHouse Performance Guide](./clickhouse-recommendations.md) - Database optimization
- [Warehouse Queries API](../codebase-apis/warehouse-queries.md) - Canonical warehouse query patterns
- [Security Standards](../security/README.md) - Security implementation

---

## Mock backend (development setup)

When `CORSO_USE_MOCK_DB` is enabled, warehouse queries are served by a mock backend that reads from checked-in JSON fixtures in `public/__mockdb__/`.

- API route: `app/api/v1/entity/{entity}/query/route.ts` (for entity queries)
- Reader: `lib/integrations/clickhouse/server.ts`
- Data source: Mock JSON files in `public/__mockdb__/{companies,projects,addresses}.json` (canonical source, edit directly to change mock data)

---

## Windows-First Development Tips

- Use `pnpm typecheck` to quickly validate warehouse query usage
- Use `pnpm lint` to validate ESLint rules (including warehouse query patterns)
- Use `pnpm ast-grep:scan` for remaining AST-Grep pattern validation (~4 rules)
- Use `git --no-pager log --oneline --grep="warehouse"` to track query-related changes
- Prefer `| type` over `| cat` when piping query results in Windows terminals

Last updated: 2025-09-01
