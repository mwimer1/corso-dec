---
status: "draft"
last_updated: "2025-12-15"
category: "documentation"
title: "Codebase Apis"
description: "Documentation and resources for documentation functionality. Located in codebase-apis/."
---
# Import Patterns & Runtime Boundaries

This guide covers strict client/server separation, runtime boundaries, and import patterns that prevent server-only code from leaking into client bundles.

## 📋 Core Architecture Overview (Client/Server Entry Points)

Use explicit entry points per domain to avoid mixed barrels:

```text
lib/
├── auth/
│   ├── client.ts        # Client-only re-exports (Clerk hooks)
│   └── server.ts        # Server-only utilities (auth(), requireUserId)
├── integrations/
│   ├── openai/server.ts # Server-only OpenAI client
│   ├── clerk/server.ts  # Server-only Clerk admin client
│   └── ...
├── shared/env/
│   ├── client.ts        # getPublicEnv via window shim (no raw process.env)
│   └── server.ts        # requireServerEnv('KEY')
└── core/
    ├── client.ts        # Client-safe exports only
    └── server.ts        # Server-only exports only
```bash

## 🏛️ Domain-Driven Architecture & Facade Patterns

The platform enforces clean architectural boundaries through domain-driven design and facade patterns. The `no-cross-domain-barrels` ESLint rule prevents direct cross-domain imports, requiring the use of designated facade exports.

### Client Containers and Composition (UI ↔ Hooks)

When composing UI from `@/components/**` with state/data from domain-colocated hooks (e.g., `@/components/ui/hooks/**`, `@/components/chat/hooks/**`) inside `app/**` routes:

- Keep a single client boundary per top-level segment (e.g., `app/(protected)/client.tsx`).
- Do not place client modules named `client.tsx` deeper in the tree for the same segment; the rule `corso/one-client-boundary-per-segment` will flag this.
- Prefer a hooks-only client container within the route segment (e.g., `subscription-container.tsx`) that:
  - Uses hooks (e.g., Clerk, local hooks) and exposes a render prop with derived props.
  - Does not import organism barrels from `components` directly when declared under `_components` folders that might be treated as the components domain.
- Compose UI in the RSC page using the container:

```tsx
// app/(protected)/subscription/page.tsx
import { PlanPicker, SubscriptionStatus, ManageSubscriptionButton } from '@/components/billing';

export default function Page() {
  return (
    <div className="space-y-6">
      <h1>Personal Subscription</h1>
      <SubscriptionStatus />
      <PlanPicker />
    </div>
  );
}
```bash

This pattern avoids cross-domain violations enforced by `corso/no-cross-domain-barrels` and keeps client boundaries compliant.

### Domain Structure

The codebase is organized into logical domains, each with specific responsibilities:

- **server**: Server-only utilities and integrations (API routes, server components)
- **shared**: Cross-domain helpers, constants, errors, and validation utilities
- **features**: Domain-specific features (auth, billing, dashboard, etc.)
- **integrations**: Third-party service integrations (ClickHouse, Redis, OpenAI, etc.)

### Server Domain Facades

The `server` domain has specific allowed facades for importing from other domains:

```json
// eslint-plugin-corso/rules/domain-config.json
{
  "server→features": [
    "@/lib/shared",
    "@/lib/core",
    "@/lib/integrations",
    "@/lib/auth/server",
    "@/lib/monitoring",
    "@/lib/security"
  ],
  "server→integrations": [
    "@/lib/integrations"
  ],
  "server→shared": [
    "@/lib/shared"
  ]
}
```bash

### ✅ Correct Server Domain Imports

```tsx
// ✅ Server domain importing from allowed facades
import { requireUserId } from '@/lib/auth/server';  // Via server→features facade
import { checkRateLimit } from '@/lib/security';    // Via server→features facade
import { logger } from '@/lib/monitoring';          // Via server→features facade
import type { ClickParams } from '@/lib/integrations'; // Via server→integrations facade
import { getQueryCache } from '@/lib/integrations'; // Via server→integrations facade

// ✅ Server domain can import from its own barrel
import {
  validateAuthContext,
  ApplicationError,
  ErrorCategory,
  ErrorSeverity
} from '@/lib/server'; // Direct same-domain import allowed
```bash

### Components Domain Facade (APP_LINKS Example)

The components domain provides a facade for accessing shared constants to maintain architectural boundaries:

```tsx
// ✅ CORRECT: Use components facade for shared constants and utilities
import { APP_LINKS, getEnv } from '@/components';

// ❌ INCORRECT: Direct cross-domain import (violates boundary)
import { APP_LINKS } from '@/lib/shared/constants/links';
import { getEnv } from '@/lib/shared/env';
```bash

#### Components Facade Configuration

The components facade in `components/index.ts` safely exposes shared constants:

```tsx
// components/index.ts - Facade for shared constants and utilities
export { APP_LINKS } from '@/lib/shared/constants/links';
export { logger } from '@/lib/shared'; // Client-safe logger facade
export { getEnv } from '@/lib/shared'; // Client-safe environment access facade
```bash

This pattern ensures:
- **Domain Boundaries**: Components don't directly import from shared domain
- **Maintainability**: Changes to shared constants don't break component imports
- **Type Safety**: Centralized type definitions maintained
- **ESLint Compliance**: Satisfies `corso/no-cross-domain-imports` rule

### ❌ Incorrect Cross-Domain Imports

```tsx
// ❌ Direct deep imports (violates domain boundaries)
import type { ClickParams } from '@/lib/integrations/clickhouse/utils';
import { getQueryCache } from '@/lib/integrations/redis/cache-client';
import { checkRateLimit } from '@/lib/ratelimiting';

// ❌ Cross-domain without facade (violates boundary rules)
import { getCurrentUser } from '@/lib/auth/session/user';
import { logger } from '@/lib/monitoring';
```bash

### Facade Pattern Benefits

1. **Clean Architecture**: Enforces domain boundaries and prevents tight coupling
2. **Maintainability**: Changes to internal module structure don't break consumers
3. **Bundle Optimization**: Facades allow tree-shaking and lazy loading
4. **Type Safety**: Centralized exports provide consistent type definitions
5. **Testing**: Easier to mock facade exports during testing

## 🎯 Import Guidelines

### ✅ Client-Side Code (Components, Hooks, Client Utils)

```tsx
// ✅ RECOMMENDED: Use main core for client-safe functionality
import { ApplicationError, clientLogger } from '@/lib/core';

// ✅ ALTERNATIVE: Direct imports for specific modules
import { ApplicationError } from '@/lib/shared/errors/application-error';

// ❌ NEVER: Server-only imports in client code
import { auth } from '@/lib/auth/server'; // ❌ Will cause build errors

// ❌ ALSO AVOID: Security barrel in client/edge (can pull server-only code via transitive exports)
// Use edge-safe subpaths instead
// import { AI_SECURITY_CONFIG } from '@/lib/security'; // ❌ avoid in client/edge

// ✅ In app routes, prefer leaf imports for heavy organisms
import { ErrorFallback } from '@/organisms/error-fallback'; // ✅ leaf import in app/**
// import { ErrorFallback } from '@/organisms'; // ❌ aggregator in app/**
```bash

### ✅ Server-Side Code (API Routes, Server Components, Server Actions)

```tsx
// ✅ RECOMMENDED: Import from domain modules
import { auth } from '@/lib/auth/server';
import { stripe } from '@/lib/integrations/stripe';
import { logger } from '@/lib/monitoring';

// ✅ ALTERNATIVE: Direct imports for specific modules
import { logger } from '@/lib/monitoring';
import { requireServerEnv } from '@/lib/server/env';
import { auth } from '@clerk/nextjs/server';

// ✅ ALSO VALID: Mix server + client-safe imports
import { auth } from '@/lib/auth/server';
import { requireServerEnv } from '@/lib/server/env';
import { ApplicationError } from '@/lib/core'; // Client-safe
```bash

### ✅ API Routes (Special Considerations)

```tsx
// ✅ NO 'use server' directive needed for API routes
import { logger } from '@/lib/monitoring';
import { requireServerEnv } from '@/lib/server/env';

export const runtime = "nodejs"; // ✅ Choose based on SDK compatibility
export const dynamic = "force-dynamic"; // ✅ This is fine

export async function POST(request: Request) {
  // API route logic
}
```bash

### ✅ **Server Actions** (Functions marked with 'use server')

```tsx
'use server'; // ✅ Required at top of file

import { auth } from '@/lib/auth/server';

export async function myServerAction() {
  // All exports must be async functions
}
```bash

## 📦 What's Available Where

### `@/lib/core` (Client-Safe Only)
```tsx
// ✅ Available in client and server contexts
import {
  // Configuration (client-safe)
  publicEnv,
  clientLogger,

  // Validation & Sanitization
  assertZodSchema,

  // Error Handling
  ApplicationError,
  ErrorCategory,
  ErrorSeverity,

  // Events & Messaging
  // ... event system exports

  // Types Only (neutral types to avoid cycles)
  CreateCheckoutSessionInput, // type only, re-exported from '@/types/billing/checkout/types'
} from '@/lib/core';
```bash

### Server-Only Functionality (Domain Modules)
```tsx
// ❌ NEVER import in client code - will cause build errors
// ❌ NEVER import in edge runtime - will cause runtime errors

// ✅ ONLY in server components, API routes, server actions

export const runtime = 'nodejs'; // ✅ Required for Node.js dependencies

// Authentication & Session Management (@/lib/auth)
import { auth } from '@/lib/auth/server';
import { assertRole } from '@/lib/auth/authorization/roles';

// Security & Validation (@/lib/security, @/lib/ratelimiting)
import { verifyTurnstileToken } from '@/lib/security/server';
import { rateLimit } from '@/lib/ratelimiting/core';

// Environment (@/lib/server/env)
import { getEnv } from '@/lib/server/env';

// Integrations (@/lib/integrations)
import { stripe } from '@/lib/integrations/stripe';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { createSupabaseClient } from '@/lib/integrations/supabase/server';

// Database & Analytics (@/lib/integrations)
import { createSafeSqlBuilder } from '@/lib/integrations/database/builder';

// Chat System (@/lib/chat)
import * as chat from '@/lib/chat/index.server';

// Monitoring & Observability (@/lib/monitoring)
import { logger } from '@/lib/monitoring';
```bash

### `@/lib/monitoring/index-server` (Server-Only Monitoring)
```tsx
// ❌ NEVER import in client code - includes pipeline exports
import {
  logger,
  collectQueryMetrics,
  // ... other server-only monitoring exports
} from '@/lib/monitoring/index-server';
```bash

## 🚨 Common Pitfalls & Fixes

### ❌ **Problem**: Importing logger from wrong place
```tsx
import { logger } from '@/lib/core'; // ❌ logger not exported from client core
```bash

**✅ Fix**: Use direct import or server core
```tsx
import { logger } from '@/lib/monitoring'; // ✅ Direct import
```bash

### ❌ **Problem**: JWT/Crypto imports in client code
```tsx
// In client component
import { auth, verifyJWT } from '@/lib/core'; // ❌ Crypto doesn't work in browsers
```bash

**✅ Fix**: Move auth logic to server
```tsx
// In server component or API route
import { auth } from '@/lib/auth/server'; // ✅
```bash

### ❌ **Problem**: 'use server' in API routes
```tsx
'use server'; // ❌ Conflicts with runtime exports

export const runtime = "edge"; // ❌ Only async functions allowed with 'use server'
```bash

**✅ Fix**: Remove 'use server' from API routes
```tsx
// API routes don't need 'use server'
export const runtime = "edge"; // ✅
```bash

### ❌ **Problem**: Server-only imports in shared utilities
```tsx
// In lib/shared/utils/helper.ts
import { getEnv } from '@/lib/server/env'; // ❌ May be imported by client code
```bash

**✅ Fix**: Use direct imports or make utility server-only
```tsx
import { publicEnv } from '@/lib/shared/config/client'; // ✅ Client-safe
// OR add 'use server' if truly server-only
```bash

### ❌ **Problem**: Missing "use client" directive for interactive components
```tsx
// Example: Any component using React hooks without "use client"
// import React, { useState, useEffect } from "react"; // ❌ Missing "use client"

// Build error: You're importing a component that needs useEffect...
```bash

**✅ Fix**: Add "use client" directive to all components using React hooks
```tsx
// ✅ CORRECT: Add "use client" directive
"use client";

import React, { useState, useEffect } from "react";

// Now all React hooks work properly in Next.js App Router
```bash

### ❌ **Problem**: Heavy dependencies loaded on initial page load
```tsx
// In server component
import { MarketInsightsSection } from '@/components/landing'; // ❌ Loads Recharts immediately

export default function Page() {
  return <MarketInsightsSection />; // Heavy bundle impact
}
```bash

**✅ Fix**: Use lazy loading wrapper for performance
```tsx
// ✅ CORRECT: Lazy load heavy components
import { LazyMarketInsightsSection } from '@/components/landing';

export default function Page() {
  return <LazyMarketInsightsSection />; // Deferred loading
}
```bash

### ❌ **Problem**: Name collision with Next.js route option `dynamic`
```tsx
// In an app route file
import dynamic from 'next/dynamic'; // ❌ Conflicts with exported route option below

export const dynamic = 'force-static'; // Route option

const ProductShowcase = dynamic(() => import('./product-showcase'));
// TS errors: TS2395/TS2440 (merged declaration/local vs exported), callable type issues
```bash

**✅ Fix**: Alias the import to avoid shadowing the route option symbol
```tsx
import NextDynamic from 'next/dynamic'; // ✅ Aliased to avoid collision

export const dynamic = 'force-static';
const ProductShowcase = NextDynamic(() => import('./product-showcase'));
```bash

## 🏗️ Migration Guide

### From Old Import Patterns

```tsx
// ❌ OLD: Everything from lib/core
import { env, logger, auth, publicEnv } from '@/lib/core';

// ✅ NEW: Split by client/server
// In client code:
import { publicEnv, ApplicationError } from '@/lib/core';

// In server code:
import { auth } from '@/lib/auth/server';
import { logger } from '@/lib/monitoring';
import { getEnv } from '@/lib/server/env';
```bash

### Barrel Export Guidelines

```tsx
// ❌ DON'T: Mix client/server in barrel exports
export * from './server-only-module';
export * from './client-safe-module';

// ✅ DO: Separate or mark appropriately
// lib/client-safe/index.ts
export * from './client-safe-module';

// lib/server-only/index.ts
'use server';
export * from './server-only-module';
```bash

### Root `@/lib` barrel removal (2025-09)

- The root `@/lib` barrel has been removed to prevent cross-domain, transitive imports.
- Use domain-specific entry points and subpaths instead, for example:
  - `@/lib/auth` (server-only helpers like `requireUserId`)
  - `@/lib/integrations/stripe/client` (Stripe client proxy)
  - `@/lib/middleware/http` (edge-safe HTTP helpers)
  - `@/lib/shared/*` (narrow, explicit utilities)
- If you see `import ... from '@/lib'` in older code, replace it with the appropriate domain import.

## 🔄 Circular Dependency Prevention

### ✅ **COMPLETE RESOLUTION ACHIEVED**
**All 17 circular dependencies have been resolved** through systematic architectural fixes and import pattern improvements, ensuring clean production builds.

### Cycle Detection Commands
```bash
# Verify zero circular dependencies (should show "✔ No circular dependency found!")
pnpm dlx madge --circular --ts-config tsconfig.json .

# Check specific directories
pnpm dlx madge --circular --ts-config tsconfig.json lib components

# CI verification
if pnpm dlx madge --circular --ts-config tsconfig.json . 2>/dev/null; then
  echo "✅ No circular dependencies detected"
else
  echo "❌ Circular dependencies found!"
  exit 1
fi
```bash

### Common Cycle Patterns & Solutions (Successfully Applied)

#### 1. Type Definition Cycles (RESOLVED)
```typescript
// ❌ PROBLEM: Types importing from auth create cycles
// types/shared/core/references/types.ts
import type { Permission } from '@/types/auth'; // Creates cycle!

// ✅ SOLUTION: Keep canonical types in domain, remove duplicates
// Note: Auth types were removed as unused. Use Clerk types directly:
// import type { User } from '@clerk/nextjs/server';
```bash

#### 2. Barrel Import Cycles (RESOLVED)
```typescript
// ❌ PROBLEM: Direct imports from leaf modules bypass barrels
// lib/chat/query/processing.ts
import { maskSensitiveData } from '@/lib/security/utils/masking'; // Leaf import!

// ✅ SOLUTION: Use barrel imports for consistency
// lib/chat/query/processing.ts
import { maskSensitiveData } from '@/lib/security';
```bash

#### 3. Validation Chain Cycles (RESOLVED)
```typescript
// ❌ PROBLEM: Validators importing from themselves
// lib/validators/auth/utils.ts
import { VALIDATION_ERROR_CODES } from '@/lib/validators'; // Cycle!

// ✅ SOLUTION: Direct import from constants
// lib/validators/auth/utils.ts
import { VALIDATION_ERROR_CODES } from '../shared/constants';
```bash

#### 4. API Response Cycles (RESOLVED)
```typescript
// ❌ PROBLEM: API response types cycle with pagination
// types/shared/data/pagination/types.ts
import type { BaseApiResponse } from '@/api/response/types';

// ✅ SOLUTION: Move to shared core references
// types/shared/core/references/types.ts
export interface BaseApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: ISODateString;
  request_id?: string;
}
```bash

### Cycle Prevention Checklist

**Before adding new imports/exports:**

1. **Will this import create a cycle?**
   - ✅ Check if the imported module (directly or indirectly) imports from the current module
   - ✅ Use `pnpm dlx madge --circular` to verify (should show "✔ No circular dependency found!")

2. **Is this a barrel import that could cycle?**
   - ✅ Prefer direct imports in core/shared modules (e.g., `@/lib/shared/env` not `@/lib/shared`)
   - ✅ Use barrel imports only for leaf modules that don't import back

3. **Are there environment variables involved?**
   - ✅ Always import `getEnv` directly from `@/lib/shared/env`
   - ✅ Never from `@/lib/shared` barrel

4. **Is this error handling code?**
   - ✅ Avoid importing from monitoring/logging in error handlers
   - ✅ Consider console logging or delayed imports

5. **Are type definitions involved?**
   - ✅ Use `export type { ... }` for type-only exports
   - ✅ Keep canonical types in domain, import from domain locations to break cycles
   - ✅ Separate runtime exports from type exports when cycles occur

### ✅ **Benefits of Complete Resolution**

**TypeScript Compilation:**
- ✅ Faster incremental compilation (no more O(n²) cycles)
- ✅ Better IDE intellisense performance
- ✅ Cleaner type checking graphs

**Runtime Performance:**
- ✅ Improved bundle analysis and tree shaking
- ✅ Better code splitting capabilities
- ✅ Reduced bundle size through optimized imports

**Development Experience:**
- ✅ Reliable hot module replacement
- ✅ Faster build times
- ✅ Easier debugging with linear call stacks
- ✅ Better module resolution predictability

## 🔍 Debugging Import Issues

### Build Error: "logger is not exported"
```text
Attempted import error: 'logger' is not exported from '@/lib/core'
```
**Solution**: Use `@/lib/monitoring`

### Bundle Bloat: importing organisms barrel in app/**
```typescript
import { ErrorFallback } from '@/organisms';
```
**Solution**: Import leaf module instead:
```typescript
import { ErrorFallback } from '@/organisms/error-fallback';
```

### Build Error: "Can't resolve 'crypto'"
```text
Module not found: Can't resolve 'crypto'
```
**Solution**: Move JWT/crypto imports to server-only code

### Build Error: "Only async functions allowed"
```text
Only async functions are allowed to be exported in a "use server" file
```
**Solution**: Remove `'use server'` from API routes and barrel exports

## 🎯 Best Practices

1. **Start with Smart Core**: Use `@/lib/core` for client code, import from domain modules for server code
2. **Use Direct Imports**: When you need specific modules, import directly for clarity
3. **Check Context**: Always consider whether your code runs client-side or server-side
4. **Test Client Builds**: Ensure client components don't accidentally import server-only modules
5. **Runtime Checks**: The smart core provides helpful runtime error messages for misuse

## 📚 Related Documentation

- [Architecture Overview](../README.md) - Platform architecture
- [Pattern Library](../../pattern-library.md) - General coding guidelines
- [UI Design Guide](../architecture-design/ui-design-guide.md) - Component patterns
- [API Routes Guide](./api.md) - Server-side patterns
- Security imports: see `lib/security/README.md` and `types/security/README.md`

## 🧭 Analytics Barrels: Client vs Server

```ts
// Client-safe barrel
import { /* filter types, utils */ } from '@/lib/dashboard/analytics';

// Server-only imports (use direct imports instead)
import { generateChartConfig } from '@/lib/dashboard/analytics/chart-config.server';
import { queryClickHouse } from '@/lib/dashboard/analytics/query';
import { createCachedQuery } from '@/lib/dashboard/analytics/query-base.server';
```bash

- Use direct imports from server files instead of the removed server barrel.

## 🌐 API Barrels: Edge vs Node

```ts
// Edge-safe API helpers
import { http, withErrorHandlingEdge, redirectPermanent } from '@/lib/api';

// Node-only API barrel (requires: export const runtime = 'nodejs')
import {
  handleStripeWebhook,
  handleClerkWebhookPost,
  handleCheckoutPost,
} from '@/lib/auth/server';
// import { handleStripeWebhook } from '@/lib/integrations/stripe';
// import { handleClerkWebhookPost } from '@/lib/integrations/clerk';
// import { handleCheckoutPost } from '@/lib/integrations/stripe';
```bash

- Do not import `@/lib/api/server` from Edge routes.
- Prefer `@/lib/api` in all client/edge contexts to avoid Node-only imports.

## 🔎 Environment Validation Output (Scripts)
The consolidated environment validation (`scripts/setup/validate-env.ts`) prints a summary and now includes warnings in the overall result for consistent formatting.

- Entry: `scripts/setup/validate-env.ts`
- Engine: `scripts/utils/env-validation-consolidated.ts`

Example output:
```text
🔍 Environment Validation
========================
📋 Basic Environment...
   ✅ Basic environment validation passed

📊 Validation Summary
===================
Passed: 5/6 steps
Duration: 842ms
Critical Errors: 0
Warnings: 2

🎉 All validations completed successfully!
```bash

Notes:
- `overall.warnings` is recorded in consolidated results for better summarization.
- Use `pnpm validate:env` (or run the script directly) during setup and CI.

---

_Last updated: 2025-09-03 - Added circular dependency prevention patterns and systematic fixes. Updated guidance: prefer `@/types/shared` barrel for shared UI/core types (e.g., `NavItemData`) instead of deep paths like `@/types/shared/core/ui`._

> See also: Import Boundaries (Critical) in Best Practices for enforced source paths of logger, marketing pricing utilities, dashboard filter types, and SQL builder.
