---
title: "Api"
last_updated: "2026-01-04"
category: "documentation"
status: "draft"
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

## ⚙️ Runtime Selection

### ⚠️ CRITICAL: Runtime Declaration & Wrapper Matching

**Always declare the runtime** in API route handlers and use the matching wrapper. Next.js defaults to Edge if not specified, which can cause failures if Node.js code is used.

**Quick Reference:**
- **Edge Runtime**: `export const runtime = 'edge';` → Use `withErrorHandlingEdge`, `withRateLimitEdge` from `@/lib/api`
- **Node.js Runtime**: `export const runtime = 'nodejs';` → Use `withErrorHandlingNode`, `withRateLimitNode` from `@/lib/middleware`

**When to use Edge:**
- Fast, stateless endpoints (health checks, CSP reports, public APIs)
- No database access, no Clerk `auth()`, no Node.js-only features
- Low latency requirements

**When to use Node.js:**
- Database operations (ClickHouse, Supabase)
- Clerk authentication (`auth()` from `@clerk/nextjs/server`)
- Webhooks with signature verification
- Any route requiring Node.js-only features (file system, streams, etc.)

**Import Locations:**
- Edge wrappers: `@/lib/api` or `@/lib/middleware`
- Node wrappers: `@/lib/middleware` only

See [Rate Limiting](#-rate-limiting) section for implementation examples.

## 🏗️ Server Actions

### Core Principles

Server Actions are Next.js server functions that can be called directly from client components. They differ from API routes in that they:
- Use `'use server'` directive instead of route handlers
- Are called directly from client components (no fetch needed)
- Automatically handle form submissions and mutations

**Server Actions Rules:**
- Always start with `'use server'`
- 5-15 lines maximum per action (delegate to service layer)
- Authenticate, validate, rate-limit, then delegate
- Throw structured errors, never generic ones
- Use Zod schemas for all input validation

### Basic Structure

```typescript
'use server';

import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { withRateLimitNode } from '@/lib/middleware';
import { updateUserProfile } from '@/lib/user/service';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function updateProfile(input: unknown) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // 2. Validate input
  const data = UpdateProfileSchema.parse(input);

  // 3. Delegate to business logic
  return await updateUserProfile(userId, data);
}
```

### Authentication & Authorization

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

**Important**: Use Clerk's `has({ role })` method for role checks. Never use deprecated `hasRole()` utilities.

```typescript
import { auth } from '@clerk/nextjs/server';

export async function adminAction(input: unknown) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  }
  
  // ✅ CORRECT: Use Clerk's has({ role }) method
  if (!has({ role: 'admin' })) {
    throw new ForbiddenError('Admin access required', 'INSUFFICIENT_PERMISSIONS');
  }

  // Proceed with admin operation
  return performAdminAction(input);
}
```

**Available Roles**: `'member'`, `'admin'`, `'owner'`, `'viewer'`, `'service'` (see OpenAPI RBAC configuration)

## 📝 OpenAPI Specification

### File Structure & Locations

**Source Files:**
- `api/openapi.yml` - **Source of truth** (OpenAPI 3.1.0 YAML specification)
- `api/openapi.base.json` - Base configuration (if used)

**Generated Artifacts:**
- `api/openapi.json` - Bundled JSON specification (generated from YAML)
- `types/api/generated/openapi.d.ts` - TypeScript type definitions (AUTO-GENERATED)

**File Relationships:**
```
api/openapi.yml (source)
    ↓ [pnpm openapi:bundle]
api/openapi.json (bundled)
    ↓ [pnpm openapi:types]
types/api/generated/openapi.d.ts (TypeScript types)
```

**Important:** Never edit `api/openapi.json` or `types/api/generated/openapi.d.ts` directly. These are generated files and will be overwritten. Always edit `api/openapi.yml`.

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

## 🔧 OpenAPI Documentation Workflow

### Complete Workflow: Adding a New Endpoint

This section provides a step-by-step guide for documenting a new API endpoint in the OpenAPI specification.

#### Step 1: Design the Endpoint

Before documenting, plan:
- **Path**: `/api/v1/{resource}/{action}`
- **Method**: GET, POST, PUT, PATCH, DELETE
- **Authentication**: Public (`x-public: true`) or protected (`bearerAuth`)
- **RBAC**: Required role(s) if protected
- **Request/Response**: Schema structure
- **Rate Limit**: Requests per minute

#### Step 2: Add to OpenAPI Specification

Edit `api/openapi.yml` and add your endpoint under the `paths:` section:

**Location in File:**
- Find the appropriate section (usually grouped by domain)
- Add your path after existing endpoints
- Follow existing formatting and indentation

**Naming Conventions:**

**operationId Pattern:** `{domain}_{action}` or `{tag}_{action}`

Examples from the codebase:
- `health_check` - Health check endpoint
- `entity_operations` - Entity base operations
- `entity_query` - Entity query endpoint
- `ai_chat_processStream` - AI chat streaming
- `ai_generateSql` - SQL generation
- `query_execute` - Generic query execution
- `users_validate` - User validation
- `insights_search` - Insights search
- `security_cspReport` - CSP reporting

**Tag Selection:**
- `Status` - Health and monitoring endpoints
- `Security` - Security-related endpoints
- `Content` - Public content and insights
- `Users` - User/profile operations
- `Dashboard` - Analytics & SQL generation
- `Chat` - AI chat & streaming
- `Internal` - Internal system endpoints (not in public spec)

#### Step 3: Complete Endpoint Example

Here's a complete example for a new endpoint:

```yaml
/api/v1/notifications:
  post:
    operationId: notifications_create
    tags:
      - Users
    summary: Create notification
    description: Creates a new notification for the authenticated user
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
            $ref: '#/components/schemas/NotificationRequest'
          example:
            title: "New message"
            message: "You have a new message"
            type: "info"
    responses:
      '201':
        description: Notification created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NotificationResponse'
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '429':
        $ref: '#/components/responses/RateLimited'
      '500':
        $ref: '#/components/responses/InternalError'
```

#### Step 4: Define Request/Response Schemas

Add schema definitions to `components/schemas:` section:

```yaml
components:
  schemas:
    NotificationRequest:
      type: object
      required: [title, message]
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
          description: Notification title
        message:
          type: string
          minLength: 1
          maxLength: 1000
          description: Notification message content
        type:
          type: string
          enum: [info, warning, error, success]
          default: info
          description: Notification type
      additionalProperties: false
    
    NotificationResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: Notification ID
        title:
          type: string
        message:
          type: string
        type:
          type: string
        createdAt:
          type: string
          format: date-time
      required: [id, title, message, type, createdAt]
```

#### Step 5: Generate and Validate

Run the complete generation and validation pipeline:

```bash
# Step 1: Generate all artifacts (bundle → lint → types)
pnpm openapi:gen

# Step 2: Validate RBAC compliance
pnpm openapi:rbac:check

# Step 3: Type check to ensure generated types are valid
pnpm typecheck
```

**What Each Command Does:**

**`pnpm openapi:gen`** (Complete Pipeline):
1. **`openapi:bundle`**: Bundles `api/openapi.yml` → `api/openapi.json`
   - Resolves `$ref` references
   - Validates YAML structure
   - Outputs JSON format
2. **`openapi:lint`**: Validates OpenAPI spec with Spectral
   - Checks OpenAPI 3.1.0 compliance
   - Validates schema definitions
   - Reports errors and warnings
3. **`openapi:types`**: Generates TypeScript types
   - Reads `api/openapi.json`
   - Generates `types/api/generated/openapi.d.ts`
   - Creates type-safe interfaces for all operations

**`pnpm openapi:rbac:check`**:
- Validates RBAC annotations
- Ensures all `bearerAuth` routes have `x-corso-rbac`
- Ensures all `bearerAuth` routes include `OrgIdHeader`
- Checks role values against allowed roles

**Individual Commands (if needed):**
```bash
pnpm openapi:bundle    # Bundle YAML → JSON only
pnpm openapi:lint      # Lint spec only
pnpm openapi:types     # Generate types only
pnpm openapi:diff      # Compare spec changes
pnpm openapi:docs      # Preview documentation (requires Redocly)
pnpm openapi:mock      # Start mock server (requires Prism)
```

#### Step 6: Use Generated TypeScript Types

After generation, import types in your code:

```typescript
import type { operations, paths } from '@/types/api/generated/openapi';

// Get operation types
type CreateNotificationOp = operations['notifications_create'];

// Request body type
type NotificationRequest = CreateNotificationOp['requestBody']['content']['application/json'];

// Response type
type NotificationResponse = CreateNotificationOp['responses']['201']['content']['application/json'];

// Path parameters (if any)
type NotificationPathParams = paths['/api/v1/notifications']['post']['parameters']['path'];
```

**Type Usage in Route Handlers:**

```typescript
import type { operations } from '@/types/api/generated/openapi';
import { validateJson, http } from '@/lib/api';
import { z } from 'zod';

// Define Zod schema matching OpenAPI spec
const NotificationRequestSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
}).strict();

// Type inference from OpenAPI
type NotificationRequest = operations['notifications_create']['requestBody']['content']['application/json'];
type NotificationResponse = operations['notifications_create']['responses']['201']['content']['application/json'];

export async function POST(req: NextRequest): Promise<Response> {
  // Validate with Zod (runtime validation)
  const parsed = await validateJson(req, NotificationRequestSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid input', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
    });
  }

  // TypeScript knows the shape from OpenAPI types
  const request: NotificationRequest = parsed.data;
  
  // Create notification...
  const notification: NotificationResponse = {
    id: crypto.randomUUID(),
    title: request.title,
    message: request.message,
    type: request.type,
    createdAt: new Date().toISOString(),
  };

  return http.ok(notification, { status: 201 });
}
```

#### Step 7: Implement Route Handler

Create the route handler in `app/api/v1/notifications/route.ts`:

```typescript
/**
 * API Route: POST /api/v1/notifications
 * 
 * Creates a new notification for the authenticated user.
 * 
 * @requires Node.js runtime for database operations
 * @requires Authentication via Clerk (userId required)
 * @requires RBAC: 'member' role minimum
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/notifications
 * Body: { title: "New message", message: "You have a new message", type: "info" }
 * Response: { success: true, data: { id: "...", title: "...", ... } }
 * ```
 */

// ⚠️ CRITICAL: Always declare runtime and use matching wrapper
// Note: This route uses Node.js runtime for database operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, validateJson } from '@/lib/api';
// Note: Use Node wrappers from @/lib/middleware for Node.js routes
import { withErrorHandlingNode, withRateLimitNode } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const NotificationRequestSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
}).strict();

const handler = async (req: NextRequest): Promise<Response> => {
  // 1. Authenticate
  const { userId, has } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // 2. RBAC check
  if (!has({ role: 'member' })) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }

  // 3. Validate input
  const parsed = await validateJson(req, NotificationRequestSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid input', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
    });
  }

  // 4. Create notification (delegate to service)
  const notification = await createNotification(userId, parsed.data);

  // 5. Return response
  return http.ok(notification, { status: 201 });
};

export const POST = withErrorHandlingNode(
  withRateLimitNode(
    handler,
    { maxRequests: 30, windowMs: 60_000 }
  )
);
```

#### Step 8: Add Tests

Create integration tests in `tests/api/v1/notifications.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe('POST /api/v1/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(true),
    });
  });

  it('should return 201 for valid request', async () => {
    const { POST } = await import('@/app/api/v1/notifications/route');
    const req = new Request('http://localhost/api/v1/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Test notification',
        message: 'Test message',
        type: 'info',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.title).toBe('Test notification');
  });

  it('should return 400 for invalid input', async () => {
    const { POST } = await import('@/app/api/v1/notifications/route');
    const req = new Request('http://localhost/api/v1/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '' }), // Invalid: empty title
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Quick Reference: Common Patterns

**Public Endpoint:**
```yaml
/api/v1/public/status:
  get:
    operationId: public_status
    tags: [Status]
    x-public: true  # No authentication required
    responses:
      '200':
        description: Public status
```

**Protected Endpoint with RBAC:**
```yaml
/api/v1/admin/users:
  get:
    operationId: admin_users_list
    tags: [Users]
    security:
      - bearerAuth: []
    x-corso-rbac: [admin]  # Admin role required
    parameters:
      - $ref: '#/components/parameters/OrgIdHeader'
    responses:
      '200':
        description: User list
```

**Streaming Endpoint (NDJSON):**
```yaml
/api/v1/ai/chat:
  post:
    operationId: ai_chat_processStream
    tags: [Chat]
    security:
      - bearerAuth: []
    x-corso-rbac: [member]
    responses:
      '200':
        description: Streaming response
        content:
          application/x-ndjson:
            schema:
              type: string
              description: NDJSON stream of chat chunks
```

### Validation Checklist

Before committing your OpenAPI changes:

- [ ] Endpoint added to `api/openapi.yml` under correct path
- [ ] `operationId` follows naming convention (`{domain}_{action}`)
- [ ] Appropriate tag selected (Status, Security, Content, Users, Dashboard, Chat)
- [ ] Security configured (`x-public: true` or `bearerAuth` + `x-corso-rbac`)
- [ ] `OrgIdHeader` parameter included for protected routes
- [ ] Request/response schemas defined in `components/schemas`
- [ ] All error responses documented (400, 401, 403, 429, 500)
- [ ] Rate limit documented (`x-rate-limit` extension)
- [ ] `pnpm openapi:gen` runs successfully
- [ ] `pnpm openapi:rbac:check` passes
- [ ] `pnpm typecheck` passes (generated types are valid)
- [ ] Route handler implemented with matching Zod schema
- [ ] Integration tests added

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

## 📊 Data Fetching Patterns

### Warehouse Query Hooks

For detailed warehouse query patterns and hook usage, see:
- [Warehouse Queries (Canonical)](../codebase-apis/warehouse-queries.md) - Query rules and patterns
- [Warehouse Query Hooks](../analytics/warehouse-query-hooks.md) - React hook usage

**Quick Reference:**
```typescript
// Simple query with automatic cache key
const { data, isLoading, error } = useWarehouseQuery<Project>(
  'SELECT * FROM projects'
);

// Cached query with custom key
const { data } = useWarehouseQueryCached<Project>(
  ['projects', filters],
  'SELECT * FROM projects WHERE status = ?',
  { staleTime: 5 * 60 * 1000 }
);
```

**Key Principles:**
- Always use parameterized queries (no string interpolation)
- Use appropriate cache keys for optimal performance
- Handle loading, error, and empty states
- See canonical documentation for complete patterns

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

### CSRF Protection

Server actions include CSRF token automatically. For custom forms, include the token:

```typescript
import { csrf } from '@/lib/security/csrf';

export async function secureAction(formData: FormData) {
  const token = formData.get('csrfToken') as string;
  await csrf.verify(token);

  // Proceed with action
}
```

### Input Sanitization

Sanitize user input to prevent XSS attacks:

```typescript
import DOMPurify from 'isomorphic-dompurify';

export async function createPost(input: CreatePostInput) {
  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(input.content);

  return createPostInDb({ ...input, content: sanitizedContent });
}
```

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

⚠️ **CRITICAL**: Always declare the runtime and use the matching wrapper.

**Edge Runtime Example:**
```typescript
// ⚠️ Always declare runtime for Edge routes
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Edge wrappers from @/lib/api for Edge routes
import { withRateLimitEdge, withErrorHandlingEdge } from '@/lib/api';

export const POST = withErrorHandlingEdge(
  withRateLimitEdge(
    handler,
    { maxRequests: 30, windowMs: 60_000 }
  )
);
```

**Node.js Runtime Example:**
```typescript
// ⚠️ Always declare runtime for Node.js routes
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Use Node wrappers from @/lib/middleware for Node.js routes
import { withRateLimitNode, withErrorHandlingNode } from '@/lib/middleware';

export const POST = withErrorHandlingNode(
  withRateLimitNode(
    handler,
    { maxRequests: 30, windowMs: 60_000 }
  )
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

**GET `/api/v1/entity/{entity}/export`** ⚠️ **PERMANENTLY REMOVED**
- Returns 410 Gone as permanent stub
- Removed: 2025-01-15 (entity grid migration)
- Alternative: Use `POST /api/v1/entity/{entity}/query` for data access

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

**Current Version:** `/api/v1/`

**Versioning Policy:**

1. **URL-Based Versioning**: All public endpoints are versioned in the URL path
   - Current: `/api/v1/*`
   - Future: `/api/v2/*`, `/api/v3/*`, etc.

2. **Breaking Changes**: Require a new version
   - Removing endpoints
   - Changing request/response schemas in incompatible ways
   - Removing required fields
   - Changing authentication requirements
   - Changing error response formats

3. **Non-Breaking Changes**: Can be added to current version
   - Adding new endpoints
   - Adding optional fields to requests/responses
   - Adding new error codes
   - Adding new query parameters (optional)
   - Extending enum values

4. **Deprecation Process**:
   ```yaml
   /api/v1/old-endpoint:
     get:
       deprecated: true
       description: |
         This endpoint is deprecated and will be removed in v2.
         Use /api/v1/new-endpoint instead.
       x-sunset: "2025-12-31"  # Optional: sunset date
   ```

5. **Migration Documentation**:
   - Document breaking changes in OpenAPI spec
   - Provide migration guides for major version changes
   - Include examples of old vs. new API usage

**Version Lifecycle:**

```
/api/v1/ (current)
    ↓
    [Breaking changes needed]
    ↓
/api/v2/ (new version)
    ↓
    [Deprecate v1 endpoints]
    ↓
    [Sunset period: 90 days]
    ↓
    [Remove v1 endpoints]
```

**Example: Version Migration**

When creating `/api/v2/`, update the OpenAPI spec:

```yaml
servers:
  - url: https://api.corso.app/v1
    description: API v1 (deprecated, use v2)
  - url: https://api.corso.app/v2
    description: API v2 (current)

paths:
  /api/v1/users:
    get:
      deprecated: true
      description: Use /api/v2/users instead
      x-sunset: "2025-12-31"
  
  /api/v2/users:
    get:
      operationId: users_list_v2
      # New version with improved schema
```

**Decision Records:**
- See `docs/decisions/` for API versioning decisions
- Major version changes should include ADR (Architecture Decision Record)

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

### Query Testing Patterns

For testing warehouse queries and data fetching:

```typescript
import { vi } from 'vitest';

// Mock warehouse query hooks
vi.mock('@/components/dashboard/hooks/use-warehouse-query', () => ({
  useWarehouseQuery: vi.fn(() => ({
    data: mockProjects,
    isLoading: false,
    error: null
  }))
}));

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

## 📚 Documentation & Tooling

### OpenAPI Documentation Generation

**Preview Interactive Documentation:**
```bash
pnpm openapi:docs
```

This command:
1. Runs `pnpm openapi:gen` to ensure spec is up-to-date
2. Starts a local Redocly preview server
3. Opens interactive API documentation in your browser

**Documentation Features:**
- Interactive API explorer with "Try it out" functionality
- Request/response examples
- Complete schema definitions with validation rules
- Authentication details and security requirements
- Rate limiting information
- Error response documentation

**Note:** Requires Redocly CLI installed. If not available, the command will show installation instructions.

### Generated Artifacts Reference

**What Gets Generated:**

1. **`api/openapi.json`** (from `api/openapi.yml`)
   - Bundled JSON format (all `$ref` resolved)
   - Used by type generators and documentation tools
   - **Location**: `api/openapi.json`
   - **Size**: ~1,088 lines (as of 2025-01-03)
   - **Format**: OpenAPI 3.1.0 JSON

2. **`types/api/generated/openapi.d.ts`** (from `api/openapi.json`)
   - TypeScript type definitions for all operations
   - Type-safe request/response interfaces
   - Path parameter types
   - Query parameter types
   - **Location**: `types/api/generated/openapi.d.ts`
   - **Usage**: `import type { operations, paths } from '@/types/api/generated/openapi'`

**Type Structure:**

```typescript
// Operations map: operationId → operation definition
type Operations = {
  'notifications_create': {
    requestBody: { content: { 'application/json': NotificationRequest } };
    responses: {
      '201': { content: { 'application/json': NotificationResponse } };
      '400': { content: { 'application/json': ErrorResponse } };
      // ... other responses
    };
    parameters: { path?: {}; query?: {}; header?: {} };
  };
  // ... other operations
};

// Paths map: path → method → definition
type Paths = {
  '/api/v1/notifications': {
    post: Operations['notifications_create'];
  };
  // ... other paths
};
```

**Using Generated Types:**

```typescript
// Import types
import type { operations, paths } from '@/types/api/generated/openapi';

// Get specific operation
type CreateNotification = operations['notifications_create'];

// Extract request body type
type NotificationRequest = CreateNotification['requestBody']['content']['application/json'];

// Extract response type
type NotificationResponse = CreateNotification['responses']['201']['content']['application/json'];

// Extract path parameters
type NotificationParams = paths['/api/v1/notifications']['post']['parameters']['path'];

// Extract query parameters
type NotificationQuery = paths['/api/v1/notifications']['post']['parameters']['query'];
```

### CI/CD Integration

**Pre-commit Validation:**
The `pretypecheck` script automatically runs `pnpm openapi:gen` before type checking (via `package.json` scripts). The optimized pre-commit hooks ensure:
- OpenAPI spec is bundled when types are checked
- Types are validated for staged files only (performance optimization)
- Validation checks run in parallel and skip when not needed
- See `.husky/README.md` for full hook optimization details

**CI Pipeline:**
```yaml
# .github/workflows/ci.yml (example)
- name: Validate OpenAPI
  run: |
    pnpm openapi:gen
    pnpm openapi:rbac:check
    pnpm openapi:lint
    git diff --exit-code -- api/openapi.json types/api/generated/openapi.d.ts
```

This ensures:
- Generated files match source spec
- RBAC compliance validated
- No uncommitted generated files

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

## 🎓 Learning Resources

### Example Endpoints to Study

**Simple GET Endpoint:**
- `GET /api/health` - Public health check (see `api/openapi.yml` lines 43-67)
- No authentication, minimal schema

**Protected POST Endpoint:**
- `POST /api/v1/user` - User profile operations (see `api/openapi.yml` around line 663)
- Bearer auth, RBAC, request body validation

**Complex Query Endpoint:**
- `POST /api/v1/entity/{entity}/query` - Entity queries (see `api/openapi.yml` around line 358)
- Path parameters, complex request body, pagination

**Streaming Endpoint:**
- `POST /api/v1/ai/chat` - AI chat streaming (see `api/openapi.yml` around line 318)
- NDJSON response format, streaming documentation

### Common Pitfalls & Solutions

**Pitfall 1: Forgetting RBAC Annotation**
```yaml
# ❌ WRONG: Missing x-corso-rbac
security:
  - bearerAuth: []
# Missing: x-corso-rbac: [member]

# ✅ CORRECT: RBAC specified
security:
  - bearerAuth: []
x-corso-rbac: [member]
```

**Pitfall 2: Missing OrgIdHeader for Protected Routes**
```yaml
# ❌ WRONG: Protected route without OrgIdHeader
security:
  - bearerAuth: []
x-corso-rbac: [member]
# Missing: parameters with OrgIdHeader

# ✅ CORRECT: OrgIdHeader included
security:
  - bearerAuth: []
x-corso-rbac: [member]
parameters:
  - $ref: '#/components/parameters/OrgIdHeader'
```

**Pitfall 3: Editing Generated Files**
```bash
# ❌ WRONG: Editing generated files
vim api/openapi.json  # Will be overwritten!
vim types/api/generated/openapi.d.ts  # Will be overwritten!

# ✅ CORRECT: Edit source file
vim api/openapi.yml  # Source of truth
pnpm openapi:gen  # Regenerate
```

**Pitfall 4: Inconsistent Schema Definitions**
```yaml
# ❌ WRONG: Schema doesn't match Zod validation
components:
  schemas:
    UserRequest:
      properties:
        email:
          type: string
          # Missing format: email, maxLength, etc.

# ✅ CORRECT: Schema matches Zod validation
components:
  schemas:
    UserRequest:
      properties:
        email:
          type: string
          format: email
          maxLength: 255
```

**Pitfall 5: Missing Error Responses**
```yaml
# ❌ WRONG: Only success response documented
responses:
  '200':
    description: Success

# ✅ CORRECT: All error responses documented
responses:
  '200':
    description: Success
  '400':
    $ref: '#/components/responses/BadRequest'
  '401':
    $ref: '#/components/responses/Unauthorized'
  '403':
    $ref: '#/components/responses/Forbidden'
  '429':
    $ref: '#/components/responses/RateLimited'
  '500':
    $ref: '#/components/responses/InternalError'
```

## 🔗 Related Documentation

- [API README](../../api/README.md) - Complete OpenAPI specification details and tooling
- [API v1 README](../../app/api/v1/README.md) - Route implementation documentation
- [API Design Guide](./api-design-guide.md) - Complete API patterns and implementation guide (this document)
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns and RBAC
- [Error Handling](../error-handling/error-handling-guide.md) - Error handling patterns
- [Testing Guide](../testing-quality/testing-guide.md) - API testing patterns

---

**Last updated:** 2025-01-15
