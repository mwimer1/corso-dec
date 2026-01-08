---
title: "scripts/lint"
last_updated: "2026-01-08"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/lint`
- Last updated: `2026-01-08`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/lint`

- **audit-ai-security.ts** – Audits AI security practices in OpenAI integration endpoints.
- **audit-breakpoints.ts** – Audits hardcoded breakpoint literals and suggests tokenized replacements.
- **audit-workflow-secrets.ts** – Audits GitHub Actions workflows for secrets usage and generates security report.
- **check-css-paths.ts** – Validates that all CSS files are located in the styles/ directory.
- **check-deprecations-util-extend.ts** – Regression check for util._extend deprecation warnings
- **check-duplicate-styles.ts** – Detects duplicate styling sources for the same component.
- **check-edge-compat.ts** – Validates Edge runtime compatibility for Next.js routes and middleware.
- **check-filenames.ts** – Batch filename case validation for all repository files.
- **check-forbidden-files.ts** – Check for forbidden files in the repository
- **check-lockfile-major.ts** – Validates that pnpm-lock.yaml uses a compatible lockfile version.
- **check-metadata-viewport.ts** – Validates that Next.js metadata exports don&#x27;t include viewport configuration.
- **check-package-scripts.ts** – Script-key linter:
- **check-pages-runtime.ts** – Check for server-only code in pages directory
- **check-readmes.ts** – Validates that required directories have README.md files.
- **check-route-theme-overrides.ts** – Route Theme Override Policy Enforcement
- **check-runtime-versions.ts** – Validates consistency between Node.js version specifications.
- **check-token-tailwind-contract.ts** – Token↔Tailwind Contract Enforcement
- **contrast-check.ts** – Ensures all color combinations in the design system meet WCAG 2.1 AA contrast ratios.
- **css-size-analyzer.ts** – Analyzes the size of the generated CSS file and fails if it exceeds a threshold.
- **fix-eslint-plugin-dts.ts** – Post-build fixer for eslint-plugin-corso TypeScript declaration files.
- **forbid-scripts-barrels.ts** – Prevents barrel index files (index.ts, index.tsx, index.js) in the scripts/ directory.
- **lint-markdown.ts** – Windows-safe markdownlint wrapper that expands globs before passing to markdownlint.
- **no-binary-fonts.ts** – Prevents binary font files from being committed to the repository.
- **no-deprecated-imports.ts** – Thin wrapper around ESLint rule @corso/no-deprecated-lib-imports
- **no-process-exit-ci-lint.ts** – Regression guard: Prevents reintroducing process.exit() calls in CI/lint scripts
- **token-syntax-audit.ts** – Audits CSS token syntax for duplicate token definitions.
- **typecheck-staged.ts** – Typechecks only staged TypeScript files for faster pre-commit hooks.
- **validate-commit-scopes.ts** – This script ensures consistency between:
- **validate-effect-deps.ts** – Validates React hook dependency arrays for exhaustive-deps compliance.
- **validate-gitleaks-config.ts** – Validates gitleaks configuration file syntax and patterns.
- **validate-package-json.ts** – Validates package.json for duplicate script keys and other issues.
- **verify-ai-tools.ts** – AI Agent Tools Verification Script
- **verify-eslint-plugin-dts.ts** – Verifies ESLint plugin TypeScript declaration file structure.
- **verify-no-dts-transform.ts** – Verifies that scripts don&#x27;t attempt to transform or parse .d.ts files.
