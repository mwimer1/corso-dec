---
title: "scripts/ci"
last_updated: "2025-12-25"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/ci`
- Last updated: `2025-12-25`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/ci`

- **assert-no-shared-component-variants.ts** – No description available
- **check-bundle-size.ts** – Simple glob matching - convert ** to match any directory depth
- **check-common.ts** – Common utilities for CI check scripts
- **check-deprecated-paths.ts** – Guardrail: Check for deprecated path references
- **check-metadata.ts** – No description available
- **check-placeholder-directories.ts** – Guardrail: Check for placeholder-only directories (only README.md)
- **check-protected-auth.ts** – client files are exempt
- **check-temp-directories.ts** – Guardrail: Check that tmp/ and supabase/.temp/ are gitignored or have READMEs
- **cleanup-branches.ts** – Branch Cleanup Script
- **ensure-api-in-v1-or-internal.ts** – Enforces API route placement &amp; runtime declarations.
- **generate-bundle-report.ts** – Generate bundle size comparison report
- **openapi-guard-rbac.ts** – Moved to scripts/openapi/openapi-guard-rbac.ts
- **quality-gates-local.ts** – scripts/quality-gates-local.ts
- **validate-cursor-rules.ts** – scripts/ci/validate-cursor-rules.ts

## Guardrail Scripts

### check-placeholder-directories.ts

Prevents directory drift by failing if a directory contains only `README.md` (and optionally `.gitkeep`) with no actual implementation files.

**Usage:**
```bash
pnpm guards:placeholders
```

**What it checks:**
- Scans `hooks/`, `contexts/`, and other specified directories
- Fails if a directory contains only `README.md` (and `.gitkeep` if present)
- Allows exceptions via `ALLOWED_PLACEHOLDER_DIRECTORIES` constant

**Configuration:**
- Edit `ALLOWED_PLACEHOLDER_DIRECTORIES` in the script to allow specific placeholder directories
- Edit `SCAN_DIRECTORIES` to add more directories to scan

### check-temp-directories.ts

Ensures that ephemeral directories (`tmp/`, `supabase/.temp/`) are either:
1. Gitignored (preferred), or
2. Have a `README.md` explaining why they are versioned

**Usage:**
```bash
pnpm guards:temp
```

**What it checks:**
- Verifies `tmp/` and `supabase/.temp/` are gitignored OR have explanatory READMEs
- Fails if directory is not gitignored and lacks a README
- Fails if directory has tracked files but is marked as gitignored (contradiction)
- Warns if versioned directory has many tracked files

**Configuration:**
- Edit `TEMP_DIRECTORIES` array to add more directories to check

### check-no-top-actions.ts

Prevents reintroduction of a top-level `actions/` directory. Server Actions should be feature-colocated (e.g., `app/(marketing)/contact/actions.ts`), not in a top-level directory.

**Usage:**
```bash
pnpm guards:no-top-actions
```

**What it checks:**
- Fails if `actions/` directory exists at repo root
- Allows `lib/actions/` (shared helper utilities)
- Warning mode by default (allows actions/ temporarily until PR5.2)
- Strict mode: Set `CORSO_ENFORCE_NO_TOP_ACTIONS=1` to enable errors

**Configuration:**
- Default: Warning mode (allows actions/ to exist temporarily)
- Set `CORSO_ENFORCE_NO_TOP_ACTIONS=1` environment variable to enable strict enforcement
- After PR5.2, CI should set this env var to enforce the policy
