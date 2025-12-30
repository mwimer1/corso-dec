---
title: Architecture Design
description: >-
  Documentation and resources for documentation functionality. Located in
  architecture-design/.
last_updated: '2025-12-30'
category: documentation
status: draft
---
# Domain-Driven Architecture Guidelines

## Overview

This document establishes the normative rules and patterns for organizing, maintaining, and growing the Corso application's domain-driven architecture.
These guidelines ensure consistency, scalability, and maintainability as the codebase evolves.

## Core Principles

### 🔒 **Zero-Trust Architecture**
- **MUST** authenticate, authorize, validate, rate-limit, and log everything
- **MUST** enforce strict runtime boundaries (Edge vs Node)
- **MUST** validate all inputs with Zod schemas
- **MUST** use structured error handling with `ApplicationError`

### 📦 **Domain-Driven Design**
- **MUST** organize code by business domains, not technical layers
- **MUST** maintain clear domain boundaries with minimal cross-domain dependencies
- **MUST** use descriptive, business-focused naming
- **MUST** keep domain logic cohesive and focused

### 🚀 **Scalability First**
- **MUST** support automatic growth through consistent patterns
- **MUST** enable parallel development without conflicts
- **MUST** provide automated guardrails
  for consistency
- **MUST** maintain performance as domains grow

## Directory Structure Rules

### 📁 **Domain Organization**

**Domains MUST live directly under `lib/`** (no intermediate "services" layer):

```text
lib/
├── {domain}/                    # Business domain (e.g., auth, entities, integrations)
│   ├── index.ts                 # Client-safe barrel exports
│   ├── server.ts                # Server-only barrel (if mixed domain)
│   ├── README.md                # Domain documentation
│   └── {subdomain}/             # Sub-domains for complex domains
│       ├── index.ts            # Sub-domain barrel
│       └── *.ts                # Implementation files
```

**Forbidden Patterns:**
- ❌ `lib/services/{domain}/` - Use `lib/{domain}/` instead
- ❌ `lib/layers/{domain}/` - Domains are not organized by technical layers

**Examples:**
- ✅ `lib/entities/` - Entity management domain
- ✅ `lib/auth/` - Authentication domain
- ✅ `lib/integrations/` - External integrations domain
- ❌ `lib/services/entities/` - Removed in favor of `lib/entities/`

### 🏷️ **Naming Conventions**

#### Domain Names
- **MUST** use lowercase, single-token names when possible
- **MUST** use descriptive, business-focused names
- **MUST** avoid technical jargon in domain names
- **SHOULD** use compound words without hyphens (e.g., `ratelimiting`, not `rate-limiting`)

**Examples:**
```typescript
✅ auth, dashboard, onboarding, security, realtime
❌ authentication, rate-limiting, user-management
```

#### File Names
- **MUST** use lowercase with hyphens for multi-word files
- **MUST** be descriptive and action-oriented
- **MUST** use `.ts` for implementation, `.tsx` for React components
- **SHOULD** group related files in subdirectories

**Examples:**
```typescript
✅ create-checkout-session.ts, validate-user-input.ts
❌ CreateCheckoutSession.ts, userInputValidation.ts
```

### 📦 **Barrel Export Rules**

#### When to Create Barrels
- **MUST** create `index.ts` when domain root has ≥ 4 exportable files
- **MUST** create `server.ts` for mixed domains with server-only exports
- **SHOULD** create sub-domain barrels when subfolder has ≥ 4 files
- **MUST** use consistent export patterns across domains

#### Barrel Structure
```typescript
// lib/{domain}/index.ts - Client-safe exports
export * from './client-safe-module';
export * from './shared-module';
export type { ClientSafeType } from './types';

// lib/{domain}/server.ts - Server-only exports
'use server';
export * from './server-only-module';
export * from './node-specific-module';
```

## Runtime Boundaries

### 🌐 **Edge vs Node Runtime**

#### Edge Runtime Rules
- **MUST** use `export const runtime = 'edge'` in Edge route files
- **MUST NOT** import Node-only modules in Edge routes
- **MUST NOT** import `@/lib/server` or Node-specific utilities
- **MUST** use `@/lib/api` for Edge-safe utilities only

#### Node Runtime Rules
- **MUST** declare `export const runtime = 'nodejs'` when needed
- **MUST** use `@/lib/api/server` for server-only API utilities
- **MUST** use `'use server'` directive in server action files
- **CAN** import Node-only modules and `@/lib/server`

#### Mixed Domain Pattern
```typescript
// lib/{domain}/index.ts - Client-safe
export * from './client-logic';
export * from './shared-types';

// lib/{domain}/server.ts - Server-only
'use server';
export * from './server-logic';
export * from './node-operations';
```

## Import Patterns

### ✅ **Approved Import Patterns**

#### Barrel Imports (Preferred)
```typescript
// Domain barrels
import { requireUserId } from '@/lib/auth/server';
import { createOpenAIClient } from '@/lib/integrations';

// Sub-domain barrels
// Widget functionality removed from dashboard module

// Cross-domain shared utilities
import { ApplicationError } from '@/lib/shared';
```

#### Direct Module Imports (Allowed)
```typescript
// For specific functionality when barrel would be too broad
// External JWT verification removed; do not import verifyExternalJwt
// Widget functionality removed from dashboard module
```

### ❌ **Forbidden Import Patterns**

#### Cross-Domain Leaf Imports
```typescript
// NEVER do this - violates domain boundaries
import { someUtil } from '@/lib/other-domain/internal-file';

// Instead, promote to shared or use domain barrel
import { someUtil } from '@/lib/shared';
import { someUtil } from '@/lib/other-domain';
```

#### Runtime Boundary Violations
```typescript
// Edge route - CANNOT import Node-only modules
import { someNodeUtil } from '@/lib/server'; // ❌ RUNTIME ERROR

// Node route - CAN import Edge-safe modules
import { someEdgeUtil } from '@/lib/api'; // ✅ OK but unnecessary
```

## Growth Triggers & Scaling

### 📈 **Domain Growth Management**

#### When to Split Domains
- **MUST** consider splitting when domain root exceeds 15 files
- **SHOULD** split when domain has > 10 disparate responsibilities
- **MUST** maintain clear domain boundaries during splits

#### Sub-Domain Creation
- **SHOULD** create sub-domains when domain grows complex
- **MUST** create sub-domain barrels when subfolder has ≥ 4 files
- **MUST** document sub-domain responsibilities in parent README

### 🔄 **Cross-Domain Utilities**

#### When to Extract to Shared
- **MUST** extract utilities used by ≥ 3 domains to `@/lib/shared`
- **SHOULD** extract utilities used by 2 domains if they're generic
- **MUST** document shared utility ownership and maintenance

#### Shared Domain Structure
```text
lib/shared/
├── index.ts              # Main shared barrel
├── {category}/          # Category-specific utilities
│   ├── index.ts        # Category barrel
│   └── *.ts            # Implementation files
```

## Documentation Standards

### 📖 **README Requirements**

#### Required Sections
- **MUST** have front-matter with `title`, `description`, `last_updated`, `owner`, `category`
- **MUST** include overview and responsibilities section
- **MUST** document directory structure with tree format
- **MUST** provide public API tables with import paths
- **MUST** include usage examples for client/server contexts
- **MUST** document runtime requirements (Edge/Node/both)
- **MUST** list required environment variables
- **MUST** document validation and type locations

#### Template Structure
```markdown
---
title: "{Domain} Domain"
description: "Brief description of domain responsibilities"
last_updated: YYYY-MM-DD
owner: "team@corso"
category: "domain"
---

# {Domain} Domain

## Overview
Domain responsibilities and scope...

## Directory Structure
```text
lib/{domain}/
├── index.ts
├── server.ts
└── subfolders...
```

## Public API

### Client-Safe Exports

| Export | Purpose | Type |
|--------|---------|------|
| exportName | description | Function/Type |

### Server-Only Exports

| Export | Purpose | Type |
|--------|---------|------|
| exportName | description | Function |

## Usage Examples

### Client Context
```typescript
import { clientExport } from '@/lib/{domain}';
```

### Server Context
```typescript
import { serverExport } from '@/lib/{domain}/server';
```

## Environment Variables
- `REQUIRED_VAR`: Description and validation rules
- `OPTIONAL_VAR`: Description with default values

## Validation & Types
- **Runtime Validation**: `@/lib/validators/{domain}/`
- **Type Definitions**: `@/types/{domain}/`

## Validation Rules

### 🔍 **Input Validation**

#### Zod Schema Requirements
- **MUST** validate all external inputs with Zod schemas
- **MUST** place schemas in `@/lib/validators/{domain}/`
- **MUST** export inferred types to `@/types/shared/validation/types.ts` or domain-specific type files
- **MUST** use descriptive error messages

#### Validation Pattern
```typescript
// lib/validators/{domain}/schemas.ts
export const inputSchema = z.object({
  field: z.string().min(1, 'Field is required')
});

// lib/validators/{domain}/index.ts
export const validateInput = (input: unknown) => {
  return assertZodSchema(inputSchema, input);
};

// types/shared/validation/types.ts (for cross-cutting validation types)
// or domain-specific type files for domain-specific types
export type InputType = z.infer<typeof inputSchema>;
```

### 🛡️ **Security Validation**

#### Authentication Guards
- **MUST** use `requireUserId()` or `requireAuthContext()` for protected operations
- **MUST** validate user permissions with role-based access control
- **MUST** implement rate limiting for all user-facing endpoints

#### SQL Security
- **MUST** use parameterized queries only
- **MUST** validate AI-generated SQL with tenant scoping
- **MUST** implement SQL injection prevention

## Environment & Configuration

### 🌍 **Environment Variables**

#### Access Pattern
- **MUST** use `getEnv()` from `@/lib/shared/env` for server-side access
- **MUST** use `getEnvEdge()` from `@/lib/api/env` for Edge runtime
- **MUST NOT** access `process.env` directly in application code

#### Validation
- **MUST** validate required environment variables on startup
- **MUST** provide sensible defaults for optional variables
- **SHOULD** document all environment variables in domain READMEs

### ⚙️ **Configuration Management**

#### Runtime Configuration
- **MUST** use `@/lib/config` for environment-aware configuration
- **MUST** support feature flags for gradual rollouts
- **SHOULD** cache configuration for performance

## Testing Standards

### 🧪 **Test Organization**

#### Test Location
- **MUST** place unit tests in `tests/unit/lib/{domain}/`
- **MUST** place integration tests in `tests/integration/{domain}/`
- **MUST** place component tests in `tests/components/{domain}/`

#### Test Coverage
- **MUST** maintain ≥ 80% line coverage
- **MUST** maintain ≥ 70% branch coverage
- **MUST** test error conditions and edge cases

### 🔧 **Test Patterns**

#### Unit Tests
```typescript
// tests/unit/lib/{domain}/module.test.ts
import { describe, it, expect } from 'vitest';

describe('module', () => {
  it('should handle normal case', () => {
    // Test implementation
  });

  it('should handle error case', () => {
    // Test error handling
  });
});
```

#### Integration Tests
```typescript
// tests/integration/{domain}/workflow.test.ts
describe('workflow integration', () => {
  it('should complete full workflow', async () => {
    // Test complete workflows
  });
});
```

## Enforcement & Automation

### 🤖 **Automated Guardrails**

#### Structure Validation
- **MUST** run structure validator on every PR
- **MUST** fail builds on structural violations
- **MUST** provide actionable error messages

#### Import Validation
- **MUST** prevent cross-domain leaf imports
- **MUST** enforce barrel usage for large domains
- **MUST** validate runtime boundary compliance

### 📋 **CI/CD Integration**

#### PR Validation
```yaml
# .github/workflows/guardrails.yml
- name: Validate lib structure
  run: pnpm guard:structure:strict

- name: Validate barrel exports
  run: pnpm agent:indexes

- name: Run domain tests
  run: pnpm test --filter lib/{domain}
```

#### Quality Gates
- **MUST** pass structure validation before merge
- **MUST** have updated barrel indexes
- **MUST** maintain test coverage thresholds
- **MUST** validate import boundaries

## Migration & Evolution

### 🔄 **Refactoring Guidelines**

#### Safe Refactoring Steps
1. **Create new structure** alongside existing
2. **Migrate imports** incrementally
3. **Update documentation** and examples
4. **Run comprehensive tests** after each change
5. **Remove old code** only after full migration

#### Breaking Changes
- **MUST** provide migration guides for breaking changes
- **MUST** update all import statements
- **MUST** validate no runtime regressions
- **SHOULD** use feature flags for gradual rollouts

### 📈 **Scalability Monitoring**

#### Metrics to Track
- **MUST** monitor domain size and complexity
- **MUST** track cross-domain dependencies
- **MUST** measure build times and bundle sizes
- **SHOULD** audit for architectural drift quarterly

#### Growth Triggers
- **MUST** review domains quarterly for split opportunities
- **MUST** add sub-domains when complexity increases
- **MUST** extract shared utilities proactively

## Common Pitfalls & Lessons Learned

### 🚫 **Avoid These Patterns**

#### Server-Only Code in Shared Barrels
```typescript
// ❌ WRONG: Server-only utilities in shared barrel (breaks Edge runtime)
export { getEnv } from '@/lib/server/env'; // FAILS in Edge runtime routes

// ✅ CORRECT: Keep server-only utilities in server-specific exports
// lib/shared/server.ts (server-only)
export { getEnv } from '@/lib/server/env';

// lib/shared/index.ts (client-safe only)
export { getEnvEdge } from '@/lib/api/env';
```

#### Node-Only Dependencies in Client Code
```typescript
// ❌ WRONG: Node-only imports in client components
import { withRateLimit } from '@/lib/server/rate-limit'; // BREAKS in Edge

// ✅ CORRECT: Use Edge-safe alternatives or isolate server code
// Client component - use Edge-safe utilities only
import { http } from '@/lib/api';

// Server component - can use Node utilities
import { withRateLimit } from '@/lib/server/rate-limit';
```

#### Mixed Runtime Exports
```typescript
// ❌ WRONG: Mixed exports in single barrel
// lib/problematic/index.ts
export { clientUtil } from './client';      // ✅ Client-safe
export { serverUtil } from './server';      // ❌ Server-only in client barrel

// ✅ CORRECT: Separate barrels by runtime
// lib/problematic/index.ts (client-safe only)
export { clientUtil } from './client';

// lib/problematic/server.ts (server-only)
'use server';
export { serverUtil } from './server';
```

#### Cross-Domain Dependencies
```typescript
// ❌ WRONG: Direct leaf imports across domains
import { someInternalUtil } from '@/lib/other-domain/internal-file';

// ✅ CORRECT: Use domain barrels or promote to shared
import { someUtil } from '@/lib/other-domain';  // Domain barrel
// OR
import { someUtil } from '@/lib/shared';        // Shared utility
```

### 📚 **Lessons from Recent Remediation**

#### Environment Access Layering
- **Problem**: Direct `process.env` usage scattered throughout codebase
- **Solution**: Centralized environment access with runtime-appropriate helpers
- **Impact**: Prevents Edge runtime failures and provides consistent configuration

#### Runtime Boundary Enforcement
- **Problem**: Server-only code leaking into Edge runtime routes and client bundles
- **Solution**: Strict runtime boundaries with automated validation
- **Impact**: Eliminates runtime errors and improves performance

#### Import Pattern Standardization
- **Problem**: Deep imports and inconsistent barrel usage
- **Solution**: Consistent barrel exports and automated index generation
- **Impact**: Better tree-shaking, clearer dependencies, easier refactoring

#### Security Pattern Consolidation
- **Problem**: Inconsistent validation and error handling across domains
- **Solution**: Standardized security patterns with automated enforcement
- **Impact**: Improved security posture and consistent user experience

### 🔧 **Development Best Practices**

#### New Domain Creation
1. **Plan Runtime Requirements**: Determine if domain needs Edge, Node, or both
2. **Create Appropriate Barrels**: Separate client-safe and server-only exports
3. **Add Comprehensive Tests**: Include runtime boundary and integration tests
4. **Document Thoroughly**: Include usage examples for both client and server contexts

#### Code Review Checklist
- ✅ **Runtime Safety**: Code works in intended runtime (Edge/Node/both)
- ✅ **Import Patterns**: Uses appropriate barrel imports, no deep imports
- ✅ **Security Compliance**: Follows authentication, validation, rate-limiting patterns
- ✅ **Documentation**: Has usage examples for different contexts
- ✅ **Testing**: Includes tests for runtime boundaries and error conditions

## Legacy Exceptions

### 📜 **Grandfathered Patterns**

#### Documented Exceptions
- **rate-limiting** folder name (legacy; new domains must use `ratelimiting`)
- **Existing cross-domain imports** (must be refactored when touched)
- **Mixed naming conventions** in legacy domains (standardize when refactoring)

#### Exception Management
- **MUST** document all exceptions in this section
- **MUST** provide migration plan for each exception
- **MUST** remove exceptions as code is modernized

## Tooling & Automation

### 🛠️ **Development Tools**

#### Required Tools
- **MUST** use domain scaffolder for new domains: `pnpm scaffold:domain`
- **MUST** validate structure regularly: `pnpm guard:structure`
- **MUST** update barrel indexes: `pnpm agent:indexes`

#### Quality Scripts
```json
{
  "scripts": {
    "guard:structure": "tsx scripts/validation/lib-structure.ts",
    "guard:structure:strict": "tsx scripts/validation/lib-structure.ts --strict",
    "scaffold:domain": "tsx scripts/scaffold/domain.ts",
    "agent:indexes": "tsx scripts/generate/agent-indexes.ts"
  }
}
```

## Related Documentation

- [Import Patterns & Boundaries](../codebase-apis/import-patterns.md)
- [Testing Strategy](../testing-quality/testing-strategy.md)
- [Security Patterns](../security/README.md)
- [API Patterns](../api-data/api-patterns.md)

---

*These guidelines ensure Corso's domain-driven architecture remains scalable, consistent, and maintainable as the codebase grows.
All team members must follow these rules when creating new domains or modifying existing ones.*

**Last updated:** 2025-09-12
**Owner:** platform-team@corso
