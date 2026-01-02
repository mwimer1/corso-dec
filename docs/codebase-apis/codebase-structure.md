---
status: "active"
last_updated: "2026-01-02"
category: "documentation"
title: "Codebase Apis"
description: "Documentation and resources for documentation functionality. Located in codebase-apis/."
---
# Codebase Structure & Conventions

This guide provides the definitive reference for Corso's codebase organization, development patterns, and coding standards.

## 📁 Directory Structure

### Root Level Organization

```text
corso-app/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── components/             # React components (UI library)
├── lib/                    # Business logic, utilities, configurations
├── types/                  # TypeScript type definitions
# hooks/                   # Hooks are domain-colocated (components/*/hooks/, components/ui/hooks/)
# contexts/                # Removed - providers are now in app/providers/
├── docs/                   # Documentation
├── config/                 # Build and tooling configuration
├── scripts/                # Development and build scripts
├── tests/                  # Test files and test utilities
└── styles/                 # Styling and design tokens
```

**Note**: Server Actions are feature-colocated (e.g., `app/(marketing)/contact/actions.ts`). There is no top-level `actions/` directory. Shared server action utilities live in `lib/actions/`.

### App Directory (`app/`)

Route-based organization with explicit entity paths:

```text
app/
├── (auth)/                 # Authentication routes
│   ├── sign-in/[[...clerk]]/
│   ├── sign-up/[[...clerk]]/
│   └── onboarding/[step]/
├── (marketing)/            # Public marketing pages
│   ├── page.tsx            # Homepage
│   ├── pricing/page.tsx
│   └── insights/[slug]/
├── (protected)/            # Authenticated user routes
│   ├── dashboard/
│   │   ├── (entities)/     # Data entity routes
│   │   │   ├── projects/
│   │   │   ├── companies/
│   │   │   └── addresses/
│   │   └── page.tsx        # Dashboard home
│   └── account/page.tsx
├── api/                    # API routes (domain-organized)
└── layout.tsx              # Root layout with providers
```

### Components Directory (`components/`)

Domain-driven component organization:

```text
components/
├── ui/                     # Design system (atoms, molecules, organisms)
│   ├── atoms/              # Basic primitives (Button, Input, Icon)
│   ├── molecules/          # Composed components (FormField, SearchBar)
│   └── organisms/          # Complex sections (Navbar, Table, Dialog)
├── auth/                   # Authentication components
├── billing/                # Billing and subscription UI
├── dashboard/              # Business intelligence components
├── forms/                  # Form components and utilities
├── landing/                # Landing page sections
├── chat/                   # Chat interface components
└── README.md               # Component library documentation
```

### Lib Directory (`lib/`)

Business domain organization. **Domains live directly under `lib/`** (no intermediate "services" layer):

```text
lib/
├── auth/                   # Authentication logic
├── billing/                # Billing and payments
├── entities/               # Entity management (projects, companies, addresses)
├── api/                    # API utilities and helpers
├── shared/                 # Cross-domain utilities
├── security/               # Security utilities
├── validators/             # Input validation schemas
├── integrations/           # External service integrations
└── README.md               # Library documentation
```

**Note**: The `lib/services/` directory was removed in favor of direct domain structure. All domains (e.g., `lib/entities/`, `lib/auth/`) live directly under `lib/` following domain-driven architecture principles.

## 🚀 Development Patterns

### Import Patterns

#### Barrel Imports (Preferred)
```typescript
// Domain barrels
import { requireUserId } from '@/lib/auth/server';
import { Button, Input } from '@/components/ui';

// Sub-domain barrels
import { processData } from '@/lib/dashboard/analytics';

// Cross-domain shared utilities
import { ApplicationError } from '@/lib/shared';
```

#### Direct Module Imports (When Needed)
```typescript
// For specific functionality to avoid large barrel imports
// External JWT verification removed; do not import verifyExternalJwt
import { calculateKPI } from '@/lib/dashboard/analytics/kpi';
```

#### Forbidden Patterns
```typescript
// ❌ Cross-domain leaf imports
import { someUtil } from '@/lib/other-domain/internal-file';

// ❌ Runtime boundary violations
import { someNodeUtil } from '@/lib/server'; // In Edge routes
```

### Component Architecture

#### Co-located Components
Route-specific components live next to their pages:

```typescript
// app/(protected)/dashboard/page.tsx
import { ChartClient } from './components/chart-client';
import { EntityTableClient } from './components/entity-table-client';

// Barrel export for clean imports
// app/(protected)/dashboard/components/index.ts
export { ChartClient } from './chart-client';
export { EntityTableClient } from './entity-table-client';
```

#### Barrel Export Rules
- **Must** create `index.ts` when domain root has ≥ 4 exportable files
- **Must** create `server.ts` for mixed domains with server-only exports
- **Must** use consistent export patterns across domains
- **Should** create sub-domain barrels when subfolder has ≥ 4 files

### Runtime Boundaries

#### Edge Runtime Rules
- **Must** declare `export const runtime = 'edge'` in Edge route files
- **Must NOT** import Node-only modules in Edge routes
- **Must** use `@/lib/api` for Edge-safe utilities only

#### Node Runtime Rules
- **Should** declare `export const runtime = 'nodejs'` when needed
- **Can** import Node-only modules and `@/lib/server`
- **Must** use `'use server'` directive in server action files

### Error Handling

#### Structured Error Types
```typescript
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, code: string, public fieldErrors?: any[]) {
    super(message, code, { fieldErrors });
  }
}
```

#### Error Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "error": "Invalid input provided",
  "code": "VALIDATION_ERROR",
  "details": { /* structured error details */ }
}
```

## 🔒 Security Patterns

### Authentication Guards
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

### Input Validation
```typescript
import { z } from 'zod';

// lib/validators/{domain}/schemas.ts
export const inputSchema = z.object({
  field: z.string().min(1, 'Field is required')
});

// Usage
const validated = inputSchema.parse(input);
```

### SQL Security
- **Must** use parameterized queries only
- **Must** validate AI-generated SQL with tenant scoping
- **Must** implement SQL injection prevention

## 🧪 Testing Standards

### Test Organization
```text
tests/
├── unit/                    # Pure functions, utilities
├── integration/             # Cross-module interactions
├── components/              # React component behavior
└── support/                 # Shared test infrastructure
```

### Testing Patterns
```typescript
// Unit tests
describe('utility', () => {
  it('should handle normal case', () => {
    // Test implementation
  });

  it('should handle error case', () => {
    // Test error handling
  });
});

// Component tests
describe('Component', () => {
  it('displays loading state', () => {
    render(<Component />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## 🛠️ Quality Gates

### Automated Validation
- **TypeScript**: `pnpm typecheck` - Full type checking
- **Linting**: `pnpm lint` - Code style and consistency
- **Tests**: `pnpm test` - Unit and integration coverage
- **Security**: `pnpm validate:cursor-rules` - Custom security rules

### Coverage Thresholds
- **Lines**: ≥ 80%
- **Branches**: ≥ 70%
- **Functions**: ≥ 75%
- **Statements**: ≥ 80%

## 📚 Related Documentation

- [Import Patterns](./import-patterns.md) - Detailed import guidelines
- [Repository Directory Structure](../codebase/repository-directory-structure.md) - Complete auto-generated directory tree reference
- [App Directory Structure](../codebase/app-directory-structure.md) - Next.js App Router organization
- [UI Design Guide](../architecture-design/ui-design-guide.md) - Component patterns
- [API Design Guide](../api/api-design-guide.md) - API development patterns and implementation guide
- [Security Standards](../security/README.md) - Security implementation
