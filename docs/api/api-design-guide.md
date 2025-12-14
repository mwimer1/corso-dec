---
last_updated: "2025-12-14"
category: "documentation"
status: "draft"
title: "Api"
description: "Documentation and resources for documentation functionality. Located in api/."
---
# API Design Guide

> **Complete guide to API design, OpenAPI compliance, validation, and documentation for the Corso API**

## 📋 Quick Reference

**Key Commands:**
```bash
# Generate OpenAPI artifacts
pnpm openapi:gen

# Validate RBAC compliance
pnpm openapi:rbac:check

# Lint OpenAPI spec
pnpm openapi:lint

# Preview documentation
pnpm openapi:docs
```

## 🎯 API Design Principles

### Core Principles

1. **Versioning**: All public APIs under `/api/v1/`
2. **Consistency**: Standardized request/response formats
3. **Security**: Zero-trust with RBAC and validation
4. **Documentation**: OpenAPI 3.1 specification
5. **Validation**: Zod schemas for all inputs
6. **Error Handling**: Standardized error responses

### API Structure

```
/api/
├── health/              # Health check endpoints (public)
├── v1/                  # Versioned public API
│   ├── entity/          # Entity resource operations
│   ├── ai/              # AI-powered endpoints
│   ├── user/            # User profile operations
│   └── csp-report/      # Security reporting
└── internal/            # Internal endpoints (webhooks)
```

## 📝 OpenAPI Specification

### Specification Management

**Source of Truth:** `api/openapi.yml` (OpenAPI 3.1.0)

**Generated Artifacts:**
- `api/openapi.json` - Bundled JSON (via `pnpm openapi:bundle`)
- `types/api/openapi.d.ts` - TypeScript types (via `pnpm openapi:types`)

### Specification Structure

```yaml
openapi: 3.1.0
info:
  title: Corso API v1
  version: 1.0.0
  description: Public, versioned API endpoints and schemas.

servers:
  - url: https://api.corso.app
    description: Production
  - url: https://staging-api.corso.app
    description: Staging
  - url: http://localhost:3000
    description: Local

paths:
  /api/v1/{endpoint}:
    {method}:
      operationId: {operation_id}
      tags: [Tag]
      summary: Brief description
      description: Detailed description
      security:
        - bearerAuth: []
      x-corso-rbac: [member]
      parameters:
        - $ref: '#/components/parameters/OrgIdHeader'
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{Schema}'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{ResponseSchema}'
```

### Adding New Endpoints

**Process:**
1. **Design**: Plan endpoint structure and behavior
2. **Document**: Add to `api/openapi.yml` with full schema
3. **Security**: Add `x-corso-rbac` and `OrgIdHeader` if protected
4. **Validate**: Run `pnpm openapi:gen && pnpm openapi:rbac:check`
5. **Implement**: Create route handler with Zod validation
6. **Test**: Add integration tests

**Example:**
```yaml
/api/v1/example:
  post:
    operationId: example_create
    tags: [Examples]
    summary: Create example resource
    description: Creates a new example resource with validation
    security:
      - bearerAuth: []
    x-corso-rbac: [member]
    parameters:
      - $ref: '#/components/parameters/OrgIdHeader'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ExampleRequest'
    responses:
      '200':
        description: Example created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExampleResponse'
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '429':
        $ref: '#/components/responses/RateLimited'
```

## 🔐 Security & RBAC

### Authentication

**Bearer Token Authentication:**
```yaml
security:
  - bearerAuth: []
```

**Public Endpoints:**
```yaml
x-public: true
# No security required
```

### Role-Based Access Control

**RBAC Annotation:**
```yaml
x-corso-rbac: [member]  # Required role(s)
```

**Available Roles:**
- `owner` - Full administrative access
- `admin` - Administrative operations
- `member` - Read/write access (default)
- `viewer` - Read-only access
- `service` - Machine-to-machine access

**Tenant Isolation:**
```yaml
parameters:
  - $ref: '#/components/parameters/OrgIdHeader'
```

### RBAC Validation

**Automated Check:**
```bash
pnpm openapi:rbac:check
```

**Requirements:**
- All `bearerAuth` routes must have `x-corso-rbac`
- All `bearerAuth` routes must include `OrgIdHeader`
- Role values must match allowed roles

## ✅ Input Validation

### Zod Schema Integration

**✅ CORRECT: Use Zod for validation**
```typescript
import { z } from 'zod';
import { validateJson, http } from '@/lib/api';

const RequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
}).strict();

export async function POST(req: NextRequest) {
  const parsed = await validateJson(req, RequestSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid input', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
    });
  }
  
  const { name, email, age } = parsed.data;
  // Process validated data
  return http.ok({ success: true });
}
```

**Schema Best Practices:**
- Use `.strict()` to prevent extra fields
- Provide clear error messages
- Validate all inputs, including query parameters
- Use appropriate Zod validators (email, url, uuid, etc.)

### OpenAPI Schema Alignment

**Zod Schema → OpenAPI Schema:**
```typescript
// Zod schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// Corresponding OpenAPI schema
components:
  schemas:
    User:
      type: object
      required: [id, email, name]
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
```

## 📤 Response Format

### Success Response

**Standard Format:**
```typescript
{
  success: true,
  data: T
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

### Error Response

**Standard Format:**
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes

**Standard Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🚦 Rate Limiting

### Rate Limit Configuration

**Standard Limits:**
- AI endpoints: 30 requests/minute
- Entity queries: 60 requests/minute
- User operations: 30 requests/minute
- Internal webhooks: 100 requests/minute

**Implementation:**
```typescript
import { withRateLimitEdge } from '@/lib/api';

export const POST = withRateLimitEdge(
  handler,
  { maxRequests: 30, windowMs: 60_000 }
);
```

**OpenAPI Documentation:**
```yaml
x-rate-limit:
  limit: 30
  window: 1m
responses:
  '429':
    $ref: '#/components/responses/RateLimited'
```

## 📊 API Endpoints

### Entity Operations

**GET `/api/v1/entity/{entity}`**
- Query entity data with pagination
- Supports filtering and sorting
- Rate limit: 60/min

**POST `/api/v1/entity/{entity}/query`**
- Advanced querying with filters
- Pagination support
- No rate limit (internal use)

**GET `/api/v1/entity/{entity}/export`**
- Export entity data (CSV/XLSX)
- No rate limit (internal use)

### AI Operations

**POST `/api/v1/ai/generate-sql`**
- Generate SQL from natural language
- Security validation included
- Rate limit: 30/min

**POST `/api/v1/ai/generate-chart`**
- Generate chart configuration
- Rate limit: 30/min

### User Operations

**POST `/api/v1/user`**
- User profile operations
- RBAC: member role required
- Rate limit: 30/min

### Security Operations

**POST `/api/v1/csp-report`**
- CSP violation reporting
- Public endpoint (no auth)
- Rate limit: 30/min

## 🔄 API Versioning

### Version Strategy

**Current:** `/api/v1/`

**Versioning Rules:**
- Breaking changes require new version
- Non-breaking changes can be added to current version
- Deprecated endpoints marked with `deprecated: true`
- Migration path documented in OpenAPI spec

**Future Versions:**
- `/api/v2/` - When breaking changes needed
- Maintain backward compatibility where possible
- Provide migration guides

## 🧪 Testing

### API Testing

**Integration Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { resolveRouteModule } from '../support/resolve-route';

describe('API v1: example endpoint', () => {
  it('should return 200 for valid request', async () => {
    const url = resolveRouteModule('v1/example');
    const mod = await import(url);
    const req = new Request('http://localhost/api/v1/example', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
    });
    const res = await mod.POST(req as any);
    expect(res.status).toBe(200);
  });
});
```

**Test Coverage:**
- Happy path scenarios
- Validation errors
- Authentication failures
- Rate limiting
- Error handling

## 📚 Documentation

### OpenAPI Documentation

**Generate Documentation:**
```bash
pnpm openapi:docs
```

**Documentation Features:**
- Interactive API explorer
- Request/response examples
- Schema definitions
- Authentication details
- Rate limiting information

### In-Code Documentation

**JSDoc Comments:**
```typescript
/**
 * API Route: POST /api/v1/example
 * 
 * Creates a new example resource.
 * 
 * @requires Node.js runtime for database access
 * @requires Authentication via Clerk (userId required)
 * @requires RBAC: 'member' role minimum
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/example
 * Body: { name: "Example", email: "example@test.com" }
 * Response: { success: true, data: { id: "123" } }
 * ```
 */
```

## 🔍 Compliance Checklist

### OpenAPI Compliance

- [ ] All endpoints documented in `api/openapi.yml`
- [ ] Request/response schemas defined
- [ ] Security annotations present (`x-corso-rbac` or `x-public`)
- [ ] `OrgIdHeader` included for protected routes
- [ ] Error responses documented
- [ ] Rate limiting documented
- [ ] Examples provided

### Implementation Compliance

- [ ] Zod validation for all inputs
- [ ] Standardized error responses
- [ ] Rate limiting applied
- [ ] Authentication enforced
- [ ] RBAC checked
- [ ] CORS headers for browser requests
- [ ] Tests written

### Validation

```bash
# Complete validation
pnpm openapi:gen
pnpm openapi:rbac:check
pnpm openapi:lint
pnpm typecheck
pnpm test
```

## 🔗 Related Documentation

- [API README](../../api/README.md) - OpenAPI specification details
- [API v1 README](../../app/api/v1/README.md) - Route documentation
- [Security Standards](../security/security-standards.md) - Security patterns
- [Error Handling](../error-handling/error-handling-guide.md) - Error patterns

---

**Last updated:** 2025-01-15

