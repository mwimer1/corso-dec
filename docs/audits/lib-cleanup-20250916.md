---
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
Summary
-------
- I scanned the live `origin/main` branch of the repository and collected code evidence under `lib/**` relevant to runtime boundaries, env usage, validation patterns, rate-limiting, integrations, and barrel hygiene.
- This report lists findings with file:line evidence and proposes minimal follow-ups for each finding.

Findings (with evidence)
------------------------

1) Server-only imports or Node builtins found in shared/edge surfaces
- `lib/shared/server.ts`: contains `import 'server-only'` and re-exports server env helpers
  - Evidence: lib/shared/server.ts — line ~5: `import 'server-only';`
    (scan output snapshot showed: "lib/shared\server.ts\n5:import 'server-only';")
- `lib/api/streaming/ndjson-route.ts` imports server streaming helper
  - Evidence: lib/api/streaming/ndjson-route.ts — line ~7: `import { ndjsonStream } from "@/lib/server/streaming/ndjson"`
- Several `lib/shared/*` files import `@/lib/server/env` (edge-unsafe)
  - Evidence (partial list):
    - lib/shared/config/runtime.ts — imports `getEnv` from `@/lib/server/env`
    - lib/shared/feature-flags/resolvers.ts — imports `getEnv` from `@/lib/server/env`
    - lib/shared/env/knobs.server.ts — contains `import 'server-only'` and imports server env
    (scan output snapshot includes these paths and import statements)

Risk: Edge runtime code or shared, client-safe barrels may pull Node-only code, breaking Edge builds and causing runtime failures.

Proposed action:
- Move any server-only files from `lib/shared/*` into `lib/server/*` (or create explicit server barrel `lib/shared/server-only.ts` and update callers). Replace client/edge exports with Edge-safe facades.
- Add `import 'server-only'` at the top of moved files to enforce runtime boundary.

2) process.env usage (env conventions)
- Most occurrences of `process.env` are in README docs; a few are in code used for environment detection or dev-only guards.
  - Evidence examples (from scan):
    - lib/shared/cache/simple-cache.ts: line ~44: `if (process.env.NODE_ENV !== 'production') {`
    - lib/monitoring/core/logger.ts: line ~131: `const isProd = (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) === 'production';`
    - README files contain `process.env.*` examples (docs only), e.g. lib/config/README.md, lib/integrations/README.md

Risk: Policy requires server env access only via `@/lib/server/env` and public env via `@/lib/shared/env/public`. Direct `process.env` usage should be confined to `lib/server/env` or build scripts.

Proposed action:
- Replace runtime `process.env` usage with `getEnv()` from `@/lib/server/env` in server code. Leave README examples untouched or convert them to callouts that recommend `getEnv()`.

3) Validators: Zod schemas scattered and not strict
- Many Zod schemas exist under `lib/validators/**` (good) but the scan shows `z.object(...)` usages without `.strict()`.
  - Evidence (sample list):
    - lib/validators/api/request-validation.ts — multiple `z.object(...)` (lines shown in scan)
    - lib/validators/auth/schemas.ts — `userRegistrationSchema = z.object({...})`
    - lib/validators/billing/schemas.ts — `createCheckoutSessionSchema = z.object({...})`
    - (full list produced by scan available in workspace)

Risk: Non-strict Zod schemas allow unknown keys and can mask malformed input at boundaries.

Proposed action:
- Update canonical validators in `lib/validators/**` to use `.strict()` on `z.object()` schemas used at external boundaries. Add a small wrapper `validateInput()` that throws consistent `ApplicationError` (already exists under `lib/actions/validation.ts`) and ensure callers use it.

4) Rate-limiting surfaces duplicated/readability issues
- **RESOLVED**: The `withRateLimitEdge` re-export from `lib/ratelimiting/index.ts` has been removed. The canonical import path is now `@/lib/middleware/edge/rate-limit` or `@/lib/api` (which re-exports it).
  - ✅ Canonical source: `lib/middleware/edge/rate-limit.ts` defines `withRateLimitEdge`
  - ✅ Removed duplicate: `lib/ratelimiting/index.ts` no longer re-exports `withRateLimitEdge`
  - ✅ Clear separation: Core rate limiting algorithms in `lib/ratelimiting`, middleware wrappers in `lib/middleware`

Risk: Previously, confusion about canonical surface; callers could import from different barrels which complicated future refactors. This has been resolved.

Proposed action:
- ✅ **COMPLETED**: Chose canonical public export path `@/lib/middleware` for wrappers and removed re-export from `lib/ratelimiting/index.ts`. All importers now use the canonical path `@/lib/middleware/edge/rate-limit` or `@/lib/api` (which re-exports it).

5) Integrations overlap (ClickHouse / OpenAI)
- There are context-aware clients and server-only clients across `lib/integrations` and `lib/server`.
  - Evidence (samples):
    - lib/integrations/clickhouse/client.ts — context-aware client that delegates to server implementations when needed
    - lib/integrations/clickhouse/client.server.ts — server creation helper (server-only)
    - lib/server/node/clickhouse/client.ts — Node-only ClickHouse client referencing integrations server helpers
    - lib/integrations/openai/server.ts — `createOpenAIClient()` server factory
    - lib/integrations/openai/openai-utils.server.ts — uses `createOpenAIClient()`

Risk: Duplicate clients and ambiguous import surfaces may leak server-only dependencies into edge/client code if barrels expose them incorrectly.

Proposed action:
- Consolidate integration clients into a single server-only factory in `lib/integrations/<service>/server.ts` and expose minimal context-aware facades in `lib/integrations/<service>/client.ts` (edge-safe). Ensure `lib/integrations/index.ts` exports only safe surfaces (types and client facades) and that server-only exports are reachable only via `@/lib/server` or `@/lib/integrations/<service>/server`.

6) Barrel hygiene and deep imports
- Scans found many relative imports across `lib/` (e.g., `from '../shared/query-utils'`) and barrels that re-export server files directly.
  - Evidence:
    - `rg` results show many `from '../...'` imports in lib modules (list in scan output)
    - `lib/api/server/index.ts` re-exports `../billing/handle-post` (server-only re-exports inside api/server are acceptable, but shared barrels must not re-export server-only; internal/webhook.ts has been removed as it was orphaned)

Risk: Deep relative imports and barrels that export server-only code from shared barrels violate the alias/barrel-only golden rule.

Proposed action:
- Add a codemod map to update imports to barrel aliases (e.g., `../shared/foo` → `@/lib/shared/foo` or prefer `@/lib/shared` barrel). For each moved file, update importers accordingly.

Duplicate files & dead code (tooling evidence)
-------------------------------------------
- I ran jscpd, knip, and ts-unused-exports; results indicate several unused exports and duplication hotspots in `styles/` and many exported symbols. (Tool outputs were produced; see workspace logs.)

Minimal, mechanical proposed edits (safe, per-guidance)
----------------------------------------------------
1. Create audit doc (this file) — added at `docs/audits/lib-cleanup-20250916.md`.
2. Codemod map: generate `scripts/codemods/lib-import-rewrites.map.json` with exact old→new import mappings for each moved file (I will generate the map next).
3. Move server-only files found under `lib/shared/*` into `lib/server/*` (preserve history via git mv). Example candidate moves:
   - `lib/shared/server.ts` → `lib/server/shared/index.ts` (or similar)
   - any file with `import 'server-only'` under `lib/shared` → move to `lib/server` and mark `import 'server-only'` at top
4. Update barrels to stop exposing server-only exports from shared barrels. Trim `lib/ratelimiting/index.ts` to not re-export middleware wrappers (or mark them explicit passthrough with comments).
5. Validators: update `z.object({...})` → `z.object({...}).strict()` in `lib/validators/**` for schemas used at external boundaries and add a migration note and tests.
6. Rate-limiting: unify wrapper usage by choosing `@/lib/middleware` as canonical wrapper export. Update importers in `lib/api/*` and `lib/actions/*` accordingly.
7. Integrations: centralize server factories under `lib/integrations/<service>/server.ts` and expose safe facades in `lib/integrations/<service>/client.ts`. Update `lib/integrations/index.ts` to export only safe facades and types.

Tests to add
------------
- For each API boundary changed (moved server file / validator change / rate-limit wrapper replacement): add 2 Vitest tests (happy path + validation failure) under `tests/unit/lib/...` following codebase conventions. Keep tests minimal and focused.

Next steps (I will perform these when you confirm)
------------------------------------------------
1. Generate codemod map `scripts/codemods/lib-import-rewrites.map.json` (I will create it from the most necessary mappings produced by the scan).
2. Implement mechanical edits in minimal commits (moves + barrel trims + validator strict updates + tests).
3. Run `pnpm -w typecheck && pnpm -w lint && pnpm -w test` locally and iterate if errors appear.

If you want me to proceed now I will:
- Create the codemod map file and commit it.
- Apply the first mechanical edits (move `lib/shared/server.ts` → `lib/server/shared/server.ts` and update importers), add shims where needed, and add the 2 Vitest tests for the moved boundary.

Evidence attachments (partial extracts from scans)
--------------------------------------------------
- Server-only import in shared surface:
  - lib/shared\server.ts:5: import 'server-only'

- Shared files importing server env:
  - lib/shared\config\runtime.ts:2: import { getEnv } from '@/lib/server/env'
  - lib/shared\feature-flags\resolvers.ts:2: import { getEnv } from '@/lib/server/env'
  - lib/shared\env\knobs.server.ts:1: import 'server-only'

- Edge streaming importing server helper:
  - lib/api/streaming/ndjson-route.ts:7: import { ndjsonStream } from "@/lib/server/streaming/ndjson"

- Validators (many z.object occurrences under lib/validators):
  - lib/validators/api/request-validation.ts: lines showing `z.object(`
  - lib/validators/auth/schemas.ts: `userRegistrationSchema = z.object({` etc.

- Rate-limiting wrapper & re-export:
  - ✅ **RESOLVED**: lib/middleware/edge/rate-limit.ts defines `withRateLimitEdge` (canonical source)
  - ✅ **RESOLVED**: lib/ratelimiting/index.ts no longer re-exports `withRateLimitEdge` (removed duplicate)

- Integrations: multiple places for ClickHouse/OpenAI client factories
  - lib/integrations/clickhouse/client.ts (context-aware client)
  - lib/integrations/clickhouse/client.server.ts (server factory)
  - lib/server/node/clickhouse/client.ts (node-only client)
  - lib/integrations/openai/server.ts (createOpenAIClient)

Full scan logs and command outputs are available in the workspace shell history.

-- End of audit doc
