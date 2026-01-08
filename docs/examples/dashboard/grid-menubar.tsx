"use client";

import { MenuBar, MenuBarContent, MenuBarItem, MenuBarMenu, MenuBarTrigger, Separator } from "@/components/ui/atoms";
// Grid state context removed - using local state instead
import type { AgGridReact } from 'ag-grid-react';
import { ArrowDownToLine, CopyPlus, FileDown, ListRestart, Maximize2, RefreshCcw, Save, Trash } from 'lucide-react';
import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GridSaveAsDialog } from './grid-save-as-dialog';
// Simple number formatting function (can be replaced with numeral if needed)
const formatNumber = (num: string | null): string => {
  if (!num) return '0';
  const n = parseInt(num, 10);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

interface GridMenubarProps {
  beta?: boolean;
  searchCount: string | null;
  gridId: string;
  applyState: (state: any) => void;
  currentState: any;
  unsavedState: boolean;
  gridRef: React.RefObject<AgGridReact>;
  coreGridTheme: string;
  setCoreGridTheme: Dispatch<SetStateAction<string>>;
  initDefaultGridName: string | null;
  initGridName: string | null;
}

export function GridMenubar(props: GridMenubarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
  const [currentSaveStateName, setCurrentSaveStateName] = useState<string | null>(null);
  // Grid state functionality removed - using local state management
  const [savedStates, setSavedStates] = useState({});
  const saveState = useCallback((name: string, state: any) => {
    setSavedStates(prev => ({ ...prev, [name]: { state_name: name, grid_state: state } }));
  }, []);
  const deleteState = useCallback((name: string) => {
    setSavedStates(prev => {
      const newStates = { ...prev };
      delete newStates[name];
      return newStates;
    });
  }, []);
  const hasInitialized = useRef(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const element = document.getElementById("corso-grid");
      if (element) {
        element.requestFullscreen();
        setIsFullscreen(true);
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current && Object.keys(savedStates).length > 0) {
      hasInitialized.current = true;
      let stateToApply: any = null;

      if (props.initGridName) {
        // Fetch the grid state using `gridStateId`
        stateToApply = Object.values(savedStates).find((state: any) => state.state_name === props.initGridName);
        if (stateToApply) {
          props.applyState(stateToApply.grid_state);
          setCurrentSaveStateName(stateToApply.state_name);
        } else {
          console.warn(`Grid state with ID "${props.initGridName}" not found.`);
        }
      }

      if (!stateToApply && props.initDefaultGridName) {
        // For now, skip default grid state handling
        console.warn(`Default grid state handling not implemented`);
      }
    }
  }, [savedStates, props]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
      if (event.key === 'F' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  const handleSave = () => {
    if (currentSaveStateName) {
      saveState(currentSaveStateName, props.currentState);
      props.applyState(props.currentState);
      // toast({
      //   title: "Grid saved",
      //   description: `Successfully saved to ${currentSaveStateName}`,
      // });
    } else {
      setIsSaveAsDialogOpen(true);
    }
  };

  const handleSaveAs = (saveStateName: string) => {
    saveState(saveStateName, props.currentState);
    setCurrentSaveStateName(saveStateName);
    props.applyState(props.currentState);
    // toast({
    //   title: "Grid saved",
    //   description: `Successfully saved to ${saveStateName}`,
    // });
  };

  const handleDelete = (deleteStateName: string) => {
    deleteState(deleteStateName);
    if (currentSaveStateName === deleteStateName) {
      setCurrentSaveStateName(null);
    }
    // toast({
    //   title: "Grid deleted",
    //   description: `Successfully deleted ${deleteStateName}`,
    // });
  };

  return (
    <>
      <MenuBar className="flex items-center justify-between w-full px-1 mb-1 mt-1 bg-background shadow-sm">
        {/* Left side: Saved Searches and Tools */}
        <div className="flex items-center my-2 gap-2">
          {/* Saved Searches menu */}
          <MenuBarMenu>
            <MenuBarTrigger className="px-2 py-0.95 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground rounded-md">
              Saved Searches
            </MenuBarTrigger>
            {/* Parent menu dropdown: keep rounded corners here */}
            <MenuBarContent
              sideOffset={2}
              className="md:min-w-[285px] border border-border shadow-md p-0 overflow-hidden rounded-md"
            >
              {Object.values(savedStates).map((state: any) => (
                /* Each item: NO rounding on the item itself */
                <MenuBarItem
                  key={state.state_name}
                  className={`
                    relative flex items-center pr-2 py-1.5 cursor-pointer group
                    hover:bg-accent
                    border-b last:border-b-0
                    rounded-none
                    ${currentSaveStateName === state.state_name ? 'bg-accent text-accent-foreground' : ''}
                  `}
                  onClick={() => {
                    props.applyState(state.grid_state);
                    setCurrentSaveStateName(state.state_name);
                  }}
                >
                  <span>{state.state_name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(state.state_name);
                    }}
                    className="absolute right-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                    aria-label="Delete state"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </MenuBarItem>
              ))}
            </MenuBarContent>
          </MenuBarMenu>

          {/* Tools menu */}
          <MenuBarMenu>
            <MenuBarTrigger className="px-2 py-0.95 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground rounded-md">
              Tools
            </MenuBarTrigger>
            {/* Parent menu dropdown: keep rounded corners here */}
            <MenuBarContent className="md:min-w-48 border border-border shadow-md p-0 overflow-hidden rounded-md">
              {/* Reload */}
              <MenuBarItem
                onClick={() => {
                  try {
                    props.gridRef?.current?.api.refreshServerSide();
                  } catch (error) {
                    console.error("Failed to refresh the grid:", error);
                  }
                }}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <RefreshCcw className="h-4 w-4" />
                <span>Reload</span>
              </MenuBarItem>

              {/* Reset */}
              <MenuBarItem
                    onClick={() => {
                      try {
                        props.gridRef?.current?.api.setFilterModel(null);
                        props.gridRef?.current?.api.resetColumnState();
                        props.gridRef?.current?.api.refreshServerSide();
                      } catch (error) {
                        console.error("Failed to reset the grid:", error);
                      }
                    }}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <ListRestart className="h-4 w-4" />
                <span>Reset</span>
              </MenuBarItem>

              <Separator />


              {/* Save */}
              <MenuBarItem
                onClick={handleSave}
                disabled={!props.currentState}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </MenuBarItem>

              {/* Save As */}
              <MenuBarItem
                onClick={() => setIsSaveAsDialogOpen(true)}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <CopyPlus className="h-4 w-4" />
                <span>Save as</span>
              </MenuBarItem>

              <Separator />

              {/* Export CSV */}
              <MenuBarItem
                onClick={() => props.gridRef?.current?.api.exportDataAsCsv()}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span>Export as CSV</span>
              </MenuBarItem>

              {/* Export Excel */}
              <MenuBarItem
                onClick={() => props.gridRef?.current?.api.exportDataAsExcel()}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <FileDown className="h-4 w-4" />
                <span>Export as Excel</span>
              </MenuBarItem>

              <Separator />

              {/* Toggle Fullscreen */}
              <MenuBarItem
                onClick={toggleFullscreen}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Fullscreen</span>
              </MenuBarItem>

              <Separator />
            </MenuBarContent>
          </MenuBarMenu>
        </div>

        {/* Right side: results -> csv -> hard reset -> save as -> save */}
        <div className="flex items-center p-1 gap-4">
          {/* Results count */}
          <MenuBarMenu>
            <MenuBarTrigger
              className="cursor-default text-muted-foreground"
              disabled
            >
              {formatNumber(props.searchCount)} results
            </MenuBarTrigger>
          </MenuBarMenu>

          {/* Export CSV */}
          <button
            onClick={() => props.gridRef?.current?.api.exportDataAsCsv()}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors"
            aria-label="Export as CSV"
          >
            <ArrowDownToLine className="h-4 w-4" />
          </button>

          {/* Hard reset */}
          <button
            onClick={() => {
              try {
                props.gridRef?.current?.api.setFilterModel(null);
                props.gridRef?.current?.api.resetColumnState();
                props.gridRef?.current?.api.refreshServerSide();
              } catch (error) {
                console.error("Failed to reset the grid:", error);
              }
            }}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors"
            aria-label="Reset grid"
          >
            <ListRestart className="h-4 w-4" />
          </button>

          {/* Reload */}
          <button
            onClick={() => {
              try {
                props.gridRef?.current?.api.refreshServerSide();
              } catch (error) {
                console.error("Failed to refresh the grid:", error);
              }
            }}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors"
            aria-label="Refresh grid"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>

          {/* Save As */}
          <button
            onClick={() => setIsSaveAsDialogOpen(true)}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors"
            aria-label="Save grid as"
          >
            <CopyPlus className="h-4 w-4" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!props.currentState}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors disabled:opacity-50"
            aria-label="Save grid"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </MenuBar>

      <GridSaveAsDialog
        isOpen={isSaveAsDialogOpen}
        onClose={() => setIsSaveAsDialogOpen(false)}
        onSave={handleSaveAs}
      />
    </>
  );
}
