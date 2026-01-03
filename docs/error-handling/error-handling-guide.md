---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: "Error Handling"
description: "Documentation and resources for documentation functionality. Located in error-handling/."
---
# Error Handling & Resilience Guide

> **Complete guide to error handling, structured logging, error boundaries, and resilience patterns**

## 📋 Quick Reference

**Key Components:**
- **Global Error Boundary**: `app/global-error.tsx`
- **Route Error Boundaries**: `app/**/error.tsx`
- **App Error Boundary**: `components/ui/organisms/app-error-boundary.tsx`
- **Error Reporting**: `lib/shared/errors/reporting.ts`
- **Structured Logging**: `lib/monitoring/core/logger.ts`

## 🎯 Error Handling Principles

### Core Principles

1. **Fail Gracefully**: Always provide user-friendly error messages
2. **Log Everything**: Structured logging for all errors
3. **Categorize Errors**: Distinguish expected vs unexpected errors
4. **Recovery Options**: Provide retry/reset mechanisms where possible
5. **Security First**: Never expose sensitive information in errors

### Error Categories

**Expected Errors:**
- Validation errors (Zod, input validation)
- Business rule violations
- Authentication/authorization failures
- Rate limiting

**Unexpected Errors:**
- Network failures
- Database connection errors
- Unhandled exceptions
- System errors

## 🛡️ Error Boundaries

### Global Error Boundary

**Location:** `app/global-error.tsx`

**Purpose:** Catches unhandled errors at the root level

**Features:**
- Client-side error logging
- User-friendly fallback UI
- Error reporting integration

```typescript
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  React.useEffect(() => {
    clientLogger.error('Global error boundary triggered', {
      error: error.message,
      stack: error.stack,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
    });
  }, [error]);

  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
```

### Route Error Boundaries

**Location:** `app/**/error.tsx`

**Purpose:** Catch errors within specific route groups

**Examples:**
- `app/(protected)/error.tsx` - Protected routes
- `app/(protected)/dashboard/error.tsx` - Dashboard routes
- `app/(marketing)/error.tsx` - Marketing pages
- `app/(auth)/error.tsx` - Authentication pages

**Pattern:**
```typescript
export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
```

### Component Error Boundary

**Location:** `components/ui/organisms/app-error-boundary.tsx`

**Purpose:** Wrap components with error recovery

**Usage:**
```typescript
import { AppErrorBoundary } from '@/components';

export function MyComponent() {
  return (
    <AppErrorBoundary>
      <YourComponent />
    </AppErrorBoundary>
  );
}
```

**Features:**
- Automatic error logging
- Reset functionality
- Customizable fallback UI

## 📝 Structured Logging

### Logger Usage

**Server-Side:**
```typescript
import { logger } from '@/lib/monitoring';

logger.info('Operation started', { userId, operation: 'data-query' });
logger.warn('Rate limit approaching', { key, remaining: 5 });
logger.error('Operation failed', { error: error.message, stack: error.stack });
```

**Client-Side:**
```typescript
import { clientLogger } from '@/lib/core';

clientLogger.error('Component error', {
  error: error.message,
  component: 'MyComponent',
  props: sanitizedProps,
});
```

### Log Levels

**Debug:** Development-only detailed information
```typescript
logger.debug('Detailed debug info', { data });
```

**Info:** General operational information
```typescript
logger.info('Operation completed', { duration: 150 });
```

**Warn:** Warning conditions
```typescript
logger.warn('Deprecated API used', { endpoint: '/old-api' });
```

**Error:** Error conditions
```typescript
logger.error('Operation failed', { error: error.message });
```

### Structured Log Format

**Standard Format:**
```json
{
  "timestamp": "2025-01-15T10:00:00.000Z",
  "level": "error",
  "msg": "[Component] Operation failed: Connection timeout",
  "requestId": "req_123",
  "context": {
    "userId": "user_456",
    "operation": "data-query"
  }
}
```

## 🚨 Error Reporting

### Error Reporting API

**Location:** `lib/shared/errors/reporting.ts`

**Usage:**
```typescript
import { reportError, ErrorCategory, ErrorSeverity } from '@/lib/shared/errors/reporting';

const errorId = reportError(error, {
  category: ErrorCategory.VALIDATION,
  severity: ErrorSeverity.ERROR,
  context: {
    userId: 'user_123',
    operation: 'data-query',
  },
});
```

### Error Category Types

- `INTERNAL` - Internal system errors
- `VALIDATION` - Input validation errors
- `SECURITY` - Security-related errors
- `NETWORK` - Network/connectivity errors
- `DATABASE` - Database operation errors
- `UNHANDLED` - Unhandled exceptions

### Error Severity

- `CRITICAL` - System-critical errors requiring immediate attention
- `ERROR` - Standard error conditions
- `WARNING` - Warning conditions that don't stop execution
- `INFO` - Informational messages

## 🔄 Resilience Patterns

### API Route Error Handling

**Edge Runtime Pattern:**
```typescript
// Edge runtime routes (fast, no Node.js dependencies)
// Use for: public endpoints, health checks, CSP reports
// ⚠️ CRITICAL: Always declare runtime and use matching wrapper
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Edge wrappers from @/lib/api for Edge routes
import { withErrorHandlingEdge } from '@/lib/api';

export const POST = withErrorHandlingEdge(async (req: NextRequest) => {
  // Handler implementation
  // Errors are automatically caught and logged
});
```

**Node.js Runtime Pattern:**
```typescript
// Node.js runtime routes (database operations, Clerk auth)
// Use for: database queries, authentication, webhooks
// ⚠️ CRITICAL: Always declare runtime and use matching wrapper
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Node wrappers from @/lib/middleware for Node.js routes
import { withErrorHandlingNode } from '@/lib/middleware';

export const POST = withErrorHandlingNode(async (req: NextRequest) => {
  // Handler implementation
  // Errors are automatically caught and logged
});
```

**Features:**
- Automatic error catching
- Structured error logging
- Standardized error responses
- Request context preservation

**Runtime Selection Guidelines:**

⚠️ **CRITICAL**: Always declare the runtime and use the matching wrapper. Mismatching runtime and wrapper will cause runtime errors.

- **Edge Runtime**:
  - Use `withErrorHandlingEdge` and `withRateLimitEdge` from `@/lib/api` (or `@/lib/middleware`)
  - For fast, stateless endpoints (health checks, CSP reports, public APIs)
  - Cannot use Node.js-only features (database, Clerk `auth()`, etc.)
  - Example: `export const runtime = 'edge';`

- **Node.js Runtime**:
  - Use `withErrorHandlingNode` and `withRateLimitNode` from `@/lib/middleware`
  - For routes requiring database access, Clerk authentication, or other Node.js-only features
  - Example: `export const runtime = 'nodejs';`

- **Always declare runtime**: Include `export const runtime = 'edge'` or `export const runtime = 'nodejs'` at the top of route files. Next.js defaults to Edge if not specified, which can cause failures if Node.js code is used.

- **Import locations**:
  - Edge wrappers: `@/lib/api` or `@/lib/middleware`
  - Node wrappers: `@/lib/middleware` only

### Retry Logic

**Manual Retry:**
```typescript
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Timeout Handling

**Request Timeout:**
```typescript
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

### Circuit Breaker Pattern

**Basic Implementation:**
```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private nextAttempt = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= 5) {
      this.state = 'open';
      this.nextAttempt = Date.now() + 60000; // 1 minute
    }
  }
}
```

## 🧪 Error Testing

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorFallback } from '@/components';

describe('ErrorFallback', () => {
  it('displays error message', () => {
    const error = new Error('Test error');
    const reset = vi.fn();
    
    render(<ErrorFallback error={error} resetErrorBoundary={reset} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('calls reset on button click', () => {
    const error = new Error('Test error');
    const reset = vi.fn();
    
    render(<ErrorFallback error={error} resetErrorBoundary={reset} />);
    
    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalled();
  });
});
```

### Testing Error Handling

```typescript
describe('API Error Handling', () => {
  it('handles validation errors', async () => {
    const req = new Request('http://localhost/api/v1/user', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });
    
    const res = await handler(req);
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('handles network errors gracefully', async () => {
    // Mock network failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    const result = await fetchData();
    expect(result).toBeNull();
    // Verify error was logged
  });
});
```

## 📊 Error Monitoring

### Error Tracking

**Integration Points:**
- Sentry (production error tracking)
- Structured logging (all environments)
- Error reporting API (development)

**Error Context:**
```typescript
reportError(error, {
  category: ErrorCategory.NETWORK,
  severity: ErrorSeverity.ERROR,
  context: {
    userId: 'user_123',
    operation: 'data-query',
    endpoint: '/api/v1/entity/projects',
    requestId: 'req_456',
  },
});
```

### Error Analytics

**Key Metrics:**
- Error rate by category
- Error rate by severity
- Error rate by endpoint
- Recovery success rate
- User impact assessment

## 🔒 Security Considerations

### Error Message Sanitization

**✅ CORRECT: Sanitized error messages**
```typescript
function sanitizeError(error: Error): string {
  // Never expose internal details
  if (error.message.includes('password') || error.message.includes('token')) {
    return 'Authentication failed';
  }
  return error.message;
}
```

**❌ INCORRECT: Exposing sensitive information**
```typescript
// Never do this
return http.error(500, error.message); // May contain sensitive data
```

### Error Classification

**Security Errors:**
- Authentication failures
- Authorization violations
- SQL injection attempts
- XSS attempts

**Handling:**
- Log security errors with high severity
- Don't expose attack details to users
- Report to security monitoring

## 📚 Best Practices

### ✅ DO

- Use error boundaries for component isolation
- Log all errors with structured data
- Provide user-friendly error messages
- Implement retry logic for transient failures
- Categorize errors appropriately
- Include request context in logs

### ❌ DON'T

- Expose sensitive information in error messages
- Swallow errors silently
- Use generic error messages
- Ignore error boundaries
- Log sensitive data (passwords, tokens)
- Fail without recovery options

## 📚 Related Documentation

- [Monitoring Guide](../monitoring/monitoring-guide.md) - Error logging, observability, and monitoring
- [Security Implementation](../security/security-implementation.md) - Security error handling
- [Operational Guide](../operations/operational-guide.md) - Troubleshooting and incident response
- [Testing Strategy](../testing-quality/testing-strategy.md) - Error boundary testing
- [API Design Guide](../api/api-design-guide.md) - API error responses

---

**Last updated:** 2025-01-15
