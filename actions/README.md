---
category: "actions"
last_updated: "2025-12-14"
status: "draft"
title: "Actions"
description: "Server-side actions for actions, handling data mutations and business logic."
---
## Public Exports
| Action | Purpose | Import Path |
|--------|---------|-------------|
| `marketing/contact-form` |  | `@/actions` |

## Public Exports
| Action | Purpose | Import Path |
|--------|---------|-------------|
| `marketing/contact-form` |  | `@/actions` |


## Overview
**5 production-ready Next.js server actions** providing secure, type-safe backend operations for AI chat generation and marketing interactions.

## Directory Structure

### Core Domains
| Domain | Purpose | Action Count |
|--------|---------|--------------|
| `chat/` | AI SQL and chart generation | 4 actions |
| `marketing/` | Contact forms with bot protection | 1 action |


## Key Features

### 🔐 **Security First**
- **Authentication**: All actions validate user sessions
- **Authorization**: Organization-scoped operations
- **Rate Limiting**: Configurable limits per action type
- **Input Validation**: Zod schemas at action boundaries
- **Error Handling**: Structured error responses

### ⚡ **Performance Optimized**
- **Caching**: Redis-backed function caching
- **Streaming**: Real-time AI generation responses
- **Database Optimization**: Efficient Supabase queries
- **Rate Limiting**: Prevents abuse with smart throttling

### 🎯 **Type Safe**
- **Zod Validation**: Runtime type checking
- **TypeScript**: Full type safety throughout
- **Schema Validation**: Input/output validation
- **Error Types**: Structured error handling

### 🔧 **Developer Experience**
- **Consistent APIs**: Standardized patterns across domains
- **Comprehensive Logging**: Debug-friendly error tracking
- **Modular Design**: Import only what you need
- **Documentation**: Inline JSDoc and usage examples

## Usage Patterns

### Billing Operations
```typescript
// Create checkout session
const url = await createCheckoutSession({
  priceId: 'price_456',
  successUrl: '/success',
  cancelUrl: '/cancel'
});
```

### AI Chat Generation
```typescript
// Generate SQL from natural language
const sqlResult = await generateSQL({
  question: 'Show me active projects',
  detectedTableIntent: 'projects'
});

// Stream chart configuration
for await (const chunk of generateChartConfigurationStream(
  results, 
  'Create a revenue chart',
  { preferredChartTypes: ['line', 'bar'] }
)) {
  // Process streaming response
}
```

### Marketing Interactions
```typescript
// Submit contact form with bot protection
await submitContactForm({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Interested in your product',
  turnstileToken: 'token123'
});
```

## Architecture Principles

### 🔒 **Security Architecture**
- **Boundary Validation**: Input validation at action entry points
- **Authentication Context**: User/org context validation
- **Rate Limiting**: Per-action type limits with smart backoff
- **Audit Logging**: Security event tracking
- **Error Sanitization**: No sensitive data leakage

### ⚡ **Performance Patterns**
- **Caching Strategy**: Redis-backed function caching
- **Database Optimization**: Efficient queries with proper indexing
- **Streaming Responses**: Real-time AI generation
- **Memory Management**: Controlled resource usage

### 🎯 **Type Safety**
- **Schema Validation**: Zod schemas for all inputs/outputs
- **Runtime Checking**: Type validation at runtime
- **Error Boundaries**: Structured error handling
- **Type Inference**: Automatic TypeScript types

### 🔧 **Operational Excellence**
- **Monitoring**: Comprehensive logging and metrics
- **Error Tracking**: Structured error reporting
- **Retry Logic**: Intelligent retry mechanisms
- **Health Checks**: Action availability monitoring

## Security Considerations

### Authentication & Authorization
```typescript
// All actions include auth validation
const { userId, orgId } = await validateAuth();

// Organization context checking
if (orgId !== targetOrgId) {
  throw new ApplicationError({
    code: 'FORBIDDEN',
    message: 'Wrong organization context'
  });
}
```

### Rate Limiting Configuration
```typescript
// Action-specific, scoped rate limits (recommended)
import { withRateLimit, buildCompositeKey } from '@/lib/ratelimiting';
import { ACTION_RATE_LIMITS } from '@/lib/ratelimiting';

// Authenticated action (per-user)
await withRateLimit(buildCompositeKey(`chat:generate-sql`, userId), ACTION_RATE_LIMITS.AI_GENERATION);

// Public action (per-IP)
await withRateLimit(buildCompositeKey(`marketing:contact`, ip), ACTION_RATE_LIMITS.USER_ACTION);
```

### Input Validation
```typescript
// Boundary validation with Zod
const validated = validateInput(schema, input, "action context");

// Structured error handling
try {
  // Action logic
} catch (error) {
  throw handleDbError(error, "Action description");
}
```

## Best Practices

### Error Handling
```typescript
// ✅ Structured error responses
try {
  const result = await billingAction(input);
  return { success: true, data: result };
} catch (error) {
  if (error instanceof ApplicationError) {
    return { success: false, error: error.message, code: error.code };
  }
  throw handleInternalError(error, "action context");
}
```

### Caching Strategy
```typescript
// ✅ Use cached functions for expensive operations
export const getExpensiveData = createCachedFunction(
  async (params) => {
    // Expensive operation
    return await databaseQuery(params);
  },
  ["cache-key"],
  CACHE_CONFIGS.DEFAULT
);
```

### Database Operations
```typescript
// ✅ Safe database operations with error handling
try {
  const { data, error } = await supabaseApi
    .fromUser("table", userId)
    .select("*")
    .eq("org_id", orgId);

  if (error) throw error;
  return data;
} catch (error) {
  throw handleDbError(error, "Failed to fetch data");
}
```

### Rate Limiting
```typescript
// ✅ Appropriate rate limits per action type
await checkRateLimit("expensive-operation", {
  maxRequests: 5,    // Conservative for expensive ops
  windowMs: 60000
});

await checkRateLimit("simple-read", {
  maxRequests: 100,  // Generous for simple reads
  windowMs: 60000
});
```

## Caching Configuration

### Function-Level Caching
```typescript
// Redis-backed function caching
export const getCachedData = createCachedFunction(
  async (params) => expensiveOperation(params),
  ["data", "cache", "key"],
  { revalidate: 300 } // 5 minute TTL
);
```

### Cache Invalidation
```typescript
// Tag-based cache invalidation
revalidateTag("user-preferences");
revalidateTag("dashboard-data");
```

## Monitoring & Observability

### Performance Monitoring
```typescript
// Automatic performance logging
const result = await measureQueryTime(
  () => expensiveOperation(),
  { userId, operation: 'data-fetch' }
);
```

### Error Tracking
```typescript
// Structured error reporting
catch (error) {
  reportError(error, {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    context: { userId, operation: 'data-update' }
  });
}
```

## Windows-First Development

- ✅ Compatible with Windows file paths and PowerShell
- ✅ Cross-platform database connectivity
- ✅ Windows-friendly error messages and logging
- ✅ Compatible with Windows development workflows

## Troubleshooting

### Common Issues

**Rate Limit Exceeded**
- Check rate limit configuration
- Implement exponential backoff
- Consider upgrading plan for higher limits

**Authentication Failures**
- Verify Clerk configuration
- Check user session validity
- Validate organization context

**Database Connection Issues**
- Verify Supabase credentials
- Check network connectivity
- Review connection pool settings

**Streaming Response Problems**
- Ensure proper async iteration
- Check for network interruptions
- Validate response format

## Migration Guide

### From Legacy Actions
```typescript
// Old approach - inline auth/validation
export async function legacyAction(input) {
  // Manual auth checking
  // Manual validation
  // Business logic
}

// New approach - structured actions
export async function modernAction(input) {
  // Auth automatically validated
  const validated = validateInput(schema, input);
  // Business logic with error handling
}
```

### From Client-Side Operations
```typescript
// Old approach - client-side API calls
const result = await fetch('/api/action', {
  method: 'POST',
  body: JSON.stringify(data)
});

// New approach - server actions
const result = await serverAction(data);
```

## Related Documentation

- `@/lib/actions` – Action utilities and helpers
- `@/lib/core/server` – Server-side core functionality
- `@/types/actions` – Action-specific TypeScript types
- `@/lib/validators` – Input validation schemas

---
_Last updated: 2025-09-04_

