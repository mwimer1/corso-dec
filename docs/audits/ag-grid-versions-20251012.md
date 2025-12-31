---
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
last_updated: "2025-12-31"
category: "documentation"
status: "resolved"
---
# AG Grid Package & Module Version Audit (20251012)

## Executive Summary

**✅ RESOLVED (2025-01-28)**: The AG Grid module registration issue has been fixed. A client-only registration adapter (`lib/vendors/ag-grid.client.ts`) now properly registers `AllEnterpriseModule` before grid instantiation, resolving error #272: "No AG Grid modules are registered!".

**Original Issue**: Version mismatch between AG Grid packages causing runtime errors. `@ag-grid-enterprise/server-side-row-model` was at version 32.3.9 while all other AG Grid packages were at 34.2.0, resulting in the error: "ClientSideRowModel 34.2.0 vs other modules 32.3.9".

## Installed Packages (raw)
- See: `tmp/ag-grid-audit/installed.txt`
- JSON: `tmp/ag-grid-audit/installed.json`

## Duplicates / Conflicts

**CRITICAL VERSION CONFLICTS DETECTED:**

| Package | Specifier | Resolved | Status |
|---------|-----------|----------|--------|
| `@ag-grid-enterprise/server-side-row-model` | `^32.3.9` | `32.3.9` | ❌ CONFLICT |
| `ag-grid-community` | `^34.2.0` | `34.2.0` | ✅ OK |
| `ag-grid-enterprise` | `^34.2.0` | `34.2.0` | ✅ OK |
| `ag-grid-react` | `^34.2.0` | `34.2.0` | ✅ OK |

**Root Cause**: Mixed registration patterns with incompatible versions:
- Primary registration uses `AllCommunityModule` from `ag-grid-community@34.2.0`
- Secondary registration attempts to load `ServerSideRowModelModule` from `@ag-grid-enterprise/server-side-row-model@32.3.9`

## Import Sites
- See: `tmp/ag-grid-audit/imports.txt`

**Import Analysis:**
- ✅ **All imports use correct scoped packages** (`ag-grid-community`, `ag-grid-react`)
- ✅ **No mixed import families** (legacy `ag-grid-community` vs `@ag-grid-community/*`)
- ✅ **Consistent import patterns** across all files

**Files importing AG Grid:**
```
components/dashboard/entity/addresses/col-defs.ts
components/dashboard/entity/companies/col-defs.ts
components/dashboard/entity/entity-page-helpers.tsx
components/dashboard/entity/projects/col-defs.ts
components/dashboard/entity/shared/grid/ag-grid-modules.ts
components/dashboard/entity/shared/grid/entity-grid.tsx
components/dashboard/entity/shared/grid/fetchers.ts
components/dashboard/entity/shared/grid/types.ts
components/dashboard/entity/shared/renderers/cellRenderers.tsx
components/dashboard/entity/shared/renderers/value-formatter.ts
components/dashboard/entity/shared/renderers/value-getters.ts
components/dashboard/index.ts
components/dashboard/table/ag-grid-container.tsx
lib/services/entity/addresses/data.server.ts
lib/services/entity/companies/data.server.ts
lib/services/entity/projects/data.server.ts
lib/vendors/ag-grid/register-modules.ts
lib/vendors/ag-grid/register.ts
```

## Registration Calls
- See: `tmp/ag-grid-audit/registry-calls.txt`

**Registration Pattern Analysis:**

### Current Mixed Pattern (❌ PROBLEMATIC)
1. **Primary Registration** (`lib/vendors/ag-grid/register.ts:48`):
   ```typescript
   ModuleRegistry.registerModules([AllCommunityModule]);
   ```

2. **Secondary Registration** (`lib/vendors/ag-grid/register-modules.ts:10`):
   ```typescript
   ModuleRegistry.registerModules([ServerSideRowModelModule as unknown as any]);
   ```

**Issue**: The `ServerSideRowModelModule` is imported from `@ag-grid-enterprise/server-side-row-model@32.3.9`, which is incompatible with `AllCommunityModule` from `ag-grid-community@34.2.0`.

## Findings

### Version Families Detected (Current - 2025-01-28)
- **Community**: `ag-grid-community@34.3.1` ✅
- **Enterprise**: `ag-grid-enterprise@34.3.1` ✅
- **React bindings**: `ag-grid-react@34.3.1` ✅
- **Legacy Server-Side**: `@ag-grid-enterprise/server-side-row-model@32.3.9` ❌ (removed - no longer needed)

### Mixed Patterns (AllCommunityModule + per-module)
**CRITICAL ISSUE**: Files are using both `AllCommunityModule` registration AND per-module registration from incompatible versions:

- `lib/vendors/ag-grid/register.ts` imports `AllCommunityModule` from `ag-grid-community@34.2.0`
- `lib/vendors/ag-grid/register-modules.ts` tries to register `ServerSideRowModelModule` from `@ag-grid-enterprise/server-side-row-model@32.3.9`

This causes the runtime error when both modules are registered simultaneously.

## Recommendations

### Target Version Set
**UPDATE ALL PACKAGES TO 34.2.0** (highest minor version currently in use)

### Enforce with pnpm.overrides (root package.json)

```json
{
  "pnpm": {
    "overrides": {
      "@ag-grid-enterprise/server-side-row-model": "34.2.0",
      "ag-grid-community": "34.2.0",
      "ag-grid-enterprise": "34.2.0",
      "ag-grid-react": "34.2.0"
    }
  }
}
```

### Registration Pattern Standardization

**Choose ONE registration pattern:**

#### Option A: AllCommunityModule Only (Recommended)
**Pros**: Simpler, less prone to version conflicts
**Cons**: Larger bundle size

**Changes Required:**
1. **Remove** `lib/vendors/ag-grid/register-modules.ts` entirely
2. **Update** `lib/vendors/ag-grid/register.ts` to handle enterprise registration properly:
   ```typescript
   // Remove the try/catch for separate server-side package
   // In AG Grid v34+, ServerSideRowModelModule is included in AllEnterpriseModule
   ModuleRegistry.registerModules([mod.AllEnterpriseModule as unknown as any]);
   ```

#### Option B: Per-Module Registration Only
**Pros**: Smaller bundle size, more explicit
**Cons**: More complex, requires tracking which modules are needed

**Changes Required:**
1. **Remove** `AllCommunityModule` usage
2. **Update** registration to use only specific modules from v34.2.0:
   ```typescript
   import { ClientSideRowModelModule } from 'ag-grid-community';
   import { ServerSideRowModelModule } from 'ag-grid-enterprise';

   ModuleRegistry.registerModules([
     ClientSideRowModelModule,
     ServerSideRowModelModule,
     // ... other specific modules as needed
   ]);
   ```

## Action Plan

### Phase 1: Fix Version Conflicts (IMMEDIATE)
1. **Apply overrides** in root `package.json`:
   ```bash
   pnpm -w install && pnpm dedupe
   ```

2. **Remove problematic registration** in `lib/vendors/ag-grid/register-modules.ts`:
   ```typescript
   # Remove this file entirely or comment out the registration
   ```

3. **Update enterprise registration** in `lib/vendors/ag-grid/register.ts`:
   - Remove the try/catch block for separate server-side package
   - Use `AllEnterpriseModule` only (ServerSideRowModelModule is included)

### Phase 2: Standardize Registration Pattern
4. **Choose registration pattern** (recommend AllCommunityModule for simplicity)
5. **Update all call sites** to use the chosen pattern consistently
6. **Test thoroughly** - verify no runtime errors

### Phase 3: Long-term Maintenance
7. **Add ESLint rule** to prevent future mixed patterns:
   ```javascript
   // .eslintrc.cjs
   'no-restricted-imports': ['error', {
     paths: [
       { name: '@ag-grid-enterprise/server-side-row-model', message: 'Use ag-grid-enterprise instead - server-side functionality is included.' },
     ],
   }],
   ```

8. **Add CI check** to assert single version per AG Grid package

## Evidence Snippets

### Version Mismatch Evidence
```json
// pnpm-lock.yaml
"@ag-grid-enterprise/server-side-row-model": "32.3.9"
"ag-grid-community": "34.2.0"
"ag-grid-enterprise": "34.2.0"
"ag-grid-react": "34.2.0"
```

### Problematic Registration Pattern
```typescript
// lib/vendors/ag-grid/register-modules.ts
try {
  const { ServerSideRowModelModule } = require('@ag-grid-enterprise/server-side-row-model');
  ModuleRegistry.registerModules([ServerSideRowModelModule as unknown as any]);
} catch (e) {
  // Error handling that masks the version conflict
}
```

### Runtime Error Correlation
The error "ClientSideRowModel 34.2.0 vs other modules 32.3.9" directly correlates with:
- `AllCommunityModule` (includes `ClientSideRowModel`) from v34.2.0
- `ServerSideRowModelModule` from v32.3.9

## Risk Assessment

### Current Risk: HIGH
- **Runtime errors** occurring in production
- **User experience impact** when AG Grid fails to load
- **Data integrity** concerns if grid operations fail

### Post-Fix Risk: LOW
- **Version alignment** eliminates compatibility issues
- **Single registration pattern** prevents future conflicts
- **Proper error handling** provides graceful degradation

## Resolution (2025-01-28)

### Implementation
- ✅ Created `lib/vendors/ag-grid.client.ts` - Client-only module registration adapter
- ✅ Registers `AllEnterpriseModule` (includes `ServerSideRowModelModule` for SSRM)
- ✅ Sets license key from `NEXT_PUBLIC_AG_GRID_LICENSE_KEY` if provided
- ✅ Fails fast with clear error if Enterprise is disabled but SSRM is required
- ✅ Updated all component imports to use client adapter
- ✅ Updated legacy vendor file to re-export for backward compatibility
- ✅ Fixed test setup to set `NEXT_PUBLIC_AGGRID_ENTERPRISE=1` before module initialization

### Current Registration Pattern
```typescript
// lib/vendors/ag-grid.client.ts
'use client';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';

export function ensureAgGridRegistered(): void {
  // Registers all Enterprise modules (includes ServerSideRowModelModule)
  ModuleRegistry.registerModules([AllEnterpriseModule]);
}
```

### Files Updated
- `lib/vendors/ag-grid.client.ts` (new) - Client-only registration
- `lib/vendors/ag-grid.ts` - Legacy shim re-exports from client adapter
- `components/dashboard/entity/shared/grid/ag-grid-modules.ts` - Updated to use client adapter
- `components/dashboard/entity/shared/grid/entity-grid.tsx` - Updated imports
- `vitest.config.ts` - Sets environment variable before module initialization
- `tests/support/setup/vitest.setup.shared.ts` - Sets environment variable

### Removed Files
- ❌ `lib/vendors/ag-grid/register-modules.ts` - No longer exists (was problematic)
- ❌ `lib/vendors/ag-grid/register.ts` - No longer exists (replaced by client adapter)

## Success Criteria

- [x] **No version conflicts** in `pnpm-lock.yaml` - All packages at 34.3.1
- [x] **No runtime errors** related to AG Grid module registration
- [x] **Consistent registration pattern** - Single client-only adapter
- [x] **All AG Grid functionality** works correctly in dashboard entities
- [x] **Bundle size** - Using `AllEnterpriseModule` (acceptable for SSRM requirement)

## Related Issues

- ✅ **RESOLVED**: Runtime error #272: "No AG Grid modules are registered!"
- ✅ **RESOLVED**: Dashboard entity grids (projects, companies, addresses) now load properly
- ✅ **RESOLVED**: Server-side row model works correctly with Enterprise modules

---

**Report Generated**: 2025-10-12  
**Status**: ✅ RESOLVED (2025-01-28)  
**Resolution Commit**: `e90778e` - `fix(dashboard): implement AG Grid module registration to resolve error #272`
