"use client";

// AG Grid registration is handled in the useEffect hook via ensureAgGridReadyFor().
// This ensures registration happens client-side after mount when environment variables are available.
import { ensureAgGridReadyFor, isAgGridEnterpriseEnabled } from '@/lib/vendors/ag-grid.client';
import type { EntityGridProps } from '@/types/dashboard';
import type { GridApi, GridReadyEvent, IServerSideGetRowsParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
// PostHog removed — no-op helper kept inline (no external dependency)
type _PosthogLite = {
  get_distinct_id?: () => string;
  capture?: (...args: any[]) => void;
};
const _posthogHook: () => _PosthogLite = () => ({
  get_distinct_id: () => 'anon',
  capture: () => {},
});

/**
 * Error display component for AG Grid Enterprise configuration issues.
 */
function AgGridEnterpriseError({ error }: { error: Error }) {
  const isConfigError = (error as any)?.code === 'AG_GRID_ENTERPRISE_NOT_CONFIGURED';
  const errorMessage = error.message;
  
  if (!isConfigError) {
    // For other errors, show a generic message
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8">
        <div className="max-w-2xl w-full rounded-lg border-l-4 border-destructive bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Failed to Initialize Grid</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{errorMessage}</p>
        </div>
      </div>
    );
  }
  
  // Format the error message for better readability
  const lines = errorMessage.split('\n').filter(line => line.trim());
  const title = lines[0] || 'AG Grid Enterprise Configuration Required';
  const details = lines.slice(1);
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="max-w-2xl w-full rounded-lg border-l-4 border-destructive bg-destructive/10 p-6">
        <h2 className="text-lg font-semibold text-destructive mb-4">{title}</h2>
        <div className="space-y-2 text-sm text-foreground">
          {details.map((line) => {
            // Use line content as key (should be unique enough for error messages)
            const lineKey = `${line.substring(0, 20)}-${line.length}`;
            // Style different types of lines
            if (line.startsWith('❌')) {
              return (
                <p key={lineKey} className="text-destructive font-medium">
                  {line}
                </p>
              );
            } else if (line.startsWith('📋') || line.startsWith('💡')) {
              return (
                <p key={lineKey} className="text-foreground font-medium mt-3">
                  {line}
                </p>
              );
            } else if (line.match(/^\s*\d+\./)) {
              // Numbered list items
              return (
                <p key={lineKey} className="text-muted-foreground ml-4">
                  {line.trim()}
                </p>
              );
            } else {
              return (
                <p key={lineKey} className="text-muted-foreground">
                  {line}
                </p>
              );
            }
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-destructive/20">
          <p className="text-xs text-muted-foreground">
            After updating your environment variables, restart the development server and refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EntityGrid({
  config, gridRef, setSearchCount, onStateUpdated, onLoadError, className, style,
}: EntityGridProps) {
  const [, setGridApi] = useState<GridApi | null>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [colDefs, setColDefs] = useState<any[]>([]);
  const posthog = _posthogHook();
  const searchParams = useSearchParams();
  const gridName = searchParams.get('gridName');
  const defaultGridName = searchParams.get('defaultGridName');

  // Ensure AG Grid modules are registered before mounting
  useEffect(() => {
    let alive = true;
    setInitError(null); // Reset error state on config change
    
    (async () => {
      try {
        // Early check for Enterprise configuration
        if (!isAgGridEnterpriseEnabled()) {
          const error = new Error(
            'AG Grid Enterprise is required but not configured. ' +
            'Set NEXT_PUBLIC_AGGRID_ENTERPRISE=1 in your .env.local file and restart the dev server.'
          );
          (error as any).code = 'AG_GRID_ENTERPRISE_NOT_CONFIGURED';
          throw error;
        }
        
        // Resolve column definitions asynchronously
        const defs = await config.colDefs();
        if (!alive) return;

        // Ensure AG Grid is ready
        await ensureAgGridReadyFor("serverSide");
        if (alive) {
          setColDefs(defs);
          setReady(true);
          setInitError(null);
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setInitError(error);
        setReady(false);
        
        // Log error for debugging (development only)
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.error('[EntityGrid] Failed to initialize', error);
        }
        
        // Notify parent component of error
        onLoadError?.(error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [config, onLoadError]);

  const statusBar = useMemo(() => config.ui?.statusBar ?? {
    statusPanels: [{ statusPanel: 'agFilteredRowCountComponent' }, { statusPanel: 'agAggregationComponent' }],
  }, [config]);

  const selectionColumnDef = useMemo(() => config.ui?.selectionColumnDef ?? ({
    sortable: false, width: 50, maxWidth: 50, suppressHeaderMenuButton: true, pinned: 'left' as const,
  }), [config]);

  const rowSelection = useMemo(() => config.ui?.rowSelection ?? ({
    mode: 'multiRow' as const, groupSelects: 'descendants' as const, hideDisabledCheckboxes: true,
  }), [config]);

  // Custom "No Rows" overlay component
  const noRowsOverlayComponent = useCallback(() => {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center py-8">
          <p className="text-base font-medium text-foreground">No results found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search criteria</p>
        </div>
      </div>
    );
  }, []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.setGridOption('serverSideDatasource', {
      async getRows(p: IServerSideGetRowsParams) {
        try {
          const r = await config.fetcher(p.request, posthog.get_distinct_id?.() ?? 'anon');
          p.success({
            rowData: r.rows,
            ...(r.totalSearchCount != null ? { rowCount: r.totalSearchCount } : {}),
          });
          setSearchCount(r.totalSearchCount?.toString() ?? '—');
          onLoadError?.(null);
        } catch (e) {
          // Log datasource errors for debugging (development only)
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.error(`[${config.id}] datasource error`, e);
          }
          p.fail();
          const error = e instanceof Error ? e : new Error(String(e));
          onLoadError?.(error);
        }
      },
    });
    params.api.sizeColumnsToFit();
    if (!(gridName || defaultGridName)) {
      params.api.applyColumnState({ state: config.defaultSortModel });
    }
  }, [config, posthog, gridName, defaultGridName, setSearchCount, onLoadError]);

  // Show error state if initialization failed
  if (initError) {
    return (
      <div id={`${config.id}-grid-error`} style={style} className={className}>
        <AgGridEnterpriseError error={initError} />
      </div>
    );
  }

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
        noRowsOverlayComponent={noRowsOverlayComponent as any}
      />
    </div>
  );
}


