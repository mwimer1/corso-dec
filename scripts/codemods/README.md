---
title: "Codemods"
description: "Documentation and resources for documentation functionality. Located in codemods/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/codemods`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/codemods`

- **codemod-common.ts** – Common utilities for codemod scripts
- **env-transformation-common.ts** – Common utilities for environment import transformations
- **file-discovery.ts** – Centralized file discovery utility for codemod scripts
- **fix-intradomain-barrels.ts** – Rewrites imports inside components/** that come from &quot;@/components&quot; or &quot;@/components/ui&quot;
- **refactor-constants-barrel.ts** – Replaces imports from
- **resolve-shared-symbol-imports.ts** – for real export sites.
- **ts-project.ts** – Shared ts-morph Project initialization utility
