---
title: "Cicd Workflow"
description: "Documentation and resources for documentation functionality. Located in cicd-workflow/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Quality Gates

## Next.js metadata & runtime guards

- metadata/viewport guard: `viewport` must be exported via `export const viewport` or `generateViewport()`,
  never nested inside `metadata`. `not-found.tsx` must not export metadata/viewport.
- edge-runtime guard: pages/layouts declaring `runtime='edge'` may not import Node-only SDKs or use SSG/ISR signals;
  switch to `runtime='nodejs'` or remove the flag.

Both run in `quality.yml` and block merges.

<!-- UI single-child guard temporarily disabled pending implementation. Use codemod fix locally if needed: pnpm fix:single-child -->

### Unified PR Quality Gate (quality-ci)

- Workflow: `.github/workflows/quality.yml` → job name: `quality`
- Purpose: single PR gate that blocks merges on any failure; runs cross‑platform, Windows‑first commands

What it runs (in order):
- ESLint: `pnpm lint`
- TypeScript: `pnpm typecheck`
- Production TypeScript: `pnpm ci:prod-typecheck`
- Tests + Coverage: `pnpm test:coverage` (Vitest)
  - Thresholds enforced (see `vitest.config.ts`):
    - Lines ≥ 80%
    - Functions ≥ 75%
    - Branches ≥ 70%
    - Statements ≥ 80%
  - Reports: `coverage/lcov.info`, `coverage/`
- Circular dependencies: `pnpm madge:ci`
- Duplication (token‑based): `pnpm jscpd:ci` (≤ 2% threshold; config at `.jscpd.json`)
- Docs validation: `pnpm docs:validate`

Local parity
- One command to mirror CI:
  - `pnpm quality:ci`
- Individual checks for quick iteration:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm ci:prod-typecheck`
  - `pnpm test:coverage`
  - `pnpm madge:ci`
  - `pnpm jscpd:ci`
  - `pnpm docs:validate`

Artifacts and visibility
- Coverage artifact uploaded as `coverage-lcov` (file: `coverage/lcov.info`).
- Duplicate detection configured via `.jscpd.json` with ≤ 2% threshold.

Notes
- Uses repository composite action `./.github/actions/setup-node-pnpm` for consistent Node/pnpm setup.
- Commands avoid interactive prompts and Unix‑only constructs to remain Windows‑friendly.
