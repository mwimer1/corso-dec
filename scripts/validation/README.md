---
title: "Validation"
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
description: "Documentation and resources for documentation functionality. Located in validation/."
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `scripts/validation`
- Last updated: `2025-12-31`

> Edit the template or the generator context to change all READMEs consistently.

## Scripts in `scripts/validation`

- **lib-structure.ts** – Lib Structure Validator

## Knip Configuration

Knip is used for unused exports detection and dead code analysis.

### Configuration

- **Config File:** `.knip.jsonc` (root directory)
- **Schema:** Knip v5 JSONC schema (`https://unpkg.com/knip@5/schema-jsonc.json`)
- **Key Features:**
  - TypeScript-aware analysis
  - Next.js plugin auto-enabled
  - GitHub Actions plugin disabled (avoids YAML parsing)
  - Tag-based filtering for framework exports

### Usage

```bash
# Run Knip analysis (JSON output)
pnpm knip --reporter json

# Run comprehensive export audit (includes barrel checks)
pnpm quality:exports:check
```

### Export Audit Script

The `scripts/maintenance/types-exports-audit.ts` script:
- Shells out to `pnpm knip --reporter json` for unused exports detection
- Combines with barrel consistency checks
- Generates reports in `reports/exports/`

### Next.js Special Exports Policy

Next.js framework exports (route handlers, metadata, etc.) are handled via JSDoc `@knipignore` tags:

**Tagged Exports:**
- Route config: `runtime`, `dynamic`, `revalidate`, `dynamicParams`, `fetchCache`, `preferredRegion`, `maxDuration`
- Metadata: `metadata`, `generateMetadata`, `viewport`, `generateViewport`
- Route handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

**Tagging Convention:**
```typescript
/** @knipignore */
export const runtime = 'nodejs';

/** @knipignore */
export const metadata: Metadata = { ... };

/** @knipignore */
export async function GET(req: Request) { ... }
```

**Why Tagging Instead of Broad ignoreIssues:**
- `ignoreIssues` can only ignore issue types per file pattern, not specific export names
- Tagging allows precise filtering: only framework-owned exports are ignored
- Real unused exports in Next.js files (helper functions, types, etc.) are still detected

**Workflow YAML Validity:**
Knip parses `.github/workflows/*.yml` files. Ensure workflow YAML is valid to avoid blocking Knip execution. Invalid YAML (e.g., mis-indented heredocs) will cause Knip to fail.
