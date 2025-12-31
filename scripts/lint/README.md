---
title: "scripts/lint"
last_updated: "2025-12-31"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/lint`
- Last updated: `2025-12-31`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/lint`

- **audit-ai-security.ts** – /*.ts&#x60;, &#x60;${chatComponents}/*
- **audit-breakpoints.ts** – /*.{ts,tsx,css,mdx}&#x27;,
- **audit-workflow-secrets.ts** – Initialize report
- **check-css-paths.ts** – scripts/lint/check-css-paths.ts
- **check-deprecations-util-extend.ts** – Regression check for util._extend deprecation warnings
- **check-duplicate-styles.ts** – Guardrail: Detect duplicate styling sources for the same component.
- **check-edge-compat.ts** – /{page,layout,route,error}.{ts,tsx} that export: export const runtime &#x3D; &#x27;edge&#x27;
- **check-filename-case.ts** – scripts/lint/check-filename-case.ts
- **check-forbidden-files.ts** – Check for forbidden files in the repository
- **check-lockfile-major.ts** – Fallback to regex if YAML parse fails
- **check-metadata-viewport.ts** – Extract metadata object body conservatively and check within it
- **check-package-scripts.ts** – Script-key linter:
- **check-pages-runtime.ts** – Check for server-only code in pages directory
- **check-readmes.ts** – only top-level route groups like (marketing)
- **check-route-theme-overrides.ts** – Route Theme Override Policy Enforcement
- **check-runtime-versions.ts** – Optional: .node-version may be missing in some contexts
- **check-token-tailwind-contract.ts** – Token↔Tailwind Contract Enforcement
- **contrast-check.ts** – No description available
- **css-size-analyzer.ts** – No description available
- **fix-eslint-plugin-dts.ts** – Post-build fixer for eslint-plugin-corso d.ts
- **forbid-scripts-barrels.ts** – No description available
- **no-binary-fonts.ts** – &#x27;,
- **no-deprecated-imports.ts** – Patterns that capture only actual module specifiers in import/export/require/dynamic import
- **token-syntax-audit.ts** – scripts/token-syntax-audit.ts
- **validate-effect-deps.ts** – scripts/validate-effect-deps.ts
- **validate-package-json.ts** – scripts/lint/validate-package-json.ts
- **verify-ai-tools.ts** – AI Agent Tools Verification Script
- **verify-eslint-plugin-dts.ts** – Inside namespaces (configs.recommended/strict), ensure rules is exported as a value
- **verify-no-dts-transform.ts** – Verify that our scripts do not attempt to transform/parse .d.ts files
