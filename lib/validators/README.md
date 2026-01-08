---
title: "Validators"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Zod validation schemas for API requests, entities, and security."
---
# Validators

Zod validation schemas for API requests, entities, and security.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/validators/
├── auth/
│   └── user-validation.ts
├── dashboard/
│   └── warehouse-entity-validation.ts
├── security/
│   ├── chat-validation.ts
│   └── csp.ts
├── shared/
│   └── primitives.ts
├── clerk-webhook.ts
├── contact.ts
├── entity.ts
├── entityListQuery.ts
├── entityQuery.ts
├── index.ts
├── mock-projects.ts
```

## Public API

**Value exports** from `@/lib/validators`:

- `AddressRowSchema`
- `BaseRowSchema`
- `CanonicalProject`
- `CanonicalProjectsFile`
- `ClerkEventEnvelope`
- `ClerkUserPayload`
- `CompanyRowSchema`
- `ContactSchema`
- `cspViolationBodySchema`
- `emailSchema`
- `EntityListQuerySchema`
- `EntityParamSchema`
- `EntityQueryRequestSchema`
- `legacyCspReportSchema`
- `nameSchema`
- ... (7 more value exports)

**Type exports** from `@/lib/validators`:

- `ChatValidationResult` (type)
- `CspViolation` (type)
- `EntityListQuery` (type)
- `EntityParam` (type)
- `EntityQueryRequest` (type)
- `SortDir` (type)
- `TCanonicalProject` (type)
- `TRawProjectRow` (type)

## Usage

```typescript
import { AddressRowSchema } from '@/lib/validators';
```

```typescript
import type { ChatValidationResult } from '@/lib/validators';
```

