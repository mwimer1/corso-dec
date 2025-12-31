# Maintenance Scripts Cleanup Report

**Date**: 2025-01-XX  
**Status**: ✅ PR #1 Complete - Files Deleted

## Summary of Findings

After comprehensive reference sweeps, the following files are safe to delete (zero references found in codebase, CI, hooks, or config files):

### ✅ Safe to Delete (PR #1)

1. **enhance-readmes.ts** - Replaced by `docs/tasks/enhance.ts` (unified CLI)
2. **refresh-readmes.ts** - Functionality merged into `docs/tasks/normalize.ts`
3. **normalize-frontmatter.ts** - Replaced by `docs/tasks/normalize.ts`
4. **inject-frontmatter.ts** - No references found, unused
5. **list-missing-frontmatter.ts** - No references found, unused
6. **docs-patterns-common.ts** - Not imported anywhere (was meant to be shared but never used)

### 📋 Review Required (PR #2)

1. **autofix-doc-links.js** - Old CommonJS script, functionality differs from `fix-links.ts`
   - `autofix-doc-links.js`: Heuristic basename-based link fixing
   - `fix-links.ts`: Pattern-based fixes using config
   - Decision: Archive or port unique logic

2. **replace-package-script-references.ts** - One-time migration script
   - Decision: Archive in `_archived/` or delete if migration complete

3. **generate-readme.ts** - Script domain README generator (NOT deprecated)
   - Purpose: Generates READMEs for script domains (scripts/analysis, scripts/ci, etc.)
   - Different from: `docs/tasks/generate.ts` (general markdown generation)
   - Decision: Keep - serves unique purpose for script domain documentation

## Reference Sweep Results

### Searches Performed:
- ✅ Direct path references: `scripts/maintenance/(filename).(ts|js)`
- ✅ Filename-only references
- ✅ `.github/workflows/**`
- ✅ `.husky/**`
- ✅ `package.json`
- ✅ Makefile/Dockerfile/justfile/taskfile (none found)

### Results:
- No references to deprecated scripts in CI/hooks/config
- Only references found in README.md (documentation, expected)
- `generate-readme.ts` not in package.json (correct - standalone script)

## Action Plan

### ✅ PR #1: Delete Safe-to-Remove Files (COMPLETED)

**Files Deleted:**
- ✅ `enhance-readmes.ts` (381 lines)
- ✅ `refresh-readmes.ts` (71 lines)
- ✅ `normalize-frontmatter.ts` (unknown size)
- ✅ `inject-frontmatter.ts` (unknown size)
- ✅ `list-missing-frontmatter.ts` (unknown size)
- ✅ `docs-patterns-common.ts` (156 lines)

**Total Lines Removed**: ~600+ lines of deprecated code

### PR #2: Archive/Review Remaining Files
- Archive `replace-package-script-references.ts` if migration complete
- Review `autofix-doc-links.js` vs `fix-links.ts` behavior
- Keep `generate-readme.ts` (serves unique purpose)

## Validation Checklist

After PR #1, verify:
- [ ] `pnpm docs:validate` passes
- [ ] `pnpm docs:links` passes
- [ ] `pnpm docs:refresh` passes
- [ ] `pnpm docs:generate` passes
- [ ] `pnpm docs:enhance` passes
- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes

## Documentation Notes

**Note**: `scripts/maintenance/README.md` is auto-generated from a template (`README.scripts.hbs`). The template should be updated to:
- Remove references to deleted files
- Clarify canonical entrypoint: `scripts/maintenance/docs/cli.ts`
- Document available commands: `generate`, `enhance`, `normalize`
- Note script domain README generation: `generate-readme.ts` (standalone, different purpose)

**Canonical Entrypoints:**
- Docs maintenance: `scripts/maintenance/docs/cli.ts` (unified CLI)
  - Commands: `generate`, `enhance`, `normalize`
  - Usage: `pnpm docs:generate`, `pnpm docs:enhance`, `pnpm docs:refresh`
- Script domain READMEs: `scripts/maintenance/generate-readme.ts` (standalone)
  - Generates READMEs for script domains (scripts/analysis, scripts/ci, etc.)
  - Different from unified docs CLI (serves unique purpose)
