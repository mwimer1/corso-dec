"use client";

// AG Grid registration is handled via registerAgGridModules() below.
import { ensureAgGridReadyFor } from '@/lib/vendors/ag-grid';
import type { GridApi, GridReadyEvent, IServerSideGetRowsParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { registerAgGridModules } from './ag-grid-modules';
import type { EntityGridProps } from '@/types/dashboard';
// PostHog removed — no-op helper kept inline (no external dependency)
type _PosthogLite = {
  get_distinct_id?: () => string;
  capture?: (...args: any[]) => void;
};
const _posthogHook: () => _PosthogLite = () => ({
  get_distinct_id: () => 'anon',
  capture: () => {},
});

registerAgGridModules();

export default function EntityGrid({
  config, gridRef, setSearchCount, onStateUpdated, onLoadError, className, style,
}: EntityGridProps) {
  const [, setGridApi] = useState<GridApi | null>(null);
  const [ready, setReady] = useState(false);
  const [colDefs, setColDefs] = useState<any[]>([]);
  const posthog = _posthogHook();
  const searchParams = useSearchParams();
  const gridName = searchParams.get('gridName');
  const defaultGridName = searchParams.get('defaultGridName');

  // Ensure AG Grid modules are registered before mounting
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Resolve column definitions asynchronously
        const defs = await config.colDefs();
        if (!alive) return;

        // Ensure AG Grid is ready
        await ensureAgGridReadyFor("serverSide");
        if (alive) {
          setColDefs(defs);
          setReady(true);
        }
      } catch (e) {
        // Log error for debugging (development only)
        // In production, errors are handled by error boundaries
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.error('[EntityGrid] Failed to initialize', e);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [config]);

  const statusBar = useMemo(() => config.ui?.statusBar ?? {
    statusPanels: [{ statusPanel: 'agFilteredRowCountComponent' }, { statusPanel: 'agAggregationComponent' }],
  }, [config]);

  const selectionColumnDef = useMemo(() => config.ui?.selectionColumnDef ?? ({
    sortable: false, width: 50, maxWidth: 50, suppressHeaderMenuButton: true, pinned: 'left' as const,
  }), [config]);

  const rowSelection = useMemo(() => config.ui?.rowSelection ?? ({
    mode: 'multiRow' as const, groupSelects: 'descendants' as const, hideDisabledCheckboxes: true,
  }), [config]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.setGridOption('serverSideDatasource', {
      async getRows(p: IServerSideGetRowsParams) {
        try {
          const r = await config.fetcher(p.request, posthog.get_distinct_id?.() ?? 'anon');
          (params as any).success({ rowData: r.rows, rowCount: undefined });
          setSearchCount(r.totalSearchCount?.toString() ?? '—');
          onLoadError?.(false);
        } catch (e) {
          // Log datasource errors for debugging (development only)
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.error(`[${config.id}] datasource error`, e);
          }
          (params as any).fail();
          onLoadError?.(true);
        }
      },
    });
    params.api.sizeColumnsToFit();
    if (!(gridName || defaultGridName)) {
      params.api.applyColumnState({ state: config.defaultSortModel });
    }
  }, [config, posthog, gridName, defaultGridName, setSearchCount, onLoadError]);

  // Show loading state while AG Grid is initializing
  if (!ready) {
    return (
      <div id={`${config.id}-grid-loading`} style={style} className={className}>
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Loading grid...
        </div>
      </div>
    );
  }

  return (
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
      />
    </div>
  );
}


