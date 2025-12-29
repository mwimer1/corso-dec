---
title: "scripts"
last_updated: "2025-12-25"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts`
- Last updated: `2025-12-25`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts`

- **check-architecture-drift.ts** – Architecture drift check script
- **verify-edge-safe.ts** – Node.js wrapper for verify-edge-safe.ps1
- **verify-env-usage.ts** – Node.js wrapper for verify-env-usage.ps1

---

## Naming Conventions

Scripts follow consistent naming patterns to indicate their purpose:

- **`check-*`** = Guardrails / invariants (often CI-oriented, fail-fast validations)
- **`lint-*`** = Lint checks / style + AST-grep style rules
- **`validate-*`** = Broader "must-pass" validations (often multi-step, comprehensive checks)
- **`verify-*`** = Targeted verification scripts (specific checks, often environment-related)
- **`audit-*`** = Reporting, baseline generation, analysis outputs (read-only analysis)
- **`codemods:*`** = Refactors (write/transform operations, automated code changes)

## How Scripts Are Executed

- **`tsx scripts/...`** is the primary runner pattern for TypeScript scripts (`.ts`, `.tsx`, `.mts`)
- **`node scripts/...`** is used for JavaScript entrypoints (`.mjs`, `.cjs` files)
- Most scripts are invoked via `package.json` scripts (see below)

## Finding Entrypoints

**Source of truth**: `package.json` scripts section contains all script entrypoints.

**Key meta-commands for developers:**

- `pnpm lint:scripts` - Validates package.json script references
- `pnpm docs:readmes:check` - Validates README freshness and structure
- `pnpm validate:duplication` - Runs duplication analysis (jscpd)
- `pnpm quality:local` - Runs local quality gates (typecheck, lint, test, etc.)
- `pnpm guards:*` - CI guardrail scripts (placeholders, temp dirs, metadata, etc.)

**To find a specific script:**
1. Search `package.json` for the command name
2. Follow the `tsx scripts/...` or `node scripts/...` path
3. Check the script's directory README for details
