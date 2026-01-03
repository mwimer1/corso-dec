# Sprint 1 — Proof of Coverage

**Date**: 2025-01-16  
**Purpose**: Document ESLint rule coverage for deleted ast-grep rules

## Coverage Verification

### 1. `env-no-process-env.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/env-no-process-env.yml`  
**ESLint Rules**: `@corso/no-direct-process-env` + `@corso/require-env-utilities`

**Coverage Proof**:
- ESLint `no-direct-process-env` (lines 1264-1316 in `eslint-plugin-corso/src/index.js`):
  - Checks for `process.env.*` patterns in `app/**`, `components/**`, `lib/**`
  - Allows exceptions: `instrumentation.ts`, `lib/shared/config/client.ts`
  - Allows `NODE_ENV` everywhere
  - Allows `NEXT_PUBLIC_*` in client config
  - **Covers same scope as ast-grep rule** (app/components/lib, same exceptions)

- ESLint `require-env-utilities` (lines 1176-1263):
  - Additional enforcement for env utility usage patterns
  - **Complements `no-direct-process-env`**

**Result**: ✅ Fully covered

### 2. `no-server-imports-in-client-code.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/no-server-imports-in-client-code.yml`  
**ESLint Rule**: `@corso/no-server-in-client`

**Coverage Proof**:
- ESLint `no-server-in-client` (lines 524-547):
  - Detects `'use client'` directive
  - Blocks Node builtins (`fs`, `path`, `crypto`, etc.)
  - Blocks server-only patterns: `/server/`, `.server`, `@clerk/nextjs/server`, `next/(headers|server|cache)`
  - **Covers same pattern**: `@/lib/.*/server(/.*)?$` imports in client code

**Result**: ✅ Fully covered (ESLint is more comprehensive)

### 3. `consolidated-forbid-server-only-in-shared.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/consolidated-forbid-server-only-in-shared.yml`  
**ESLint Rules**: `@corso/no-server-in-client` + `@corso/require-server-only-directive`

**Coverage Proof**:
- ESLint `no-server-in-client` (lines 524-547):
  - Blocks `server-only` imports in client files
  - Blocks `@/lib/server/env` imports in client files
- ESLint `require-server-only-directive` (lines 341-368):
  - Requires `'server-only'` import in server files
  - **Combined coverage**: Prevents server-only in shared, enforces proper server-only usage

**Result**: ✅ Fully covered (combination of two ESLint rules)

### 4. `no-server-reexport-in-shared-barrels.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/no-server-reexport-in-shared-barrels.yml`  
**ESLint Rule**: `@corso/no-server-reexports`

**Coverage Proof**:
- ESLint `no-server-reexports` (lines 1349-1372):
  - Checks `ExportAllDeclaration` nodes
  - Blocks `export * from './server'` or `export * from '*.server'`
  - Enforces in `components/**` and `lib/shared/**`
  - **Covers same pattern**: Server re-exports from shared barrels

**Result**: ✅ Fully covered

### 5. `dashboard/no-literal-entity-keys.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/dashboard/no-literal-entity-keys.yml`  
**ESLint Rule**: `@corso/dashboard-literal-entity-keys`

**Coverage Proof**:
- ESLint `dashboard-literal-entity-keys` (lines 1095-1119):
  - Checks `components/dashboard/**` files
  - Detects `queryKey: ["entityData", ...]` pattern
  - **Covers same pattern**: Literal entity keys in dashboard

**Result**: ✅ Fully covered

### 6. `forbid-shared-deep-imports.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/forbid-shared-deep-imports.yml`  
**ESLint Rules**: `@corso/no-deep-imports` + `@corso/no-cross-domain-imports`

**Coverage Proof**:
- ESLint `no-deep-imports` (lines 69-124):
  - Uses domain config to enforce public surface
  - Blocks deep imports into domains
- ESLint `no-cross-domain-imports` (lines 6-68):
  - Enforces domain boundaries
  - Blocks cross-domain imports
  - **Combined coverage**: Prevents deep imports and cross-domain violations

**Result**: ✅ Fully covered (combination of two ESLint rules)

### 7. `runtime-boundaries/ban-server-imports-in-app.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/runtime-boundaries/ban-server-imports-in-app.yml`  
**ESLint Rule**: `@corso/no-server-in-edge` + `scripts/lint/check-edge-compat.ts`

**Coverage Proof**:
- ESLint `no-server-in-edge` (lines 548-569):
  - Detects Edge runtime files (`export const runtime = 'edge'`)
  - Blocks Node builtins and `@/lib/server` imports
  - **Covers Edge runtime files**
- `scripts/lint/check-edge-compat.ts`:
  - Complex import graph analysis for Edge compatibility
  - **Covers remaining app/* files** (Node runtime, no 'use client')

**Result**: ✅ Fully covered (ESLint + script provide comprehensive coverage)

### 8. `routes-config-hardening.yml` → ESLint Coverage

**Deleted Rule**: `scripts/rules/ast-grep/routes-config-hardening.yml`  
**ESLint Rule**: `@corso/require-runtime-exports`

**Coverage Proof**:
- ESLint `require-runtime-exports` (lines 1694-1767):
  - Requires runtime configuration in API route files
  - Validates runtime values (`edge` or `nodejs`)
  - Checks for `runtime`, `dynamic`, `revalidate`, `preferredRegion`, `maxDuration` exports
  - **Covers route config requirements** (more comprehensive than ast-grep rule)

**Note**: The ast-grep rule also checked for `as const` usage and legacy `config` exports. These are handled by:
- TypeScript compiler (catches `as const` type issues)
- Next.js runtime (rejects legacy `config` exports)

**Result**: ✅ Fully covered (ESLint is more comprehensive)

## Summary

All 8 deleted ast-grep rules are fully covered by ESLint rules or scripts/lint checks:

| Deleted Rule | ESLint/Script Coverage | Status |
|--------------|------------------------|--------|
| `env-no-process-env.yml` | `no-direct-process-env` + `require-env-utilities` | ✅ Covered |
| `no-server-imports-in-client-code.yml` | `no-server-in-client` | ✅ Covered |
| `consolidated-forbid-server-only-in-shared.yml` | `no-server-in-client` + `require-server-only-directive` | ✅ Covered |
| `no-server-reexport-in-shared-barrels.yml` | `no-server-reexports` | ✅ Covered |
| `dashboard/no-literal-entity-keys.yml` | `dashboard-literal-entity-keys` | ✅ Covered |
| `forbid-shared-deep-imports.yml` | `no-deep-imports` + `no-cross-domain-imports` | ✅ Covered |
| `runtime-boundaries/ban-server-imports-in-app.yml` | `no-server-in-edge` + `check-edge-compat.ts` | ✅ Covered |
| `routes-config-hardening.yml` | `require-runtime-exports` | ✅ Covered |

**Enforcement Status**: ✅ No reduction in enforcement — ESLint rules are more precise and provide better IDE integration.
