---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# Custom Lint Rules & Cursor AI Standards

Comprehensive guide to all custom ESLint rules, validation scripts, and Cursor AI rules that enforce codebase standards, security, and runtime boundaries.

## 📋 Overview

The Corso codebase uses multiple layers of validation to ensure code quality, security, and runtime safety:

### 🔧 Custom ESLint Rules
- **Runtime Boundaries**: Prevents server code in client/edge contexts
- **Import Patterns**: Enforces barrel imports and prevents deep imports
- **Environment Usage**: Ensures proper environment variable access patterns
- **Security Standards**: Validates authentication, validation, and rate limiting

### 🔍 Validation Scripts - Development
- **Environment Validation**: `pnpm validate:env` - checks environment setup
- **Cursor Rules Validation**: `pnpm validate:cursor-rules` - validates AI assistant rules
- **OpenAPI RBAC Validation**: `pnpm openapi:rbac:check` - validates API security
- **Link Validation**: `pnpm validate:links` - checks documentation links

### 🤖 Cursor AI Rules - Overview
- **Runtime Boundaries**: Edge safety and server/client separation
- **Security Standards**: Authentication, authorization, validation patterns
- **Code Quality**: Import patterns, error handling, TypeScript strict mode
- **Analytics Tracking**: Edge-safe tracking with graceful degradation

## 🎯 Custom ESLint Rules

### Runtime Boundary Enforcement

The `corso/no-server-only-in-client` rule prevents server-only imports in client/edge contexts:

**Detected Violations:**
- Server-only modules (`/server/` paths, `.server.ts` files)
- Node.js builtins (`fs`, `path`, `crypto`) in client/edge contexts
- Server-only libraries (`@clerk/nextjs/server`, `next/headers`)
- Server environment access (`@/lib/server/env`)

**Correct Usage Patterns:**
```typescript
// ✅ Client Components - Use client-safe imports
'use client';
import { publicEnv } from '@/lib/shared/config/client';
import { logger } from '@/lib/shared/config/client';

// ✅ Edge Routes - Use edge-safe imports
export const runtime = 'edge';
import { getEnvEdge } from '@/lib/api';

// ✅ Server Routes - Use server-only imports
export const runtime = 'nodejs';
import { getEnv } from '@/lib/server/env';
import { auth } from '@clerk/nextjs/server';
```

### Import Pattern Enforcement

The `corso/no-deep-imports` rule enforces barrel imports:

```typescript
// ❌ INCORRECT: Deep imports
import { getCurrentUser } from '@/lib/integrations/clerk/server';

// ✅ CORRECT: Barrel imports
import { getCurrentUser } from '@/lib/integrations/clerk';
```

### Environment Usage Enforcement

The `corso/no-direct-env-access` rule prevents direct `process.env` usage:

```typescript
// ❌ INCORRECT: Direct environment access
const apiKey = process.env.OPENAI_API_KEY;

// ✅ CORRECT: Centralized config patterns
import { getEnv } from '@/lib/server/env';
const apiKey = getEnv().OPENAI_API_KEY;

// Edge-safe version
import { getEnvEdge } from '@/lib/api';
const apiKey = getEnvEdge().OPENAI_API_KEY;
```

### Security Standards Enforcement

Custom rules validate security patterns:

```typescript
// ✅ CORRECT: Proper authentication
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// ✅ CORRECT: Input validation
import { z } from 'zod';
const schema = z.object({ email: z.string().email() });

// ✅ CORRECT: Rate limiting
import { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';
export const POST = withRateLimitEdge(handler);

// ✅ CORRECT: Error handling
import { withErrorHandlingEdge } from '@/lib/api';
export const POST = withErrorHandlingEdge(handler);
```

## 🔍 Validation Scripts (Development)

### Environment Validation
```bash
# Validates environment variables and setup
pnpm validate:env

# Validates custom Cursor AI rules and runtime boundaries
pnpm validate:cursor-rules

# Validates OpenAPI RBAC compliance
pnpm openapi:rbac:check
```

### Link & Documentation Validation
```bash
# Validates all internal links in documentation
pnpm validate:links

# Lints markdown files for style compliance
pnpm docs:lint

# Checks for stale documentation
pnpm docs:stale-check
```

## 🤖 Cursor AI Rules (`.cursor/rules/`) - Overview

### Core Standards Rules
- **Runtime Boundaries**: Edge safety and server/client separation
- **Security Standards**: Authentication, authorization, validation patterns
- **Code Quality**: Import patterns, error handling, TypeScript strict mode
- **Analytics Tracking**: Edge-safe tracking with graceful degradation

### Key Rule Files
```bash
.cursor/rules/
├── security-standards.mdc      # Authentication, validation, rate limiting
├── runtime-boundaries.mdc      # Edge safety and client/server separation
├── code-quality-standards.mdc  # Import patterns and error handling
├── analytics-tracking.mdc      # Edge-safe analytics implementation
├── openapi-vendor-extensions.mdc # API specification standards
└── warehouse-query-hooks.mdc   # Database query patterns
```

### Rule Validation Commands
```bash
# Validate all Cursor AI rules
pnpm validate:cursor-rules

# Check specific rule compliance
pnpm ast-grep scan --rule scripts/rules/ast-grep/security-standards.yml

# Validate runtime boundaries
pnpm ast-grep scan --rule scripts/rules/ast-grep/runtime-boundaries.yml
```

## 🔐 Security Rule Enforcement

### Authentication Patterns
All protected routes must use Clerk authentication:
```typescript
// ✅ CORRECT: Server-side authentication
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// ✅ CORRECT: Client-side authentication
import { useAuth } from '@clerk/nextjs';
const { userId } = useAuth();
```

### Input Validation Patterns
All external inputs must be validated with Zod:
```typescript
// ✅ CORRECT: Schema validation
import { z } from 'zod';
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});

// ✅ CORRECT: Error handling wrapper
import { withErrorHandlingEdge } from '@/lib/api';
export const POST = withErrorHandlingEdge(async (req) => {
  const body = await req.json();
  const validated = schema.parse(body);
  // ... process validated data
});
```

### Rate Limiting Patterns
All endpoints must implement rate limiting:
```typescript
// ✅ CORRECT: Edge runtime rate limiting
import { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';
export const POST = withRateLimitEdge(handler, {
  maxRequests: 30,
  windowMs: 60_000
});

// ✅ CORRECT: Server-side rate limiting
import { checkRateLimit } from '@/lib/ratelimiting';
const limited = await checkRateLimit(key, {
  windowMs: 60_000,
  maxRequests: 30
});
```

## 🏷️ Rule Configuration

### ESLint Configuration
Custom rules are configured in `eslint.config.mjs`:
```javascript
{
  plugins: ['@corso/eslint-plugin'],
  rules: {
    '@corso/no-server-only-in-client': 'error',
    '@corso/no-deep-imports': 'error',
    '@corso/no-direct-env-access': 'error',
    '@corso/require-auth': 'error',
    '@corso/require-validation': 'error',
    '@corso/require-rate-limit': 'error'
  }
}
```

### AST-Grep Rule Validation
Rules are enforced using AST-grep patterns:
```yaml
# Detect missing error handling wrappers
rule: |
  export const $METHOD = withErrorHandlingEdge
  where:
    not inside: lib/api/**

# Detect direct environment access
rule: |
  process\.env\.$KEY
  where:
    not inside: lib/server/env/**
```

## 🚨 Common Violations & Fixes

### Runtime Boundary Violations
**Error:** Server-only import in client component
**Fix:** Use client-safe alternatives from `@/lib/shared/config/client`

### Import Pattern Violations
**Error:** Deep import detected
**Fix:** Use barrel imports like `@/lib/integrations` instead of `lib/integrations/clerk/server`

### Environment Access Violations
**Error:** Direct `process.env` access detected
**Fix:** Use centralized config: `getEnv()` from `@/lib/server/env` or `getEnvEdge()` from `@/lib/api`

### Security Pattern Violations
**Error:** Missing authentication on protected route
**Fix:** Add `auth()` check at the beginning of route handlers

## 🔧 Testing & Validation

### Local Rule Testing
```bash
# Test all ESLint rules
pnpm lint

# Test specific file
pnpm exec eslint path/to/file.tsx

# Test Cursor AI rules
pnpm validate:cursor-rules

# Test OpenAPI RBAC compliance
pnpm openapi:rbac:check
```

### CI/CD Integration
All rules run automatically in:
- Pre-commit hooks (`husky`)
- Pull request checks (`GitHub Actions`)
- Quality gates (`pnpm quality:local`)
- Release pipeline validation

## 📚 Related Documentation

- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns and validation
- [Runtime Boundaries](../../.cursor/rules/runtime-boundaries.mdc) - Runtime separation guidelines
- [Code Quality Standards](../../.cursor/rules/code-quality-standards.mdc) - Import and error handling patterns
- [ESLint Plugin](../../eslint-plugin-corso/README.md) - Plugin implementation details
