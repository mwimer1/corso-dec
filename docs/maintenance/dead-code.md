---
title: "Dead Code Removal Guide"
description: "Process and policies for identifying and removing dead code in the Corso codebase."
last_updated: "2025-12-15"
category: "documentation"
status: "stable"
---

# Dead Code Removal Guide

This document describes the process and policies for identifying and removing dead code in the Corso codebase.

## Tools

### Primary Tool: Knip

Knip is our primary dead code detection tool. It analyzes the entire codebase and identifies unused exports, files, and dependencies.

**Usage:**
```bash
pnpm validate:dead-code  # Run Knip
```

**Configuration:** See `.knip.jsonc` in the repository root.

### Secondary Tools

- **Madge** (orphans): Identifies files with no imports
  - Run via: `pnpm validate:dead-code:optimized`
  - Excludes Next.js entrypoints automatically

- **Test-only exports**: Identifies exports used only by tests
  - Run via: `pnpm deadcode:test-only`

## False Positives

### Next.js Entrypoints

The following file patterns are **not** considered dead code, even if they appear unused:

- `app/**/page.tsx` - Next.js pages (filesystem routing)
- `app/**/layout.tsx` - Layout components
- `app/**/loading.tsx` - Loading UI
- `app/**/error.tsx` - Error boundaries
- `app/**/not-found.tsx` - 404 pages
- `app/**/global-error.tsx` - Global error handler
- `app/**/route.ts` - API route handlers
- `app/sitemap.ts` - Sitemap generator
- `middleware.ts` - Next.js middleware
- `next.config.mjs` - Next.js configuration

These are automatically excluded in our tooling configuration.

### Type-Only Imports

Exports that are only imported via `import type` are tracked by Knip and should not be flagged as unused.

### Dynamic Imports

Code loaded via `import()` or runtime file-system loading may appear unused but is actually used dynamically. These require manual verification.

## Batching Strategy

Dead code removal is done in batches to minimize risk:

### Batch 1: Low-Risk Removals

**Scope:** Unused types, constants, and pure helper functions

**Criteria:**
- ✅ Unused type exports
- ✅ Unused constants
- ✅ Unused pure helper functions (no side effects)
- ✅ Unused barrel re-export lines

**Avoid:**
- ❌ Anything in `lib/integrations/**`
- ❌ Anything with "registry", "resolver", "factory"
- ❌ Anything used by scripts or config
- ❌ Anything that smells dynamic (key-based maps, string lookups)

**Quality Gates:**
- `pnpm typecheck` after each deletion
- `pnpm lint` and `pnpm test` after ~20 deletions

### Batch 2: Domain-Specific Cleanup

**Scope:** Unused modules by domain (lib/shared, lib/validators, lib/services, lib/api)

**Process:**
1. Remove unused re-exports in domain's `index.ts`
2. Remove unused exports
3. Remove unused files

**Quality Gates:**
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build` (at least once per domain batch)

### Batch 3: High-Risk Items

**Scope:** Integrations and dynamic exports

**Process:**
1. Manual investigation (search codebase, check configs)
2. Verify no dynamic usage
3. Remove one-by-one with separate commits if needed

**Quality Gates:**
- Full test suite
- Build verification
- Runtime testing if applicable

## Test-Only Exports

Exports used only by tests should be moved out of production barrels:

**Policy A (Preferred):**
- Move to `tests/helpers/**` or `__tests__/helpers/**`
- Remove from `lib/` entirely
- Update test imports

**Policy B (Acceptable):**
- Keep in `lib/testing/**` or `lib/test-utils/**`
- Ensure NOT exported from production barrels (`@/lib`, `@/lib/shared`)
- Only tests import them

## Allowlist Policy

Some exports may be intentionally unused or used dynamically. These can be added to an allowlist:

**File:** `ts-prune-allowlist.txt`

**Format:**
```
# filePath:symbolName
# Justification: why it's kept

lib/server/env.ts:ServerEnvFallback
# Used indirectly by Next.js config at build time
```

**Requirements:**
- Must include justification comment
- Must be reviewed periodically
- Prefer removal over allowlisting when possible

## Workflow

1. **Run tools** to get baseline findings
2. **Triage** findings into batches
3. **Verify** each item before removal:
   - Search codebase for symbol name
   - Check for type-only imports
   - Check for dynamic usage
4. **Remove** in order:
   - Remove from barrel exports first
   - Remove implementation
   - Delete file if empty
5. **Verify** with quality gates
6. **Commit** in logical batches

## Quality Gates

Each batch/PR must pass:

- ✅ `pnpm typecheck`
- ✅ `pnpm lint`
- ✅ `pnpm test`
- ✅ `pnpm build` (at least once per domain batch)

## Definition of Done

The dead code sprint is complete when:

- ✅ Knip results are stable (Next entrypoints not noisy)
- ✅ `lib/**` unused exports reduced to manageable number (~0-10 with justified allowlist)
- ✅ Test-only exports no longer polluting production barrels
- ✅ CI runs dead code check (warn-only initially, plan to fail-on-regression)

## Related Documentation

- [Maintenance Audit Implementation](../maintenance/MAINTENANCE_AUDIT_IMPLEMENTATION.md)
- [Consolidation Summary](../maintenance/CONSOLIDATION_SUMMARY.md)

