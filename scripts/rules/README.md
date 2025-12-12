---
title: "Tools"
description: "Documentation and resources for documentation functionality."
last_updated: "2025-11-03"
category: "documentation"
status: "draft"
---
# Tools Directory

This directory contains development tools, utilities, and automation scripts for code quality assurance, analysis, and maintenance of the Corso platform.

## 📁 Directory Structure

| Directory | Purpose | File Count | Description |
|-----------|---------|------------|-------------|
| `eslint-plugin-corso/` | ESLint plugin (formerly AST-Grep) | 40+ rules | Primary code quality enforcement (98% migrated from AST-Grep) |
| `ast-grep/` | Remaining AST-Grep patterns | ~4 files | Specialized pattern matching for complex cases |
| `tailwind/` | Tailwind CSS plugins | 2 files | Custom plugins and utilities for design system |
| `types/` | TypeScript type definitions | 1 file | Type definitions for development tools |

## 🎯 Tools vs Scripts: Clear Boundary

### **Tools** (`/tools`)
Purpose: **Rulepacks and config assets only**. Contains static configuration, patterns, and reusable rule definitions that don't execute code.

**Characteristics:**
- Static configuration files (JSON, YAML, text patterns)
- Rule definitions for external tools (ESLint, AST-Grep)
- No executable scripts
- No `@/` imports (violates boundary)

**Contents:**
- `eslint-plugin-corso/` - ESLint rule definitions
- `ast-grep/` - AST-Grep pattern files
- `tailwind/` - Tailwind plugins
- `types/` - Type definitions for tools

### **Scripts** (`/scripts`)
Purpose: **Executable automation and maintenance scripts** (moved from `/tools/scripts`).

**Characteristics:**
- Project-specific executables
- CI/CD validation and automation
- Code quality and maintenance tools
- Can use `@/` imports when referencing app code

**See:** `/scripts/README.md` for detailed organization by domain.

## 🚀 Usage

> **Windows-friendly**: All tools work on Windows. Use forward slashes in paths and `tsx` for TypeScript execution.

### Quick Start Commands

```bash
# Validate everything
pnpm quality:local

# Run ESLint rules (primary validation)
pnpm lint

# Run remaining AST-Grep rules (~4 rules)
pnpm ast-grep:scan

# Check runtime boundaries
pnpm validate:runtime-boundaries

# Scan directory structure
tsx tools/scripts/scan-directory.ts components --json

# Audit breakpoints
tsx tools/scripts/audit-breakpoints.ts

# Check tool installation
tsx tools/scripts/tools-doctor.mjs
```

### Code Quality Validation (98% ESLint-based)

```bash
# Primary validation (40+ migrated rules)
pnpm lint

# Remaining AST-Grep patterns (~4 specialized rules)
pnpm ast-grep:scan

# Run specific ESLint rule
pnpm exec eslint --rule 'corso/no-server-in-client: error' 'app/**/*.{ts,tsx}'

# Check specific categories (ESLint-based)
pnpm lint:client-directive      # Client directive enforcement
pnpm lint:server-env-imports    # Server environment import validation
pnpm lint:contexts-barrel-usage # Context import patterns
pnpm lint:icons                 # Icon SSR safety
```

### Directory Analysis

```bash
# Tree view with depth limit
tsx tools/scripts/scan-directory.ts . --max-depth 3

# Exclude patterns
tsx tools/scripts/scan-directory.ts . --exclude node_modules,dist,.next

# Machine-readable JSON output
tsx tools/scripts/scan-directory.ts . --json
```

## 🔧 Code Quality Configuration

### Primary: ESLint Plugin (98% of patterns)
- **Location**: `@/eslint-plugin-corso/src/index.js` (40+ rules)
- **Configuration**: Standard ESLint config files
- **IDE Integration**: Full editor support with real-time feedback
- **Auto-fix**: Most rules include automatic fixes

### Secondary: AST-Grep (~4 remaining rules)
- **Version**: ast-grep 0.38+ (configured in package.json)
- **Configuration**: Centralized in `sgconfig.yml` at project root
- **Specialized patterns**: Complex multi-file patterns requiring AST analysis
- **Reports**: JSON output saved to `reports/ast-grep-report.json` for CI/CD

### Rule Categories

| Category | Rules | Focus |
|----------|-------|-------|
| Security & API | 10+ rules | Authentication, authorization, input validation |
| Architecture | 15+ rules | Runtime boundaries, import restrictions |
| UI/UX Standards | 7 rules | Call-to-action patterns, component consistency |
| Code Quality | 20+ rules | Best practices, anti-patterns |
| DevOps & Infra | 5+ rules | GitHub workflows, CI/CD standards |

## 📊 Quality Gates Integration

These tools integrate with Corso's automated quality assurance:

- `pnpm lint` → ESLint validation (40+ migrated rules from AST-Grep)
- `pnpm ast-grep:scan` → `tools/scripts/ast-grep-validate.mjs` (~4 remaining rules)
- `pnpm validate:runtime-boundaries` → `tools/scripts/validate-runtime-boundaries.mjs`
- `pnpm quality:local` → Full validation suite (98% ESLint-based)

## 📚 Related Documentation

- [ESLint Plugin](./ast-grep/README.md) - Code quality rules (40+ migrated from AST-Grep)
- [Development Scripts](./scripts/README.md) - Script usage and development
- [Tailwind Plugins](./tailwind/README.md) - Custom CSS plugin documentation
- [Code Quality Standards](../../docs/code-quality-standards.md) - Quality assurance guidelines
- [Scripts vs Tools Guidelines](../../docs/scripts-vs-tools-guidelines.md) - Development conventions

---

**Quick Reference**:
```bash
# Full validation
pnpm quality:local

# Check ESLint rules (primary validation)
pnpm lint

# Check remaining AST-Grep rules (~4 rules)
pnpm ast-grep:scan

# Analyze directory
tsx tools/scripts/scan-directory.ts . --json

# Audit breakpoints
tsx tools/scripts/audit-breakpoints.ts
```

