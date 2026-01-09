---
description: "Guide for building context packs in Cursor for comprehensive documentation audits"
last_updated: "2026-01-09"
category: "documentation"
status: "draft"
---
# Cursor Ask Context Pack Builder for Docs Audit

This guide provides a complete workflow for building context packs in Cursor to perform comprehensive documentation audits. Use this to prepare all necessary files and prompts for effective AI-assisted documentation review.

## A. What to Include in the Context Pack (Minimum Viable)

### Root-Level Docs + Repo Governance

In Cursor, add these paths to context (or paste their contents into a "context pack" file):

**Required Files:**
- `README.md` - Main project README
- `CHANGELOG.md` - Change log (if present)
- `docs/CONTRIBUTING-DOCS.md` - Documentation contribution guidelines
- `docs/README.md` - Main documentation index
- `docs/repository-root-policy.md` - Repository structure policy (if present)

**Optional but Recommended:**
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `.github/CODEOWNERS` - Code ownership file
- Any root-level `SECURITY.md` or `CODE_OF_CONDUCT.md` (if present)

### Docs Build / Site Config (Critical for Dedup + Formatting Strategy)

Include whichever exists:

- `.markdownlint.jsonc` - Markdown linting configuration
- `next.config.mjs` - Next.js config (if docs are Next-based)
- `package.json` - Check for docs-related scripts (`docs:validate`, `jscpd:docs`, etc.)

**Note:** This repo uses:
- `.markdownlint.jsonc` for markdown linting
- `next.config.mjs` for Next.js configuration
- No mkdocs/docusaurus/vitepress (docs are static markdown)

### Docs Directory

**A full tree of `docs/` (file paths only)**

**Entry points / indexes:**
- `docs/README.md` - Main documentation index
- `docs/CONTRIBUTING-DOCS.md` - Contribution guidelines

**The specific files implicated by clones (from your report), at minimum:**

- `docs/maintenance/powershell-performance-fixes/powershell-fixes-implemented.md`
- `docs/maintenance/powershell-performance-fixes/pr-structure.md`
- `docs/ai/rules/AFTER_TOKEN_REPORT.md`
- `docs/ai/rules/BEFORE_TOKEN_REPORT.md`
- `docs/security/auth-patterns.md`
- `docs/reference/api-specification.md`
- `docs/ai/rules/openapi-vendor-extensions.md`
- `docs/error-handling/error-handling-guide.md`
- `docs/monitoring/monitoring-guide.md`
- `docs/development/coding-standards.md`
- `docs/typescript/typescript-guide.md`
- `docs/database/clickhouse-hardening.md`
- `docs/database/backup-and-recovery.md`
- `docs/architecture/codebase-structure.md`
- `docs/ai/rules/security-standards.md`
- `docs/architecture-design/domain-driven-architecture.md`
- `docs/analytics/clickhouse-recommendations.md`

**Why:** If we don't include the canonical entry points + the configs that generate navigation, we can't reliably recommend the right "single source of truth" patterns or the best dedup strategy (e.g., includes/partials vs cross-links vs consolidation).

## B. Commands to Generate a "Context Pack" Quickly (Windows-Friendly)

### 1) Dump Directory Trees

**Docs tree (paths only):**

**Windows PowerShell:**
```powershell
Get-ChildItem -Recurse -File docs | ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\', '') } | Sort-Object
```

**Windows CMD (if needed):**
```cmd
for /r docs %f in (*.md) do @echo %f
```

**Root markdown list:**

**Windows PowerShell:**
```powershell
Get-ChildItem -File *.md | ForEach-Object { $_.Name }
```

### 2) Identify Doc System + Tooling

**Search for doc config:**

```bash
# Using ripgrep (rg) - Windows-friendly
rg -n "mkdocs|docusaurus|vitepress|sphinx|docsify|gitbook" -S .

# Or using PowerShell
Select-String -Path . -Pattern "mkdocs|docusaurus|vitepress|sphinx|docsify|gitbook" -Recurse
```

**Find linting configs:**

```bash
# Using ripgrep
rg -n "markdownlint|remark|vale|cspell|prettier" -S .

# Or check for specific files
Get-ChildItem -Recurse -Filter ".markdownlint*"
Get-ChildItem -Recurse -Filter "cspell.json"
Get-ChildItem -Recurse -Filter ".remarkrc*"
```

### 3) Fast Health Checks for Docs Debt

**Orphan signals:**

```bash
# Using ripgrep
rg -n "TODO|TBD|FIXME|DEPRECATED|WIP" docs -S

# Or PowerShell
Select-String -Path docs -Pattern "TODO|TBD|FIXME|DEPRECATED|WIP" -Recurse
```

**Link inventory:**

```bash
# Find all markdown links
rg -n "\]\((\.{1,2}\/|\/docs\/|http)" docs -S

# Or PowerShell
Select-String -Path docs -Pattern '\]\((\.{1,2}\/|\/docs\/|http)' -Recurse
```

**Duplicate headings inside single files (common issue):**

```bash
# Find all headings
rg -n "^(#{1,6})\s" docs -S

# Count duplicate headings per file (requires processing)
rg -n "^(#{1,6})\s" docs -S | ForEach-Object { $_.Split(':')[0] } | Group-Object | Where-Object { $_.Count -gt 1 }
```

### 4) (Optional but High Value) Broken-Link Check

**If you have Node tooling:**

```bash
# Using markdown-link-check (if installed)
npx markdown-link-check docs/**/*.md

# Or using linkinator
npx linkinator docs --recurse --skip '^(mailto:|tel:)'
```

**Note:** This repo has `pnpm docs:links` command for link validation.

## C. "Cursor Ask" Prompts You Can Paste (Copy/Paste Ready)

### Prompt 1 — Inventory & Navigation Audit

```
Task: Build a docs inventory and navigation map.
Context: @docs plus any docs site config (.markdownlint.jsonc, next.config.mjs).
Output:
- list entry points/index files,
- list docs with no inbound links (or likely orphan docs),
- propose a simple, stable navigation hierarchy,
- identify naming inconsistencies and suggested renames.
```

### Prompt 2 — Root README + CHANGELOG Governance Audit

```
Task: Audit root README.md and CHANGELOG.md for freshness, accuracy, and best practice.
Context: @README.md @CHANGELOG.md plus docs entry points (docs/README.md, docs/CONTRIBUTING-DOCS.md).
Output:
- mismatches between README and docs,
- missing sections (install, quickstart, docs link, support/security, release process),
- recommended CHANGELOG format (Keep a Changelog + SemVer) and automation suggestions.
```

### Prompt 3 — Clone Report Triage and Canonical-Source Plan

```
Task: Using the clone report results, decide what should be canonical vs cross-referenced.
Context: the clone-paired files from reports/orphan/orphan-report.json and reports/orphan-audit-with-allowlist.json.
Output:
- for each clone pair: recommended "single source of truth",
- exact consolidation plan (move text, replace with link, or extract snippet/template),
- risk notes for security/db docs drift.

Specific files to analyze:
- docs/maintenance/powershell-performance-fixes/powershell-fixes-implemented.md
- docs/maintenance/powershell-performance-fixes/pr-structure.md
- docs/ai/rules/AFTER_TOKEN_REPORT.md vs docs/ai/rules/BEFORE_TOKEN_REPORT.md
- docs/security/auth-patterns.md vs .cursor/rules/security-standards.mdc
- docs/reference/api-specification.md
- docs/ai/rules/openapi-vendor-extensions.md vs .cursor/rules/openapi-vendor-extensions.mdc
- docs/error-handling/error-handling-guide.md
- docs/monitoring/monitoring-guide.md
- docs/development/coding-standards.md
- docs/typescript/typescript-guide.md
- docs/database/clickhouse-hardening.md
- docs/database/backup-and-recovery.md
- docs/architecture/codebase-structure.md
- docs/ai/rules/security-standards.md vs .cursor/rules/security-standards.mdc
- docs/architecture-design/domain-driven-architecture.md
- docs/analytics/clickhouse-recommendations.md
```

### Prompt 4 — Docs Formatting + Linting Baseline

```
Task: Define a docs style guide and enforceable lint rules for this repo.
Context: @docs and any lint configs (.markdownlint.jsonc).
Output:
- style guide (headings, code fences, admonitions, line length, link style),
- toolchain recommendation (markdownlint/remark/vale/cspell),
- CI checks + pre-commit hooks,
- autofix strategy.

Current setup:
- Uses .markdownlint.jsonc
- Has pnpm docs:validate, pnpm docs:links, pnpm jscpd:docs commands
- Frontmatter required: title, last_updated, category, status, description
- Filenames: kebab-case
```

## Quick Reference: Context Pack Checklist

Before starting a docs audit in Cursor, ensure you have:

- [ ] Root-level docs (README.md, CHANGELOG.md, CONTRIBUTING-DOCS.md)
- [ ] Docs index (docs/README.md)
- [ ] Linting config (.markdownlint.jsonc)
- [ ] Full docs directory tree (file paths)
- [ ] Clone report files (reports/orphan/orphan-report.json)
- [ ] All files mentioned in clone reports
- [ ] Entry point files (docs/README.md, docs/CONTRIBUTING-DOCS.md)

## Usage Workflow

1. **Generate context pack:**
   ```powershell
   # Get docs tree
   Get-ChildItem -Recurse -File docs | ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\', '') } | Sort-Object > docs-tree.txt
   
   # Get root markdown files
   Get-ChildItem -File *.md | ForEach-Object { $_.Name } > root-md-files.txt
   ```

2. **Add to Cursor context:**
   - Open Cursor
   - Use `@docs` to add the docs directory
   - Use `@README.md` to add root README
   - Use `@CHANGELOG.md` to add changelog
   - Use `@.markdownlint.jsonc` to add linting config
   - Use `@reports/orphan/orphan-report.json` to add clone report

3. **Run prompts:**
   - Copy/paste Prompt 1 for inventory
   - Copy/paste Prompt 2 for README/CHANGELOG audit
   - Copy/paste Prompt 3 for clone triage
   - Copy/paste Prompt 4 for formatting baseline

## Related Documentation

- [Contributing to Documentation](CONTRIBUTING-DOCS.md) - Documentation contribution guidelines
- [Documentation Index](README.md) - Main documentation index
- [Repository Root Policy](repository-root-policy.md) - Documentation folder structure

---

**Last Updated**: 2026-01-29  
**Maintained By**: Platform Team  
**Status**: Active
