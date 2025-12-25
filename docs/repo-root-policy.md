---
title: "Repository Root Policy"
description: "Guidelines for what belongs in the repository root vs. organized subdirectories."
last_updated: "2025-12-25"
category: "documentation"
---

# Repository Root Policy

This document defines what files and directories belong in the repository root versus organized subdirectories.

## ✅ Must Remain in Root

**Framework & Build Configuration:**
- `next.config.mjs` - Next.js configuration (auto-discovered)
- `package.json` - Package manager manifest
- `pnpm-lock.yaml` - Lock file (package manager)
- `tsconfig.json` - TypeScript root configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

**Package Manager Configuration:**
- `.npmrc` - Cross-tool npm settings (e.g., `engine-strict`)
- `.pnpmrc` - pnpm-specific settings (canonical for pnpm config)

**Tooling Auto-Discovered Configs:**
- `.spectral.yaml` - Spectral CLI auto-discovers in root
- `eslint.config.mjs` - ESLint configuration
- `.markdownlint.jsonc` - Markdown linting config
- `jscpd.config.json` - Code duplication detection
- `.knip.jsonc` - Dead code detection
- Other tool configs that require root location for auto-discovery

**Essential Project Files:**
- `README.md` - Project overview and quick start
- `CHANGELOG.md` - Version history
- `.gitignore` - Git ignore patterns
- `.editorconfig` - Editor configuration (if used)

## 📁 Organized Subdirectories

### Documentation (`docs/`)
- **QA & Verification**: `docs/qa/` - Manual verification guides, QA checklists
- **Maintenance**: `docs/maintenance/` - Maintenance summaries, implementation plans
- **Architecture**: `docs/architecture/` - Architecture explanations, design decisions
- **Feature Notes**: `docs/feature-notes/` - Feature implementation summaries, design docs
- **Audits**: `docs/audits/` - Audit reports and analysis
- **References**: `docs/references/` - Reference documentation, examples

### Scripts (`scripts/`)
- **Windows Scripts**: `scripts/windows/` - PowerShell scripts for Windows development
- **Setup Scripts**: `scripts/setup/` - Development environment setup
- **CI Scripts**: `scripts/ci/` - Continuous integration automation
- **Maintenance Scripts**: `scripts/maintenance/` - Maintenance and cleanup scripts
- **Lint Scripts**: `scripts/lint/` - Linting and validation scripts

### Configuration (`config/`)
- **TypeScript**: `config/typescript/` - TypeScript project configurations
- **Security**: `config/security/` - Security policy configurations

### Reports (`reports/`)
- Generated reports, analysis outputs, and audit artifacts

## 🚫 What NOT to Put in Root

**Documentation Files:**
- ❌ Implementation summaries, QA checklists, verification guides → `docs/`
- ❌ Feature design documents → `docs/feature-notes/`
- ❌ Audit reports → `docs/audits/`

**Scripts:**
- ❌ Development scripts → `scripts/`
- ❌ Windows-specific scripts → `scripts/windows/`

**IDE Configuration:**
- ❌ `.code-workspace` files → Ignored (personal preference, see `.gitignore`)
- ❌ IDE-specific configs → `.vscode/` or `.idea/` (if shared)

**Obsolete/Unused Configs:**
- ❌ Tool configs for tools not in use → Remove
- ❌ Duplicate configs → Consolidate to canonical location

## 📋 Adding New Tools/Configs

**When adding a new tool:**
1. Check if tool auto-discovers config in root (e.g., Spectral, ESLint)
2. If yes: Place config in root with standard name (`.toolrc`, `tool.config.json`)
3. If no: Place in `config/` subdirectory
4. If tool supports both: Prefer root for auto-discovery, document in this policy

**When adding documentation:**
- Use appropriate `docs/` subdirectory based on content type
- Update `docs/README.md` index if adding new category
- Follow existing naming conventions (kebab-case)

**When adding scripts:**
- Place in appropriate `scripts/` subdirectory
- Use descriptive names following existing patterns
- Add to `scripts/README.md` if creating new category

## 🔍 Maintenance

**Regular audits:**
- Review root directory quarterly for obsolete files
- Check for duplicate configs across root and `config/`
- Verify all root files are actively used or required for auto-discovery

**Last root audit**: 2025-12-25  
*Next audit due: 2026-03-25 (quarterly)*

**Before removing root files:**
1. Search repository for references: `rg -n "<filename>" .`
2. Check `package.json` scripts for usage
3. Check `.github/workflows/` for CI references
4. Verify tool is still in dependencies
5. Document removal reason in commit message

---

**Last Updated**: 2025-12-25  
**Last Root Audit**: 2025-12-25  
**Next Audit Due**: 2026-03-25 (quarterly)  
**Maintained By**: Platform Team

