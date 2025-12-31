---
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
last_updated: "2025-12-31"
category: "documentation"
status: "active"
---
# Dead Code Audit Baseline — 2025-01-26

## 🎯 Objective

Establish reproducible, artifact-backed dead code audits with CI as the single source of truth.

## ✅ Completed (PR 1)

### 1. CI Workflow Created

**File:** `.github/workflows/dead-code-audit.yml`

**Features:**
- Runs on PRs, pushes to main, weekly schedule, and manual trigger
- Executes all audit checks (cross-platform + Linux-only)
- Uploads artifacts (reports) for 30 days
- Generates workflow summary with results

**Checks Run:**
1. ✅ `pnpm validate:dead-code:optimized` (cross-platform, Windows-compatible)
2. ✅ `pnpm audit:orphans` (detailed ts-morph analysis)
3. ✅ `pnpm audit:orphans:high-signal` (filtered high-confidence candidates)
4. ⚠️ `pnpm quality:exports:check` (Linux-only, Knip-based)
5. ⚠️ `pnpm deadcode:test-only:ci` (Linux-only, ts-prune-based)

### 2. Documentation Added

**File:** `docs/development/setup-guide.md`

**New Section:** "🔍 Dead Code & Unused Exports Audits"

**Contents:**
- Source of truth: CI (Linux) as canonical
- Windows limitations documented
- Available audit commands (cross-platform vs Linux-only)
- CI workflow details and artifact locations
- Understanding audit results (orphans, unused exports, test-only)
- Contributing guidelines for cleanup PRs

## 📊 Baseline Results (2025-01-26)

### Repo Snapshot

- **Commit:** `3367aaa2e4bce5edb1161a093007c067d7d40baf`
- **Node:** `v24.11.1`
- **pnpm:** `10.17.1`

### Dead Code Check (Optimized)

**Command:** `pnpm validate:dead-code:optimized`

**Results:**
- ✅ All 14 orphaned files are allowlisted
- ✅ No circular dependencies found
- ✅ All dead code checks passed

**Status:** Clean (all orphans are intentionally allowlisted)

### Orphan Audit

**Command:** `pnpm audit:orphans --out reports/orphan/orphan-report.json`

**Results:**
- **Candidates:** 705 files
- **Kept:** 637 files (allowlisted, framework conventions, etc.)
- **Droppable:** 68 files

**High-Signal Filter:**
- **Total high-signal candidates:** 0

**Status:** 68 files identified as droppable, but 0 high-signal candidates after filtering (excludes tests, scripts, config files, conventions)

### Unused Exports Check

**Status:** ⚠️ Not run (requires Linux/CI - Knip has Windows native binding issues)

**Expected Location:** `reports/exports/unused-exports.report.json` and `reports/exports/unused-exports.summary.md`

### Test-Only Exports Check

**Status:** ⚠️ Not run (requires Linux/CI - ts-prune has Windows path issues)

## 📁 Artifact Locations

All audit reports are generated in `reports/`:

```
reports/
├── orphan/
│   └── orphan-report.json          # 239KB - Detailed orphan analysis
└── exports/
    ├── unused-exports.report.json  # Generated on CI (Linux)
    └── unused-exports.summary.md   # Generated on CI (Linux)
```

**Note:** Reports are not committed to the repository. They are:
- Generated locally when running audit commands
- Uploaded as CI artifacts for each workflow run
- Available for 30 days in GitHub Actions

## 🔄 Next Steps (Prioritized PRs)

### PR 2 — High-Signal Orphan Deletions

**Goal:** Reduce dead weight with minimal debate

**Action Items:**
1. Review `reports/orphan/orphan-report.json` for files marked `DROP`
2. Filter out:
   - Next.js convention files (should be excluded already)
   - Generated/tool-consumed files
   - Barrel files (verify public API status)
   - Dynamically referenced files
3. Delete only clearly unused files
4. Run `pnpm typecheck`, `pnpm build`, `pnpm test` after deletions
5. Keep PR small and easy to review

**Current State:** 0 high-signal candidates (after filtering), but 68 droppable files identified

### PR 3 — Unused Exports Cleanup + Barrel Alignment

**Goal:** Reduce noise and prevent reintroduction

**Action Items:**
1. Wait for CI to generate `reports/exports/unused-exports.summary.md`
2. Review and categorize:
   - Internal-only exports → Remove
   - Public API exports → Keep (with allowlist) or move
   - Type-only exports → Easy cleanup
   - Barrel inconsistencies → Fix barrel exports
3. Update Knip config (see PR 4) for intentional exports
4. Run full test suite after changes

**Status:** Waiting for CI baseline (requires Linux runner)

### PR 4 — Tooling Quality: Add Explicit Knip Config

**Goal:** Reduce false positives and make audits more trustworthy

**Action Items:**
1. Create `knip.config.ts` or `knip.config.json`
2. Define:
   - Entry points (Next.js routes, API routes, etc.)
   - Project tsconfigs
   - Ignore patterns (generated files, Next conventions)
   - Explicit "public API" modules
3. Test with `pnpm validate:dead-code` on CI
4. Update documentation with config location

**Current State:** No Knip config exists (uses defaults)

### PR 5 — Allowlist Cleanup & Documentation

**Goal:** Make allowlist maintainable and self-documenting

**Action Items:**
1. Review `scripts/audit/orphans.allowlist.json` (30+ entries)
2. Add reasons per entry (comments or markdown doc)
3. Split conceptually:
   - Generated files
   - Framework conventions
   - Tool-consumed (non-imported)
   - Intentional barrels / public API
4. Remove entries for deleted files
5. Document policy for when to add/remove entries

## 🎯 Definition of Done

- [x] CI produces artifacts (reports) on every PR
- [ ] The number of findings is trending down
- [ ] New findings don't silently creep in (CI fails on regression or posts warning)
- [ ] The allowlist has reasons and stops growing mindlessly

## 📝 Notes

### Windows Limitations

- **Knip** (`pnpm validate:dead-code`): Fails on Windows due to native bindings
- **ts-prune** (`pnpm deadcode:test-only`): Path issues with `pnpm exec` on Windows

**Workaround:** Use Windows-compatible commands locally, rely on CI for full analysis.

### Current Allowlist

`scripts/audit/orphans.allowlist.json` contains 30+ intentionally kept files:
- Barrel files (intentional re-exports)
- Generated files (OpenAPI types)
- Architecture config (consumed by tools, not imports)
- Indirect usage (via barrel exports, AG Grid configs)

### Next.js Conventions

The audit tools automatically exclude:
- Route files: `page.tsx`, `layout.tsx`, `route.ts`, `sitemap.ts`
- Error boundaries: `error.tsx`, `global-error.tsx`
- Loading states: `loading.tsx`
- Not found: `not-found.tsx`

These are used by Next.js filesystem routing, not imports.

---

**Last updated:** 2025-01-26
**Next review:** After PR 2-5 completion
