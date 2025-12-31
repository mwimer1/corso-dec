---
title: Ci
description: Documentation and resources for documentation functionality. Located in ci/.
last_updated: '2025-12-31'
category: documentation
status: draft
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/ci`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/ci`

- **assert-no-shared-component-variants.ts** – No description available
- **check-bundle-size.ts** – Simple glob matching - convert ** to match any directory depth
- **check-common.ts** – Common utilities for CI check scripts
- **check-deprecated-paths.ts** – Guardrail: Check for deprecated path references
- **check-metadata.ts** – No description available
- **check-no-top-actions.ts** – Guardrail: Prevent reintroduction of top-level actions/ directory
- **check-placeholder-directories.ts** – Guardrail: Check for placeholder-only directories
- **check-protected-auth.ts** – client files are exempt
- **check-temp-directories.ts** – Guardrail: Check that tmp/ and supabase/.temp/ are properly handled
- **cleanup-branches.ts** – Branch Cleanup Script
- **ensure-api-in-v1-or-internal.ts** – Enforces API route placement &amp; runtime declarations.
- **generate-bundle-report.ts** – Generate bundle size comparison report
- **quality-gates-local.ts** – scripts/quality-gates-local.ts
- **validate-cursor-rules.ts** – scripts/ci/validate-cursor-rules.ts
