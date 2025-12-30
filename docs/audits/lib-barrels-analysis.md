---
title: "Audits"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "draft"
---
# Lib Barrels Production Usage Analysis

**Date**: 2025-12-14  
**Goal**: Identify which lib barrel files are actually used in production runtime code and can potentially be removed.

## Files Already Removed ✅

These files do not exist (already cleaned up):
- ❌ `lib/api/server/index.ts` - **Does not exist**
- ❌ `lib/config/index.ts` - **Does not exist**
- ❌ `lib/server/config/index.ts` - **Does not exist**
- ❌ `lib/server/dashboard/index.ts` - **Does not exist**
- ❌ `lib/server/errors/index.ts` - **Does not exist**
- ❌ `lib/server/security/index.ts` - **Does not exist**

## Files Requiring Analysis

### 1. `lib/auth/index.ts` ⚠️ POTENTIALLY UNUSED

**Status**: Exists, exports client-safe auth utilities

**Production Usage**:
- ✅ **App code**: NO imports found in `app/` directory
- ✅ **Components**: NO imports found in `components/` directory
- ⚠️ **Only used by**: `lib/core/index.ts` (barrel-to-barrel import)

**Exports**:
- `clerk-appearance` config
- `client` utilities (client-safe)
- `authorization/roles` (RBAC helpers)

**Analysis**:
- The barrel exists to provide a client-safe auth surface
- However, production code uses `@/lib/auth/server` or `@clerk/nextjs/server` directly
- The barrel appears to be unused in actual runtime production code
- Only `lib/core/index.ts` imports from it (which itself may be analyzing)

**Recommendation**: **SAFE TO REMOVE** if we verify `lib/core/index.ts` doesn't need it, or if we update `lib/core/index.ts` to import directly.

**Risk**: Low - no production code depends on it.

---

### 2. `lib/marketing/index.ts` ✅ SAFE TO REMOVE

**Status**: Exists, exports client-safe marketing utilities

**Production Usage**:
- ✅ **Verified**: Production code imports directly from `@/lib/marketing/client` or `@/lib/marketing/server`
- ✅ **Examples**:
  - `components/landing/sections/roi/roi-calculator.tsx` uses `@/lib/marketing/client`
  - `components/landing/sections/use-cases/use-cases.data.ts` uses `@/lib/marketing/client`
  - `app/(marketing)/insights/*` uses `@/lib/marketing/server`

**Exports** (unused):
- ROI calculator utilities (`calcRoi`, `clamp`) - **Used via `/client` directly**
- Use case types (`UseCase`, `UseCaseKey`) - **Used via `/client` directly**

**Analysis**:
- The barrel re-exports from `./client` but production code bypasses it
- No actual runtime production code imports from the barrel
- All imports use `/client` or `/server` paths directly

**Recommendation**: **✅ SAFE TO REMOVE** - Production code already uses direct paths.

**Risk**: None - code already uses direct imports.

---

### 3. `lib/server/index.ts` ✅ KEEP

**Status**: Main server-only barrel, actively used

**Production Usage**: Yes - server-only utilities exported here

**Recommendation**: **KEEP** - This is the main server barrel.

---

### 4. `lib/core/index.ts` ✅ KEEP

**Status**: Client-safe core barrel, architectural component

**Production Usage**: Yes - widely used

**Recommendation**: **KEEP** - This is an architectural component (client-safe barrel).

---

## Summary & Recommendations

### Files Safe to Remove

1. **`lib/auth/index.ts`** ⚠️
   - **Status**: No production app/component code imports it
   - **Action**: Remove after verifying `lib/core/index.ts` doesn't need it
   - **Risk**: Low

2. **`lib/marketing/index.ts`** ⚠️
   - **Status**: No production code imports it (uses `/server` directly)
   - **Action**: Remove after verifying ROI calculator utilities are unused
   - **Risk**: Low (but verify ROI calc usage)

### Files to Keep

- ✅ `lib/server/index.ts` - Main server barrel, actively used
- ✅ `lib/core/index.ts` - Client-safe architectural component

## Next Steps

1. Verify ROI calculator usage:
   ```bash
   rg "calcRoi|clamp" --type ts --type tsx
   ```

2. Check what `lib/core/index.ts` actually exports and if it needs `lib/auth/index.ts`:
   ```bash
   cat lib/core/index.ts
   ```

3. If safe, remove the barrels:
   - Delete `lib/auth/index.ts`
   - Delete `lib/marketing/index.ts`
   - Update any test references
   - Run validation: `pnpm typecheck && pnpm lint && pnpm test`

---

## ✅ Completed Actions (2025-12-14)

1. ✅ **Removed `lib/auth/index.ts`** - No production code imported from it
2. ✅ **Removed `lib/marketing/index.ts`** - Production code uses `/client` and `/server` directly
3. ✅ **Updated `vitest.config.ts`** - Changed `@/lib/auth` alias to point to specific paths
4. ✅ **Updated `tsconfig.base.json`** - Removed `@/lib/auth` barrel path mapping
5. ✅ **Updated `scripts/audit/orphans.allowlist.json`** - Removed `lib/marketing/index.ts`
6. ✅ **Verified**: Typecheck passes after removal

**Result**: Both unused barrels successfully removed. No production code needed updates since all imports already used direct paths.

---

**Last Updated**: 2025-12-14
