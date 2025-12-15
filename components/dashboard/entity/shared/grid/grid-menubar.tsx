"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/styles";
// Grid state context removed - using local state instead
import type { AgGridReact } from 'ag-grid-react';
import { AlertTriangle, ArrowDownToLine, CopyPlus, FileDown, ListRestart, Maximize2, RefreshCcw, Save, Trash } from 'lucide-react';
import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
// GridSaveAsDialog removed - using simple prompt for now
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
  hasEnterprise?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
}

export function GridMenubar(props: GridMenubarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSaveStateName, setCurrentSaveStateName] = useState<string | null>(null);
  // Grid state functionality removed - using local state management
  const [savedStates, setSavedStates] = useState<Record<string, { state_name: string; grid_state: any }>>({});
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
        stateToApply = Object.values(savedStates).find((state) => state.state_name === props.initGridName);
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

  const handleSaveAsClick = () => {
    const name = prompt('Enter a name for this saved search:');
    if (name && name.trim()) {
      handleSaveAs(name.trim());
    }
  };

  const handleSaveAs = (saveStateName: string) => {
    saveState(saveStateName, props.currentState);
    setCurrentSaveStateName(saveStateName);
    props.applyState(props.currentState);
  };

  const handleSave = () => {
    if (currentSaveStateName) {
      saveState(currentSaveStateName, props.currentState);
      props.applyState(props.currentState);
    } else {
      handleSaveAsClick();
    }
  };

  const handleDelete = (deleteStateName: string) => {
    deleteState(deleteStateName);
    if (currentSaveStateName === deleteStateName) {
      setCurrentSaveStateName(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between w-full px-1 mb-1 mt-1 bg-background shadow-sm">
        {/* Left side: Saved Searches and Tools */}
        <div className="flex items-center my-2 gap-2">
          {/* Saved Searches menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="px-2 py-0.95 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Saved Searches
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={2}
                className={cn("md:min-w-[285px] border border-border shadow-md p-0 overflow-hidden rounded-md bg-background")}
              >
                {Object.values(savedStates).map((state) => (
                  <DropdownMenu.Item
                    key={state.state_name}
                    className={cn(
                      "relative flex items-center pr-2 py-1.5 cursor-pointer group",
                      "hover:bg-accent border-b last:border-b-0 rounded-none",
                      currentSaveStateName === state.state_name && "bg-accent text-accent-foreground"
                    )}
                    onSelect={() => {
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
                      className="absolute right-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:opacity-100"
                      aria-label="Delete state"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Tools menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="px-2 py-0.95 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Tools
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={cn("md:min-w-48 border border-border shadow-md p-0 overflow-hidden rounded-md bg-background")}>
                {/* Reload */}
                <DropdownMenu.Item
                  onSelect={() => {
                    try {
                      props.gridRef?.current?.api.refreshServerSide();
                    } catch (error) {
                      console.error("Failed to refresh the grid:", error);
                    }
                  }}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>Reload</span>
                </DropdownMenu.Item>

                {/* Reset */}
                <DropdownMenu.Item
                  onSelect={() => {
                    try {
                      props.gridRef?.current?.api.setFilterModel(null);
                      props.gridRef?.current?.api.resetColumnState();
                      props.gridRef?.current?.api.refreshServerSide();
                    } catch (error) {
                      console.error("Failed to reset the grid:", error);
                    }
                  }}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                >
                  <ListRestart className="h-4 w-4" />
                  <span>Reset</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="border-b border-border" />

                {/* Save */}
                <DropdownMenu.Item
                  onSelect={handleSave}
                  disabled={!props.currentState}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none", !props.currentState && "opacity-50 cursor-not-allowed")}
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </DropdownMenu.Item>

                {/* Save As */}
                <DropdownMenu.Item
                  onSelect={handleSaveAsClick}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                >
                  <CopyPlus className="h-4 w-4" />
                  <span>Save as</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="border-b border-border" />

                {/* Export CSV */}
                <DropdownMenu.Item
                  onSelect={() => props.gridRef?.current?.api.exportDataAsCsv()}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>Export as CSV</span>
                </DropdownMenu.Item>

                {/* Export Excel - only show if enterprise is enabled */}
                {props.hasEnterprise && (
                  <DropdownMenu.Item
                    onSelect={() => {
                      try {
                        props.gridRef?.current?.api.exportDataAsExcel();
                      } catch (error) {
                        console.error('Excel export failed. Enterprise features may not be available.', error);
                      }
                    }}
                    className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Export as Excel</span>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Separator className="border-b border-border" />

                {/* Toggle Fullscreen */}
                <DropdownMenu.Item
                  onSelect={toggleFullscreen}
                  className={cn("px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2 border-b last:border-b-0 rounded-none")}
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Fullscreen</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Right side: error alert -> results -> csv -> hard reset -> save as -> save */}
        <div className="flex items-center p-1 gap-4">
          {/* Error alert */}
          {props.loadError && (
            <div
              role="alert"
              className="flex items-center gap-2 px-2 py-1 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>Error loading data.</span>
              {props.onRetry && (
                <button
                  onClick={props.onRetry}
                  className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Retry loading data"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {/* Results count */}
          <div className="cursor-default text-muted-foreground">
            {formatNumber(props.searchCount)} results
          </div>

          {/* Export CSV */}
          <button
            onClick={() => props.gridRef?.current?.api.exportDataAsCsv()}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Refresh grid"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>

          {/* Save As */}
          <button
            onClick={handleSaveAsClick}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Save grid as"
          >
            <CopyPlus className="h-4 w-4" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!props.currentState}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:focus-visible:ring-0"
            aria-label="Save grid"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
