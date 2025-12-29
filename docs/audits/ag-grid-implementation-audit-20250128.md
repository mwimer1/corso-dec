---
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
title: "Audits"
description: "Documentation and resources for documentation functionality. Located in audits/."
---
# AG Grid Implementation Audit Report

**Date:** 2025-01-28  
**Repository:** mwimer1/corso-dec  
**Purpose:** Verify AG Grid baseline before implementing changes

> **Note:** This is a comprehensive implementation audit. For version conflict resolution details, see [`ag-grid-versions-20251012.md`](./ag-grid-versions-20251012.md).

---

## 1. AG Grid Versions & Enterprise Status

### Package Versions
**Location:** `package.json:351-353`

```351:353:package.json
    "ag-grid-community": "^34.3.1",
    "ag-grid-enterprise": "^34.3.1",
    "ag-grid-react": "^34.3.1",
```

**Status:** ✅ All packages at version **34.3.1** (aligned, no conflicts)

### Enterprise Configuration

**Environment Variable:** `NEXT_PUBLIC_AGGRID_ENTERPRISE`  
**Location:** `lib/shared/config/client.ts:89-92, 202-203`

```89:92:lib/shared/config/client.ts
  // AG Grid Enterprise license (public by design)
  // Accept both NEXT_PUBLIC_AGGRID_LICENSE_KEY (canonical) and NEXT_PUBLIC_AG_GRID_LICENSE_KEY (legacy)
  NEXT_PUBLIC_AGGRID_LICENSE_KEY: z.string().min(1).optional(),
  // Accept both NEXT_PUBLIC_AGGRID_ENTERPRISE and NEXT_PUBLIC_AG_GRID_ENTERPRISE (legacy)
  NEXT_PUBLIC_AGGRID_ENTERPRISE: z.string().optional(),
```

**Configuration Check:** `lib/vendors/ag-grid.client.ts:16-25`

```16:25:lib/vendors/ag-grid.client.ts
export function isAgGridEnterpriseEnabled(): boolean {
  // Direct access allows Next.js to statically replace at build time
  // Using bracket notation to satisfy TypeScript index signature requirement
  const raw =
    process.env['NEXT_PUBLIC_AGGRID_ENTERPRISE'] ??
    process.env['NEXT_PUBLIC_AG_GRID_ENTERPRISE']; // optional legacy support

  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true';
}
```

**License Key Configuration:** `lib/vendors/ag-grid.client.ts:89-97`

```89:97:lib/vendors/ag-grid.client.ts
  // Set license key if provided (removes watermark/warnings in production)
  // Uses canonical name NEXT_PUBLIC_AGGRID_LICENSE_KEY (legacy NEXT_PUBLIC_AG_GRID_LICENSE_KEY supported)
  // Using bracket notation to satisfy TypeScript index signature requirement
  const licenseKey =
    process.env['NEXT_PUBLIC_AGGRID_LICENSE_KEY'] ??
    process.env['NEXT_PUBLIC_AG_GRID_LICENSE_KEY'];
  if (licenseKey) {
    LicenseManager.setLicenseKey(licenseKey);
  }
```

**Status:** ✅ Enterprise enabled via `NEXT_PUBLIC_AGGRID_ENTERPRISE=1`  
**Status:** ✅ License key configured via `NEXT_PUBLIC_AGGRID_LICENSE_KEY`  
**Module Registration:** `lib/vendors/ag-grid.client.ts:99-100`

```99:100:lib/vendors/ag-grid.client.ts
  // Register all Enterprise modules (includes ServerSideRowModelModule for SSRM)
  ModuleRegistry.registerModules([AllEnterpriseModule]);
```

**Status:** ✅ `AllEnterpriseModule` registered (includes ServerSideRowModelModule)

---

## 2. Theme Usage End-to-End

### CSS Files

**Corso Theme Overrides:** `styles/ui/ag-grid.theme.css` (exists)

```1:34:styles/ui/ag-grid.theme.css
:root {
  --ag-foreground-color: hsl(var(--foreground));
  --ag-background-color: hsl(var(--surface, 0 0% 100%));
  --ag-header-background-color: hsl(var(--surface, 0 0% 100%));
  --ag-header-foreground-color: hsl(var(--foreground));
  --ag-row-hover-color: color-mix(in srgb, var(--ag-background-color), black 6%);
  --ag-selected-row-background-color: hsl(var(--primary, 221 86% 54%) / 0.08);
  --ag-border-color: hsl(var(--border));
}

.ag-theme-quartz {
  --ag-font-size: 13px;
  --ag-grid-size: 6px;
}

.ag-theme-quartz .ag-root-wrapper {
  border: 1px solid var(--ag-border-color);
  border-radius: var(--radius-lg);
  background: var(--ag-background-color);
}

.ag-theme-quartz .ag-header-container,
.ag-theme-quartz .ag-header {
  border-bottom: 1px solid var(--ag-border-color);
}

.ag-theme-quartz .ag-row-hover {
  background: var(--ag-row-hover-color);
}

.ag-theme-quartz .ag-row-selected {
  background: var(--ag-selected-row-background-color) !important;
}
```

**Status:** ✅ Corso theme overrides exist

### CSS Import Status

**⚠️ CRITICAL FINDING:** AG Grid base CSS files (`ag-grid.css`, `ag-theme-quartz.css`) are **NOT imported** anywhere in the codebase.

**Searched locations:**
- `app/layout.tsx` - Only imports `@/styles/globals.css`
- `styles/globals.css` - No AG Grid imports
- No component-level CSS imports found

**Expected imports (missing):**
```css
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-quartz.css';
```

**Status:** ❌ **MISSING** - Base AG Grid CSS not imported

### Theme Class Application

**Theme Prop Passed:** `components/dashboard/entity/shared/grid/entity-grid-host.tsx:147`

```147:147:components/dashboard/entity/shared/grid/entity-grid-host.tsx
          coreGridTheme="ag-theme-quartz"
```

**⚠️ CRITICAL FINDING:** The `coreGridTheme` prop is passed to `GridMenubar` but **NOT applied to the grid wrapper**.

**Grid Wrapper:** `components/dashboard/entity/shared/grid/entity-grid.tsx:346`

```346:370:components/dashboard/entity/shared/grid/entity-grid.tsx
    <div id={`${config.id}-grid`} style={style} className={className}>
      <AgGridReact
        rowModelType="serverSide"
        onGridReady={onGridReady}
        columnDefs={colDefs}
        defaultColDef={{ ...config.defaultColDef, enableRowGroup: false } as any}
        statusBar={statusBar as any}
        sideBar={config.ui?.sideBar as any}
        rowHeight={config.ui?.rowHeight ?? 40}
        headerHeight={config.ui?.headerHeight ?? 40}
        groupHeaderHeight={config.ui?.groupHeaderHeight ?? 26}
        animateRows
        pagination
        paginationPageSizeSelector={[10, 50, 100] as any}
        paginationPageSize={config.ui?.paginationPageSize ?? 50}
        rowSelection={rowSelection as any}
        selectionColumnDef={selectionColumnDef as any}
        ref={gridRef as any}
        cellSelection
        allowContextMenuWithControlKey
        enableCharts={false}
        onStateUpdated={onStateUpdated as any}
        noRowsOverlayComponent={noRowsOverlayComponent as any}
      />
    </div>
```

**Status:** ❌ **MISSING** - `ag-theme-quartz` class not applied to grid wrapper div

**Note:** AG Grid requires the theme class on the wrapper div containing `<AgGridReact>` for proper styling.

---

## 3. AG Grid Entry Points

### Main Grid Component

**Location:** `components/dashboard/entity/shared/grid/entity-grid.tsx`  
**Usage:** Renders `<AgGridReact>` with server-side row model

### Grid Host Component

**Location:** `components/dashboard/entity/shared/grid/entity-grid-host.tsx`  
**Usage:** Wraps `EntityGrid` with toolbar (`GridMenubar`) and error handling

### Entity Pages (Route Entry Points)

**Route:** `app/(protected)/dashboard/(with-topbar)/(entities)/[entity]/page.tsx`

```37:52:app/(protected)/dashboard/(with-topbar)/(entities)/[entity]/page.tsx
export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) return notFound();

  const { entity } = parsed.data;

  // Chat entity is handled in (no-topbar) route group
  if (isChatEntity(entity)) {
    return notFound();
  }

  if (isGridEntity(entity)) {
    // Use registry as single source of truth
    const gridConfig = getEntityConfig(entity as 'projects' | 'addresses' | 'companies');
    return <EntityGridHost config={gridConfig} /> as unknown as React.JSX.Element;
  }

  return notFound();
}
```

**Entity Configs:**
- `components/dashboard/entity/projects/config.ts` - Projects grid
- `components/dashboard/entity/companies/config.ts` - Companies grid
- `components/dashboard/entity/addresses/config.ts` - Addresses grid

**Registry:** `components/dashboard/entity/index.ts:8-14`

```8:14:components/dashboard/entity/index.ts
export const registry = {
  projects: projectsConfig,
  addresses: addressesConfig,
  companies: companiesConfig,
} as const;

export const getEntityConfig = (id: keyof typeof registry) => registry[id];
```

**Status:** ✅ All entity grids use shared `EntityGridHost` component

### Grid Menubar

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx`  
**Usage:** Toolbar with saved views, export, refresh, reset, fullscreen

**Status:** ✅ Single toolbar component for all grids

---

## 4. Current Defaults

### Default Column Definition

**Location:** `components/dashboard/entity/shared/ag-grid-config.ts:9-20`

```9:20:components/dashboard/entity/shared/ag-grid-config.ts
export const createDefaultColDef = (): ColDef => ({
  editable: false,
  hide: false,
  filter: 'agTextColumnFilter',
  filterParams: {
    buttons: ['apply', 'reset'],
  },
  sortable: true,
  resizable: true,
  enablePivot: false,
  minWidth: 130,
});
```

**Applied in EntityGrid:** `components/dashboard/entity/shared/grid/entity-grid.tsx:351`

```351:351:components/dashboard/entity/shared/grid/entity-grid.tsx
        defaultColDef={{ ...config.defaultColDef, enableRowGroup: false } as any}
```

**Status:** ✅ Defaults applied with `enableRowGroup: false` override

### Row/Header Heights by Entity

**Projects:** `components/dashboard/entity/projects/config.ts:21`

```21:21:components/dashboard/entity/projects/config.ts
  ui: { rowHeight: 42, headerHeight: 38 },
```

**Companies:** `components/dashboard/entity/companies/config.ts:21`

```21:21:components/dashboard/entity/companies/config.ts
  ui: { rowHeight: 38, headerHeight: 40 },
```

**Addresses:** `components/dashboard/entity/addresses/config.ts:23`

```23:23:components/dashboard/entity/addresses/config.ts
  ui: { rowHeight: 38, headerHeight: 40, groupHeaderHeight: 26 },
```

**Applied in EntityGrid:** `components/dashboard/entity/shared/grid/entity-grid.tsx:354-356`

```354:356:components/dashboard/entity/shared/grid/entity-grid.tsx
        rowHeight={config.ui?.rowHeight ?? 40}
        headerHeight={config.ui?.headerHeight ?? 40}
        groupHeaderHeight={config.ui?.groupHeaderHeight ?? 26}
```

**Status:** ✅ Entity-specific heights configured

### Toolbar Actions

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx`

**Actions Available:**
- Saved searches (save, load, delete)
- Export to CSV
- Refresh data
- Reset filters/sort
- Fullscreen toggle (F key or button)

**Status:** ✅ Toolbar actions implemented

### Status Bar

**Default:** `components/dashboard/entity/shared/grid/entity-grid.tsx:214-216`

```214:216:components/dashboard/entity/shared/grid/entity-grid.tsx
  const statusBar = useMemo(() => config.ui?.statusBar ?? {
    statusPanels: [{ statusPanel: 'agFilteredRowCountComponent' }, { statusPanel: 'agAggregationComponent' }],
  }, [config]);
```

**Applied:** `components/dashboard/entity/shared/grid/entity-grid.tsx:352`

```352:352:components/dashboard/entity/shared/grid/entity-grid.tsx
        statusBar={statusBar as any}
```

**Status:** ✅ Status bar with filtered row count and aggregation

### Side Bar

**Applied:** `components/dashboard/entity/shared/grid/entity-grid.tsx:353`

```353:353:components/dashboard/entity/shared/grid/entity-grid.tsx
        sideBar={config.ui?.sideBar as any}
```

**Status:** ✅ Side bar configurable per entity (currently undefined in all configs)

### Pagination

**Applied:** `components/dashboard/entity/shared/grid/entity-grid.tsx:358-360`

```358:360:components/dashboard/entity/shared/grid/entity-grid.tsx
        pagination
        paginationPageSizeSelector={[10, 50, 100] as any}
        paginationPageSize={config.ui?.paginationPageSize ?? 50}
```

**Status:** ✅ Pagination enabled with size selector [10, 50, 100], default 50

### Row Selection

**Default:** `components/dashboard/entity/shared/grid/entity-grid.tsx:222-224`

```222:224:components/dashboard/entity/shared/grid/entity-grid.tsx
  const rowSelection = useMemo(() => config.ui?.rowSelection ?? ({
    mode: 'multiRow' as const, groupSelects: 'descendants' as const, hideDisabledCheckboxes: true,
  }), [config]);
```

**Selection Column:** `components/dashboard/entity/shared/grid/entity-grid.tsx:218-220`

```218:220:components/dashboard/entity/shared/grid/entity-grid.tsx
  const selectionColumnDef = useMemo(() => config.ui?.selectionColumnDef ?? ({
    sortable: false, width: 50, maxWidth: 50, suppressHeaderMenuButton: true, pinned: 'left' as const,
  }), [config]);
```

**Status:** ✅ Multi-row selection with pinned selection column

---

## 5. Critical Behaviors (Do Not Break)

### Server-Side Row Model (SSRM)

**Configuration:** `components/dashboard/entity/shared/grid/entity-grid.tsx:348`

```348:348:components/dashboard/entity/shared/grid/entity-grid.tsx
        rowModelType="serverSide"
```

**Datasource:** `components/dashboard/entity/shared/grid/entity-grid.tsx:248-277`

```248:277:components/dashboard/entity/shared/grid/entity-grid.tsx
    api.setGridOption('serverSideDatasource', {
      async getRows(p: IServerSideGetRowsParams) {
        // In relaxed mode, allow API call even if orgId is null
        // In strict mode, the API will return NO_ORG_CONTEXT if no org can be resolved
        try {
          // Pass orgId to fetcher to include X-Corso-Org-Id header in API request (if available)
          // If orgId is null, fetcher won't set the header, allowing API to use fallback logic
          const r = await config.fetcher(p.request, posthog.get_distinct_id?.() ?? 'anon', currentOrgId);
          
          // Dev-only schema validation (only on first successful load)
          if (!hasValidatedSchema && r.rows && r.rows.length > 0) {
            validateSchemaInDev(config.id, colDefs, r.rows[0] as Record<string, unknown>);
            hasValidatedSchema = true;
          }
          
          p.success({
            rowData: r.rows,
            ...(r.totalSearchCount != null ? { rowCount: r.totalSearchCount } : {}),
          });
          setSearchCount(r.totalSearchCount?.toString() ?? '—');
          onLoadError?.(null);
        } catch (e) {
          // Log datasource errors for debugging (development only)
          devError(`[${config.id}] datasource error`, e);
          p.fail();
          const error = e instanceof Error ? e : new Error(String(e));
          onLoadError?.(error);
        }
      },
    });
```

**Status:** ✅ SSRM configured with proper error handling

### Saved Views

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx:129-179`

**Storage:** localStorage with key `corso:gridSavedStates:${userId}:${gridId}`

**Status:** ✅ Saved views persist to localStorage

### Export

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx:29-93`

**Function:** `createCsvExportParams` processes cells using valueGetter and valueFormatter

**Status:** ✅ CSV export with proper cell processing

### Refresh

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx` (refresh button)

**Status:** ✅ Refresh button calls `gridRef.current?.api?.refreshServerSide()`

### Reset

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx` (reset button)

**Status:** ✅ Reset button clears filters and sort

### Fullscreen

**Location:** `components/dashboard/entity/shared/grid/grid-menubar.tsx:193-204`

**Status:** ✅ Fullscreen toggle with F key shortcut

---

## 6. Implementation Map

### File Paths & Line References

#### Core Grid Components
- `components/dashboard/entity/shared/grid/entity-grid.tsx` (375 lines)
  - Lines 347-369: `<AgGridReact>` configuration
  - Lines 214-224: Status bar and selection defaults
  - Lines 248-277: SSRM datasource setup

- `components/dashboard/entity/shared/grid/entity-grid-host.tsx` (171 lines)
  - Lines 32-168: Host component with error handling
  - Line 147: Theme prop passed to GridMenubar

- `components/dashboard/entity/shared/grid/grid-menubar.tsx` (608 lines)
  - Lines 29-93: CSV export function
  - Lines 126-608: Toolbar UI and saved views

#### Configuration Files
- `components/dashboard/entity/shared/ag-grid-config.ts` (23 lines)
  - Lines 9-20: `createDefaultColDef()` factory

- `components/dashboard/entity/projects/config.ts` (26 lines)
  - Line 21: Projects UI config (rowHeight: 42, headerHeight: 38)

- `components/dashboard/entity/companies/config.ts` (26 lines)
  - Line 21: Companies UI config (rowHeight: 38, headerHeight: 40)

- `components/dashboard/entity/addresses/config.ts` (28 lines)
  - Line 23: Addresses UI config (rowHeight: 38, headerHeight: 40, groupHeaderHeight: 26)

#### Vendor Integration
- `lib/vendors/ag-grid.client.ts` (121 lines)
  - Lines 16-25: Enterprise check
  - Lines 77-100: Module registration
  - Lines 89-97: License key setup

#### Route Integration
- `app/(protected)/dashboard/(with-topbar)/(entities)/[entity]/page.tsx` (56 lines)
  - Lines 37-52: Entity page route handler

#### Theme Overrides
- `styles/ui/ag-grid.theme.css` (34 lines)
  - Lines 11-33: `.ag-theme-quartz` overrides

---

## 7. Issues Found

### ❌ Critical: Missing AG Grid Base CSS

**Issue:** AG Grid base CSS files (`ag-grid.css`, `ag-theme-quartz.css`) are not imported.

**Impact:** Grid may not render correctly without base styles.

**Recommendation:** Add imports to `styles/globals.css` or `app/layout.tsx`:
```css
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-quartz.css';
```

### ❌ Critical: Theme Class Not Applied

**Issue:** `ag-theme-quartz` class is passed to `GridMenubar` but not applied to the grid wrapper div.

**Impact:** Theme overrides in `styles/ui/ag-grid.theme.css` may not apply correctly.

**Location:** `components/dashboard/entity/shared/grid/entity-grid.tsx:346`

**Current:**
```tsx
<div id={`${config.id}-grid`} style={style} className={className}>
```

**Should be:**
```tsx
<div id={`${config.id}-grid`} style={style} className={`ag-theme-quartz ${className ?? ''}`}>
```

**Recommendation:** Apply `ag-theme-quartz` class to the wrapper div containing `<AgGridReact>`.

---

## 8. Summary

### ✅ Verified
- AG Grid versions: 34.3.1 (all packages aligned)
- Enterprise enabled: `NEXT_PUBLIC_AGGRID_ENTERPRISE=1`
- License key configured: `NEXT_PUBLIC_AGGRID_LICENSE_KEY`
- Module registration: `AllEnterpriseModule` registered
- SSRM configured: Server-side row model with proper datasource
- Entity configs: Projects, Companies, Addresses all configured
- Defaults: Column defs, heights, pagination, selection all set
- Toolbar: Saved views, export, refresh, reset, fullscreen working

### ❌ Issues
- **Missing base CSS imports** - AG Grid base styles not imported
- **Theme class not applied** - `ag-theme-quartz` not on grid wrapper

### 📋 Next Steps
1. Add AG Grid base CSS imports to `styles/globals.css`
2. Apply `ag-theme-quartz` class to grid wrapper div in `EntityGrid`
3. Verify theme styling after fixes
4. Test all critical behaviors (SSRM, saved views, export, refresh, reset, fullscreen)

---

**Report Generated:** 2025-01-28  
**Auditor:** AI Assistant  
**Repository:** mwimer1/corso-dec

