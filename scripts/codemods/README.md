---
title: "scripts/codemods"
last_updated: "2025-12-15"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/codemods`
- Last updated: `2025-12-15`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/codemods`

- **codemod-common.ts** – Common utilities for codemod scripts
- **convert-default-export-to-main.ts** – Convert default-exported script entrypoints into executable main() form.
- **env-transformation-common.ts** – Common utilities for environment import transformations
- **file-discovery.ts** – Centralized file discovery utility for codemod scripts
- **fix-intradomain-barrels.ts** – Rewrites imports inside components/** that come from &quot;@/components&quot; or &quot;@/components/ui&quot;
- **migrate-ui-origins.ts** – ts-morph Identifier does not expose remove() in some versions; remove via parent binding
- **refactor-constants-barrel.ts** – Replaces imports from
- **refactor-generated-tests.ts** – Codemod to refactor all generated test files to use the shared test factory
- **rename-import.ts** – TypeScript-based import renaming utility
- **resolve-shared-symbol-imports.ts** – for real export sites.
- **ts-project.ts** – Shared ts-morph Project initialization utility
