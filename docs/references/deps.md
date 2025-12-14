---
title: References
description: >-
  Documentation and resources for documentation functionality. Located in
  references/.
last_updated: '2025-12-14'
category: documentation
status: draft
---
# Dependency Health & Audit Process

> **Comprehensive dependency management system** for preventing circular dependencies, identifying unused code, and maintaining clean import graphs.

## 📋 Quick Reference

**Core Validation Commands:**
- `pnpm validate:cycles` - Check for circular dependencies (production code only)
- `pnpm validate:orphans` - Identify unused files with improved accuracy
- `pnpm validate:ts-unused` - Find unused TypeScript exports
- `pnpm validate:dead-code:all` - Run all dependency validations
- `pnpm validate:dead-code:ci` - CI-ready validation pipeline

**Snapshot Commands (local only):**
- `pnpm deps:snapshot:cycles` - Generate cycles.json baseline
- `pnpm deps:snapshot:orphans` - Generate orphans.json baseline

**CI Integration:**
- Dependency validation runs in `ci.yml` quality job
- Fails on circular dependencies or validation errors
- Generates `.agent/deps/` artifacts for traceability

## 📑 Table of Contents

- [Overview](#overview)
- [Validation Commands](#validation-commands)
- [Dependency Policies](#dependency-policies)
- [ESLint Guards](#eslint-guards)
- [CI Integration](#ci-integration)
- [Cleanup Process](#cleanup-process)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

---

## Overview

The dependency health system uses [madge](https://github.com/pahen/madge) and [ts-unused-exports](https://github.com/pzavolinsky/ts-unused-exports) to:

- **Prevent Circular Dependencies**: Runtime-blocking import cycles that cause undefined exports and bundler issues
- **Identify Unused Code**: Dead exports and files that increase bundle size and maintenance burden
- **Maintain Clean Architecture**: Enforce domain boundaries and proper import patterns

### Key Principles

1. **Zero Tolerance for Cycles**: All circular dependencies must be resolved before merging
2. **Progressive Cleanup**: Remove unused code in controlled batches with verification
3. **Accurate Detection**: Exclude known false positives (mocks, .d.ts files) from scans
4. **CI Enforcement**: Automated validation prevents regressions

---

## Validation Commands

### Core Validations

#### `validate:cycles`
```bash
pnpm validate:cycles
# Excludes lib/mocks/ (dev-only) to focus on production cycles
# Returns exit code 1 if cycles found
```

**What it does:**
- Scans production code for circular import dependencies
- Excludes `lib/mocks/` directory (dev/test utilities)
- Fails CI if cycles detected

**Expected output:**
```
✔ No circular dependency found!
```

#### `validate:orphans`
```bash
pnpm validate:orphans
# Includes app/ directory, excludes .d.ts and mocks
# More accurate than basic scan
```

**What it does:**
- Identifies files not imported by any other scanned file
- Includes `app/` directory for complete picture
- Excludes `.d.ts` files and `lib/mocks/` (known false positives)

**Expected output:**
```
actions/index.ts
app/(auth)/error.tsx
components/dashboard/entity/shared/dynamic-grid-renderer.tsx
# ... legitimate orphans only
```

#### `validate:ts-unused`
```bash
pnpm validate:ts-unused
# Finds unused TypeScript exports across all files
```

**What it does:**
- Analyzes all TypeScript files for unused named exports
- Reports functions, types, and variables that aren't imported anywhere

**Expected output:**
```
307 modules with unused exports
lib/mocks/normalize.ts: normalizeProject
components/dashboard/entity/entity-copy.ts: ENTITY_COPY
# ... actionable unused exports
```

#### `validate:dead-code:all`
```bash
pnpm validate:dead-code:all
# Runs all validations in sequence
# Used in CI pipeline
```

**What it does:**
- Runs `validate:orphans && validate:cycles && validate:ts-unused`
- Fails if any validation fails
- Provides comprehensive dependency health report

### Snapshot Commands (Local Development)

#### `deps:snapshot:cycles`
```bash
pnpm deps:snapshot:cycles
# Generates .agent/deps/cycles.json baseline
```

**What it does:**
- Creates JSON snapshot of current circular dependencies
- Useful for tracking improvements over time
- Stored in `.agent/deps/cycles.json`

#### `deps:snapshot:orphans`
```bash
pnpm deps:snapshot:orphans
# Generates .agent/deps/orphans.json baseline
```

**What it does:**
- Creates JSON snapshot of current orphan analysis
- Useful for comparing before/after cleanup
- Stored in `.agent/deps/orphans.json`

---

## Dependency Policies

### Circular Dependencies

**🚫 Zero Tolerance Policy:**
- All circular dependencies must be resolved before merging
- Production code (excluding `lib/mocks/`) must have 0 cycles
- CI fails on any detected cycles

**Common Causes:**
1. **Barrel Re-exports**: Domain barrel exports file that imports the barrel
2. **Cross-Domain Cycles**: A imports B, B imports A
3. **Type-Only Cycles**: Type definitions creating import cycles

**Resolution Strategies:**
1. **Extract Shared Types**: Move common interfaces to separate `contracts.ts` file
2. **Dynamic Imports**: Use `await import()` for runtime-only dependencies
3. **Relative Imports**: Use `./file` instead of domain barrel within same domain

### Orphaned Files

**🎯 Accuracy First:**
- Orphans scan includes `app/` directory for complete picture
- Excludes known false positives: `.d.ts` files, `lib/mocks/`
- Focus on files that are genuinely unused, not just unimported in scan scope

**Verification Before Removal:**
1. Check if file appears in any `import`/`require` statements
2. Verify no dynamic imports reference the file
3. Confirm no re-exports in barrel files
4. Run typecheck and tests after removal

### Unused Exports

**📊 Data-Driven Cleanup:**
- `ts-unused-exports` provides comprehensive analysis
- Focus on `lib/**` first (core business logic)
- Remove in small batches with verification
- Establish allowlist for intentionally exported items

**Safe Removal Process:**
1. Identify unused exports in targeted domain
2. Verify no external imports (grep across codebase)
3. Remove exports in small, related batches
4. Run typecheck + tests after each batch
5. Commit with descriptive messages

---

## ESLint Guards

### Barrel Import Prevention

**🚫 Entity Domain Guard:**
```typescript
// In eslint.config.mjs
{
  files: ["components/dashboard/entity/**"],
  rules: {
    "no-restricted-imports": ["error", {
      "patterns": ["@/lib/dashboard/entity"]
    }]
  }
}
```

**What it prevents:**
- Importing `@/lib/dashboard/entity` from within `components/dashboard/entity/`
- Creates circular dependencies through barrel re-exports

**Allowed patterns:**
- Relative imports: `../actions`, `./loader`
- Domain barrels from other domains: `@/lib/shared/*`

### Additional Guards

**📋 Import Pattern Enforcement:**
- Prevents deep relative imports (`../../lib/*`)
- Blocks legacy alias usage (`@shared/*`)
- Enforces domain boundaries for security modules

---

## CI Integration

### Quality Job Integration

**Location:** `.github/workflows/ci.yml` - `quality` job

```yaml
- name: 'Guard: Dependency health (cycles, orphans, unused exports)'
  run: pnpm validate:dead-code:ci
```

**What happens:**
1. Runs after typecheck and linting
2. Fails PR if cycles or validation errors found
3. Provides clear error messages for debugging
4. Generates artifacts for audit trail

### Artifact Generation

**📁 `.agent/deps/` Directory:**
- `cycles.json` - Current circular dependency state
- `orphans.json` - Current orphan analysis (optional)
- Generated on each CI run for traceability

---

## Cleanup Process

### Phase 1: Fix Cycles (Blocking)
1. **Identify**: Run `pnpm validate:cycles` to find cycles
2. **Analyze**: Determine if barrel, cross-domain, or type-only cycle
3. **Resolve**: Use contracts.ts, dynamic imports, or restructuring
4. **Verify**: Ensure `validate:cycles` passes

### Phase 2: Remove High-Confidence Orphans
1. **Identify**: Run `pnpm validate:orphans` for accurate list
2. **Verify**: Check each file for actual usage (not just scan scope)
3. **Remove**: Use `git rm` for tracked deletions
4. **Test**: Run typecheck + tests after each removal

### Phase 3: Clean Unused Exports
1. **Scope**: Focus on `lib/**` first, then `components/**`
2. **Batch**: Remove 5-10 related exports per commit
3. **Verify**: Typecheck + tests after each batch
4. **Document**: Use conventional commit messages

### Phase 4: Establish Allowlist
1. **Identify**: Items that should remain exported (future use, API surface)
2. **Document**: Create `scripts/ts-unused-exports.ignore` or config
3. **Maintain**: Update as codebase evolves

---

## Troubleshooting

### Common Issues

#### "Found X circular dependencies" in CI
**Cause:** New code introduced cycles
**Solution:**
1. Run `pnpm validate:cycles` locally to see details
2. Identify the cycle pattern (barrel, cross-domain, type-only)
3. Apply appropriate resolution strategy
4. Test with `pnpm validate:cycles` before pushing

#### "High number of orphans reported"
**Cause:** Scan scope doesn't include all consumers
**Solution:**
- Current scan includes `app/` and excludes known false positives
- If still too many, verify each orphan manually before removal
- Consider if file should be in different location or have different export pattern

#### "Unused exports in barrel files"
**Cause:** Re-exported items not used by consumers
**Solution:**
1. Check if consumers actually need the export
2. Remove unused re-exports from barrel
3. Consider if item should be exported differently

### Debug Commands

```bash
# Debug specific cycles
pnpm dlx madge --circular --ts-config tsconfig.json --extensions ts,tsx lib/dashboard/entity

# Debug specific orphans
pnpm dlx madge --orphans --ts-config tsconfig.json --extensions ts,tsx components/dashboard/table

# Check if file is actually used
rg -n "import.*filename" --type ts --type tsx

# Find all references to export
rg -n "ExportName" --type ts --type tsx
```

---

## Related Documentation

- [Component Architecture](../../codebase-apis/codebase-structure.md) - Domain boundaries and import patterns
- [Development Workflow](../../development/workflow.md) - Contribution guidelines including dependency management
- [Testing Strategy](../../testing-quality/testing-strategy.md) - Testing patterns for dependency changes
- [Bundle Analysis](../../development/bundle-analysis.md) - Bundle size impact of dependency cleanup

## 🏷️ Tags

`#development` `#dependencies` `#audit` `#ci` `#quality-gates` `#dead-code` `#circular-dependencies`

---

*Last updated: 2025-01-16 | Maintained by: dev-team@corso*
