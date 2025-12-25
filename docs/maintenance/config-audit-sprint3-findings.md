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

**Status**: ⚠️ **EQUIVALENT MISSING** - Rule intent not currently enforced

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

**Current State**:
- ❌ No equivalent rule exists in `eslint.config.mjs`
- ✅ Cache utilities are exported from `lib/shared/index.ts` barrel:
  ```typescript
  export * from './cache/lru-cache';
  export * from './cache/simple-cache';
  ```
- ⚠️ Direct imports still occur:
  - `lib/shared/feature-flags/core.ts` → `@/lib/shared/cache/simple-cache`
  - `lib/shared/errors/reporting.ts` → `@/lib/shared/cache/lru-cache`

**Recommendation**:
- **Option A**: Add equivalent rule to `eslint.config.mjs` to enforce barrel exports
- **Option B**: Refactor direct imports to use barrel exports (`@/lib/shared`)
- **Option C**: Document as intentional deviation if direct imports are preferred

**Priority**: Medium (code consistency improvement, not critical)

---

## Summary

### Completed Actions
- ✅ Removed references to non-existent `config/marketing/links.ts`
- ✅ Removed references to non-existent `config/codemod-imports.toml`
- ✅ Updated `config/README.md` to reflect actual file structure

### Remaining Items
- ⚠️ Legacy ESLint rule `cache-exports-prevention` has no equivalent
- 📋 Decision needed: Re-implement rule or document intentional deviation

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

