---
title: "Ast Grep"
description: ">-"
last_updated: "2025-11-03"
category: "documentation"
status: "draft"
---
## Public Exports
| Tool | Purpose | Import Path |
|------|---------|-------------|
| `ag-grid-no-direct-registration` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-forbid-server-only-in-shared` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-nextjs15-route-params-async` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-no-direct-clickhouse-import-outside-integration` | tool file | `@/scripts/rules/ast-grep`
| `env-no-process-env` | tool file | `@/scripts/rules/ast-grep`
| `forbid-server-only-in-shared` | tool file | `@/scripts/rules/ast-grep`
| `forbid-shared-deep-imports` | tool file | `@/scripts/rules/ast-grep`
| `no-as-const-in-route-config` | tool file | `@/scripts/rules/ast-grep`
| `no-export-config-in-app-router` | tool file | `@/scripts/rules/ast-grep`
| `no-server-imports-in-client-code` | tool file | `@/scripts/rules/ast-grep`
| `no-server-only-in-pages` | tool file | `@/scripts/rules/ast-grep`
| `no-server-reexport-in-shared-barrels` | tool file | `@/scripts/rules/ast-grep`
| `ui-no-any` | tool file | `@/scripts/rules/ast-grep`
| `no-client-import-server-barrel` | tool file | `@/scripts/rules/ast-grep`
| `no-literal-entity-keys` | tool file | `@/scripts/rules/ast-grep`
| `no-api-test-routes` | tool file | `@/scripts/rules/ast-grep`
| `ban-module-scope-env` | tool file | `@/scripts/rules/ast-grep`
| `ban-server-imports-in-app` | tool file | `@/scripts/rules/ast-grep`
| `forbid-at-alias-in-tools` | tool file | `@/scripts/rules/ast-grep`

## Public Exports
| Tool | Purpose | Import Path |
|------|---------|-------------|
| `ag-grid-no-direct-registration` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-forbid-server-only-in-shared` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-nextjs15-route-params-async` | tool file | `@/scripts/rules/ast-grep`
| `consolidated-no-direct-clickhouse-import-outside-integration` | tool file | `@/scripts/rules/ast-grep`
| `env-no-process-env` | tool file | `@/scripts/rules/ast-grep`
| `forbid-server-only-in-shared` | tool file | `@/scripts/rules/ast-grep`
| `no-as-const-in-route-config` | tool file | `@/scripts/rules/ast-grep`
| `no-export-config-in-app-router` | tool file | `@/scripts/rules/ast-grep`
| `no-server-imports-in-client-code` | tool file | `@/scripts/rules/ast-grep`
| `no-server-only-in-pages` | tool file | `@/scripts/rules/ast-grep`
| `no-server-reexport-in-shared-barrels` | tool file | `@/scripts/rules/ast-grep`
| `ui-no-any` | tool file | `@/scripts/rules/ast-grep`
| `no-client-import-server-barrel` | tool file | `@/scripts/rules/ast-grep`
| `no-literal-entity-keys` | tool file | `@/scripts/rules/ast-grep`
| `no-api-test-routes` | tool file | `@/scripts/rules/ast-grep`
| `ban-module-scope-env` | tool file | `@/scripts/rules/ast-grep`
| `ban-server-imports-in-app` | tool file | `@/scripts/rules/ast-grep`
| `forbid-at-alias-in-tools` | tool file | `@/scripts/rules/ast-grep`


## Overview

AST-Grep is a powerful structural search and replace tool that operates on Abstract Syntax Trees (ASTs) rather than plain text. These rules help maintain:

- **🔐 Security standards** — Preventing unauthorized imports, enforcing secure patterns
- **🏗️ Architectural integrity** — Maintaining clean separation between client/server boundaries
- **🎨 Code quality** — Enforcing consistent patterns and preventing common mistakes
- **⚡ Performance** — Optimizing imports and preventing inefficient patterns
- **📱 UI consistency** — Standardizing component usage and CTA patterns


## Directory Structure

### 📁 Rule Categories

| Directory | Focus | File Count | Description | |
|-----------|-------|------------|-------------|
| `_archived/` | **ARCHIVED** | ~~30+ rules~~ | **ARCHIVED**: Migrated to ESLint/Stylelint (2025-01-15) | |
| `dashboard/` | Dashboard Rules | 1 rule | **ACTIVE**: Dashboard-specific import patterns (entity keys migrated to ESLint) | |
| `patterns/` | Code Patterns | 2 rules | Remaining client/server separation, runtime safety | |
| `consolidated-*` | Runtime Safety | 1 rule | **ACTIVE**: ClickHouse boundaries (Next.js 15 async params migrated to ESLint) | |
| Root Level | Mixed | ~6 rules | Essential code quality and security rules | |

### 🗂️ Archive Structure

| Directory | Contents | Reason | |
|-----------|----------|--------|
| `archive/runtime-boundaries/` | Original runtime boundary rules | **✅ Consolidated**: Reduced 30-40% duplication by merging similar patterns | |
| `archive/duplicate-import-boundaries/` | Duplicate import rules | **✅ Migrated**: Moved to ESLint plugin for better integration | |
| `archive/scripts-ast-grep-rules/` | Scripts directory logger rules | **✅ DELETED**: Migrated to ESLint plugin `@corso/eslint-plugin` | |
| `archive/cta/` | Overly narrow CTA rules | **🗑️ Too Narrow**: Button width and container rules applied to specific patterns | |
| `archive/css-utilities/` | CSS-specific rules | **🔧 Better Tool**: CSS patterns better handled by Stylelint/ESLint | |
| `archive/github-workflow/` | GitHub workflow rules | **🏗️ Wrong Tool**: CI/CD rules don't belong in code quality enforcement | |
| `archive/component-specific/` | Component-specific rules | **🎯 Too Narrow**: Rules for specific components don't warrant AST-Grep | |
| `archive/nextjs-specific/` | Next.js/framework rules | **🔧 Better Tool**: Framework patterns better handled by ESLint plugins | |
| `archive/duplicate-rules/` | Duplicate and redundant rules | **🔄 Redundant**: Rules that duplicated existing, more comprehensive rules | |

### 📋 Configuration

Rules are centrally configured in `sgconfig.yml` at the project root:

- **📂 Target files**: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`, etc.
- **🔄 Auto-discovery**: All `.yml` files in `scripts/rules/ast-grep/` are automatically loaded
- **📊 Output**: JSON reports saved to `reports/ast-grep-report.json`

### 🔄 Rule Consolidation Process

**🚀 Multi-Phase Optimization (2025-09-10 to 2025-09-11)**: Comprehensive cleanup reduced rule count by ~65%:

#### **Phase 1: Consolidation (2025-09-10)**
**Consolidated Rules Created:**
- **`consolidated-no-server-import-in-edge-runtime.yml`** - Edge runtime server import restrictions
- **`consolidated-no-server-only-directive-in-shared-lib.yml`** - Server-only directive boundaries
- **`consolidated-no-direct-clickhouse-import-outside-integration.yml`** - ClickHouse integration boundaries
- **`consolidated-forbid-security-barrel-in-client-or-edge.yml`** - Security barrel restrictions
- **`consolidated-nextjs15-route-params-async.yml`** - Next.js 15 async params

#### **Phase 2: Scope Optimization (2025-09-11)**
**Rules Archived:**
- **25+ overly narrow/duplicative rules** across 6 categories
- **CSS utilities** → Better handled by Stylelint
- **Component-specific rules** → Too narrow for AST-Grep
- **GitHub workflow rules** → Wrong tool for CI/CD
- **Framework-specific patterns** → Better handled by ESLint plugins
- **Duplicate rules** → Redundant with existing comprehensive rules

#### **Migration Strategy:**
1. **Critical Analysis**: Identified rules by scope (too narrow, wrong tool, redundant)
2. **Categorization**: Grouped rules by removal reason for systematic archiving
3. **Safe Archiving**: Moved to `archive/` with detailed documentation
4. **Documentation**: Updated all READMEs with archival reasoning
5. **Verification**: Confirmed no breaking changes to active rules

#### **Archive Deletion (2025-01-15):**
**Deleted Files:**
- `scripts/rules/ast-grep/archive/consolidated-client-logger-rules.yml` → Migrated to ESLint plugin `@corso/eslint-plugin`
- `scripts/rules/ast-grep/archive/manifest.json` → Archive manifest no longer needed
- `scripts/rules/ast-grep/archive/no-server-import-in-client.yml` → Consolidated into active rules
- `scripts/rules/ast-grep/archive/no-server-imports-in-client.yml` → Consolidated into active rules
- `scripts/rules/ast-grep/archive/README.md` → Archive documentation removed

**Reason:** Logger enforcement migrated to ESLint plugin for better editor integration and CI feedback. Archive directory cleaned up to reduce repository clutter.

#### **Additional Cleanup (2025-01-15):**
**Removed Unnecessary Rules:**
- `consolidated-client-logger-rules.yml` → Empty file, migrated to ESLint
- `no-server-import-in-client.yml` → Deprecated, consolidated into `consolidated-no-server-imports-in-client.yml`
- `no-server-imports-in-client.yml` → Duplicates `consolidated-no-server-imports-in-client.yml`
- `no-self-barrel-import.sgrep.yml` → Duplicates `forbid-self-barrel-import.yml`
- `cta/cta-archive-list.yml` → Archive documentation only
- `manifest.json` → References deleted archive files
- `no-widget-type-defs.yml` → Too specific to dashboard widgets
- `no-server-exports-in-dashboard-index.yml` → Too specific to one file
- `no-dashboard-barrel-in-lib.yml` → Too specific to dashboard domain

**Reason:** Removed deprecated, duplicate, and overly narrow rules to further reduce maintenance burden and improve focus on essential patterns.

#### **Final Cleanup (2025-01-15):**
**Removed Additional Rules:**
- `no-brand-blue-in-components.yml` → Migrated to Stylelint (CSS-specific)
- `marketing-no-brand-blue-in-css.yml` → Migrated to Stylelint (CSS-specific)
- `no-hardcoded-breakpoints.yml` → Migrated to Stylelint (CSS-specific)
- `landing-no-global-css-imports.yml` → Migrated to Stylelint (CSS-specific)
- `no-broad-dashboard-import-in-components.yml` → Too specific to dashboard domain
- `atomic-ui-missing.yml` → Too opinionated, better handled by code review
- `prefer-barrel-imports.yml` → Migrated to ESLint plugin (`no-deep-imports`)
- `forbid-self-barrel-import.yml` → Migrated to ESLint plugin (`no-cross-domain-imports`)
- `landing-no-self-barrel.yml` → Migrated to ESLint plugin (domain-specific)
- `patterns/no-client-apis-in-server-components.yml` → Already exists in ESLint plugin
- `no-hooks-in-components-ts-without-client.yml` → Migrated to ESLint plugin (React-specific)

**Reason:** Migrated CSS/styling rules to Stylelint for better tool specialization, moved import boundary rules to ESLint for better performance, and removed overly specific rules that don't warrant AST-Grep enforcement.

#### **ESLint & Stylelint Migration (2025-01-XX):**
**Rules Migrated to ESLint (@corso/eslint-plugin):**

**Phase 1 - Import Boundaries (2025-01-15):**
- `force-root-imports.yml` → `corso/force-root-imports`
- `forbid-ui-self-barrel.yml` → `corso/forbid-ui-self-barrel`
- `no-underscore-dirs.yml` → `corso/no-underscore-dirs`
- `no-widgets-from-outside.yml` → `corso/no-widgets-from-outside`
- `no-ad-hoc-navbars.yml` → `corso/no-ad-hoc-navbars`

**Phase 2 - Runtime Boundaries (2025-01-15):**
- `consolidated-no-server-imports-in-client.yml` → `corso/no-server-in-client`
- `consolidated-no-server-import-in-edge-runtime.yml` → `corso/no-server-in-edge`
- `consolidated-forbid-security-barrel-in-client-or-edge.yml` → `corso/forbid-security-barrel-in-client-or-edge`
- `consolidated-no-server-only-directive-in-shared-lib.yml` → `corso/no-server-only-directive-in-shared`
- `dashboard-rules.yml` → `corso/dashboard-import-guard`
- `no-server-import-in-components.yml` → `corso/no-server-in-client`
- `no-server-in-client-barrels.yml` → `corso/no-server-in-client`
- `no-server-only-in-client.yml` → `corso/no-server-in-client`
- `no-client-import-in-server.yml` → `corso/no-server-in-client`
- `no-node-builtins-in-client.yml` → `corso/no-server-in-client`
- `no-node-builtins-in-edge-routes.yml` → `corso/no-server-in-edge`
- `no-client-aggregator-in-server.yml` → `corso/no-server-in-client`
- `no-atoms-barrel-in-server.yml` → `corso/no-server-in-client`
- `no-organisms-barrel-in-server.yml` → `corso/no-server-in-client`
- `no-organisms-aggregator-in-app.yml` → `corso/no-server-in-client`
- `no-radix-in-server.yml` → `corso/no-server-in-client`
- `edge-api-barrel-no-server-imports.yml` → `corso/no-server-in-client`
- `require-server-only-in-server-barrels.yml` → `corso/no-server-only-directive-in-shared`

**Phase 3 - API/Fetch Rules (2025-01-15):**
- `ensure-api-wrappers.yml` → `corso/ensure-api-wrappers`
- `no-raw-internal-fetch.yml` → `corso/no-raw-internal-fetch`
- `next-script/no-empty-nonce.yml` → `corso/next-script-no-empty-nonce`

**Phase 4 - Complex Pattern Migration (2025-01-XX):**
- `dashboard/no-literal-entity-keys.yml` → `corso/dashboard-literal-entity-keys`
- `no-client-in-icons.yml` → `corso/no-client-in-icons`
- `consolidated-nextjs15-route-params-async.yml` → `corso/nextjs15-route-params-async`

**Phase 5 - Runtime Safety Migration (2025-01-XX):**
- `patterns/require-client-directive-for-client-code.yml` → `corso/require-client-directive-for-client-code`
- `patterns/no-mixed-runtime-exports.yml` → `corso/no-mixed-runtime-exports`

**Phase 6 - Environment & Import Rules (2025-01-XX):**
- `no-direct-process-env.yml` → `corso/no-direct-process-env`
- `require-shared-env-server.yml` → `corso/require-server-env-imports`
- `consolidated-no-server-reexports.yml` → `corso/no-server-reexports`
- `no-server-reexports.yml` → `corso/no-server-reexports`
- `no-deprecated-lib-imports.yml` → `corso/no-deprecated-lib-imports`

**Phase 7 - Types & API Rules (2025-01-XX):**
- `no-runtime-in-types.yml` → `corso/no-runtime-in-types`
- `no-await-headers.yml` → `corso/no-await-headers`
- `no-clerkclient-invoke.yml` → `corso/no-clerkclient-invoke`
- `contexts-barrel-usage.yml` → `corso/contexts-barrel-usage`
- `rate-limits-dot-access.yml` → `corso/rate-limits-bracket-access`

**Phase 8 - Final Optimization Rules (2025-01-XX):**
- `forbid-header-spacing-in-dashboard.yml` → `corso/forbid-header-spacing-in-dashboard`
- `no-clerkprovider-outside-root.yml` → `corso/no-clerkprovider-outside-root`
- `rules/api-edge-barrel-no-server-exports.yml` → `corso/api-edge-barrel-no-server-exports`
- `consolidated-nextjs15-route-params-async.yml` → `corso/nextjs15-route-params-optimization` *(complementary ESLint rule)*

**Rules Migrated to Stylelint:**
- `rules/no-faint-border-literal.yml` → `declaration-property-value-disallowed-list` in `.stylelintrc.cjs`
- `rules/no-legacy-color-tokens.yml` → `declaration-property-value-disallowed-list` in `.stylelintrc.cjs`
- `marketing-auth/no-inline-colors.yml` → ESLint rule `corso/no-inline-color-literals` (for JSX) + Stylelint

**Migration Benefits:**
- **🔧 Better Editor Integration**: ESLint rules surface in IDEs with real-time feedback
- **⚡ Improved Performance**: ESLint's AST traversal is optimized for JavaScript/TypeScript
- **🔄 Auto-fix Support**: Many ESLint rules include automatic fixes
- **🎯 Consistent Tooling**: Unified linting experience across the codebase
- **📚 Easier Maintenance**: Single plugin for all code quality rules

**Archived Files:** All migrated rules moved to `scripts/rules/ast-grep/_archived/` with migration metadata.

#### **Benefits Achieved:**
- **📉 98% total reduction** in rule file count (80+ → ~4 files)
- **⚡ Significant performance improvement** - faster AST scanning
- **🔧 Reduced maintenance burden** - fewer, more focused rules
- **🎯 Better separation of concerns** - right tool for right job
- **📚 Cleaner codebase** - removed technical debt and confusion
- **🗑️ Archive cleanup** - Deleted `scripts/rules/ast-grep/archive/` directory after ESLint migration
- **🧹 Additional cleanup** - Removed 9 more unnecessary rules (deprecated, duplicate, overly narrow)
- **🚀 Phase 4 optimization** - Migrated 3 more complex patterns to ESLint (dashboard entity keys, icon SSR safety, Next.js 15 async params)
- **🚀 Phase 5 optimization** - Migrated 2 runtime safety rules to ESLint (client directive enforcement, mixed runtime exports)
- **🚀 Phase 6 optimization** - Migrated 5 environment/import rules to ESLint (process.env access, server env imports, server re-exports, deprecated imports)
- **🚀 Phase 7 optimization** - Migrated 5 types/API rules to ESLint (runtime exports in types, await headers, clerk client usage, contexts barrel, rate limits access)
- **🚀 Phase 8 optimization** - Migrated 4 final optimization rules to ESLint (dashboard spacing, Clerk provider placement, API edge barrel exports, Next.js 15 route params optimization)

## Rules Matrix

| Rule | Purpose | Canonical Tool | Includes/Excludes | Owners |
|------|---------|----------------|-------------------|---------|
| `consolidated-forbid-server-only-in-shared` | Prevent server-only imports in shared/client code | AST-Grep | `lib/shared/**`, `components/**` | platform@corso.io |
| `env-no-process-env` | Prevent direct process.env access (merged module-scope restrictions) | AST-Grep | `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}` (excludes: instrumentation.ts, client config, scripts, tools) | platform@corso.io |
| `ban-server-imports-in-app` | Prevent server imports in App Router (Node runtime only) | AST-Grep | `app/**/*.ts` (excludes: client components, Edge runtime) | platform@corso.io |
| `routes-config-hardening` | Prevent `as const` and legacy `config` exports in App Router | AST-Grep | `app/**/route.ts`, `app/**/page.tsx` | platform@corso.io |
| `consolidated-nextjs15-route-params-async` | Enforce async route params in Next.js 15 | AST-Grep | `app/api/**/*.ts` | platform@corso.io |
| `consolidated-no-direct-clickhouse-import-outside-integration` | Restrict ClickHouse imports to integration layer | AST-Grep | All files (excludes: `lib/integrations/clickhouse/**`, `scripts/**`) | platform@corso.io |
| `ag-grid-no-direct-registration` | Prevent direct AG Grid module registration | AST-Grep | `components/**/*.ts` (excludes: `lib/vendors/**`, `tests/**`) | platform@corso.io |
| `no-server-imports-in-client-code` | Prevent server imports in client components | AST-Grep | `components/**`, `hooks/**` | platform@corso.io |
| `no-server-reexport-in-shared-barrels` | Prevent server module re-exports from shared barrels | AST-Grep | `lib/auth/index.ts`, `lib/core/index.ts` | platform@corso.io |
| `forbid-shared-deep-imports` | Prevent deep imports from shared UI barrels | AST-Grep | `components/ui/**/*`, `components/*/ui/**/*`, `styles/ui/**/*` | platform@corso.io |
| `ui-no-any` | Prevent `any` type usage in UI components | AST-Grep | `components/ui/**/*.{ts,tsx}`, `components/*/ui/**/*.{ts,tsx}`, `styles/ui/**/*.{ts,tsx}` | platform@corso.io |
| `dashboard.no-literal-entity-keys` | Enforce shared entity query key helpers | AST-Grep | `components/dashboard/**` (excludes: `**/*.d.ts`) | platform@corso.io |
| `dashboard.no-client-import-server-barrel` | Prevent client imports from dashboard server barrel | AST-Grep | `components/dashboard/**`, `app/**` (excludes: `components/dashboard/server.ts`) | platform@corso.io |
| `hardening.no-api-test-routes` | Prevent test routes in production API paths | AST-Grep | `app/api/**/test/route.ts` | platform@corso.io |
| `patterns.no-server-only-in-pages` | Prevent server-only imports in legacy pages router | AST-Grep | `pages/**/*.ts`, `pages/**/*.tsx` | platform@corso.io |
| `runtime-boundaries.forbid-at-alias-in-tools` | Prevent app code imports in tools directory | AST-Grep | `tools/` | platform@corso.io |
| `corso/no-server-in-client` | Prevent server-only modules in client code | ESLint | Client files with 'use client' | platform@corso.io |
| `corso/no-server-in-edge` | Prevent server-only modules in Edge runtime | ESLint | Edge runtime files | platform@corso.io |
| `corso/forbid-security-barrel-in-client-or-edge` | Prevent security barrel imports in client/edge | ESLint | Client/Edge files | platform@corso.io |
| `corso/no-server-only-directive-in-shared` | Prevent server-only directive outside server modules | ESLint | Non-server files | platform@corso.io |
| `corso/dashboard-import-guard` | Guard dashboard server imports in client/edge | ESLint | `components/dashboard/**/*` | platform@corso.io |
| `corso/require-client-directive-for-client-code` | Require 'use client' for client components | ESLint | TSX files with React hooks | platform@corso.io |
| `corso/no-mixed-runtime-exports` | Prevent mixed client/server re-exports | ESLint | `lib/**/*.ts` | platform@corso.io |
| `corso/force-root-imports` | Prefer alias imports over relative paths | ESLint | All files | platform@corso.io |
| `corso/no-cross-domain-imports` | Prevent cross-domain deep imports | ESLint | All files | platform@corso.io |
| `corso/no-deep-imports` | Prevent deep imports from domain barrels | ESLint | All files | platform@corso.io |
| `corso/forbid-ui-self-barrel` | Prevent self-imports in UI components | ESLint | `components/ui/**/*` | platform@corso.io |
| `corso/no-underscore-dirs` | Prevent underscore-prefixed directories | ESLint | `components/**/_*/**` | platform@corso.io |
| `corso/no-widgets-from-outside` | Prevent widget imports outside domain | ESLint | Outside `components/` | platform@corso.io |
| `corso/no-ad-hoc-navbars` | Prefer shared Navbar implementation | ESLint | Landing/marketing navbars | platform@corso.io |
| `corso/cta-require-linktrack-or-tracking` | Require LinkTrack for landing CTAs | ESLint | `components/landing/**/*.tsx` | platform@corso.io |
| `corso/no-raw-internal-fetch` | Use lib/api wrappers instead of raw fetch | ESLint | All files | platform@corso.io |
| `corso/ensure-api-wrappers` | Prefer internal API client wrappers | ESLint | All files | platform@corso.io |
| `corso/next-script-no-empty-nonce` | Prevent empty nonce values in Script components | ESLint | All TSX | platform@corso.io |
| `corso/dashboard-literal-entity-keys` | Enforce entity query key helpers (ESLint version) | ESLint | `components/dashboard/**` | platform@corso.io |
| `corso/no-client-in-icons` | Ensure icon modules are SSR-safe | ESLint | `components/ui/atoms/icon/**/*` | platform@corso.io |
| `corso/nextjs15-route-params-async` | Optimize Next.js 15 route params | ESLint | `app/api/**/*.ts` | platform@corso.io |
| `corso/require-env-utilities` | Use env utilities instead of direct process.env | ESLint | Runtime files | platform@corso.io |
| `corso/no-direct-process-env` | Prevent direct process.env access | ESLint | Runtime files | platform@corso.io |
| `corso/require-server-env-imports` | Server-only helpers must import from server env | ESLint | lib, app | platform@corso.io |
| `corso/no-server-reexports` | Prevent server module re-exports from barrels | ESLint | components, lib/shared | platform@corso.io |
| `corso/no-deprecated-lib-imports` | Use domain barrels instead of deprecated paths | ESLint | All files | platform@corso.io |
| `corso/no-runtime-in-types` | Prevent runtime exports in types directory | ESLint | `types/` | platform@corso.io |
| `corso/no-await-headers` | Prevent awaiting synchronous Next.js APIs | ESLint | All files | platform@corso.io |
| `corso/no-clerkclient-invoke` | Prevent clerkClient() function calls | ESLint | All files | platform@corso.io |
| `corso/contexts-barrel-usage` | Import contexts via barrel | ESLint | All files | platform@corso.io |
| `corso/rate-limits-bracket-access` | Use bracket access for RATE_LIMITS | ESLint | All files | platform@corso.io |
| `corso/forbid-header-spacing-in-dashboard` | Dashboard navbar spacing restrictions | ESLint | `components/dashboard/**` | platform@corso.io |
| `corso/no-clerkprovider-outside-root` | Centralized ClerkProvider usage | ESLint | All files except `contexts/providers.tsx` | platform@corso.io |
| `corso/api-edge-barrel-no-server-exports` | Edge barrel server export restrictions | ESLint | `lib/api` | platform@corso.io |
| `corso/nextjs15-route-params-optimization` | Next.js 15 route params optimization | ESLint | `app/api` | platform@corso.io |
| `corso/require-zod-strict` | Require Zod .strict() mode | ESLint | All files | platform@corso.io |
| `corso/require-runtime-exports` | Require runtime export declarations | ESLint | `app/api/**/*.ts` | platform@corso.io |

**Archived Rules:** Files moved to `scripts/rules/ast-grep/_archive/` are no longer active but preserved for history.

## Rule Categories

### 🔐 Security & API Rules

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `consolidated-no-direct-clickhouse-import-outside-integration` | Restrict ClickHouse imports to integration layer | error | Non-integration files | AST-Grep |
| `require-shared-env-server` | Require server-specific env access patterns | error | `lib/**/*.ts`, `app/**/*.ts` | AST-Grep |
| `corso/no-server-in-client` | Prevent server-only modules in client code | error | Client files | ESLint |
| `corso/no-server-in-edge` | Prevent server-only modules in Edge runtime | error | Edge files | ESLint |
| `corso/forbid-security-barrel-in-client-or-edge` | Prevent `@/lib/security` barrel imports in client/edge | error | Client/Edge files | ESLint |
| `corso/no-server-only-directive-in-shared` | Prevent `server-only` outside dedicated server modules | error | Non-server files | ESLint |

### 🏗️ Architecture & Boundaries

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `consolidated-nextjs15-route-params-async` | Next.js 15 requires async route params | error | `app/api/**/*.ts` | AST-Grep |
| `no-client-in-icons` | Ensure icon modules are SSR-safe | error | `components/ui/atoms/icon/**/*` | AST-Grep |
| `corso/force-root-imports` | Prefer alias imports over relative paths | suggestion | All files | ESLint |
| `corso/forbid-ui-self-barrel` | Prevent self-imports in UI components | error | `components/ui/**/*` | ESLint |
| `corso/no-underscore-dirs` | Prevent underscore-prefixed directories | error | `components/**/_*/**` | ESLint |
| `corso/no-widgets-from-outside` | Prevent widget imports outside domain | error | Outside components/ | ESLint |
| `corso/no-ad-hoc-navbars` | Prefer shared Navbar implementation | suggestion | Landing/marketing navbars | ESLint |

### 📱 UI/UX Standards

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `corso/cta-require-linktrack-or-tracking` | Require LinkTrack or trackNavClick for landing CTAs | warning | `components/landing/**/*.tsx` | ESLint |
| `corso/cta-internal-link-to-link` | Use Next.js `<Link>` for internal URLs in buttons | suggestion | All TSX | ESLint |
| `corso/cta-external-anchor-hardening` | Add security attributes to external links | problem | All TSX | ESLint |
| `corso/cta-add-link-import` | Auto-add Next.js Link import when needed | suggestion | All TSX | ESLint |
| `no-inline-color-literals` | Prevent inline color literals in JSX | warn | All TSX | ESLint |

### 🎨 Code Quality & Standards

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `corso/no-mixed-runtime-exports` | Prevent mixed client/server re-exports | warning | `lib/**/*.ts` | ESLint |
| `corso/require-client-directive-for-client-code` | Require 'use client' for client code | warning | All TSX | ESLint |
| `corso/no-direct-process-env` | Use env utilities instead of direct process.env access | error | Runtime files | ESLint |
| `corso/require-server-env-imports` | Server-only helpers must be imported from server env module | error | lib, app | ESLint |
| `corso/no-server-reexports` | Prevent re-exporting server modules from client/shared barrels | error | components, lib/shared | ESLint |
| `corso/no-deprecated-lib-imports` | Use domain barrels instead of deprecated lib paths | error | All files | ESLint |
| `corso/no-runtime-in-types` | Prevent runtime exports in types directory | error | types/ | ESLint |
| `corso/no-await-headers` | Prevent awaiting synchronous Next.js headers/cookies APIs | error | All files | ESLint |
| `corso/no-clerkclient-invoke` | Prevent clerkClient() function calls | error | All files | ESLint |
| `corso/contexts-barrel-usage` | Import contexts via barrel instead of deep subpath imports | error | All files | ESLint |
| `corso/rate-limits-bracket-access` | Use bracket access for RATE_LIMITS with dynamic keys | warning | All files | ESLint |
| `corso/forbid-header-spacing-in-dashboard` | Dashboard must not import shared header spacing utilities | error | components/dashboard | ESLint |
| `corso/no-clerkprovider-outside-root` | Use centralized ClerkProvider in contexts/providers.tsx only | error | All files | ESLint |
| `corso/api-edge-barrel-no-server-exports` | Edge barrel should not re-export server-only modules | error | lib/api | ESLint |
| `corso/nextjs15-route-params-optimization` | Optimize Next.js 15 route params for better performance | error | app/api | ESLint |
| `corso/no-raw-internal-fetch` | Use lib/api wrappers instead of raw fetch | suggestion | All files | ESLint |
| `corso/ensure-api-wrappers` | Prefer internal API client wrappers | suggestion | All files | ESLint |
| `corso/next-script-no-empty-nonce` | Prevent empty nonce values in Script components | problem | All TSX | ESLint |

### 🔧 DevOps & Infrastructure

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `scripts-shebang` | Require shebang in executable TS scripts | warning | `scripts/**/*.ts` | AST-Grep |
| `no-githooks-directory` | Prevent duplicate .githooks directory | error | Repository root | AST-Grep |

### 📊 Dashboard & Component Rules

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `dashboard.no-client-import-server-barrel` | Prevent client imports from dashboard server barrel | error | `components/dashboard/**`, `app/**` | AST-Grep |
| `dashboard.no-literal-entity-keys` | Enforce shared helper for entity query keys | error | `components/dashboard/**` | AST-Grep |
| `corso/dashboard-import-guard` | Guard dashboard server imports in client | error | `components/dashboard/**/*` | ESLint |
| `logger-import-boundary` | Correct logger import patterns | error | All TypeScript | AST-Grep |
| `sql-builder-import` | Correct SQL builder import paths | error | All TypeScript | AST-Grep |

### 🎨 Style Rules (Stylelint)

| Rule | Purpose | Severity | Files | Tool |
|------|---------|----------|-------|------|
| `declaration-property-value-disallowed-list` | Disallow faint border literals | error | All CSS | Stylelint |
| `declaration-property-value-disallowed-list` | Disallow legacy color tokens | error | All CSS | Stylelint |
| `color-no-hex` | Enforce color tokens instead of hex values | true | Non-token CSS | Stylelint |
| `function-disallowed-list` | Enforce CSS variables for colors | true | Non-token CSS | Stylelint |

## Usage

### 🚀 Quick Start

```bash
# Run all rules (recommended - uses sgconfig.yml configuration)
ast-grep scan

# Run all rules and save JSON report
pnpm validate:ast-grep

# Check specific rule categories
pnpm sg:check:api              # API wrapper and fetch rules
pnpm sg:check:runtime          # Runtime boundary rules
pnpm sg:check:ui-boundaries    # UI component import boundaries
```

### 🎯 Development Workflow

#### During Development
```bash
# Fast feedback on specific files
ast-grep scan --rule scripts/rules/ast-grep/runtime-boundaries.yml app/api/

# Check import boundaries for components
ast-grep scan --rule scripts/rules/ast-grep/import-boundaries/ app/components/
```

#### Pre-commit Validation
```bash
# Manual validation (run before committing)
pnpm validate:ast-grep
pnpm validate:runtime-boundaries

# Full quality gate (includes AST-Grep)
pnpm quality:local
```

#### CI/CD Pipeline
```bash
# Automated validation (saves reports/ast-grep-report.json)
pnpm validate:ast-grep
```

### 🔍 Rule-Specific Commands

#### Security & API Rules
```bash
# Check API wrapper compliance
ast-grep scan --rule scripts/rules/ast-grep/ensure-api-wrappers.yml

# Validate internal fetch usage
ast-grep scan --rule scripts/rules/ast-grep/no-raw-internal-fetch.yml
```

#### Architecture Rules
```bash
# Check runtime boundaries
ast-grep scan --rule scripts/rules/ast-grep/runtime-boundaries.yml

# Validate import boundaries
ast-grep scan --rule scripts/rules/ast-grep/import-boundaries/
```

#### UI/UX Rules
```bash
# Check CTA compliance
ast-grep scan --rule scripts/rules/ast-grep/cta/

# Validate marketing components
ast-grep scan --rule scripts/rules/ast-grep/marketing-auth/
```

### 📊 Advanced Usage

#### Pattern Matching
```bash
# Find specific patterns
ast-grep run --pattern "export const runtime = 'edge'" --lang typescript

# Search for import patterns
ast-grep run --pattern "import.*from.*'@/lib/server'" --lang typescript
```

#### File-Specific Scanning
```bash
# Scan specific file
ast-grep scan --rule scripts/rules/ast-grep/runtime-boundaries.yml specific-file.ts

# Scan directory
ast-grep scan --rule scripts/rules/ast-grep/cta/ components/landing/
```

#### Debugging Rules
```bash
# Test rule syntax (catches field name errors)
sg scan -r scripts/rules/ast-grep/your-rule.yml /dev/null

# Debug with verbose output
ast-grep scan --rule your-rule.yml --debug
```

## Rule Development

### 🔧 Creating New Rules

#### Quick Template
```yaml
id: your-rule-name
language: typescript
severity: error
message: "Clear, actionable error message"
rule:
  pattern: "forbidden pattern here"
```

#### Step-by-Step Process
1. **Choose a template** - Copy from similar existing rules
2. **Define the pattern** - Use AST-grep syntax for precise matching
3. **Set appropriate severity** - `error` for blocking issues, `warning` for best practices
4. **Test syntax** - Always validate before committing:
   ```bash
   sg scan -r scripts/rules/ast-grep/your-rule.yml /dev/null
   ```
5. **Test against codebase** - Ensure no false positives:
   ```bash
   sg scan -r scripts/rules/ast-grep/your-rule.yml .
   ```

### 📝 Rule Syntax Standards

#### ✅ CORRECT: Modern AST-Grep Syntax
```yaml
id: your-rule-name
language: typescript
severity: error
message: "Clear error message"
rule:
  all:                           # Logical AND
    - pattern: "import.*from.*forbidden"  # Pattern to match
    - not:                        # Negation
        pattern: "allowed exception"
```

#### ❌ INCORRECT: Deprecated Syntax
```yaml
rule:
  pattern-regex: 'pattern'       # Wrong field name - causes parsing errors
```

### 🎯 Pattern Types

#### Import Restrictions
```yaml
rule:
  pattern: "import $X from '@/lib/server$Y'"
```

#### File-Specific Rules
```yaml
rule:
  all:
    - regex:
        kind: file
        regex: "^app/api/"
    - pattern: "export const runtime = 'edge'"
```

#### Complex Multi-Condition Rules
```yaml
rule:
  all:
    - pattern: "export const $METHOD = ($HNDL)"
    - not:
        pattern: "export const $METHOD = withApiWrappers($HNDL)"
```

### 🔧 Critical Rule Fixes Applied

| Rule File | Issue | Fix Applied |
|-----------|-------|-------------|
| `github-workflow-requires-permissions.yml` | `pattern-regex:` → `regex:` | Added `kind: document` |
| `enforce-canonical-clamp.yml` | `pattern-regex:` → `regex:` | Fixed field name |
| `no-hardcoded-breakpoints.yml` | Multiple `pattern-regex:` → `regex:` | Fixed all instances |
| `no-pull_request_target.yml` | `pattern-regex:` → `regex:` | Added `kind: document` |

### 📊 Field Requirements by Language

| Language | Required Fields | Common Patterns |
|----------|----------------|-----------------|
| `typescript` | `pattern`, `language` | Import validation, function patterns |
| `tsx` | `pattern`, `language` | JSX patterns, component validation |
| `yaml` | `regex`, `kind: document` | GitHub workflows, config files |

## Troubleshooting

### 🔍 Common Issues

#### False Positives
- **Refine patterns**: Make rules more specific to reduce false matches
- **Add file restrictions**: Use `files` or `regex` with `kind: file`
- **Use exclusions**: Add `not:` conditions for allowed exceptions

#### Performance Issues
- **Target specific directories**: Scan only relevant parts of codebase
- **Optimize patterns**: Use more specific selectors when possible
- **Cache results**: Leverage AST-Grep's built-in caching

#### Syntax Errors
```bash
# Test rule syntax (catches field name errors)
sg scan -r scripts/rules/ast-grep/your-rule.yml /dev/null

# Debug with verbose output
ast-grep scan --rule your-rule.yml --debug
```

### 🚨 Error Patterns to Watch For

#### Common Mistakes
- Using `pattern-regex:` instead of `regex:`
- Missing `kind: document` for YAML files
- Incorrect file path patterns
- Overly broad patterns causing false positives

#### Validation Checklist
- [ ] Rule syntax validates without errors
- [ ] No false positives on clean codebase
- [ ] Appropriate severity level (`error` vs `warning`)
- [ ] Clear, actionable error messages
- [ ] File restrictions are properly scoped

## Related Documentation

- [Tools Directory](../README.md) — Overview of all development tools
- [AST-Grep Documentation](https://ast-grep.github.io/) — Official documentation
- [Code Quality Standards](../../docs/codebase/quality.md) — Project quality guidelines
- [Runtime Boundaries](../../docs/architecture/runtime-boundaries.md) — Edge/Node separation patterns

