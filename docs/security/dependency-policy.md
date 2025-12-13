---
status: "draft"
title: "Security"
description: "Documentation and resources for documentation functionality. Located in security/."
category: "documentation"
last_updated: "2025-12-13"
---
# Dependency Policy

We keep all high-severity audit issues at zero.

## Approach
1. Update parents that pull in vulnerable transitives (e.g., `@lhci/cli`, `lighthouse`, `puppeteer-core`, `@puppeteer/browsers`).
2. Use `pnpm.overrides` to pin patched floors for vulnerable leaves until upstreams catch up.
3. CI runs `pnpm audit --audit-level=high` on PRs, pushes to `main`, and weekly (see `security-audit.yml`).

### Current enforced floors
- `ws >= 8.17.1` — DoS fix
- `tar-fs >= 3.0.9` — path traversal fixes
- `glob >= 11.1.0` — Command injection fix (via markdownlint-cli)
- `npm-run-path = 5.3.0` — exact pin for bin deduplication
- `unicorn-magic = 0.1.0` — exact pin for bin deduplication
- `@typescript-eslint/utils>eslint = 9.34.0` — exact pin for bin deduplication
- `cross-spawn-async = npm:cross-spawn@7.0.3` — exact alias for bin deduplication
- `json-schema-ref-parser = npm:@apidevtools/json-schema-ref-parser@^11.7.2` — exact pin for bin deduplication
- `@faker-js/faker = npm:@faker-js/faker@^9.2.0` — exact pin for bin deduplication
- `sourcemap-codec = npm:@jridgewell/sourcemap-codec@^1.5.5` — exact pin for bin deduplication
- `deep-extend = npm:@simov/deep-extend@^1.0.0` — exact pin for bin deduplication

### Notes
- We do not silence or ignore `pnpm audit`.
- Keep overrides within the same major version to minimize break risk.
- Remove overrides once parents depend on patched versions.

## Self-Healing Automation
- Renovate runs weekly (see `renovate.json5`) and raises PRs to update parents.
- Auto-merge is limited to minor/patch updates and only after CI (including `pnpm audit --audit-level=high`) passes.
- This keeps secure floors enforced while trending toward removing overrides as parents adopt patches.
## Edge Runtime Guard

Edge-designated entrypoints (middleware and any `app/**/{page,layout,route,error}`
exporting `runtime = 'edge'`) are statically scanned to prevent Node-only APIs and
disallowed packages in the Edge runtime.

- Config: `config/edge-compat.config.json`
- Local: `pnpm run lint:edge`
- CI: step "Edge runtime guard" in `.github/workflows/quality.yml`

Rules enforced:
- Block Node core modules and subpaths (e.g., `fs`, `fs/promises`, `path/posix`)
- Block disallowed packages (database drivers, `sharp`, `node-fetch`, `ws`, etc.)
- Block Node-only globals: `require`, `__dirname`, `__filename`, and non-public `process.env.*`
- Ignore `Buffer` when referenced in type-only lines
<!-- Removed duplicate Dependency Security Policy section (consolidated above) -->

