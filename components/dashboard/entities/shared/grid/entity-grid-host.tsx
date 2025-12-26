"use client";

import { devError } from '@/lib/log';
import { publicEnv } from '@/lib/shared/config/client';
import type { EntityGridConfig } from '@/types/dashboard';
import type { ColumnState, FilterModel, StateUpdatedEvent } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import EntityGrid from './entity-grid';
import { GridMenubar } from './grid-menubar';

/**
 * Minimal type for grid state applied by GridMenubar
 */
interface GridState {
  columnState?: ColumnState[];
  filterModel?: FilterModel;
  sortModel?: ColumnState[];
}

/**
 * Minimal type for error objects that may include status code, error code, and details
 */
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

type DensityMode = 'comfortable' | 'compact';

export default function EntityGridHost({ config }: { config: EntityGridConfig }) {
  const gridRef = React.useRef<AgGridReact | null>(null);
  const [searchCount, setSearchCount] = React.useState<string | null>(null);
  const [currentState, setCurrentState] = React.useState<GridState | null>(null);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const searchParams = useSearchParams();
  const gridName = searchParams.get('gridName');
  const defaultGridName = searchParams.get('defaultGridName');
  const hasEnterprise = publicEnv.NEXT_PUBLIC_AGGRID_ENTERPRISE === '1';
  
  // Density state with localStorage persistence
  const densityStorageKey = `corso:gridDensity:${config.id}`;
  const [density, setDensity] = React.useState<DensityMode>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    try {
      const stored = localStorage.getItem(densityStorageKey);
      if (stored === 'comfortable' || stored === 'compact') {
        return stored as DensityMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'comfortable';
  });
  
  const handleDensityChange = React.useCallback((newDensity: DensityMode) => {
    setDensity(newDensity);
    try {
      localStorage.setItem(densityStorageKey, newDensity);
    } catch {
      // Ignore localStorage errors
    }
  }, [densityStorageKey]);

  // Search state (not persisted to localStorage - not part of saved views)
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  
  // Debounced search query (300ms delay) to avoid excessive API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState<string>('');
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStateUpdated = React.useCallback((event: StateUpdatedEvent) => {
    // Extract state from AG Grid StateUpdatedEvent and convert to GridState format
    // Note: AG Grid v31+ uses api.getColumnState() instead of columnApi
    const state: GridState = {
      columnState: event.api.getColumnState(),
      filterModel: event.api.getFilterModel(),
      sortModel: event.api.getColumnState(),
    };
    setCurrentState(state);
  }, []);

  const applyState = React.useCallback((state: GridState) => {
    if (gridRef.current?.api) {
      try {
        if (state.columnState && state.columnState.length > 0) {
          gridRef.current.api.applyColumnState({ state: state.columnState });
        }
        if (state.filterModel) {
          gridRef.current.api.setFilterModel(state.filterModel);
        }
        if (state.sortModel && state.sortModel.length > 0) {
          gridRef.current.api.applyColumnState({ state: state.sortModel });
        }
      } catch (error) {
        devError('Failed to apply grid state:', error);
      }
    }
  }, []);

  const [retryCooldown, setRetryCooldown] = React.useState(false);
  
  const handleRetry = React.useCallback(() => {
    if (retryCooldown) return;
    
    setLoadError(null);
    setRetryCooldown(true);
    gridRef.current?.api?.refreshServerSide();
    
    // Disable retry button for 2 seconds to prevent spam
    setTimeout(() => {
      setRetryCooldown(false);
    }, 2000);
  }, [retryCooldown]);

  return (
    <div className="flex flex-col h-full w-full" id="corso-grid" data-testid="entity-grid">
      {/* Error alert above toolbar */}
      {loadError && (() => {
        const errorWithStatus = loadError as ErrorWithStatus;
        const status = errorWithStatus?.status;
        const errorCode = errorWithStatus?.code;
        let errorMessage = loadError.message || 'Error loading data.';
        
        // Provide user-friendly messages for specific status codes and error codes
        if (status === 401) {
          errorMessage = 'Please sign in again.';
        } else if (status === 403) {
          // Show specific message based on error code
          if (errorCode === 'NO_ORG_CONTEXT') {
            errorMessage = 'No organization selected. (Strict mode.)';
          } else if (errorCode === 'FORBIDDEN') {
            errorMessage = 'Insufficient permissions.';
          } else {
            // Use API error message if available, otherwise fallback
            errorMessage = loadError.message || 'You do not have permission to access this resource.';
          }
        } else if (status === 429) {
          if (errorCode === 'RATE_LIMITED') {
            errorMessage = 'Too many requests. Wait 10–30 seconds and retry.';
          } else {
            errorMessage = loadError.message || 'Too many requests. Please wait and try again.';
          }
        } else if (status) {
          // For other status codes, use the error message from the fetcher (already includes status)
          errorMessage = loadError.message;
        }
        
        return (
          <div className="px-2 pt-2">
            <div
              role="alert"
              className="flex items-center gap-2 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={handleRetry}
                disabled={retryCooldown}
                className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-2 py-1 -mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Retry loading data"
              >
                Retry
              </button>
            </div>
          </div>
        );
      })()}
      <div>
        <GridMenubar
          searchCount={searchCount}
          gridId={config.id}
          applyState={applyState}
          currentState={currentState}
          unsavedState={false}
          gridRef={gridRef as React.RefObject<AgGridReact>}
          coreGridTheme="corso-ag-grid"
          setCoreGridTheme={() => {}}
          initDefaultGridName={defaultGridName}
          initGridName={gridName}
          hasEnterprise={hasEnterprise}
          loadError={!!loadError}
          onRetry={handleRetry}
          density={density}
          onDensityChange={handleDensityChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
      <div className="flex-1 min-h-0">
        <EntityGrid
          config={config}
          gridRef={gridRef as React.RefObject<AgGridReact>}
          setSearchCount={setSearchCount}
          onStateUpdated={handleStateUpdated}
          onLoadError={setLoadError}
          className="h-full w-full"
          density={density}
          search={debouncedSearchQuery}
        />
      </div>
    </div>
  );
}


