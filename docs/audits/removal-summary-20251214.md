---
title: "Audits"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# Production Files Removal Summary

> **ARCHIVED:** Completed on 2025-12-14. Kept for historical context.

**Date**: 2025-12-14  
**Scope**: Removal of unused barrel files from production codebase

## Files Removed ✅

### 1. `lib/auth/index.ts`

**Reason**: No production runtime code imported from this barrel. All production code uses:
- `@/lib/auth/server` for server-side auth
- `@/lib/auth/client` for client-side auth utilities
- Direct imports from specific auth modules

**Impact**: None - code already uses direct paths

**Config Updates**:
- ✅ Updated `vitest.config.ts` - Changed alias to specific paths
- ✅ Updated `tsconfig.base.json` - Removed barrel path mapping

---

### 2. `lib/marketing/index.ts`

**Reason**: Production code bypasses the barrel, importing directly from:
- `@/lib/marketing/client` (for ROI calculator, use cases)
- `@/lib/marketing/server` (for insights data fetching)

**Impact**: None - code already uses direct paths

**Config Updates**:
- ✅ Updated `scripts/audit/orphans.allowlist.json` - Removed from allowlist

---

## Verification

✅ **Typecheck**: Passes  
✅ **Linting**: No errors  
✅ **Production Code**: No import updates needed (already uses direct paths)  
✅ **Tests**: No test files import from removed barrels

## Summary

- **Files Removed**: 2 production barrel files
- **Lines Removed**: ~30 lines of unused barrel exports
- **Breaking Changes**: None (code already uses direct imports)
- **Risk Level**: Low (verified unused in production)

---

**Last Updated**: 2025-12-14
