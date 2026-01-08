---
status: "draft"
last_updated: "2025-11-03"
category: "documentation"
---
# Edge vs Node API: Boundaries & Guardrails

## Route invariants
- **Edge routes**: `export const runtime = 'edge'`.
  - ❌ Must not import from `@/lib/server/**` or `@/lib/ratelimiting/server`.
- **Node routes**: `export const runtime = 'nodejs'`; also:
  - `export const dynamic = 'force-dynamic'`
  - `export const revalidate = 0`
- **Never** use `as const` on the above route config exports.

## Libraries
- `lib/middleware/edge/**` and `lib/api/**` are treated as Edge-safe by default.
- If you need server-only code, place it under `lib/api/server/**` and **do not** re-export from `lib/api/index.ts`.

## CI & local checks
- `pnpm test:boundaries` — Vitest boundary tests
- `pnpm verify:edge` — static scan for forbidden imports in Edge contexts

## Commands (Windows-first)

Run these exactly; they’re idempotent.

```bash
# 1) Sync & baseline
git --no-pager fetch origin --no-tags --no-recurse-submodules
git checkout -B chore/edge-boundary-guards origin/main

# 2) Install & typecheck
pnpm -w install
pnpm -w typecheck

# 3) Apply patches or copy files, then regenerate indexes if needed
pnpm rules:sync

# 4) Run local gates
pnpm -w lint
pnpm -w test:boundaries
pnpm -w verify:edge
pnpm -w test
pnpm -w build

# 5) Commit with Conventional Commits
git add .
git commit -m "chore(boundary): add ESLint restriction, runtime-boundary tests, and CI checks for Edge/Node APIs"

# 6) Push topic branch
git push -u origin chore/edge-boundary-guards
```

