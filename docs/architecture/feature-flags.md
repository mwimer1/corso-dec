---
category: "architecture"
last_updated: "2026-01-09"
status: "draft"
---
# Feature Flags

Corso uses feature flags to control rollout, enable optional capabilities, and safely ship experimental work.

## Where feature flags live

- **Shared (client-safe) types + helpers**: `lib/shared/feature-flags/**`
- **Server-side definitions + resolvers**: `lib/server/feature-flags/**`

## Usage guidelines

- **Client components**: Prefer shared, client-safe helpers from `lib/shared/feature-flags/**`.
- **Server-only code**: Define and resolve flags in `lib/server/feature-flags/**` and keep all environment access server-side.
- **Do not** access `process.env` directly in app code; use the repo env helpers (see security standards).

## Adding a new flag

1. Add/update the flag definition in `lib/server/feature-flags/feature-flags.ts`.
2. Implement resolver logic (org/user/plan gating) in `lib/server/feature-flags/resolvers.ts` as needed.
3. Expose any client-safe shape via `lib/shared/feature-flags/feature-flags.ts` if the UI needs it.
4. Document the flag in the relevant feature/ADR and include default behavior (fail-open vs fail-closed).

## Related docs

- [Security Standards](../../.cursor/rules/security-standards.mdc)

