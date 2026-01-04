# Warehouse Query Hooks - Extended Documentation

This document contains advanced patterns, migration guides, and extended examples for warehouse query hooks. For the concise rule, see [`.cursor/rules/warehouse-query-hooks.mdc`](../../.cursor/rules/warehouse-query-hooks.mdc).

## Advanced Patterns

### Optimistic Updates

```typescript
// ✅ CORRECT: Optimistic updates with mutations
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

### Factory Pattern for Reusable Hooks

```typescript
// ✅ CORRECT: Create domain-specific hook factories
import { createWarehouseQueryHook } from '@/hooks/shared/analytics';

const useAnalyticsQuery = createWarehouseQueryHook({
  staleTime: 10 * 60 * 1000, // 10 minutes
  autoLimit: true,
  makeKey: ({ sql, cacheKey = [] }) => ['analytics', ...cacheKey, sql],
});

function useDashboardMetrics() {
  return useAnalyticsQuery<MetricRow>(
    'SELECT * FROM metrics'
  );
}
```

## Common Pitfalls - Detailed Examples

### Infinite Loops

```typescript
// ❌ INCORRECT: Changing query keys cause infinite loops
const { data } = useWarehouseQueryCached(
  ['projects', Date.now()], // ❌ New key every render
  'SELECT * FROM projects'
);

// ✅ CORRECT: Stable cache keys
const { data } = useWarehouseQueryCached(
  ['projects'], // ✅ Stable key
  'SELECT * FROM projects'
);
```

### Memory Leaks

```typescript
// ❌ INCORRECT: Not cleaning up subscriptions
const { data } = useWarehouseQuery('SELECT * FROM large_table', {
  staleTime: Infinity, // ❌ Never refetches, never cleans up
});

// ✅ CORRECT: Appropriate stale times
const { data } = useWarehouseQuery('SELECT * FROM large_table', {
  staleTime: 30 * 60 * 1000, // 30 minutes
});
```

### Race Conditions

```typescript
// ❌ INCORRECT: Multiple concurrent queries
function SearchComponent() {
  const [query, setQuery] = useState('');
  const { data } = useWarehouseQuery(
    `SELECT * FROM items WHERE name LIKE '%${query}%'` // ❌ Race conditions
  );
}

// ✅ CORRECT: Debounced queries with proper keys
function SearchComponent() {
  const [debouncedQuery] = useDebounce(query, 300);
  const { data } = useWarehouseQueryCached(
    ['search', debouncedQuery],
    'SELECT * FROM items WHERE name LIKE ?',
    { enabled: debouncedQuery.length > 2 }
  );
}
```

## Migration from Legacy Patterns

### From Direct Fetch

```typescript
// ❌ OLD: Direct fetch (no caching, no error handling)
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

## Enforcement - AST-Grep Rules

```yaml
# Detect missing type parameters
rule: |
  useWarehouseQuery($ARGS)
  where:
    $ARGS not contains "<"

# Detect string interpolation in SQL
rule: |
  useWarehouseQuery($SQL)
  where:
    $SQL contains "`" or $SQL contains "+" or $SQL contains "${"

# Detect missing error handling
rule: |
  const { data } = useWarehouseQuery($SQL)
  where:
    not contains "error" or not contains "isLoading"
```

## ESLint Integration

```javascript
{
  "rules": {
    "@corso/warehouse-query-type-safety": "error",
    "@corso/warehouse-query-error-handling": "error",
    "@corso/warehouse-query-sql-injection": "error"
  }
}
```
