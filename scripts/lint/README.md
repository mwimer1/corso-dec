---
title: "scripts/lint"
last_updated: "2026-01-03"
category: "automation"
---

# Lint Scripts Documentation

This directory contains TypeScript lint scripts that enforce code quality, architectural boundaries, and repository standards.

**Total Scripts:** 36  
**Documented:** 36  
**Undocumented:** 0

> ⚠️ **Note**: This README is auto-generated from JSDoc comments in the script files. To update documentation, edit the JSDoc header at the top of each script file.

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

### `_smoke-runner`

Smoke test runner for migrated lint scripts Runs the pilot scripts and reports pass/fail status Usage: tsx scripts/lint/_smoke-runner.ts

### `audit-ai-security`

Audits AI security practices in OpenAI integration endpoints. Checks for prompt injection vulnerabilities, SQL injection in AI-generated queries, and ensures proper input sanitization is applied in AI endpoints.
  **Intent:** Enforce AI security best practices
  **Files:** app/api/v1/dashboard and lib/chat/query TypeScript files
  **Invocation:** pnpm audit:ai

### `audit-breakpoints`

Audits hardcoded breakpoint literals and suggests tokenized replacements. Scans codebase for hardcoded pixel values (640px, 768px, etc.) and viewport units that should be replaced with design token utilities (px(BREAKPOINT.sm), mq.up('md'), etc.).
  **Intent:** Enforce design token usage for responsive breakpoints
  **Files:** TypeScript, TSX, CSS, and MDX files in app, components, styles, and lib directories
  **Invocation:** pnpm audit:breakpoints

### `audit-workflow-secrets`

Audits GitHub Actions workflows for secrets usage and generates security report. Runs gitleaks to detect secrets in the repository, then audits workflow files to ensure secrets are properly referenced (not hardcoded) and generates a report.
  **Intent:** Ensure secrets are properly managed in CI/CD workflows
  **Files:** YAML files in .github/workflows directory
  **Invocation:** pnpm audit:secrets

### `check-css-paths`

Validates that all CSS files are located in the styles/ directory. Scans the repository for CSS files outside the styles/ directory and reports them as errors to enforce consistent file organization.
  **Intent:** Enforce CSS file organization standards
  **Files:** All .css files outside styles/ directory
  **Invocation:** pnpm lint (via prelint hook)

### `check-deprecations-util-extend`

Regression check for util._extend deprecation warnings Scans node_modules for packages using util._extend and fails if new packages are found that aren't in the allowlist. Usage: pnpm lint:deprecations To update allowlist: 1. Run this script to see current findings 2. Copy findings to scripts/lint/deprecations-util-extend.allowlist.json 3. Re-run to verify

### `check-duplicate-styles`

Detects duplicate styling sources for the same component. Flags if both a pattern CSS file (styles/ui/patterns/[name].css) and a component CSS file (components/[any]/[name].module.css) exist for the same component name, unless explicitly allowlisted.
  **Intent:** Prevent duplicate styling sources for components
  **Files:** CSS files in styles/ui/patterns and component CSS files
  **Invocation:** pnpm lint (via prelint hook)

### `check-edge-compat`

Validates Edge runtime compatibility for Next.js routes and middleware. Finds Edge entrypoints (middleware.ts, routes with runtime='edge') and scans their import graphs to flag Node.js-only dependencies (core modules, packages like pg/mysql2, Node globals like Buffer, __dirname, require()). Also warns on process.env usage unless NEXT_PUBLIC_ prefix is used.
  **Intent:** Ensure Edge runtime routes don't use Node.js-only APIs
  **Files:** middleware.ts and app route files with runtime='edge' export
  **Invocation:** pnpm lint:edge-runtime

### `check-filename-case`

Validates that a single filename follows kebab-case naming convention. Checks that filenames use lowercase letters, numbers, and hyphens only. Dotfiles are ignored. Used by lint-staged for per-file validation.
  **Intent:** Enforce kebab-case filename convention
  **Files:** Single file path provided as argument
  **Invocation:** tsx scripts/lint/check-filename-case.ts <file-path>

### `check-filenames`

Batch filename case validation for all repository files. Scans all files in the repository and validates they follow kebab-case naming convention (lowercase letters, numbers, hyphens only). Dotfiles are ignored. More efficient than per-file validation for full repository scans.
  **Intent:** Enforce kebab-case filename convention across repository
  **Files:** All files in repository (excluding ignored directories)
  **Invocation:** pnpm lint (via prelint hook)

### `check-forbidden-files`

Check for forbidden files in the repository Checks for: - .bak backup files (tracked and untracked) - __tmp__ directories or files Usage: tsx scripts/lint/check-forbidden-files.ts

### `check-lockfile-major`

Validates that pnpm-lock.yaml uses a compatible lockfile version. Checks the lockfileVersion in pnpm-lock.yaml to ensure it matches the expected major version for the current pnpm version. Prevents lockfile format mismatches.
  **Intent:** Ensure lockfile version compatibility
  **Files:** pnpm-lock.yaml
  **Invocation:** pnpm lint:lockfile

### `check-metadata-viewport`

Validates that Next.js metadata exports don't include viewport configuration. Checks that page/layout files don't export viewport in metadata or generateMetadata, and ensures not-found.tsx files don't export metadata at all. Viewport should be configured at the root layout level only.
  **Intent:** Enforce centralized viewport configuration
  **Files:** Page, layout, template, loading, and not-found files in app directory
  **Invocation:** pnpm lint:metadata-viewport

### `check-package-scripts`

Script-key linter: - ERROR: same command string defined under multiple script keys (duplicates). - ERROR: script commands reference missing local files. - WARN: non-standard script prefixes (nudges toward a consistent schema). - Guarantees fast feedback on `pnpm lint` via "prelint".

### `check-pages-runtime`

Check for server-only code in pages directory Windows-compatible replacement for Bash conditional

### `check-readmes`

Validates that required directories have README.md files. Checks that top-level route groups (e.g., (marketing)) and UI component directories (atoms, molecules, organisms) have README.md files for documentation.
  **Intent:** Ensure documentation exists for key directories
  **Files:** README.md files in route groups and UI component directories
  **Invocation:** pnpm docs:readmes:check

### `check-route-theme-overrides`

Route Theme Override Policy Enforcement Validates that route theme files (auth.css, marketing.css, etc.) only override allowed tokens. This prevents accidental overrides of spacing, typography, radius, or other structural tokens that should remain consistent across themes. Allowed overrides: - Color tokens (--primary, --secondary, --background, --foreground, etc.) - Semantic color aliases (--success, --warning, --danger, etc.) - Surface variants (--surface, --surface-contrast, --surface-hover, etc.) Forbidden overrides: - Spacing tokens (--space-*) - Typography tokens (--text-*, --font-*) - Radius tokens (--radius-*) - Animation tokens (--duration-*, --delay-*, --easing-*) - Shadow tokens (--shadow-*) - Any other structural tokens

### `check-runtime-versions`

Validates consistency between Node.js version specifications. Ensures that package.json engines.node, package.json packageManager, and .node-version file all specify compatible Node.js versions to prevent environment mismatches.
  **Intent:** Ensure Node.js version consistency across configuration files
  **Files:** package.json, .node-version
  **Invocation:** pnpm lint:versions

### `check-token-tailwind-contract`

Token↔Tailwind Contract Enforcement Validates that: 1. All tokens referenced in tailwind.config.ts are defined in styles/tokens/*.css 2. Fallback values in tailwind.config.ts match token defaults exactly This prevents "two sources of truth" configuration drift.

### `contrast-check`

Ensures all color combinations in the design system meet WCAG 2.1 AA contrast ratios. Validates foreground/background color pairs from CSS custom properties to ensure accessibility compliance. Checks both light and dark theme variants.
  **Intent:** Enforce WCAG 2.1 AA contrast ratio requirements
  **Files:** styles directory CSS files (CSS custom properties)
  **Invocation:** pnpm a11y:contrast

### `css-size-analyzer`

Analyzes the size of the generated CSS file and fails if it exceeds a threshold. Monitors the built Tailwind CSS file size to prevent bundle bloat. Currently enforces a maximum size of 150KB for the generated CSS.
  **Intent:** Prevent CSS bundle size bloat
  **Files:** styles/build/tailwind.css
  **Invocation:** pnpm a11y:css-size

### `fix-eslint-plugin-dts`

Post-build fixer for eslint-plugin-corso TypeScript declaration files. Eliminates namespace alias exports (e.g., `rules_1 as rules`) inside configs namespaces by converting them into concrete value declarations. This ensures proper TypeScript type exports for the ESLint plugin.
  **Intent:** Fix TypeScript declaration file generation issues
  **Files:** eslint-plugin-corso/dist/index.d.ts
  **Invocation:** pnpm plugin:dts:fix

### `forbid-scripts-barrels`

Prevents barrel index files (index.ts, index.tsx, index.js) in the scripts/ directory. Barrel files are forbidden under scripts/ to maintain explicit imports and prevent circular dependencies. Only _utils directories are allowed to have barrels.
  **Intent:** Prevent barrel files in scripts directory
  **Files:** scripts directory index files (index.ts, index.tsx, index.js)
  **Invocation:** pnpm scripts:forbid:scripts-barrels

### `no-binary-fonts`

Prevents binary font files from being committed to the repository. Scans for binary font files (.woff, .woff2, .ttf, .otf, .eot) and fails if any are found. Fonts should be served from CDN or external sources, not committed.
  **Intent:** Prevent binary font files in repository
  **Files:** Binary font files (woff, woff2, ttf, otf, eot)
  **Invocation:** pnpm validate:fonts (via lint-staged)

### `no-deprecated-imports`

Thin wrapper around ESLint rule @corso/no-deprecated-lib-imports This script runs ESLint with the deprecated imports rule and formats output to match the original script's format. The actual enforcement is handled by the ESLint rule which reads from eslint-plugin-corso/rules/deprecated-imports.json Migration: Sprint 4 - Deprecated imports now enforced via ESLint rule Config: eslint-plugin-corso/rules/deprecated-imports.json

### `no-process-exit-ci-lint`

Regression guard: Prevents reintroducing process.exit() calls in CI/lint scripts This script scans scripts/ci and scripts/lint directories for forbidden process.exit() calls and fails if any are found. This ensures all scripts use process.exitCode instead, allowing logs to flush and reports to be written before the process exits. Usage: pnpm lint:no-process-exit Exit behavior: Sets process.exitCode = 1 if any violations found, otherwise 0. Never calls process.exit() itself (would be ironic!).

### `should-skip-check`

Helper functions to determine if validation checks should be skipped. Provides utilities to check if validation should be skipped based on staged files. Used to optimize pre-commit hooks by skipping checks when relevant files haven't changed.
  **Intent:** Optimize pre-commit hook performance
  **Files:** Uses git staged files to determine skip conditions
  **Invocation:** Imported by other lint scripts

### `token-syntax-audit`

Audits CSS token syntax for duplicate token definitions. Scans all token files in styles/tokens directory and checks for duplicate token names within the same CSS rule selector. Ensures each token is defined only once per scope to prevent conflicts.
  **Intent:** Prevent duplicate token definitions
  **Files:** CSS files in styles/tokens directory
  **Invocation:** pnpm audit:tokens

### `typecheck-staged`

Typechecks only staged TypeScript files for faster pre-commit hooks. Runs TypeScript compiler on only the staged .ts/.tsx files instead of the entire codebase, providing faster feedback during development while maintaining type safety.
  **Intent:** Fast type checking for staged files only
  **Files:** Git staged .ts/.tsx files
  **Invocation:** pnpm typecheck:staged (via pre-commit hook)

### `validate-commit-scopes`

@fileoverview Validates that commit scope documentation matches commitlint.config.cjs This script ensures consistency between: - commitlint.config.cjs (authoritative source) - .gitmessage (git commit template) - .cursor/rules/ai-agent-development-environment.mdc (cursor rules) - docs/development/commit-conventions.md (documentation) Run this script in CI and pre-commit hooks to prevent scope documentation drift.

### `validate-effect-deps`

Validates React hook dependency arrays for exhaustive-deps compliance. Runs ESLint with exhaustive-deps rule on hooks/ directory to ensure all React hooks (useEffect, useMemo, useCallback, etc.) have complete dependency arrays.
  **Intent:** Enforce exhaustive-deps rule for React hooks
  **Files:** TypeScript files in hooks directory
  **Invocation:** pnpm validate:effect-deps

### `validate-gitleaks-config`

Validates gitleaks configuration file syntax and patterns. Checks that config/.gitleaks.toml uses valid Go regex patterns (not glob patterns) and validates the structure of the configuration file to prevent runtime errors.
  **Intent:** Ensure gitleaks configuration is valid
  **Files:** config/.gitleaks.toml
  **Invocation:** pnpm tools:gitleaks:validate

### `validate-package-json`

Validates package.json for duplicate script keys and other issues. Checks for duplicate script commands, validates script key naming conventions, and uses caching to optimize performance when package.json hasn't changed.
  **Intent:** Ensure package.json scripts are well-organized
  **Files:** package.json
  **Invocation:** pnpm validate:package

### `verify-ai-tools`

AI Agent Tools Verification Script Verifies that all essential AI agent tools are installed and working correctly. This script helps troubleshoot installation issues and ensures compatibility.

### `verify-eslint-plugin-dts`

Verifies ESLint plugin TypeScript declaration file structure. Validates that eslint-plugin-corso/dist/index.d.ts has proper exports structure: - Top-level rules export as concrete value (not alias) - Namespace configs export rules as values (not aliases)
  **Intent:** Ensure ESLint plugin TypeScript definitions are correct
  **Files:** eslint-plugin-corso/dist/index.d.ts
  **Invocation:** pnpm verify:plugin:dts

### `verify-no-dts-transform`

Verifies that scripts don't attempt to transform or parse .d.ts files. Scans scripts/ directory for suspicious patterns that might process TypeScript declaration files or dist/** directories, which should be excluded from transformations.
  **Intent:** Prevent accidental processing of generated declaration files
  **Files:** TypeScript and JavaScript files in scripts directory
  **Invocation:** pnpm verify:scripts:no-dts-transform

## Adding Documentation

To document a script, add a JSDoc comment at the top of the file:

```typescript
#!/usr/bin/env tsx
/**
 * Brief description of what the script does.
 * 
 * Intent: What problem this script solves
 * Files: Which files or patterns it scans
 * Invocation: How it's invoked (e.g., "pnpm lint:script-name")
 */
```

---

_This documentation is auto-generated from JSDoc comments. Last updated: 2026-01-03_
