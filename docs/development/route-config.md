---
title: "Route Configuration"
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Route Configuration Guide

Short guidance for route authors:

- Prefer named exports for route config: `export const runtime = 'edge'`, `export const dynamic = 'force-dynamic'`, `export const revalidate = 0`.
- When wrapping client components (e.g. Clerk sign-in/sign-up), keep the route file a server component and avoid placing a module-level `'use client'` alongside route config exports. Client components may be rendered from the server component wrapper instead.
- Do NOT export a `config` object (`export const config = { ... }`) — Next.js App Router requires named exports.
- Do NOT use `as const` on route config literals (e.g. `export const runtime = 'edge' as const`) — our ESLint rules will flag this.
- Edge routes must not import Node-only modules (import from `@/lib/api/server` or `@/lib/server`) — prefer `@/lib/api` for Edge-safe helpers.

New repository checks:

- ESLint rule `@corso/require-runtime-exports` — requires runtime configuration in API route files.
- ESLint rule `@corso/no-edge-runtime-on-pages` — blocks Edge runtime on pages/layouts.

If you need to make a route Node runtime (for ClickHouse, Stripe, streaming), declare:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Run `pnpm validate:cursor-rules` locally to validate these rules during development.

## 📚 Related Documentation

- [Runtime Boundaries](../architecture/runtime-boundaries.md) - Edge vs Node.js runtime patterns
- [API Design Guide](../api/api-design-guide.md) - Runtime selection for API routes
- [Edge Runtime Reference](../reference/edge-runtime.md) - Edge runtime boundaries and guardrails
- [ESLint Runtime Boundaries](./eslint-runtime-boundaries.md) - ESLint rules for runtime boundaries
