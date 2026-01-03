---
title: "scripts/rules/ast-grep"
last_updated: "2026-01-03"
category: "automation"
---

# AST-Grep Rules Documentation

This directory contains ast-grep rule definitions that enforce code patterns, architectural boundaries, and security standards through static analysis.

**Total Rules:** 7  
**Categories:** 5  
**Severity Breakdown:**
- **error**: 7

> ⚠️ **Note**: This README is auto-generated from YAML rule files. To update documentation, edit the YAML files directly.

## Rule Categories

### General

#### `no-direct-ag-grid-module-registry-in-components` 🔴 `typescript`

**Message:** Do not call ModuleRegistry.registerModules in components. Use ensureAgGridRegistered() from lib/vendors/ag-grid.client instead.


**Path:** `ag-grid-no-direct-registration.yml`

#### `no-direct-clickhouse-import-outside-integration` 🔴 `typescript`

**Message:** Only import '@clickhouse/client' inside lib/integrations/clickhouse/** or scripts/**.

**Path:** `consolidated-no-direct-clickhouse-import-outside-integration.yml`

#### `ui-no-any` 🔴 `typescript`

**Message:** Avoid 'any' escape hatches in UI components. Use proper typing instead.

**Files:** `components/ui/**/*.{ts,tsx}`, `components/*/ui/**/*.{ts,tsx}`, `styles/ui/**/*.{ts,tsx}`

**Path:** `ui-no-any.yml`


### dashboard

#### `dashboard.no-client-import-server-barrel` 🔴 `ts`

**Message:** Client/edge code must not import from "@/lib/server/dashboard". Import server APIs only within server files (with `import 'server-only'`).


**Path:** `dashboard\no-client-import-server-barrel.yml`


### hardening

#### `no-api-test-routes` 🔴 `TypeScript`

**Message:** Do not add test routes under app/api/**/test/route.ts

**Files:** `app/api/**/test/route.ts`

**Path:** `hardening\no-api-test-routes.yml`


### patterns

#### `no-server-only-in-pages` 🔴 `TypeScript`

**Message:** Importing "server-only" is not allowed in the legacy pages/ router. Use a .rsc.ts split and import via '@/lib/<domain>' barrel.

**Path:** `patterns\no-server-only-in-pages.yml`


### runtime-boundaries

#### `forbid-at-alias-in-rules` 🔴 `typescript`

**Message:** Scripts must not import from @/ (app code). Use scripts/_shared or move script to lib/.

**Path:** `runtime-boundaries\forbid-at-alias-in-rules.yml`


## ESLint vs AST-Grep

Some policies are enforced via ESLint rules, others via ast-grep. Here's the breakdown:

### ESLint-Only Policies
- Runtime boundary enforcement (client/server/edge)
- Import path validation
- Type safety checks
- API wrapper enforcement
- Environment variable access patterns

### AST-Grep-Only Policies
- Pattern-based code style enforcement
- File structure validation
- Cross-cutting concerns (e.g., no `any` in UI components)
- Hardening rules (e.g., no test routes in API)

### Overlapping Policies
Some policies may be enforced by both tools for redundancy or different use cases.

## Adding New Rules

To add a new ast-grep rule:

1. Create a YAML file in the appropriate category directory (or root)
2. Define the rule with required fields:
   ```yaml
   id: rule-name
   message: "Human-readable error message"
   severity: error | warning | info
   language: typescript | javascript | etc.
   files:
     - "path/pattern/**/*.ts"
   rule:
     # AST pattern or rule definition
   ```
3. Run `pnpm docs:generate:lint` to regenerate this documentation

## Running Rules

```bash
# Scan all files with ast-grep
pnpm ast-grep:scan

# Validate rule syntax
pnpm validate:ast-grep
```

---

_This documentation is auto-generated from YAML rule files. Last updated: 2026-01-03_
