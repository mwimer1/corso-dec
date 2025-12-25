---
title: "Config Audit Sprint 3 - Triage Findings"
description: "Findings from triaging orphaned config references and legacy ESLint rules"
last_updated: "2025-01-16"
category: "maintenance"
status: "complete"
---

# Config Audit Sprint 3 - Triage Findings

## Overview

This document summarizes findings from Sprint Batch 3, which triaged orphaned config references and legacy ESLint rule intent.

## Findings

### 1. `config/marketing/links.ts` - File Does Not Exist

**Status**: ✅ **DOCUMENTATION ONLY** - File never existed, only mentioned in docs

**Investigation**:
- File `config/marketing/links.ts` does not exist in the repository
- Directory `config/marketing/` does not exist
- Referenced in `config/README.md` but file was never created

**Actual Implementation**:
- Marketing links are defined in `lib/shared/constants/links.ts`
- Navigation links are in `components/ui/organisms/navbar/links.ts`
- No separate marketing-specific config file exists

**Action Taken**:
- ✅ Removed references from `config/README.md`
- ✅ Documentation now reflects actual file structure

---

### 2. `config/codemod-imports.toml` - File Does Not Exist

**Status**: ✅ **DOCUMENTATION ONLY** - File never existed, only mentioned in docs

**Investigation**:
- File `config/codemod-imports.toml` does not exist in the repository
- Referenced in `config/README.md` as "Deprecated import mappings (historical reference)"
- No actual codemod configuration file exists

**Action Taken**:
- ✅ Removed references from `config/README.md`
- ✅ Documentation now reflects actual file structure

---

### 3. Legacy ESLint Rule: `cache-exports-prevention`

**Status**: ✅ **CLOSED** - Rule re-implemented and enforced

**Original Rule Intent**:
The legacy rule `config/eslint/cache-exports-prevention.json` enforced:
- **Prevent direct imports** from cache utility modules
- **Force barrel exports** via `@/lib/shared/cache` barrel
- **Maintain consistent usage patterns** and prevent unused export warnings

**Rule Configuration** (from git history):
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": [
              "@/lib/shared/cache/config-loader",
              "@/lib/shared/cache/lru-cache",
              "@/lib/shared/cache/simple-cache"
            ],
            "message": "Import cache utilities from the barrel export '@/lib/shared/cache' instead of individual modules..."
          }
        ]
      }
    ]
  }
}
```

**Action Taken**:
- ✅ Created `lib/shared/cache/index.ts` barrel file exporting both cache modules
- ✅ Added ESLint rule to `eslint.config.mjs` enforcing barrel imports (Policy A)
- ✅ Fixed all existing violations:
  - `lib/shared/feature-flags/core.ts` → now uses `@/lib/shared/cache`
  - `lib/shared/errors/reporting.ts` → now uses `@/lib/shared/cache`
- ✅ Verified no violations remain via grep
- ✅ All validation passes (typecheck, lint, test)

**Current State**:
- ✅ Equivalent rule exists in `eslint.config.mjs` (no-restricted-imports patterns)
- ✅ Cache utilities are exported from `lib/shared/cache/index.ts` barrel:
  ```typescript
  export * from './lru-cache';
  export * from './simple-cache';
  ```
- ✅ All imports now use the canonical barrel `@/lib/shared/cache`

**Canonical Import Surface**: `@/lib/shared/cache`

---

## Summary

### Completed Actions
- ✅ Removed references to non-existent `config/marketing/links.ts`
- ✅ Removed references to non-existent `config/codemod-imports.toml`
- ✅ Updated `config/README.md` to reflect actual file structure
- ✅ Re-implemented ESLint rule `cache-exports-prevention` with Policy A enforcement
- ✅ Created `lib/shared/cache/index.ts` barrel file
- ✅ Fixed all existing cache import violations

### Remaining Items
- ✅ All items completed

### Impact
- **Documentation**: Now accurately reflects actual config structure
- **Code Quality**: Identified missing enforcement for cache utility imports
- **Maintenance**: Reduced confusion from references to non-existent files

---

## Related Documentation

- [Config README](../../config/README.md) - Updated config documentation
- [Remaining Action Items](./REMAINING_ACTION_ITEMS.md) - Maintenance backlog
- [ESLint Configuration](../../eslint.config.mjs) - Current ESLint rules

---

_Last updated: 2025-01-16_

