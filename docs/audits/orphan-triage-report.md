---
status: stable
last_updated: 2025-12-20
---

# Orphan File Triage Report

**Generated:** 2025-12-20  
**Source:** `pnpm audit:orphans` (filtered for high-signal candidates)  
**Total High-Signal Candidates:** 13 (excludes tests, scripts, config files, conventions)

## Executive Summary

After filtering out known false positives (tests, scripts, config files, framework conventions), we identified **13 high-signal orphan candidates**. Analysis shows:

- **Safe to Delete:** 7 files (already marked as removed/unused, empty stubs)
- **Keep (False Positives):** 5 files (used indirectly, type augmentation, architecture config, tooling config)
- **Needs Review:** 1 file (exported but usage unclear)

## Triage Results

### ✅ Safe to Delete (7 files)

These files are already marked as removed/unused in comments and contain no actual code:

#### Components
1. **`components/ui/molecules/empty-state.tsx`**
   - Status: Empty stub file, marked "removed - this file is kept for potential future use"
   - Evidence: Only exports empty object `export { }`
   - Action: **DELETE** - Variant styles exported from `@/styles/ui/molecules` instead

2. **`components/ui/organisms/layout-utils.ts`**
   - Status: Stub file, marked "moved to @/lib/shared/utils/layout"
   - Evidence: Empty file with comment redirect
   - Action: **DELETE** - Migration already complete

#### Lib - Server
3. **`lib/server/streaming/ndjson.ts`**
   - Status: Empty file, marked "removed: ndjsonStream (unused)"
   - Evidence: Only has `import 'server-only'` and comment
   - Note: Still exported from `lib/server/index.ts` barrel - need to remove export too
   - Action: **DELETE** (and remove from barrel export)

4. **`lib/server/feature-flags/feature-flag-validator.ts`**
   - Status: Empty file
   - Evidence: Only has `import 'server-only'`
   - Note: Still exported from `lib/server/index.ts` barrel - need to remove export too
   - Action: **DELETE** (and remove from barrel export)

5. **`lib/server/performance/database-metrics.ts`**
   - Status: Empty file (only `import 'server-only'` and comment)
   - Evidence: File is completely empty
   - Note: Still exported from `lib/server/index.ts` barrel - need to remove export too
   - Action: **DELETE** (and remove from barrel export)

#### Lib - Shared
6. **`lib/shared/utils/layout.ts`**
   - Status: Stub file, marked "Removed unused exports"
   - Evidence: Empty file with comment about removed exports
   - Action: **DELETE**

#### Mocks
7. **`lib/mocks/types.ts`**
   - Status: Minimal types, but no actual usage found
   - Evidence: Contains type definitions but grep shows no imports
   - Action: **DELETE** (if types aren't used - verify with TypeScript compilation first)

### ⚠️ Needs Review (1 file)

This file is exported but usage is unclear:

1. **`lib/mocks/normalize.ts`**
   - Status: Contains `normalizeCompany` function but usage unclear
   - Evidence:
     - File has implementation for `normalizeCompany`
     - No grep matches for `normalizeCompany` usage
     - Mentioned in `docs/references/deps.md` but not imported anywhere
   - Action: **REVIEW** - Check if used via dynamic import or test fixtures
   - Recommendation: If not used, **DELETE**

2. **`playwright.config.ts`**
   - Status: **KEEP** - Playwright config file (used by E2E tests)
   - Evidence:
     - `@playwright/test` is in dependencies
     - Used by E2E tests in `tests/e2e/`
     - Referenced in package.json scripts (`test:e2e`)
     - Config file consumed by Playwright CLI, not imported
   - Action: **KEEP** - Should be excluded from orphan checks (tooling convention file)

### ✅ Keep - False Positives (5 files)

These files are used but in ways the static analyzer doesn't detect:

#### Components (False Positives)
1. **`components/dashboard/corso-ai-mode.tsx`**
   - Status: **KEEP** - Used indirectly via barrel export
   - Evidence:
     - Exported from `components/dashboard/index.ts` barrel
     - Note in file: "Indirectly consumed via dashboard barrel; allowlisted in unused-exports"
     - Referenced in `vitest.config.ts` and `eslint.config.mjs`
   - Action: **KEEP** - Add to orphan audit allowlist/exclusions

2. **`components/dashboard/entity/shared/renderers/value-formatter.ts`**
   - Status: **KEEP** - Used by AG Grid column definitions
   - Evidence:
     - Exports `ValueCurrencyFormatter` and `DateEffectiveValueFormatter`
     - Used in `lib/services/entity/adapters/aggrid.ts` via imports
     - Note in file: "Indirectly consumed via AG Grid column definitions"
   - Action: **KEEP** - Add to orphan audit allowlist/exclusions

#### Config
3. **`config/domain-map.ts`**
   - Status: **KEEP** - Used by dependency-cruiser and architecture tooling
   - Evidence:
     - Referenced in `config/README.md` as architecture boundaries configuration
     - Used by dependency-cruiser to enforce domain boundaries
     - Not imported via TS imports but consumed by tooling
   - Action: **KEEP** - Add to orphan audit exclusions for architecture config files

#### Types
4. **`types/config/security/types.ts`**
   - Status: **KEEP** - Type augmentation/module declaration
   - Evidence:
     - Referenced in `config/typescript/tsconfig.base.json` path mapping
     - Used for TypeScript module augmentation
     - Referenced in import baseline policies
   - Action: **KEEP** - `.d.ts` files should be excluded from orphan checks or marked as type augmentation files

#### Tooling Config
5. **`playwright.config.ts`**
   - Status: **KEEP** - Playwright E2E test configuration
   - Evidence:
     - `@playwright/test` is in package.json dependencies
     - Used by E2E tests in `tests/e2e/`
     - Referenced in package.json scripts (`test:e2e`, `test:e2e:ui`, `test:e2e:install`)
     - Config file consumed by Playwright CLI, not imported via TS
   - Action: **KEEP** - Should be excluded from orphan checks (tooling convention file)

## Recommended Actions

### Phase 1: Immediate Cleanup (Safe Deletes)

Delete these 7 files and remove their barrel exports:

```bash
# Remove files
rm components/ui/molecules/empty-state.tsx
rm components/ui/organisms/layout-utils.ts
rm lib/server/streaming/ndjson.ts
rm lib/server/feature-flags/feature-flag-validator.ts
rm lib/server/performance/database-metrics.ts
rm lib/shared/utils/layout.ts
rm lib/mocks/types.ts  # After verifying TypeScript still compiles
```

**Also remove exports from barrels:**
- `lib/server/index.ts`: Remove exports for `ndjson`, `feature-flag-validator`, `database-metrics`
- Verify `components/ui/organisms/index.ts` already has removal note

### Phase 2: Review & Verify

1. **`lib/mocks/normalize.ts`**
   - Run TypeScript compilation to verify no type errors
   - Check if `normalizeCompany` is used in test fixtures or dynamic imports
   - If unused, delete

2. ~~**`playwright.config.ts`**~~ - **RESOLVED: KEEP** (Playwright is used for E2E tests)

### Phase 3: Update Orphan Audit Configuration

Update `scripts/audit/orphans.ts` to exclude/include:

```typescript
// Add to EXCLUDE_PATTERNS or CONFIG
const CONFIG = {
  // ... existing config
  EXCLUDE_PATTERNS: [
    // ... existing patterns
    /playwright\.config\./,           // Playwright E2E test config
    /^config\/domain-map\.ts$/,       // Architecture config (dependency-cruiser)
    /^types\/.*\.d\.ts$/,             // Type declarations (module augmentation)
  ],
  // Add KEEP patterns for indirect usage
  KEEP_INDIRECT_USAGE: [
    'components/dashboard/corso-ai-mode.tsx',        // Barrel export
    'components/dashboard/entity/shared/renderers/value-formatter.ts', // AG Grid usage
  ],
};
```

## Validation Steps

After deletions, run:

```bash
# Type checking
pnpm typecheck

# Build verification
pnpm build

# Test suite
pnpm test

# Linting
pnpm lint
```

## Notes

- Many files were already marked as "removed" in comments but not actually deleted
- Several files are still exported from barrels even though they're empty - need to clean up exports
- The orphan audit tool correctly identified these as unused, but some require manual verification for indirect usage patterns
- Type declaration files (`.d.ts`) should generally be excluded from orphan checks as they're consumed via TypeScript's module resolution, not imports

## Next Steps

1. Create PR with Phase 1 deletions
2. Run validation steps
3. Review Phase 2 candidates
4. Update orphan audit configuration to reduce false positives
5. Re-run orphan audit to verify cleaner results

