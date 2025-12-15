"use client";

import * as React from 'react';
import EntityGrid from './entity-grid';
import type { EntityGridConfig } from '@/types/dashboard';
import { GridMenubar } from './grid-menubar';
import { useSearchParams } from 'next/navigation';
import { publicEnv } from '@/lib/shared/config/client';

export default function EntityGridHost({ config }: { config: EntityGridConfig }) {
  const gridRef = React.useRef<any>(null);
  const [searchCount, setSearchCount] = React.useState<string | null>(null);
  const [currentState, setCurrentState] = React.useState<any>(null);
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

  return (
    <div className="flex flex-col h-full w-full" id="corso-grid">
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
      />
      <div className="flex-1 min-h-0">
        <EntityGrid
          config={config}
          gridRef={gridRef}
          setSearchCount={setSearchCount}
          onStateUpdated={handleStateUpdated}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}


