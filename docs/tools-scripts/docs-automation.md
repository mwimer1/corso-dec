---
title: "Tools Scripts"
description: "Documentation and resources for documentation functionality. Located in tools-scripts/."
last_updated: "2026-01-02"
category: "documentation"
status: "stable"
---
# Documentation Automation

Automated tools for maintaining documentation consistency, validating content, and ensuring documentation stays in sync with code.

## Overview

The documentation automation system provides:

- **Content Validation**: Scans for banned patterns, validates code blocks, checks environment variable documentation
- **Link Validation**: Verifies internal and external links are valid
- **Freshness Checks**: Ensures documentation is up-to-date
- **Environment Variable TOC Generation**: Auto-generates table of contents for env var documentation

## Scripts

### Content Validation

**Script**: `scripts/maintenance/validate-docs-content.ts`

Validates documentation content for:

- **Banned Patterns**: Detects direct `process.env` usage in documentation (should use `getEnv()` patterns)
- **Code Block Validation**: Checks TypeScript/JavaScript code blocks for common issues
- **Environment Variable Documentation**: Verifies all env vars used in code are documented

**Usage**:
```bash
pnpm docs:validate:content
```

**What it checks**:
- Direct `process.env` usage in docs (unless clearly marked as incorrect example)
- Code blocks with suspicious import patterns
- Undocumented environment variables

### Environment Variable TOC Generation

**Script**: `scripts/maintenance/generate-env-docs-toc.ts`

Generates or updates the Table of Contents for `docs/references/env.md` based on environment variables found in `lib/server/env.ts`.

**Usage**:
```bash
pnpm docs:env:toc
```

**Features**:
- Automatically categorizes env vars (public, server, build, integration, feature)
- Generates markdown TOC with links to each variable
- Updates existing TOC or creates new one

### Full Documentation Validation

**Script**: `scripts/maintenance/validate-docs.ts`

Comprehensive validation including:
- Link validation (filesystem and external)
- Freshness checks
- Content validation
- Markdown linting
- Metrics validation

**Usage**:
```bash
pnpm docs:validate
# Or just links:
pnpm docs:links --links-only
```

## CI Integration

These scripts are integrated into CI workflows:

- **Pre-commit**: Runs lightweight validation via `validate-docs-on-commit.ts`
- **CI Pipeline**: Runs full validation including content checks
- **PR Checks**: Validates documentation changes

## Adding New Validation Rules

To add new content validation rules:

1. Edit `scripts/maintenance/validate-docs-content.ts`
2. Add pattern checks in `checkBannedPatterns()` or `validateCodeBlocks()`
3. Update tests in `scripts/maintenance/__tests__/validate-docs-content.test.ts`
4. Run `pnpm docs:validate:content` to test

## Environment Variable Documentation

### Keeping Documentation in Sync

The automation helps ensure:

1. **All used env vars are documented**: `validate-docs-content.ts` checks for undocumented variables
2. **TOC stays current**: `generate-env-docs-toc.ts` regenerates TOC from code
3. **Patterns match codebase**: Validates code examples use correct patterns

### Manual Updates

When adding new environment variables:

1. Add to `lib/server/env.ts` (ValidatedEnv type)
2. Document in `docs/references/env.md`
3. Run `pnpm docs:env:toc` to update TOC
4. Run `pnpm docs:validate:content` to verify

## Examples

### Validating Documentation Before Commit

```bash
# Quick validation
pnpm docs:validate:content

# Full validation
pnpm docs:validate
```

### Updating Environment Variable TOC

```bash
# After adding new env vars
pnpm docs:env:toc

# Verify changes
git diff docs/references/env.md
```

### Testing Validation Rules

```bash
# Run tests
pnpm test scripts/maintenance/__tests__/validate-docs-content.test.ts

# Test with intentional violation
echo "const key = process.env.API_KEY;" > test-doc.md
pnpm docs:validate:content
# Should fail with error
```

## Troubleshooting

### Validation Fails on process.env Usage

If validation fails because of `process.env` in documentation:

1. **If showing wrong pattern**: Mark with `❌` or `INCORRECT` comment
2. **If legitimate example**: Add explanatory comment
3. **If actual code**: Update to use `getEnv()` pattern

### TOC Generation Fails

If TOC generation fails:

1. Check `lib/server/env.ts` exists and is valid
2. Verify `docs/references/env.md` exists
3. Check file permissions

### Undocumented Environment Variables

If validation reports undocumented variables:

1. Check if variable is intentionally internal (starts with `_`)
2. Add documentation to `docs/references/env.md`
3. Run `pnpm docs:env:toc` to update TOC

## Related Documentation

- [Environment Variables Reference](../references/env.md) - Complete env var documentation
- [Development Tools](./development-tools.md) - Other development scripts
- [Documentation Standards](../development/coding-standards.md) - Documentation conventions
