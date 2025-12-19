"use client";

import { publicEnv } from '@/lib/shared/config/client';
import type { EntityGridConfig } from '@/types/dashboard';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import EntityGrid from './entity-grid';
import { GridMenubar } from './grid-menubar';

export default function EntityGridHost({ config }: { config: EntityGridConfig }) {
  const gridRef = React.useRef<any>(null);
  const [searchCount, setSearchCount] = React.useState<string | null>(null);
  const [currentState, setCurrentState] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const searchParams = useSearchParams();
  const gridName = searchParams.get('gridName');
  const defaultGridName = searchParams.get('defaultGridName');
  const hasEnterprise = publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE === '1';

  const handleStateUpdated = React.useCallback((state: any) => {
    setCurrentState(state);
  }, []);

  const applyState = React.useCallback((state: any) => {
    if (gridRef.current?.api) {
      try {
        gridRef.current.api.applyColumnState({ state: state.columnState });
        if (state.filterModel) {
          gridRef.current.api.setFilterModel(state.filterModel);
        }
        if (state.sortModel) {
          gridRef.current.api.applyColumnState({ state: state.sortModel });
        }
      } catch (error) {
        console.error('Failed to apply grid state:', error);
      }
    }
  }, []);

  const handleRetry = React.useCallback(() => {
    setLoadError(null);
    gridRef.current?.api?.refreshServerSide();
  }, []);

  return (
    <div className="flex flex-col h-full w-full" id="corso-grid">
      {/* Error alert above toolbar */}
      {loadError && (() => {
        const status = (loadError as any)?.status;
        let errorMessage = loadError.message || 'Error loading data.';
        
        // Provide user-friendly messages for specific status codes
        if (status === 401) {
          errorMessage = 'Please sign in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to access this resource (role required: org:member).';
        } else if (status) {
          // For other status codes, use the error message from the fetcher (already includes status)
          errorMessage = loadError.message;
        }
        
        return (
          <div className="px-6 md:px-8 pt-2">
            <div
              role="alert"
              className="flex items-center gap-2 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={handleRetry}
                className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-2 py-1 -mr-2"
                aria-label="Retry loading data"
              >
                Retry
              </button>
            </div>
          </div>
        );
      })()}
      <div className="px-6 md:px-8 pb-2">
        <GridMenubar
          searchCount={searchCount}
          gridId={config.id}
          applyState={applyState}
          currentState={currentState}
          unsavedState={false}
          gridRef={gridRef}
          coreGridTheme="ag-theme-quartz"
          setCoreGridTheme={() => {}}
          initDefaultGridName={defaultGridName}
          initGridName={gridName}
          hasEnterprise={hasEnterprise}
          loadError={!!loadError}
          onRetry={handleRetry}
        />
      </div>
      <div className="flex-1 min-h-0 px-6 md:px-8">
        <EntityGrid
          config={config}
          gridRef={gridRef}
          setSearchCount={setSearchCount}
          onStateUpdated={handleStateUpdated}
          onLoadError={setLoadError}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}


