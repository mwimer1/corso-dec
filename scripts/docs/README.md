---
title: "scripts/docs"
last_updated: "2025-12-25"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/docs`
- Last updated: `2025-12-25`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/docs`

- **freshen.ts** – Minimal README/docs freshness tool.
- **gen-route-tree.ts** – Generates a Markdown route tree from /app for docs.

---

## Purpose

`scripts/docs/` contains **lightweight documentation helpers** for simple, focused operations:

- **Freshness checks** (`freshen.ts`) - Validate README/documentation staleness
- **Route tree generation** (`gen-route-tree.ts`) - Generate app route structure for docs
- **Idempotency checks** (`check-docs-idempotent.mjs`) - Verify docs generation is idempotent

## Which Should I Use?

**Use `scripts/docs/` when:**
- You need a simple, single-purpose docs operation
- You want to check freshness or generate route trees
- You need quick validation without the full docs CLI

**Use `scripts/maintenance/docs/` when:**
- You need the full docs CLI system (generate/normalize/enhance)
- You want to run comprehensive docs operations
- You need to work with frontmatter, links, or complex docs transformations

See `scripts/maintenance/docs/README.md` for the full docs CLI system.
