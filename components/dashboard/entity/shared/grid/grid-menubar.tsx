"use client";

import { Badge, Button, Input } from "@/components/ui/atoms";
import { devError, devWarn } from "@/lib/log";
import { cn } from "@/styles";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// Grid state context removed - using local state instead
import type { AgGridReact } from 'ag-grid-react';
import { ArrowDownToLine, CopyPlus, FileDown, ListRestart, Maximize2, RefreshCcw, Save, Search, Trash } from 'lucide-react';
import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
          devWarn(`Grid state with ID "${props.initGridName}" not found.`);
        }
      }

      if (!stateToApply && props.initDefaultGridName) {
        // For now, skip default grid state handling
        devWarn(`Default grid state handling not implemented`);
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

  // Saved searches filtering for searchable dropdown
  const [savedSearchQuery, setSavedSearchQuery] = useState("");
  const savedStatesArray = useMemo(() => Object.values(savedStates), [savedStates]);
  const filteredSavedStates = useMemo(() => {
    if (!savedSearchQuery.trim()) return savedStatesArray;
    const query = savedSearchQuery.toLowerCase();
    return savedStatesArray.filter((state) =>
      state.state_name.toLowerCase().includes(query)
    );
  }, [savedStatesArray, savedSearchQuery]);

  // Determine if current saved search is the default
  const isDefaultSavedSearch = useCallback(
    (stateName: string) => stateName === props.initDefaultGridName,
    [props.initDefaultGridName]
  );

  return (
    <>
      <div className="flex items-center justify-between w-full px-2 py-2 bg-background/95 backdrop-blur-sm">
        {/* Left side: Saved Searches and Tools */}
        <div className="flex items-center gap-2">
          {/* Saved Searches menu */}
          <DropdownMenu.Root
            onOpenChange={(open) => {
              // Reset search query when dropdown closes
              if (!open) {
                setSavedSearchQuery("");
              }
            }}
          >
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" className="h-9">
                Saved Searches
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={2}
                className={cn("md:min-w-[285px] border border-border shadow-md p-0 overflow-hidden rounded-md bg-background")}
              >
                {/* Search input */}
                {savedStatesArray.length > 0 && (
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search saved searches..."
                        value={savedSearchQuery}
                        onChange={(e) => setSavedSearchQuery(e.target.value)}
                        className="pl-8 h-8"
                        iconPadding={false}
                        onKeyDown={(e) => {
                          // Prevent dropdown from closing on input interaction
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {savedStatesArray.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm font-medium text-foreground mb-1">
                      No saved searches yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Save your current view to create one
                    </p>
                  </div>
                )}

                {/* Filtered results */}
                {filteredSavedStates.length === 0 && savedStatesArray.length > 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No saved searches match "{savedSearchQuery}"
                    </p>
                  </div>
                )}

                {filteredSavedStates.map((state) => (
                  <DropdownMenu.Item
                    key={state.state_name}
                    className={cn(
                      "relative flex items-center gap-2 pr-2 py-1.5 cursor-pointer group",
                      "hover:bg-accent border-b last:border-b-0 rounded-none",
                      currentSaveStateName === state.state_name && "bg-accent text-accent-foreground"
                    )}
                    onSelect={() => {
                      props.applyState(state.grid_state);
                      setCurrentSaveStateName(state.state_name);
                      setSavedSearchQuery(""); // Reset search on selection
                    }}
                  >
                    <span className="flex-1 truncate">{state.state_name}</span>
                    {isDefaultSavedSearch(state.state_name) && (
                      <Badge color="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(state.state_name);
                      }}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:opacity-100"
                      aria-label="Delete saved search"
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
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" className="h-9">
                Tools
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={cn("md:min-w-48 border border-border shadow-md p-0 overflow-hidden rounded-md bg-background")}>
                {/* Reload */}
                <DropdownMenu.Item
                  onSelect={() => {
                    try {
                      props.gridRef?.current?.api.refreshServerSide();
                    } catch (error) {
                      devError("Failed to refresh the grid:", error);
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
                      devError("Failed to reset the grid:", error);
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
                        devError('Excel export failed. Enterprise features may not be available.', error);
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

        {/* Right side: results count -> action buttons (grouped) */}
        <div className="flex items-center gap-3">
          {/* Results count */}
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-foreground">{formatNumber(props.searchCount)}</span>
            <span className="text-muted-foreground">results</span>
          </div>

          {/* Action buttons group: Export, Reset, Refresh */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => props.gridRef?.current?.api.exportDataAsCsv()}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Export as CSV"
              title="Export as CSV"
            >
              <ArrowDownToLine className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                try {
                  props.gridRef?.current?.api.setFilterModel(null);
                  props.gridRef?.current?.api.resetColumnState();
                  props.gridRef?.current?.api.refreshServerSide();
                } catch (error) {
                  devError("Failed to reset the grid:", error);
                }
              }}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Reset grid"
              title="Reset filters and columns"
            >
              <ListRestart className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                try {
                  props.gridRef?.current?.api.refreshServerSide();
                } catch (error) {
                  devError("Failed to refresh the grid:", error);
                }
              }}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Refresh grid"
              title="Refresh data"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Save actions group: Save As, Save */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveAsClick}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Save grid as"
              title="Save current view as new"
            >
              <CopyPlus className="h-4 w-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={!props.currentState}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:focus-visible:ring-0"
              aria-label="Save grid"
              title="Save current view"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
