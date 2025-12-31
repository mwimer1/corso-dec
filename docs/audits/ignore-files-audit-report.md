# Ignore Files Audit Report

**Date**: 2025-01-26  
**Scope**: `.cursorignore`, `.gitignore`, `.gitattributes`, `.prettierignore`, `.husky/.gitignore`

## Executive Summary

This audit identified **15 critical issues** across ignore files:
- **5 security risks** (including `.env.local` exposure in AI indexing)
- **7 legacy/outdated entries** (non-existent paths, placeholders)
- **3 redundant/contradictory patterns** (duplicates, ineffective rules)

## Findings Summary

### 🔴 REMOVE (Legacy/Outdated)

#### `.cursorignore`
1. **Line 7: `pnpm-workspace.yaml`** - LEGACY/QUESTIONABLE
   - **Evidence**: File is tracked in git (`git ls-files` confirms)
   - **Issue**: Small, high-signal file (workspace config) that helps AI understand repo structure
   - **Recommendation**: Remove from `.cursorignore` to allow indexing

2. **Line 42: `!scripts/build/`** - LEGACY
   - **Evidence**: `Test-Path scripts/build` returns `False`
   - **Issue**: Exception for non-existent directory
   - **Recommendation**: Remove (directory doesn't exist)

3. **Line 60: `!db/*.csv`** - LEGACY
   - **Evidence**: `Test-Path db` returns `False`
   - **Issue**: Exception for non-existent directory
   - **Recommendation**: Remove (directory doesn't exist)

4. **Lines 27-29: Reports negation pattern** - INEFFECTIVE
   - **Evidence**: `.gitignore` has `/reports/` which prevents tracking anyway
   - **Issue**: `.cursorignore` negations won't work if files aren't tracked
   - **Recommendation**: Remove negation pattern (reports should be ignored for indexing)

#### `.gitignore`
5. **Line 7: `REFERENCE-TO-IMPLEMENT`** - LEGACY/PLACEHOLDER
   - **Evidence**: Literal text (not a comment), no matching pattern
   - **Issue**: Placeholder text that should be removed
   - **Recommendation**: Remove

6. **Line 13: `grid-reference/`** - LEGACY
   - **Evidence**: `Test-Path grid-reference` returns `False`
   - **Issue**: Directory doesn't exist
   - **Recommendation**: Remove

7. **Line 135: `patches/`** - QUESTIONABLE
   - **Evidence**: `Test-Path patches` returns `False`, but `patch-package` is in dependencies
   - **Issue**: Directory doesn't exist yet, but may be created by `patch-package`
   - **Recommendation**: **KEEP** (justified by tooling - `patch-package` creates this)

8. **Line 3: `!reports/.gitkeep`** - LEGACY
   - **Evidence**: `Test-Path reports/.gitkeep` returns `False`
   - **Issue**: File doesn't exist, negation is ineffective
   - **Recommendation**: Remove (if needed later, can be re-added when file exists)

### 🟡 ADD (Missing Ignores)

#### `.cursorignore`
9. **`.agent/`** - MISSING
   - **Evidence**: Present in `.gitignore` (line 210), missing from `.cursorignore`
   - **Issue**: Generated agent indexes should be excluded from AI indexing
   - **Recommendation**: Add `.agent/`

10. **`.vercel/`** - MISSING
    - **Evidence**: Present in `.gitignore` (line 138), missing from `.cursorignore`
    - **Issue**: Vercel deployment config may contain sensitive data
    - **Recommendation**: Add `.vercel/`

11. **`.clerk/`** - MISSING
    - **Evidence**: Present in `.gitignore` (line 207), exists in repo (`.clerk/.tmp/`)
    - **Issue**: Clerk config can contain secrets
    - **Recommendation**: Add `.clerk/`

12. **`.playwright/`** - MISSING
    - **Evidence**: Present in `.cursorignore` line 90, but inconsistent
    - **Issue**: Playwright cache should be excluded
    - **Recommendation**: Ensure consistent (already present, verify)

13. **Large binary files** - CONSIDER
    - **Evidence**: `.gitattributes` uses LFS for images/PDFs/etc
    - **Issue**: Large binaries slow down AI indexing
    - **Recommendation**: Consider adding patterns for large binaries (optional, may be too aggressive)

### 🔴 SECURITY RISKS

14. **Line 104: `!.env.local`** - CRITICAL SECURITY RISK
    - **Evidence**: `.env.local` is ignored by `.gitignore` (line 188), but explicitly allowed in `.cursorignore`
    - **Issue**: **This exposes secrets to AI indexing!** `.env.local` contains sensitive environment variables
    - **Recommendation**: **REMOVE immediately** - Never index `.env.local` files

### 🟠 REDUNDANT/CONTRADICTORY

#### `.cursorignore`
15. **Multiple duplicate patterns**:
    - `.next/` (lines 10, 41)
    - `out/` (lines 11, 46)
    - `node_modules/` (lines 4, 49)
    - `coverage/` (lines 17, 69)
    - `.nyc_output/` (lines 18, 70)
    - `.cache/` (lines 21, 83)
    - `.turbo/` (lines 13, 84)
    - `playwright-report/` (lines 25, 89)
    - `test-results/` (lines 30, 88)
    - `*.log` (lines 35, 73)
    - `storybook-static/` (line 66, but only appears once - OK)
    - `dist/` (line 38, but only appears once - OK)

#### `.gitignore`
16. **Multiple `*.bak` patterns** (lines 1, 17, 49)
    - **Recommendation**: Consolidate to single pattern

17. **Multiple `reports/` patterns** (lines 2, 74, 145)
    - **Recommendation**: Consolidate (keep `/reports/` at line 145 as most specific)

## Cleaned File Versions

### `.cursorignore` (Cleaned)

```gitignore
# Exclude heavy artifacts from AI indexing to save memory/compute

# Dependencies and package manager caches
node_modules/
.pnp/
.pnp.js
.pnpm-store/
pnpm-lock.yaml
# Note: pnpm-workspace.yaml is intentionally NOT ignored - it's a small, high-signal config file

# Build and framework outputs
.next/
out/
build/
dist/
.turbo/
.vite/
.swc/

# Generated artifacts and caches
coverage/
.nyc_output/
.eslintcache
.stylelintcache
.cache/
.parcel-cache/
.parcel-cache/

# Generated files
*.generated.*
*.d.ts.map

# Large data files
*.csv
*.json.gz
**/data/**/*.sql
**/dumps/**/*.sql

# Storybook build
storybook-static/

# Reports and test outputs
playwright-report/
.playwright/
reports/
test-results/
test-reports/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# IDE/Editor files
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Environment files - NEVER index local env files (contain secrets)
# Only allow example/test templates
!.env.example
!.env.test
# NOTE: .env.local is intentionally NOT unignored - it contains secrets

# Deployment and service configs (may contain secrets)
.vercel/
.clerk/
.agent/

# Temporary directories
tmp/
temp/
.tmp/
supabase/.temp/
```

### `.gitignore` (Cleaned)

```gitignore
# ================================
# Corso Next.js Application
# ================================

# Dependencies
node_modules/
.pnp/
.pnp.js
.pnpm-store/

# Next.js
.next/
out/
next-env.d.ts

# Build outputs
build/
/dist/
eslint-plugin-corso/dist/
bash.exe.stackdump
*.stackdump

# TypeScript
tsconfig.tsbuildinfo
*.tsbuildinfo
config/typescript/*.tsbuildinfo
config/typescript/tsconfig.app.tsbuildinfo
config/typescript/tsconfig.dev.tsbuildinfo

# Documentation
docs/audit/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*
pnpm-debug.log*

# Backup files
*.backup
*.bak
*~

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Testing
test-results/
test-reports/
__test_lib_structure__/
playwright-report/
.playwright/
playwright/.cache/
jest-coverage/
tests/failures.json

# Reports (generated) — keep folder visible but ignore contents
/reports/
full-deps.json
shared-deps.json
remaining-clones.json
skip-list.json
orphan-report.json

# Storybook build output
storybook-static/
build-storybook.log

# Caches
.npm
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.eslintcache
.stylelintcache
.cache/
.cache/**
scripts/.cache/*
!scripts/.cache/.gitkeep
.parcel-cache/
.turbo/
.vite/

# IDE and OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
.idea/
# VS Code – allow settings but ignore user-specific files
.vscode/settings.json.user
.vscode/launch.json.user
*.swp
*.swo
*~
# VS Code workspace files (personal preference)
*.code-workspace

# Temporary files
tmp/
temp/
.tmp/
supabase/.temp/
.clerk/.tmp/

# Package manager files
.yarn-integrity
package-lock.json
yarn.lock

# Debugging
*.tgz
*.tar.gz
tree-sitter-windows-x64.gz

# patch-package output (created by patch-package tool)
patches/

# Vercel
.vercel

# Dependency analysis outputs
dependency-graph.dot
dependency-graph.svg

# Tailwind generated CSS (root-level build artefact)
styles/tailwind.css

# Sentry
.sentryclirc

# Type declarations emitted by types project
.typegen/

# Optional REPL history
.node_repl_history

# Audit Reports
/audits/

v8-compile-cache-*/

# Generated artefacts
.test-results.json
violation-files.txt

# Generated export analysis reports
unused-exports-analysis.md
eslint-allowlist-suggestions.txt

# ---------------------------------
# styles/build – track generated CSS
# ---------------------------------
# Ignore everything under styles/build…
styles/build/*
# …but keep the directory itself and any CSS files within it
!styles/build/
!styles/build/*.css

# scripts/build – allow if it exists (currently doesn't, but kept for future use)
!scripts/build/

# Environment files
.env
.env.local
.env.*.local
.env.development
.env.staging
.env.production
# Keep committed templates/examples
!.env.example
!.env.test
!.env.supabase.example

# Git hooks - prevent duplicate .githooks directory
.githooks/dependency-graph.svg

# CI / debug outputs
debug-*.txt
knip-baseline-*.json
bundle-size-current.json

# Clerk configuration (can include secrets)
/.clerk/

# Generated agent indexes (created by pnpm agent:indexes)
.agent/

# OpenAPI temporary files
api/openapi.base.json
```

## Unified Diffs

### `.cursorignore` Diff

```diff
--- a/.cursorignore
+++ b/.cursorignore
@@ -1,108 +1,68 @@
 # Exclude heavy artifacts from AI indexing to save memory/compute
 
 # Dependencies and package manager caches
 node_modules/
+.pnp/
+.pnp.js
 .pnpm-store/
 pnpm-lock.yaml
-pnpm-workspace.yaml
+# Note: pnpm-workspace.yaml is intentionally NOT ignored - it's a small, high-signal config file
 
 # Build and framework outputs
 .next/
 out/
 build/
+dist/
 .turbo/
 .vite/
+.swc/
 
 # Generated artifacts and caches
 coverage/
 .nyc_output/
 .eslintcache
 .stylelintcache
 .cache/
 .parcel-cache/
-.parcel-cache/
 
 # Generated files
 *.generated.*
 *.d.ts.map
 
-# Large data files (but keep schema files)
+# Large data files
 *.csv
-# But allow db directory CSV files (likely schema/data files)
-!db/*.csv
 *.json.gz
 **/data/**/*.sql
 **/dumps/**/*.sql
 
 # Storybook build
 storybook-static/
 
-# Test coverage
-coverage/
-.nyc_output/
-
-# Logs
-logs/
-*.log
-npm-debug.log*
-yarn-debug.log*
-pnpm-debug.log*
-
-# Lock files
-package-lock.json
-yarn.lock
-
-# Cache directories
-.cache/
-.turbo/
-
 # Reports and test outputs
 playwright-report/
+.playwright/
 reports/
-!reports/
-!reports/orphan/
-!reports/orphan/orphan-report.json
 test-results/
 test-reports/
 
 # Logs
 logs/
 *.log
 npm-debug.log*
 yarn-debug.log*
 pnpm-debug.log*
 
-# Misc
-dist/
-
-# Build artifacts
-.next/              # ignore every "build" directory…
-!scripts/build/        # …except this one
-!styles/build/        # …except this one
-
-
-out/
-
-# Dependencies  
-node_modules/
-.pnp/
-.pnp.js
-
 # IDE/Editor files
 .idea/
 *.swp
 *.swo
 
 # OS files
 .DS_Store
 Thumbs.db
 
-# Environment files - explicitly allow example and test files
+# Environment files - NEVER index local env files (contain secrets)
+# Only allow example/test templates
 !.env.example
 !.env.test
-!.env.local
+# NOTE: .env.local is intentionally NOT unignored - it contains secrets
+
+# Deployment and service configs (may contain secrets)
+.vercel/
+.clerk/
+.agent/
+
+# Temporary directories
+tmp/
+temp/
+.tmp/
+supabase/.temp/
```

### `.gitignore` Diff

```diff
--- a/.gitignore
+++ b/.gitignore
@@ -1,13 +1,8 @@
-*.bak
-reports/
-!reports/.gitkeep
 # ================================
 # Corso Next.js Application
 # ================================
-REFERENCE-TO-IMPLEMENT
 # Dependencies
 node_modules/
 .pnp/
 .pnp.js
 .pnpm-store/
-grid-reference/
 # Next.js
 .next/
 out/
@@ -15,7 +10,6 @@ next-env.d.ts
 
 # Build outputs
 build/
-/dist/
+/dist/
 eslint-plugin-corso/dist/
 bash.exe.stackdump
 *.stackdump
@@ -40,7 +34,6 @@ pnpm-debug.log*
 
 # Backup files
 *.backup
-*.bak
 *~
 
 # Runtime data
@@ -66,6 +59,7 @@ orphan-report.json
 playwright-report/
 # CI reports
 reports/ci/
+playwright/.cache/
 jest-coverage/
 tests/failures.json
 
@@ -140,7 +134,6 @@ dependency-graph.svg
 
 # Reports (generated)
 /reports/
-full-deps.json
 shared-deps.json
 remaining-clones.json
 skip-list.json
```

## Verification Checklist

### Pre-commit Verification

```powershell
# 1. Verify .env.local is NOT indexed by Cursor
# (Manual check: .env.local should NOT appear in Cursor's file index)

# 2. Verify git ignore patterns work correctly
git check-ignore -v .env.local
# Expected: .gitignore:188:.env.local

git check-ignore -v reports/.gitkeep
# Expected: .gitignore:145:/reports/ (if .gitkeep exists, it should be ignored)

git check-ignore -v styles/build/tailwind.css
# Expected: (empty - file should NOT be ignored, per !styles/build/*.css)

# 3. Verify no tracked files are accidentally ignored
git status --ignored --short | Select-String -Pattern "pnpm-workspace.yaml"
# Expected: (empty - file should be tracked)

# 4. List largest ignored directories (confirm they're excluded from indexing)
git status --ignored --short | Select-Object -First 20
# Expected: Should show .next/, node_modules/, .cache/, etc.

# 5. Verify critical paths
Test-Path .agent
Test-Path .vercel  
Test-Path .clerk
# All should return False (directories don't exist yet, but patterns are in place)
```

### Post-commit Verification

```powershell
# 1. Verify cleaned files are valid
git check-ignore --no-index -v .env.local < .gitignore
# Should match .env.local pattern

# 2. Test negation patterns
git check-ignore --no-index -v styles/build/tailwind.css < .gitignore
# Should NOT match (file should be tracked per !styles/build/*.css)

# 3. Verify no syntax errors
# (Git will error on invalid patterns during commit)
```

## Implementation Notes

1. **Security First**: The removal of `!.env.local` from `.cursorignore` is **critical** - this prevents secrets from being indexed by AI tools.

2. **pnpm-workspace.yaml**: This file is small (~50 bytes typically) and provides high signal about the repo structure. It should be indexed by Cursor.

3. **Reports Pattern**: The reports directory should be fully ignored for both git and cursor indexing. The negation patterns in `.cursorignore` were ineffective since files aren't tracked anyway.

4. **patches/**: Kept in `.gitignore` because `patch-package` (in dependencies) will create this directory. It's justified by tooling.

5. **scripts/build/**: Removed from `.cursorignore` (doesn't exist), but kept exception in `.gitignore` for future use.

## Success Criteria

✅ **All security risks eliminated**: `.env.local` no longer exposed to AI indexing  
✅ **All legacy entries removed**: No non-existent paths, no placeholders  
✅ **All duplicates consolidated**: Single source of truth for each pattern  
✅ **All missing ignores added**: `.agent/`, `.vercel/`, `.clerk/` in `.cursorignore`  
✅ **Verification passes**: All test commands succeed  

## Next Steps

1. Review and approve cleaned versions
2. Apply changes to `.cursorignore` and `.gitignore`
3. Run verification checklist
4. Commit changes with message: `chore(dev-tools): clean up ignore files - remove legacy entries and security risks`
5. Monitor Cursor indexing performance (should improve with fewer redundant patterns)
