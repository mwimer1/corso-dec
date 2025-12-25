---
title: "Maintenance"
description: "Documentation and resources for documentation functionality. Located in maintenance/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
# Maintenance Suite Consolidation Summary

## Overview

This document summarizes the consolidation work completed as part of the Maintenance Suite Audit implementation. All P0 (critical) and P1 (important) tasks have been completed.

## Completed Consolidations

### 1. Dead Code Detection ✅

**Before**: Multiple overlapping tools
- `deadcode` (ts-prune)
- `lint:unused` (ts-prune with allowlist)
- `validate:dead-code` (knip)

**After**: Single canonical tool
- `validate:dead-code` (knip) - **Primary tool**
- `deadcode` - Deprecated, shows warning, calls knip
- `lint:unused` - Deprecated, shows warning, calls knip
- `deadcode:test-only` - Kept (specialized functionality)

**Benefits**:
- Single source of truth for dead code detection
- Reduced maintenance overhead
- Consistent results across all checks

### 2. Duplication Detection ✅

**Before**: Multiple overlapping commands
- `validate:dup` (custom wrapper script)
- `jscpd:report`, `jscpd:ci`, `jscpd:sarif`, etc. (multiple variants)

**After**: Unified approach
- `validate:duplication` - **Primary command** (uses `jscpd.config.json` config)
- `validate:dup` - Alias to `validate:duplication`
- Specialized `jscpd:*` commands remain for specific use cases:
  - `jscpd:ci` - CI-specific settings
  - `jscpd:report` - JSON report generation
  - `jscpd:sarif` - SARIF format for code scanning
  - `jscpd:docs` - Documentation-specific check
  - `jscpd:tests` - Test code duplication

**Benefits**:
- Standard validation uses consistent config
- Specialized commands available when needed
- Reduced confusion about which command to use

### 3. Cleanup Command Naming ✅

**Before**: Inconsistent naming patterns
- `cleanup:shared:trim:dry` / `cleanup:shared:trim:prune`
- `cleanup:styles:trim` / `cleanup:styles:purge`
- Mixed patterns across different cleanup types

**After**: Consistent pattern
- `cleanup:*:trim` - Dry-run (default, safe)
- `cleanup:*:trim:write` - Apply changes to barrel files
- `cleanup:*:purge` - Dry-run for file deletion
- `cleanup:*:purge:write` - Delete unused files

**Standardized Commands**:
- `cleanup:ui:trim` / `cleanup:ui:trim:write` / `cleanup:ui:trim:delete`
- `cleanup:shared:trim` / `cleanup:shared:trim:write` / `cleanup:shared:trim:delete`
- `cleanup:styles:trim` / `cleanup:styles:trim:write` / `cleanup:styles:purge` / `cleanup:styles:purge:write`
- `cleanup:atoms:trim` / `cleanup:atoms:trim:write` / `cleanup:atoms:purge:components`

**Benefits**:
- Predictable command names
- Clear safety defaults (dry-run)
- Easy to understand what each command does

## Migration Guide

### For Dead Code Detection

**Old**:
```bash
pnpm deadcode
pnpm lint:unused
```

**New**:
```bash
pnpm validate:dead-code  # Use this
```

### For Duplication Detection

**Old**:
```bash
pnpm validate:dup
```

**New**:
```bash
pnpm validate:duplication  # Preferred
# or
pnpm validate:dup  # Still works (alias)
```

### For Cleanup Commands

**Old**:
```bash
pnpm cleanup:shared:trim:dry
pnpm cleanup:shared:trim:prune
```

**New**:
```bash
pnpm cleanup:shared:trim          # Dry-run (default)
pnpm cleanup:shared:trim:write   # Apply changes
pnpm cleanup:shared:trim:delete   # Apply + delete files
```

## Remaining Specialized Commands

These commands remain unchanged as they serve specific purposes:

### Dead Code
- `deadcode:test-only` - Finds exports only used in tests
- `validate:dead-code:all` - Runs orphans + cycles checks (uses madge)

### Duplication
- `jscpd:ci` - CI-specific duplication check
- `jscpd:report` - Generate JSON report
- `jscpd:sarif` - Generate SARIF format
- `jscpd:docs` - Check documentation duplication
- `jscpd:tests` - Check test code duplication

## Next Steps

1. **Monitor Usage**: Track if deprecated commands are still being used
2. **Update Documentation**: Ensure all docs reference new command names
3. **CI Updates**: Verify CI pipelines use new commands
4. **Remove Deprecated**: After migration period, remove deprecated scripts

## Related Documentation

- [Maintenance Audit Implementation](./MAINTENANCE_AUDIT_IMPLEMENTATION.md)
- [Maintenance Standards](./MAINTENANCE_STANDARDS.md) (to be created)
