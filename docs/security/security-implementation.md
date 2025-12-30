---
title: Security
description: >-
  Documentation and resources for documentation functionality. Located in
  security/.
last_updated: '2025-12-30'
category: documentation
status: draft
---
# Security Implementation Guide

This document provides a comprehensive guide to security implementation in the Corso codebase, covering authentication, authorization, security headers, and best practices.

## 🛡️ Security Architecture

### Zero-Trust Principles

Corso follows a zero-trust security model:
- **Authenticate** all requests to protected resources
- **Authorize** based on user identity and role-based access control (RBAC)
- **Validate** all inputs using strict schemas
- **Rate limit** all endpoints to prevent abuse
- **Log** security events for monitoring and auditing

## 🔐 Authentication & Authorization

### Clerk Integration

All authentication is handled via Clerk v6:

```typescript
import { auth } from '@clerk/nextjs/server';

// Check authentication
const { userId } = await auth();
if (!userId) {
  return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
}

// Check role-based authorization using Clerk's has({ role }) method
const { has } = await auth();
if (!has({ role: 'member' })) {
  return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
}
```

### Middleware Protection

The `middleware.ts` file protects all routes:
- Public routes are explicitly whitelisted
- Protected routes require authentication
- Unauthenticated users are redirected to sign-in

### API Route Protection

All protected API routes must:
1. Check authentication using `auth()` from Clerk
2. Verify authorization using RBAC (`has({ role: '...' })`)
3. Return proper error codes (401 for unauthorized, 403 for forbidden)

**Example:**
```typescript
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  
  // Route-specific logic...
}
```

## 🔒 Security Headers

### Global Security Headers

The following security headers are configured globally in `config/next.config.mjs`:

- **Strict-Transport-Security**: Enforces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Content Security Policy (CSP)

CSP is configured for SVG images:
```javascript
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
```

For full CSP implementation, consider adding a CSP header in middleware or via Next.js headers configuration.

## 🚦 Rate Limiting

### Implementation

Rate limiting is applied to all API endpoints. **Always declare the runtime** and use the matching wrapper:

**Edge Runtime** (for fast, stateless endpoints):
```typescript
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { withRateLimitEdge } from '@/lib/api';

export const POST = withRateLimitEdge(
  handler,
  { windowMs: 60_000, maxRequests: 30 }
);
```

**Node.js Runtime** (for database operations, Clerk auth):
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { withRateLimitNode } from '@/lib/middleware';

export const POST = withRateLimitNode(
  handler,
  { windowMs: 60_000, maxRequests: 30 }
);
```

**Important**: Use Edge wrappers (`withRateLimitEdge`, `withErrorHandlingEdge`) for Edge routes, and Node wrappers (`withRateLimitNode`, `withErrorHandlingNode`) for Node.js routes. Mismatching runtime and wrapper can cause runtime errors.

### Rate Limit Configuration

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| AI endpoints | 30/min | 60s |
| Entity queries | 60/min | 60s |
| User operations | 30/min | 60s |
| Webhooks | 100/min | 60s |
| Health checks | N/A | N/A |

## 🔍 Input Validation

### Zod Schema Validation

All API inputs must be validated using Zod schemas:

```typescript
import { z } from 'zod';

const BodySchema = z.object({
  field: z.string().min(1).max(100),
}).strict();

const parsed = BodySchema.safeParse(json);
if (!parsed.success) {
  return http.badRequest('Invalid input', {
    code: 'VALIDATION_ERROR',
    details: parsed.error.flatten(),
  });
}
```

### SQL Injection Prevention

AI-generated SQL is validated before execution:

```typescript
import { validateSQLScope } from '@/lib/integrations/database/scope';

try {
  validateSQLScope(generatedSQL, orgId);
  // SQL is valid and tenant-scoped - proceed with execution
} catch (validationError) {
  // SecurityError thrown if validation fails
  const errorMessage = validationError instanceof Error 
    ? validationError.message 
    : 'Invalid SQL generated';
  return http.badRequest(errorMessage, { code: 'INVALID_SQL' });
}
```

## 🔐 Webhook Security

### Clerk Webhook Verification

Clerk webhooks are verified using Svix:

```typescript
import { Webhook } from 'svix';

const wh = new Webhook(getEnv().CLERK_WEBHOOK_SECRET || '');
const evt = wh.verify(payload, headers);
```

### Stripe Webhook Verification

Stripe webhooks are verified using signature verification:

```typescript
import { stripe } from '@/lib/integrations/stripe';

const event = stripe.webhooks.constructEvent(
  body,
  signature,
  getEnv().STRIPE_WEBHOOK_SECRET
);
```

## 🔑 Secret Management

### Environment Variables

- **Never commit secrets**: `.env.local` is in `.gitignore`
- **Use `getEnv()`**: Server-side environment access via `@/lib/server/env`
- **Use `getEnvEdge()`**: Edge runtime environment access
- **Never use `process.env` directly**: Always use centralized helpers

### Secret Scanning

Gitleaks is configured to scan for secrets:
- Configuration: `config/.gitleaks.toml`
- CI integration: `pnpm ci:gitleaks`
- Pre-commit hook: `pnpm scan:secrets`

## 🌐 CORS Configuration

### CORS Headers

CORS is handled via `handleCors()` middleware:

```typescript
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}
```

**Note**: Some routes use `'Access-Control-Allow-Origin': '*'` for development. In production, this should be restricted to specific origins.

## 📊 Security Monitoring

### Error Logging

Security events are logged using structured logging:

```typescript
import { logger } from '@/lib/monitoring';

logger.error('Security violation detected', {
  userId,
  ip,
  violation: 'unauthorized_access',
  path: req.nextUrl.pathname,
});
```

### Security Event Tracking

Track security events for:
- Authentication failures
- Authorization violations
- Rate limit exceeded
- Input validation failures
- SQL injection attempts

## ✅ Security Checklist

### For New API Routes

- [ ] Authentication check (`auth()`)
- [ ] Authorization check (RBAC if needed)
- [ ] Input validation (Zod schema)
- [ ] Rate limiting applied
- [ ] Error handling with proper status codes
- [ ] CORS headers configured
- [ ] Security logging implemented

### For New Features

- [ ] No hardcoded secrets
- [ ] Environment variables used correctly
- [ ] Input validation on all user inputs
- [ ] Output sanitization for XSS prevention
- [ ] SQL queries use parameterization
- [ ] Security headers configured
- [ ] Tests for security scenarios

## 🚨 Security Best Practices

### Do's

✅ Always validate user input with Zod schemas  
✅ Use parameterized queries for database operations  
✅ Implement rate limiting on all endpoints  
✅ Log security events for monitoring  
✅ Use environment variables for secrets  
✅ Verify webhook signatures  
✅ Implement proper error handling  
✅ Use HTTPS in production  

### Don'ts

❌ Never commit secrets to version control  
❌ Never use `process.env` directly  
❌ Never trust user input without validation  
❌ Never expose sensitive data in error messages  
❌ Never use wildcard CORS in production  
❌ Never skip authentication checks  
❌ Never log sensitive information  

## 📚 Related Documentation

- [Operational Guide](../operations/operational-guide.md) - Security operations and incident response
- [Testing Strategy](../testing-quality/testing-strategy.md) - Security testing patterns
- [API Documentation](../../app/api/README.md) - API security patterns and rate limiting
- [Security Policy](security-policy.md) - Vulnerability reporting
- [Authentication Patterns](auth-patterns.md) - Auth implementation details
- [API Security Standards](../../.cursor/rules/security-standards.mdc) - API security rules
- [OpenAPI RBAC](../../.cursor/rules/openapi-vendor-extensions.mdc) - RBAC configuration

## 🔄 Security Updates

### Regular Security Tasks

1. **Dependency Updates**: Run `pnpm audit` regularly
2. **Secret Scanning**: Run `pnpm ci:gitleaks` in CI
3. **Security Headers**: Verify headers are applied
4. **Authentication**: Test auth flows regularly
5. **Rate Limiting**: Monitor rate limit effectiveness

### Security Incident Response

1. **Identify**: Detect security issue
2. **Contain**: Limit impact of the issue
3. **Remediate**: Fix the security vulnerability
4. **Document**: Update security documentation
5. **Notify**: Inform affected users if necessary

---

**Last Updated**: 2025-12-15  
**Maintained By**: Security Team  
**Status**: Active
