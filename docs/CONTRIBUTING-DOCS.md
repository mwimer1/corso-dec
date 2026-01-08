---
title: "Contributing to Documentation"
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Contributing to Documentation

This guide explains how to contribute to Corso documentation, including where to place new documents, naming conventions, and best practices for maintaining documentation quality.

## 📋 Where to Place Documentation

### Documentation Structure

- **`docs/development/`** - Developer setup, coding standards, workflows, development tools
- **`docs/quality/`** - Testing, CI/CD pipelines, quality gates, QA processes
- **`docs/architecture/`** - Architecture explanations, design decisions, codebase structure
- **`docs/reference/`** - Environment variables, API specs, dependencies, quick references
- **`docs/audits/`** - Audit reports, baseline snapshots, remediation trackers (date-organized)
- **`docs/feature-notes/`** - Feature implementation summaries, design docs (ADRs moved to docs/decisions/)
- **`docs/maintenance/`** - Upgrade guides, dependency management, maintenance procedures
- **`docs/security/`** - Security guidelines, auth patterns, and security policy/implementation docs
- **`docs/database/`** - Database documentation (ClickHouse, Postgres) – e.g. schema design, backup, retention policies
- **`docs/analytics/`** - Analytics and warehouse guides (ClickHouse usage, analytics integration)
- **`docs/typescript/`** - TypeScript configuration, strictness, and type safety best practices
- **`docs/decisions/`** - Architecture Decision Records (ADRs) and design rationale documents
- **`docs/operations/`** - Operational guides for deployment, monitoring, and incident response
- **`docs/performance/`** - Performance optimization and scaling guidelines
- **`docs/qa/`** - Manual QA test plans and verification checklists

### Decision Guide

**New documentation?** Ask:
1. **Is it developer-focused?** → `docs/development/`
2. **Is it about testing/CI/CD/quality?** → `docs/quality/`
3. **Is it about system design/patterns?** → `docs/architecture/`
4. **Is it a reference/cheat sheet?** → `docs/reference/`
5. **Is it a time-bound audit/snapshot?** → `docs/audits/`
6. **Is it a feature design doc?** → `docs/feature-notes/`
7. **Is it about upgrades/dependencies?** → `docs/maintenance/`
8. **Is it about security/auth/security policy?** → `docs/security/`
9. **Is it about database schema/backup/retention?** → `docs/database/`
10. **Is it about analytics/warehouse/ClickHouse?** → `docs/analytics/`
11. **Is it about TypeScript configuration/type safety?** → `docs/typescript/`
12. **Is it an ADR or design rationale?** → `docs/decisions/`
13. **Is it about deployment/monitoring/operations?** → `docs/operations/`
14. **Is it about performance/scaling?** → `docs/performance/`
15. **Is it a manual QA test plan/checklist?** → `docs/qa/`

## ✍️ Single Source of Truth Principle

**Link, don't duplicate.** If information already exists in another document:
- ✅ Link to the existing document
- ❌ Don't copy-paste the content
- ❌ Don't paraphrase if it's redundant

### Examples

**❌ Bad**: Copying setup steps into README when they're already in Setup Guide
```markdown
# Setup (duplicated from Setup Guide)
1. Run pnpm install
2. Run pnpm verify:ai-tools
...
```

**✅ Good**: Linking to the canonical source
```markdown
# Setup

See the [Development Environment Setup Guide](development/setup-guide.md) for complete installation instructions.
```

## 📝 Naming & Format Conventions

### Filenames

- Use **kebab-case** (all lowercase, hyphen-separated)
- Examples: `setup-guide.md`, `quality-gates.md`, `coding-standards.md`
- Avoid: `SetupGuide.md`, `quality_gates.md`, `Quality Gates.md`

### Frontmatter

Every documentation file **must** include frontmatter:

```markdown
---
title: "Document Title"
last_updated: "2026-01-04"
category: "documentation"
status: "active"  # or "draft" or "stable"
description: "Brief description of the document's purpose."
---
```

**Fields**:
- `title` - Document title (string)
- `last_updated` - Date last updated (YYYY-MM-DD format)
- `category` - Usually "documentation"
- `status` - Document status: `"active"` (current), `"draft"` (in progress), `"stable"` (unchanging)
- `description` - Brief description for indexes and navigation

### Titles & Headings

- Use clear, descriptive titles
- Use sentence case for headings (Capitalize First Word Only, Unless Proper Nouns)
- Keep headings concise and specific

## 📊 Baseline Snapshots & Audit Reports

### Baseline Patterns

For time-bound snapshots and audit reports:

1. **Use date-organized folders**: `docs/audits/YYYY-MM-topic/`
   - Example: `docs/audits/2026-01-production-readiness/`

2. **Use dated filenames for baselines**: `topic-baseline-YYYY-MM.md`
   - Example: `quality-gates-baseline-2026-01.md`

3. **Archive location**: Move baselines to `docs/audits/baselines/` after creation
   - Example: `docs/audits/baselines/quality-gates-2026-01.md`

4. **Link from main docs**: In the canonical document, add a link to archived baselines:
   ```markdown
   ## Baseline Snapshots

   Historical baseline snapshots are archived for reference:
   - [Quality Gates Baseline (Jan 2026)](audits/baselines/quality-gates-2026-01.md) - *(Archived)*
   ```

### Audit Reports

- Store in `docs/audits/YYYY-MM-topic/` folders
- Include `remediation-tracker.md` for active audits
- Move completed audits to `docs/audits/` with date prefixes
- Keep baseline snapshots in `docs/audits/baselines/` for historical reference

## 🔗 Link vs. Duplicate Content

### When to Link

- Setup instructions (link to Setup Guide)
- Testing patterns (link to Testing Guide)
- Quality gate requirements (link to Quality Gates doc)
- Coding standards (link to Coding Standards doc)
- API patterns (link to API Design Guide)

### When Minimal Duplication is Acceptable

- Brief summaries in README/index files (2-3 sentences max)
- Quick reference tables (with link to full doc)
- Code examples that illustrate a specific point (should link to full guide)

### Duplication Detection

We use `jscpd:docs` to detect duplicate content:
```bash
pnpm jscpd:docs  # Scans for duplicate markdown content
```

**Threshold**: <5% duplication is acceptable (allows for small quotes, code examples, common phrasing).

## 📚 Documentation Index

### Updating the Index

When adding new documentation:

1. **Add to `docs/README.md`** - Main documentation index
2. **Add to section README** - Update the relevant section README (e.g., `docs/quality/README.md`)
3. **Use clear descriptions** - Write a brief, descriptive line for each document

**Example**:
```markdown
## Quality Guides

- [Testing Guide](quality/testing-guide.md) - How to write and run tests (unit, integration, e2e)
- [Testing Strategy](quality/testing-strategy.md) - Testing approach and coverage requirements
```

## 🔍 Quarterly Audit Process

Every quarter, we perform a documentation audit:

1. **Link Validation**: `pnpm docs:links` - Check for broken links
2. **Duplication Scan**: `pnpm jscpd:docs` - Check for duplicate content (<5% threshold)
3. **Freshness Check**: `pnpm docs:validate` - Check for outdated documentation
4. **Index Review**: Verify all docs are listed in `docs/README.md` or intentionally excluded
5. **Frontmatter Review**: Check `last_updated` dates and update stale docs

### Last Audit

- **Date**: 2026-01-04
- **Next Due**: 2026-04-04

## 🚀 CI Integration

Documentation validation is integrated into CI workflows:

- **Docs Duplication Check**: Runs `pnpm jscpd:docs` in CI (non-blocking, <5% threshold)
- **Link Validation**: Part of `pnpm docs:validate` (runs in CI)
- **Content Validation**: Part of `pnpm docs:validate:content` (runs in CI)

The duplication check is non-blocking on first implementation to allow for gradual reduction of duplicates.

## ✅ Pre-Commit Checklist

Before committing documentation changes:

- [ ] Filename uses kebab-case
- [ ] Frontmatter is complete and accurate (except root README.md which doesn't require frontmatter)
- [ ] Content follows single-source-of-truth principle (links instead of duplicating)
- [ ] Document is added to appropriate section in `docs/README.md`
- [ ] Internal links are updated to reflect new structure (if files moved)
- [ ] No sensitive information (API keys, passwords, etc.)
- [ ] Run `pnpm lint:md` to check markdown formatting (CI will also check this)
- [ ] Verify links are accessible (CI will check links automatically)

## 🛠️ Validation Commands

Before pushing, run:

```bash
# Markdown linting (required - runs in CI)
pnpm lint:md

# Full documentation validation
pnpm docs:validate

# Check for broken links (CI also checks automatically)
pnpm docs:links

# Check for duplicate content (CI also checks automatically)
pnpm jscpd:docs

# Spell checking (CI runs this non-blocking)
pnpm docs:spellcheck

# Validate content patterns
pnpm docs:validate:content
```

**Note**: CI automatically runs markdownlint, link checking, duplication detection, and spell checking on every PR. Run these locally before pushing to catch issues early.

## 🤖 CI Automation

Documentation quality is automatically enforced via CI workflows on every pull request:

### Automatic Checks (Every PR)

- **Markdownlint**: Validates markdown structure and formatting
  - Runs: `pnpm lint:md`
  - Blocks PR if formatting issues are found
  - Catches broken code fences, inconsistent formatting

- **Link Checking**: Validates all internal and external links
  - Uses Lychee to check link accessibility
  - Retries flaky external links automatically
  - Blocks PR if broken links are found

- **Duplication Detection**: Prevents copy-pasted content
  - Uses jscpd to detect duplicated sections
  - Threshold: 5% (allows small quotes and common phrasing)
  - Blocks PR if duplication exceeds threshold

- **Spell Checking**: Catches typos (non-blocking)
  - Uses cspell to check spelling
  - Runs but doesn't block PRs (allows for review)

### Scheduled Checks

- **Freshness Check**: Monthly automated check for stale docs
  - Runs on 1st of each month via `.github/workflows/docs-freshness.yml`
  - Flags files older than 90 days
  - Creates GitHub issues for maintainers to review
  - Command: `pnpm docs:stale:check --maxAgeDays=90`

### Local Development

To get immediate feedback before pushing:

```bash
# Run all documentation checks locally
pnpm lint:md              # Markdown linting
pnpm docs:links           # Link checking
pnpm jscpd:docs           # Duplication detection
pnpm docs:spellcheck      # Spell checking (optional)
```

All checks that run in CI can be run locally using these commands. CI will run the same checks automatically when you open a PR.

## 📖 Related Documentation

- [Documentation Index](README.md) - Main documentation index
- [Repository Root Policy](repository-root-policy.md) - Documentation folder structure
- [Coding Standards](development/coding-standards.md) - Code documentation standards

---

**Last Updated**: 2026-01-04  
**Maintained By**: Platform Team  
**Status**: Active
