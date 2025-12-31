---
title: "scripts/codemods"
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/codemods`
- Last updated: `2025-12-31`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/codemods`

- **fix-intradomain-barrels.ts** – Rewrites imports inside components/** that come from &quot;@/components&quot; or &quot;@/components/ui&quot;
- **refactor-constants-barrel.ts** – Replaces deep imports from @/lib/shared/constants/* with barrel imports
- **resolve-shared-symbol-imports.ts** – Resolves imports from @/styles/ui/shared to real export sites
