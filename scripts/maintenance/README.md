---
title: "scripts/maintenance"
last_updated: "2025-12-15"
category: "automation"
---

# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/maintenance`
- Last updated: `2025-12-15`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/maintenance`

- **audit-barrels.ts** – Unified Barrel Audit
- **audit-unused-tokens.ts** – Skip build directories
- **barrel-helpers.ts** – noop
- **barrel.config.ts** – &#x27;,
- **check-barrels.ts** – Ensures all exports from domain index.ts files resolve to files within the same domain
- **clean-next-build.ts** – Cross-platform script to clean .next directory before build
- **cleanup-cursor.ts** – Cross-platform script to preview or delete .cursor directories older than 1 day
- **docs-patterns-common.ts** – Common utilities for documentation maintenance scripts
- **enhance-readmes.ts** – scripts/enhance-readmes.ts
- **ensure-ports.ts** – Cross-platform script to check and kill processes on specified ports
- **extract-docs-rules.ts** – scripts/maintenance/extract-docs-rules.ts
- **find-test-only-exports.ts** – Find exports that are only referenced from tests.
- **fix-barrel-exports-all.ts** – scripts/maintenance/fix-barrel-exports-all.ts
- **fix-links.ts** – Use the refactored link fixes for all sets
- **gen-variants-index.ts** – ⛔ Explicit skip-list to prevent reintroducing removed aggregators
- **generate-alias-doc.ts** – Load and fully parse tsconfig (handles &#x60;extends&#x60;, JSONC, etc.).
- **generate-readme.ts** – scripts/maintenance/generate-readme.ts
- **inject-frontmatter.ts** – /*.md&#x27;,
- **kill-orphans.ts** – Cross-platform script to kill orphaned Node.js processes
- **link-fixes.config.ts** – scripts/maintenance/link-fixes.config.ts
- **list-missing-frontmatter.ts** – /*.md&#x27;,
- **maintenance-common.ts** – Tolerant marker replacement. Accepts variants like:
- **manage-docs.ts** – &#x27;, &#x27;.git/**&#x27;, &#x27;test-reports/**&#x27;, &#x27;dist/**&#x27;, &#x27;coverage/**&#x27;],
- **normalize-doc-status.ts** – No description available
- **normalize-frontmatter.ts** – /*.md&#x27;,
- **refresh-readmes.ts** – /*.md&quot;,
- **replace-package-script-references.ts** – Keep our maintenance scripts intact (they contain canonical mapping)
- **stale-docs.ts** – pnpm docs:stale        # Run stale documentation check (reports if any outdated docs)
- **styles-comprehensive-audit.ts** – scripts/maintenance/styles-comprehensive-audit.ts
- **types-exports-audit.ts** – pnpm audit:types-exports           # Run all checks and report issues
- **validate-dead-code-optimized.ts** – Optimized Dead Code Validation
- **validate-doc-links.ts** – /*.md&#x60;,
- **validate-docs-on-commit.ts** – scripts/validate-docs-on-commit.ts
- **validate-docs.ts** – Checks if markdown-link-check tool is available
