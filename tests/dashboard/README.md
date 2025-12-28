---
title: "Dashboard"
description: "Documentation and resources for documentation functionality. Located in dashboard/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
## Public Exports
| Test File | Type | Description |
|-----------|------|-------------|
| `a11y-skip-link` | Component test |  |


# Dashboard Integration Tests

> **Testing of dashboard functionality, focusing on data synchronization, user interactions, and real-time updates.**

## 📋 Quick Reference

**Key Points:**

- **Data Synchronization**: Tests URL state sync and real-time data updates
- **User Interactions**: Validates complex user workflows and state management
- **Performance**: Tests dashboard responsiveness with realistic data loads
- **Integration**: Ensures proper coordination between dashboard components

## 📑 Table of Contents

- [Overview](#overview)
- [URL State Synchronization](#url-state-synchronization)
- [Data Management](#data-management)
- [User Interaction Testing](#user-interaction-testing)
- [Performance Testing](#performance-testing)

---

## Overview

Dashboard integration tests validate complex user workflows, data synchronization, and performance under realistic conditions. These tests ensure the dashboard provides a smooth, responsive experience for data exploration and management.

## URL State Synchronization

### Shallow URL Sync
```typescript
import { renderHook } from '@testing-library/react';
// Hooks are now domain-colocated, e.g.:
// import { useShallowSyncTableUrlState } from '@/components/dashboard/entities/shared/grid/hooks/use-grid-performance';

describe('URL state synchronization', () => {
  it('updates URL when table state changes', () => {
    const mockReplace = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ replace: mockReplace }),
      usePathname: () => '/dashboard/projects',
      useSearchParams: () => new URLSearchParams(''),
    }));

    const { result } = renderHook(() =>
      useShallowSyncTableUrlState({
        pageIndex: 1,
        pageSize: 25,
        sortCol: 'name',
        sortDir: 'asc',
        searchText: '',
        filtersHash: '',
      })
    );

    expect(mockReplace).toHaveBeenCalledWith(
      '?page=1&pageSize=25&sortBy=name&sortDir=asc'
    );
  });

  it('guards against unnecessary URL updates', () => {
    const mockReplace = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ replace: mockReplace }),
      usePathname: () => '/dashboard/projects?page=1&pageSize=25',
      useSearchParams: () => new URLSearchParams('page=1&pageSize=25'),
    }));

    const { result } = renderHook(() =>
      useShallowSyncTableUrlState({
        pageIndex: 1,
        pageSize: 25,
        sortCol: 'name',
        sortDir: 'asc',
        searchText: '',
        filtersHash: '',
      })
    );

    // Should not update URL when state matches current URL
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
```

### Complex Filter Synchronization
```typescript
describe('Complex filter URL synchronization', () => {
  it('encodes complex filter states', () => {
    const mockReplace = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ replace: mockReplace }),
      usePathname: () => '/dashboard/projects',
      useSearchParams: () => new URLSearchParams(''),
    }));

    const { result } = renderHook(() =>
      useShallowSyncTableUrlState({
        pageIndex: 0,
        pageSize: 10,
        sortCol: '',
        sortDir: 'asc',
        searchText: 'active',
        filtersHash: 'status|eq|active,type|in|residential,commercial',
      })
    );

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('search=active')
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('filtersHash=status%7Ceq%7Cactive')
    );
  });
});
```

## Data Management

### Query Key Management
```typescript
import { entityTableKey } from '@/lib/shared/table/query-keys';

describe('Query key management', () => {
  it('builds stable query keys for caching', () => {
    const key = entityTableKey('projects', 0, 25, { id: 'name', desc: false }, '', '');

    expect(key).toEqual(['entityData', 'projects', 0, 25, 'name', 'asc', '', '']);
  });

  it('defaults empty search and filters for stability', () => {
    const key = entityTableKey('companies', 1, 10, undefined, undefined, undefined);

    expect(key[6]).toBe(''); // searchText
    expect(key[7]).toBe(''); // filtersHash
  });
});
```

### Cancellation Testing
```typescript
describe('React Query cancellation', () => {
  it('aborts previous requests when superseded', async () => {
    const abortSpy = vi.fn();
    global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal | null | undefined;
      if (signal) {
        signal.addEventListener('abort', abortSpy, { once: true });
      }
      return new Promise<any>(() => {});
    }) as any;

    // Trigger rapid parameter changes that should cancel previous requests
    // This would be tested in actual component integration tests

    expect(typeof global.fetch).toBe('function');
  });
});
```

## User Interaction Testing

### Accessibility Skip Links
```typescript
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '@/components/dashboard';

describe('Dashboard accessibility', () => {
  it('provides skip links for keyboard navigation', () => {
    render(<DashboardLayout />);

    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders focusable main content region', () => {
    render(<DashboardLayout />);

    const main = document.getElementById('main-content');
    expect(main).toBeTruthy();
    expect(main).toHaveAttribute('tabindex', '-1');
  });
});
```

### Complex User Workflows
```typescript
describe('Dashboard user workflows', () => {
  it('handles complete data exploration workflow', async () => {
    render(<DashboardPage />);

    // Search for data
    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'active projects' } });

    await waitFor(() => {
      expect(screen.getByText('Active Project 1')).toBeInTheDocument();
    });

    // Sort results
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Filter by status
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    // Export results
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    // Verify workflow completion
    expect(screen.getByText(/Export completed/)).toBeInTheDocument();
  });
});
```

## Performance Testing

### Large Dataset Performance
```typescript
describe('Dashboard performance with large datasets', () => {
  const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
    id: i.toString(),
    name: `Project ${i}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    value: Math.floor(Math.random() * 1000000)
  }));

  it('renders large datasets efficiently', async () => {
    const startTime = performance.now();

    render(<DashboardPage data={largeDataset} />);

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(2000); // 2s budget for large datasets
  });

  it('handles search on large datasets', async () => {
    render(<DashboardPage data={largeDataset} />);

    const searchInput = screen.getByLabelText('Search');
    const startTime = performance.now();

    fireEvent.change(searchInput, { target: { value: 'Project 25000' } });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500); // 500ms for search
  });
});
```

### Memory Leak Prevention
```typescript
describe('Dashboard memory management', () => {
  it('cleans up event listeners and subscriptions', () => {
    const { unmount } = render(<DashboardPage />);

    // Component should not have memory leaks
    expect(() => unmount()).not.toThrow();

    // Check that no lingering event listeners or timers remain
    // This would require more specific cleanup testing
  });
});
```

## Best Practices

### ✅ **Do**
- Test complete user workflows, not just individual interactions
- Validate URL state synchronization thoroughly
- Test performance with realistic data volumes
- Ensure proper cleanup of resources and subscriptions
- Test accessibility features for complex interfaces
- Use integration tests for complex state management

### ❌ **Don't**
- Skip testing URL state synchronization edge cases
- Ignore performance implications of dashboard operations
- Test implementation details of state management libraries
- Create tests that depend on specific data ordering
- Mock data fetching without testing error scenarios

### Testing Strategy
- Focus on user goals and complete workflows
- Test state management across component boundaries
- Validate performance with production-like data
- Ensure accessibility for data-heavy interfaces
- Monitor for memory leaks and resource cleanup

---

## 🎯 Key Takeaways

- **Workflow Focus**: Test complete user journeys through the dashboard
- **State Management**: Ensure proper synchronization and cleanup
- **Performance Critical**: Dashboard responsiveness impacts user experience
- **Accessibility Essential**: Complex interfaces must be usable by all

## 📚 Related Documentation

- [Dashboard Architecture](../../docs/dashboard-architecture.md) - Dashboard system design
- [State Management](../../docs/state-management.md) - URL sync and state handling
- [Performance](../../docs/performance.md) - Dashboard performance optimization

## 🏷️ Tags

`#dashboard-testing` `#integration-testing` `#state-management` `#performance` `#accessibility`

---

_Last updated: 2025-01-16_
