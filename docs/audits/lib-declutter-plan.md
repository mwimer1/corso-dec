---
title: "Audits"
description: ">-"
last_updated: "2025-12-14"
category: "documentation"
status: "draft"
---
## Priorities
- P0 runtime violations: 0
- Cross-domain leaves: 135
- Dup families: 0

## (A) Auth consolidation
- Final entrypoints: `@/lib/auth/client` (Edge), `@/lib/auth/server` (Node).
- Clerk provider code under `@/lib/integrations/clerk/**`.
- JWT + session under `@/lib/auth/session/**` with Node-only guards.
- Access control via `@/lib/auth/access-control.ts` as single gate.
Move table:
```
lib/auth/jwt/* -> lib/auth/server (re-export from index)
lib/auth/client.ts -> stays (Edge)
lib/auth/authorization/* -> keep roles; remove duplicates
```
Codemod (Auth):
```
// Replace deep auth imports with entrypoints
@/lib/auth/jwt/*           -> @/lib/auth/server
@/lib/auth/session/*       -> @/lib/auth/server
@/lib/auth/authorization/* -> @/lib/auth (if using roles/assertRole)

// Replace duplicated Clerk helpers with provider adapter
import { auth } from '@clerk/nextjs/server' -> keep; ensure callers import from @/lib/auth/server for wrappers
```

## (B) Billing/Stripe unification
- Single Stripe client at `@/lib/integrations/stripe/client`.
- Webhook handlers Node runtime with `import "server-only"`.
- De-duplicate plans between marketing pricing modules.
- Delete deprecated surfaces enumerated by DEPRECATED.md when unused.
Move table (Billing):
```

## (C) Shared extraction
- Move domain-specific utils from `lib/shared/**` into their domains.
- Keep only env/errors/feature-flags/cache interfaces generic.
Targets:
```
lib/shared/*marketing* -> lib/marketing/**
lib/shared/*cache*     -> expose via lib/shared/cache facade; impl via integrations/redis
```

## (D) Codemods
- Rewrite imports to barrels: `@/lib/<domain>` or `@/lib/<domain>/(server|client)`.
- Prohibit cross-domain leaf imports.
Implementation notes:
```
// TS-morph script outline
- Scan ts files; for imports starting with '@/lib/&lt;domain&gt;/' and tail not in ['', 'server', 'client'] and domain != current domain -> rewrite to '@/lib/&lt;domain&gt;' (or '/server' if server-only symbol)
- Verify symbol exists in barrel; if not, add to barrel index.ts (automated insert)
```

## (E) Risks & rollback
- Introduce changes behind branch, ensure guardrail tests pass.
- Unskip guardrail tests once codemods applied and barrels completed.
- If failures occur, bisect using `.agent/audits/lib-cross-domain-leaves.json` and address largest clusters first.

## (F) Barrel usage guarantees
- Auth barrels: `@/lib/auth/client` for UI config, `@/lib/auth/server` for JWT/session/access control.
- All Node-only modules must include `import 'server-only'`.
