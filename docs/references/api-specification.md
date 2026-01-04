---
description: "Documentation and resources for documentation functionality. Located in references/."
last_updated: "2026-01-04"
category: "documentation"
status: "draft"
title: "References"
---
# API Specification

## Overview

We maintain an OpenAPI v3.1 specification for the Corso API.

- **Primary spec**: `api/openapi.yml` (manually maintained) - Source of truth for the API
- **RBAC validation**: `scripts/openapi/openapi-guard-rbac.ts` (automated security validation)
- **Generated artifacts**: `api/openapi.json` (bundled via redocly for tooling)
- **TypeScript types**: `types/api/generated/openapi.d.ts` (auto-generated from spec)

## Usage

### Development Workflow
```bash
# Validate RBAC security compliance (REQUIRED)
pnpm openapi:rbac:check

# Bundle and lint the primary OpenAPI spec
pnpm openapi:gen

# Optional: preview documentation
pnpm openapi:docs

# Optional: generate client SDK
pnpm openapi:sdk
```

### Production Approach
The primary OpenAPI specification (`api/openapi.yml`) is manually maintained and includes:
- Comprehensive API documentation with examples
- Proper security annotations (`x-corso-rbac`, `x-public`)
- Detailed parameter and response schemas
- Server configurations for different environments

### Full Validation Pipeline
```bash
# Complete validation workflow
pnpm openapi:gen && pnpm openapi:rbac:check && pnpm openapi:diff

# Check for breaking changes
pnpm openapi:diff --breaking

# Generate client SDK (if needed)
pnpm openapi:sdk
```

## Scope

- **Primary spec**: `api/openapi.yml` is manually maintained with comprehensive API documentation
- **RBAC validation**: `scripts/openapi/openapi-guard-rbac.ts` validates security annotations
- **Schema integration**: Route handlers use Zod schemas for validation and error responses
- **Error handling**: Standard error envelope from `lib/shared/errors/api-error.ts`
  - API responses use: `{ success: false, error: { code, message, details? } }`
  - Legacy `errors: [{ field, message, code }]` is deprecated

## Best Practices

- **Single source of truth**: `api/openapi.yml` is the authoritative API specification
- **Schema integration**: Add explicit response schema exports to route handlers for better documentation
- **Security annotations**: All protected routes must include proper RBAC and tenant isolation annotations
- **Validation**: Always run `pnpm openapi:rbac:check` after modifying API routes

## RBAC Guard Integration

### Enhanced Security Validation
The RBAC guard (`scripts/openapi/openapi-guard-rbac.ts`) performs comprehensive security validation:

**Automated Checks:**
- ✅ All `bearerAuth` operations have `x-corso-rbac` or `x-public`
- ✅ All `bearerAuth` operations include `OrgIdHeader` parameter
- ✅ Role values match allowed roles from `config/security/rbac-roles.json`
- ✅ Public endpoints properly marked with `x-public` (no security required)
- ✅ Tenant isolation enforced for all authenticated operations

### Vendor Extensions
All bearer-authenticated operations must include RBAC and tenant isolation:

```yaml
paths:
  /api/v1/entity/{entity}/query:
    post:
      operationId: entity_query
      tags: [Dashboard]
      summary: Query entity data with filtering, sorting, and pagination
      parameters:
        - name: entity
          in: path
          required: true
          schema:
            type: string
            enum: [projects, companies, addresses]
        - $ref: '#/components/parameters/OrgIdHeader'  # Required for tenant isolation
      security:
        - bearerAuth: []
      x-corso-rbac: [member]  # Required RBAC annotation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/EntityQueryRequest"
```

### Public Endpoints
Public endpoints use the `x-public` opt-out mechanism:

```yaml
paths:
  /status/health:
    get:
      operationId: status_health
      tags: [Status]
      summary: Health check
      x-public: true  # Public endpoint - no security/RBAC required
      security: []     # Explicitly no security
      responses:
        "200":
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: { type: boolean, example: true }
                  data:
                    type: object
                    properties:
                      status: { type: string, example: ok }
                      time: { type: string, format: date-time }
    head:
      operationId: status_health_head
      tags: [Status]
      summary: Health check (no body)
      x-public: true  # Public endpoint - no security/RBAC required
      security: []     # Explicitly no security
      responses:
        "204":
          description: Service is healthy (no content)
```

### RBAC Validation
Run the RBAC guard as part of your workflow:

```bash
# Validate RBAC compliance
pnpm openapi:rbac:check

# Full validation pipeline
pnpm openapi:gen && pnpm openapi:rbac:check && pnpm openapi:diff
```

## CI Considerations

Add comprehensive CI validation with enhanced security checks:

```yaml
# .github/workflows/openapi.yml
- name: Validate OpenAPI
  run: |
    pnpm openapi:bundle
    pnpm openapi:lint
    pnpm openapi:types
    pnpm openapi:diff
    pnpm openapi:rbac:check  # ← Enhanced RBAC security validation
    git diff --exit-code -- api/openapi.json types/rest/openapi.d.ts
```

### Security Gates
The RBAC guard enforces zero-trust security principles:

- **Authentication**: All protected routes require Clerk authentication
- **Authorization**: Role-based access control with granular permissions
- **Tenant Isolation**: Organization-scoped data access enforcement
- **Input Validation**: Zod schema validation for all external inputs
- **Rate Limiting**: Standard 30 req/min per endpoint (configurable)

### Breaking Change Detection
```bash
# Detect API breaking changes in PRs
pnpm openapi:diff --breaking

# Validate generated TypeScript types
pnpm openapi:types && git diff --exit-code -- types/api/openapi.d.ts
```

## Role Assignment Guidelines

```typescript
// READ operations (GET)
x-corso-rbac: [member]

// WRITE operations (POST/PUT/PATCH)
x-corso-rbac: [admin]

// DESTRUCTIVE operations (DELETE)
x-corso-rbac: [admin]

// ORGANIZATION operations
x-corso-rbac: [member]

// SERVICE operations (webhooks)
x-corso-rbac: [service]
```

## Common Issues
### Error Shape Mismatch
```json
// ❌ Legacy (deprecated)
{ "success": false, "errors": [{ "field": "email", "message": "Invalid", "code": "INVALID" }] }

// ✅ Preferred
{ "success": false, "error": { "code": "INVALID", "message": "Invalid email", "details": [] } }
```

### Chat/Security Schema Names
```ts
// Chat: table intent object (nullable)
// Chat table intent validation would use appropriate chat validation schemas

// Security: sanitized table intent string (from security domain to avoid cycles)
import { AITableIntentSchema } from '@/lib/security';
```

### RBAC Validation Errors

#### Missing RBAC Annotation
```bash
# Error: POST /api/v1/ai/chat: missing x-corso-rbac
# Fix: Add RBAC annotation to the operation
post:
  security:
    - bearerAuth: []
  x-corso-rbac: [member]  # ← Required for all bearer-authenticated operations
```

#### Missing OrgIdHeader Parameter
```bash
# Error: POST /api/v1/dashboard/query: bearerAuth route missing OrgIdHeader parameter
# Fix: Include the OrgIdHeader parameter for tenant isolation
post:
  parameters:
    - $ref: '#/components/parameters/OrgIdHeader'  # ← Required for tenant isolation
  security:
    - bearerAuth: []
  x-corso-rbac: [member]
```

#### Invalid Role Value
```bash
# Error: POST /api/v1/ai/chat: invalid role 'superuser' (not in config/security/rbac-roles.json)
# Fix: Use only roles defined in rbac-roles.json
post:
  security:
    - bearerAuth: []
  x-corso-rbac: [admin]  # ← Use valid role from config
```

#### Missing Security on Protected Route
```bash
# Error: POST /api/v1/ai/chat: protected route missing security definition
# Fix: Add security requirements for protected operations
post:
  security:
    - bearerAuth: []  # ← Required for protected routes
  x-corso-rbac: [member]
```

#### Incorrect Public Endpoint
```bash
# Error: GET /api/v1/insights/search: public endpoint with bearerAuth security
# Fix: Use x-public for truly public endpoints or add proper security
get:
  x-public: true  # ← Use x-public OR proper security, not both
  # No security or x-corso-rbac required
```

### Development Workflow Issues

#### TypeScript Type Generation
```bash
# Error: TypeScript types not updated after API changes
# Fix: Always regenerate types after API modifications
pnpm openapi:gen  # Regenerates types/api/generated/openapi.d.ts
```

#### Breaking Changes in PRs
```bash
# Error: API breaking changes detected in pull request
# Fix: Review changes and update client code accordingly
pnpm openapi:diff --breaking  # Identify breaking changes
```

#### Missing Error Handling Wrapper
```bash
# Error: API route missing withErrorHandlingEdge wrapper
# Fix: Wrap all route handlers with error handling
import { withErrorHandlingEdge } from '@/lib/api';

export const POST = withErrorHandlingEdge(async (req) => {
  // Route handler implementation
});
```

## 📚 Related Documentation

- [API Design Guide](../api/api-design-guide.md) - Complete API patterns, OpenAPI workflow, and implementation guide
- [Security Standards](../security/README.md) - Security implementation and RBAC patterns
- [Error Handling Guide](../error-handling/error-handling-guide.md) - Error handling patterns
- [OpenAPI Vendor Extensions](../.cursor/rules/openapi-vendor-extensions.mdc) - RBAC guard and vendor extensions
