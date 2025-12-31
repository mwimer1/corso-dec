---
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
last_updated: "2025-12-31"
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

- `scripts/rules/ast-grep/routes-config-hardening.yml` — errors on `export const config =` and `as const` usage for route config exports in `app/**` files.

If you need to make a route Node runtime (for ClickHouse, Stripe, streaming), declare:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Run `pnpm validate:cursor-rules` locally to validate these rules during development.
