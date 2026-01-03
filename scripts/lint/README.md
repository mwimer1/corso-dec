---
title: "scripts/lint"
last_updated: "2026-01-03"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/lint`
- Last updated: `2026-01-03`

> Edit the template or the generator context to change all READMEs consistently.

## Shared Utilities

Lint scripts use shared utilities from `scripts/lint/_utils/`:
- **files.ts** - File walking and globbing (`findFiles`, `findFilesGlob`)
- **paths.ts** - Path normalization (`getRepoRoot`, `resolveFromRepo`, `normalizePath`)
- **log.ts** - Standardized logging (re-exports `logger` from `scripts/utils/logger`)
- **result.ts** - Error collection and exit code handling (`LintResult`, `createLintResult`)

**Usage example:**
```typescript
import { findFiles, getRepoRoot, logger, createLintResult } from './_utils';

const result = createLintResult();
const files = findFiles('**/*.ts');
// ... check files ...
result.report({ successMessage: '✅ All checks passed' });
```

## Scripts in `scripts/lint`

- **audit-ai-security.ts** – /*.ts&#x60;, &#x60;${chatComponents}/*
- **audit-breakpoints.ts** – /*.{ts,tsx,css,mdx}&#x27;,
- **audit-workflow-secrets.ts** – Continue to workflow audit even if gitleaks fails
- **check-css-paths.ts** – scripts/lint/check-css-paths.ts
- **check-deprecations-util-extend.ts** – Regression check for util._extend deprecation warnings
- **check-duplicate-styles.ts** – Guardrail: Detect duplicate styling sources for the same component.
- **check-edge-compat.ts** – /{page,layout,route,error}.{ts,tsx} that export: export const runtime &#x3D; &#x27;edge&#x27;
- **check-filename-case.ts** – scripts/lint/check-filename-case.ts
- **check-filenames.ts** – &#x27;,
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
- **no-process-exit-ci-lint.ts** – Regression guard: Prevents reintroducing process.exit() calls in CI/lint scripts
- **token-syntax-audit.ts** – scripts/token-syntax-audit.ts
- **validate-effect-deps.ts** – scripts/validate-effect-deps.ts
- **validate-gitleaks-config.ts** – Validates that a string is a valid Go regex pattern (not a glob pattern)
- **validate-package-json.ts** – scripts/lint/validate-package-json.ts
- **verify-ai-tools.ts** – AI Agent Tools Verification Script
- **verify-eslint-plugin-dts.ts** – Inside namespaces (configs.recommended/strict), ensure rules is exported as a value
- **verify-no-dts-transform.ts** – Verify that our scripts do not attempt to transform/parse .d.ts files
