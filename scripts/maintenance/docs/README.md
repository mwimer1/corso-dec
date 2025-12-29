---
title: "scripts/maintenance/docs"
last_updated: "2025-01-28"
category: "automation"
---

# Documentation Maintenance System

This directory contains the **full documentation CLI system** for comprehensive documentation operations.

## Purpose

`scripts/maintenance/docs/` provides a complete documentation maintenance system with:

- **CLI interface** (`cli.ts`) - Unified command-line interface for all docs operations
- **Task modules** (`tasks/`) - Individual operation modules (generate, normalize, enhance)
- **Library utilities** (`lib/`) - Shared utilities for frontmatter, links, markdown, and file operations
- **Test suite** (`__tests__/`) - Comprehensive tests for all components

## Available Operations

### Generate
```bash
pnpm docs:generate
# or
tsx scripts/maintenance/docs/cli.ts generate --write
```
Generates README files from templates and script metadata.

### Normalize
```bash
pnpm docs:refresh
# or
tsx scripts/maintenance/docs/cli.ts normalize --write --force
```
Normalizes frontmatter, links, and structure across all documentation.

### Enhance
```bash
pnpm docs:enhance
# or
tsx scripts/maintenance/docs/cli.ts enhance --write
```
Enhances documentation with additional metadata and cross-references.

## Which Should I Use?

**Use `scripts/maintenance/docs/` when:**
- You need the full docs CLI system (generate/normalize/enhance)
- You want to run comprehensive docs operations
- You need to work with frontmatter, links, or complex docs transformations
- You're maintaining documentation at scale

**Use `scripts/docs/` when:**
- You need a simple, single-purpose docs operation
- You want to check freshness or generate route trees
- You need quick validation without the full docs CLI

See `scripts/docs/README.md` for lightweight docs helpers.

## Architecture

- **`cli.ts`** - Main CLI entrypoint, routes commands to task modules
- **`tasks/`** - Task implementations (generate.ts, normalize.ts, enhance.ts)
- **`lib/`** - Shared utilities:
  - `frontmatter.ts` - Frontmatter parsing and manipulation
  - `fs.ts` - File system operations
  - `links.ts` - Link validation and fixing
  - `markdown.ts` - Markdown processing utilities
- **`constants.ts`** - Shared constants and configuration
- **`types.ts`** - TypeScript type definitions
- **`__tests__/`** - Test suite

## Scripts in `scripts/maintenance/docs`

- **cli.ts** – Main CLI entrypoint for docs operations
- **generate-readmes.ts** – README generation from templates
- **constants.ts** – Shared constants and configuration
- **types.ts** – TypeScript type definitions

