---
description: "Documentation and resources for documentation functionality. Located in shared/."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# App Shared Utilities

Shared utilities and factories for route groups to reduce duplication and ensure consistency across the app directory.

## Purpose

This directory contains reusable factories and utilities used across multiple route groups (`(auth)`, `(marketing)`, `(protected)`) to:

- Eliminate code duplication
- Ensure consistent patterns
- Improve maintainability

## Files

### `create-error-boundary.tsx`

Factory function for creating error boundary components with consistent logging and error handling.

**Usage:**
```tsx
// app/(auth)/error.tsx
import { createErrorBoundary } from '@/app/shared/create-error-boundary';

export default createErrorBoundary({ context: 'Auth' });
```

**Features:**
- Consistent error logging with structured logging
- Optional production logging control
- Uses shared `ErrorFallback` component

### `create-loading.tsx`

Factory function for creating loading components with customizable messages.

**Usage:**
```tsx
// app/(auth)/loading.tsx
import { createLoading } from '@/app/shared/create-loading';

export default createLoading('Loading authentication...');
```

**Features:**
- Customizable loading messages
- Uses shared `RouteLoading` component
- Consistent loading UI across route groups

## Patterns

### Error Boundaries

All route groups use the shared error boundary factory for consistency:

- `app/(auth)/error.tsx`
- `app/(marketing)/error.tsx`
- `app/(protected)/error.tsx`
- `app/(protected)/dashboard/error.tsx`

### Loading States

All route groups use the shared loading factory:

- `app/(auth)/loading.tsx`
- `app/(marketing)/loading.tsx`
- `app/(protected)/loading.tsx`

### Route Configuration

Route configuration uses inline exports for consistency and clarity:

```tsx
// Standard route configuration pattern
export const runtime = 'nodejs'; // All routes use Node.js for Clerk compatibility
export const dynamic = 'force-dynamic'; // or 'force-static' for static pages
export const revalidate = 0; // or number (in seconds) for ISR
```

**Why inline configuration?**
- Clear and explicit per-route configuration
- No additional abstraction layer
- Easy to understand and maintain
- Consistent across all routes

## Related Documentation

- [App Directory README](../README.md) - Main app directory documentation
- [Route Groups](../README.md#route-groups--urls) - Route group structure and patterns
