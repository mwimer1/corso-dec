"use client";

import { Badge, Button, Input } from "@/components/ui/atoms";
import { devError, devWarn } from "@/lib/log";
import { cn } from "@/styles";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// Grid state context removed - using local state instead
import { useUser } from '@clerk/nextjs';
import type { CsvExportParams, ProcessCellForExportParams } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { ArrowDownToLine, Columns, CopyPlus, FileDown, GripVertical, ListRestart, Maximize2, RefreshCcw, Save, Search, Trash, X } from 'lucide-react';
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

/**
 * Creates CSV export parameters that process cells to match grid display
 * Uses valueGetter and valueFormatter to ensure exported values match what's shown in the grid
 */
function createCsvExportParams(gridApi: AgGridReact['api']): CsvExportParams {
  return {
    processCellCallback: (params: ProcessCellForExportParams): string => {
      const { column, node, value } = params;
      
      if (!column || !node) {
        return value ?? '';
      }

      // Get the column definition to check for valueGetter and valueFormatter
      const colDef = column.getColDef();
      
      // First, apply valueGetter if it exists to get the computed value
      let computedValue: unknown = value;
      if (colDef.valueGetter && typeof colDef.valueGetter === 'function') {
        try {
          // Create params for valueGetter
          const getterParams = {
            data: node.data,
            node: node,
            colDef: colDef,
            column: column,
            api: gridApi,
            columnApi: gridApi,
            getValue: (field: string) => {
              // Helper to get field value from node data
              return node.data?.[field];
            },
          };
          computedValue = colDef.valueGetter(getterParams as any);
        } catch (error) {
          // If valueGetter fails, use raw value
          devWarn('CSV export: valueGetter failed', error);
          computedValue = value;
        }
      }
      
      // Then, apply valueFormatter if it exists
      if (colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
        try {
          // Create a params object similar to what valueFormatter expects
          const formatterParams = {
            value: computedValue,
            data: node.data,
            node: node,
            colDef: colDef,
            column: column,
            api: gridApi,
            columnApi: gridApi,
          };
          
          const formatted = colDef.valueFormatter(formatterParams as any);
          return formatted ?? '';
        } catch (error) {
          // If formatter fails, fall back to computed value
          devWarn('CSV export: valueFormatter failed', error);
          return String(computedValue ?? '');
        }
      }
      
      // No formatter, return computed value (or raw value if no valueGetter)
      return String(computedValue ?? value ?? '');
    },
  };
}

// Local style tokens for toolbar dropdowns (maintainability + consistency)
const TOOLBAR_HOVER_BG = "hover:bg-black/5";
const TOOLBAR_FOCUS_VISIBLE_BG = "focus-visible:bg-black/5";
const TOOLBAR_OPEN_BG = "data-[state=open]:bg-black/5";

const DROPDOWN_CONTENT_CLASS = "z-[2000] md:min-w-[285px] border border-border shadow-lg p-1 rounded-md bg-background overflow-hidden";

const DROPDOWN_ITEM_BASE_CLASS = "flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer";
const DROPDOWN_ITEM_INTERACTION_CLASS = "hover:bg-black/5 focus:bg-black/5";

const SAVED_SEARCH_ITEM_BASE_CLASS = "relative flex items-center gap-2 pr-2 py-2 rounded-sm cursor-pointer group text-sm";
const DROPDOWN_ITEM_ACTIVE_CLASS = "bg-black/10 text-foreground";
const DROPDOWN_SECTION_LABEL_CLASS = "px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide select-none";

type DensityMode = 'comfortable' | 'compact';

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
  density?: DensityMode;
  onDensityChange?: (density: DensityMode) => void;
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
}

export function GridMenubar(props: GridMenubarProps) {
  const { user } = useUser();
  const userId = user?.id ?? 'anon';
  const storageKey = `corso:gridSavedStates:${userId}:${props.gridId}`;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [currentSaveStateName, setCurrentSaveStateName] = useState<string | null>(null);
  // Grid state functionality removed - using local state management
  const [savedStates, setSavedStates] = useState<Record<string, { state_name: string; grid_state: any }>>({});
  
  // Density state with localStorage persistence
  const densityStorageKey = `corso:gridDensity:${userId}:${props.gridId}`;
  const [density, setDensity] = useState<DensityMode>(() => {
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
  
  // Sync density with parent if provided
  useEffect(() => {
    if (props.density && props.density !== density) {
      setDensity(props.density);
    }
  }, [props.density, density]);
  
  // Persist density changes
  const handleDensityChange = useCallback((newDensity: DensityMode) => {
    setDensity(newDensity);
    try {
      localStorage.setItem(densityStorageKey, newDensity);
    } catch {
      // Ignore localStorage errors
    }
    props.onDensityChange?.(newDensity);
  }, [densityStorageKey, props]);
  
  // Load saved states from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, { state_name: string; grid_state: any }>;
        if (parsed && typeof parsed === 'object') {
          setSavedStates(parsed);
        }
      }
    } catch (error) {
      // Handle corrupted data gracefully
      if (process.env.NODE_ENV !== 'production') {
        devWarn(`[GridMenubar] Failed to load saved states from localStorage:`, error);
      }
      // Clear corrupted data
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [storageKey]);

  // Save saved states to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      if (Object.keys(savedStates).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(savedStates));
      } else {
        // Remove key if no saved states
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      // Handle storage quota errors gracefully
      if (process.env.NODE_ENV !== 'production') {
        devWarn(`[GridMenubar] Failed to save states to localStorage:`, error);
      }
    }
  }, [savedStates, storageKey]);

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

  const toggleSideBar = useCallback(() => {
    const api = props.gridRef?.current?.api;
    if (!api) return;

    const newState = !isSideBarOpen;
    setIsSideBarOpen(newState);

    if (newState) {
      api.setSideBarVisible(true);
      api.openToolPanel('columns');
    } else {
      api.closeToolPanel();
      api.setSideBarVisible(false);
    }
  }, [isSideBarOpen, props.gridRef]);

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


  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs/editable elements
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable ||
                            target.closest('[contenteditable="true"]') !== null;

      if (isInputElement) {
        return; // Don't intercept keyboard shortcuts when user is typing
      }

      // Ctrl/Cmd+K to focus search input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
      // Changed from F to Ctrl/Cmd+Shift+F to avoid conflicts with browser find and typing
      if (event.key === 'F' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
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
              <Button variant="ghost" size="sm" className={cn("h-9", TOOLBAR_HOVER_BG, TOOLBAR_OPEN_BG, TOOLBAR_FOCUS_VISIBLE_BG)}>
                Saved Searches
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={2}
                align="start"
                className={cn(DROPDOWN_CONTENT_CLASS)}
              >
                {/* Search input */}
                {savedStatesArray.length > 0 && (
                  <div className="px-2 pt-1 pb-2">
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
                {savedStatesArray.length > 0 && (
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                )}

                {/* Empty state */}
                {savedStatesArray.length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-sm font-medium text-foreground mb-1">
                      No saved searches yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save your current view to create one
                    </p>
                  </div>
                )}

                {/* Filtered results */}
                {filteredSavedStates.length === 0 && savedStatesArray.length > 0 && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No saved searches match "{savedSearchQuery}"
                    </p>
                  </div>
                )}

                {filteredSavedStates.map((state) => (
                  <DropdownMenu.Item
                    key={state.state_name}
                    className={cn(
                      SAVED_SEARCH_ITEM_BASE_CLASS,
                      DROPDOWN_ITEM_INTERACTION_CLASS,
                      currentSaveStateName === state.state_name && DROPDOWN_ITEM_ACTIVE_CLASS
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
              <Button variant="ghost" size="sm" className={cn("h-9", TOOLBAR_HOVER_BG, TOOLBAR_OPEN_BG, TOOLBAR_FOCUS_VISIBLE_BG)}>
                Tools
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={2}
                align="start"
                className={cn(DROPDOWN_CONTENT_CLASS)}
              >
                {/* View section */}
                <div className={DROPDOWN_SECTION_LABEL_CLASS}>View</div>
                {/* Reload */}
                <DropdownMenu.Item
                  onSelect={() => {
                    try {
                      props.gridRef?.current?.api.refreshServerSide();
                    } catch (error) {
                      devError("Failed to refresh the grid:", error);
                    }
                  }}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
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
                      // Clear search query
                      props.setSearchQuery?.('');
                      props.gridRef?.current?.api.refreshServerSide();
                    } catch (error) {
                      devError("Failed to reset the grid:", error);
                    }
                  }}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
                >
                  <ListRestart className="h-4 w-4" />
                  <span>Reset</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                {/* Saved views section */}
                <div className={DROPDOWN_SECTION_LABEL_CLASS}>Saved views</div>
                {/* Save */}
                <DropdownMenu.Item
                  onSelect={handleSave}
                  disabled={!props.currentState}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS, !props.currentState && "opacity-50 cursor-not-allowed")}
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </DropdownMenu.Item>

                {/* Save As */}
                <DropdownMenu.Item
                  onSelect={handleSaveAsClick}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
                >
                  <CopyPlus className="h-4 w-4" />
                  <span>Save as</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                {/* Export section */}
                <div className={DROPDOWN_SECTION_LABEL_CLASS}>Export</div>
                {/* Export CSV */}
                <DropdownMenu.Item
                  onSelect={() => {
                    const api = props.gridRef?.current?.api;
                    if (api) {
                      api.exportDataAsCsv(createCsvExportParams(api));
                    }
                  }}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
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
                    className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Export as Excel</span>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                {/* Display section */}
                <div className={DROPDOWN_SECTION_LABEL_CLASS}>Display</div>
                {/* Density Toggle */}
                <DropdownMenu.Item
                  onSelect={() => {
                    handleDensityChange(density === 'comfortable' ? 'compact' : 'comfortable');
                  }}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
                >
                  <GripVertical className="h-4 w-4" />
                  <span>{density === 'comfortable' ? 'Compact' : 'Comfortable'}</span>
                </DropdownMenu.Item>
                {/* Toggle Fullscreen */}
                <DropdownMenu.Item
                  onSelect={toggleFullscreen}
                  className={cn(DROPDOWN_ITEM_BASE_CLASS, DROPDOWN_ITEM_INTERACTION_CLASS)}
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Fullscreen</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Global Quick Search */}
          {props.searchQuery !== undefined && props.setSearchQuery && (
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (Ctrl+K)"
                value={props.searchQuery}
                onChange={(e) => props.setSearchQuery?.(e.target.value)}
                className="pl-8 pr-8 h-9 text-sm"
                iconPadding={false}
                aria-label="Search across all columns"
              />
              {props.searchQuery && (
                <button
                  onClick={() => props.setSearchQuery?.('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side: results count -> action buttons (grouped) */}
        <div className="flex items-center gap-3">
          {/* Results count */}
          <div className="flex items-center gap-1.5 text-sm font-medium" data-testid="entity-results-count">
            <Badge color="secondary" className="tabular-nums">
              {formatNumber(props.searchCount)}
            </Badge>
            <span className="text-muted-foreground">results</span>
          </div>

          {/* Action buttons group: Density, Columns, Export, Reset, Refresh */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                handleDensityChange(density === 'comfortable' ? 'compact' : 'comfortable');
              }}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                density === 'compact' && "bg-black/10"
              )}
              aria-label={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} density`}
              title={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} density`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              onClick={toggleSideBar}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSideBarOpen && "bg-black/10"
              )}
              aria-label="Toggle columns panel"
              title="Toggle columns panel"
            >
              <Columns className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const api = props.gridRef?.current?.api;
                if (api) {
                  api.exportDataAsCsv(createCsvExportParams(api));
                }
              }}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  // Clear search query
                  props.setSearchQuery?.('');
                  props.gridRef?.current?.api.refreshServerSide();
                } catch (error) {
                  devError("Failed to reset the grid:", error);
                }
              }}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Reset grid"
              title="Reset filters, columns, and search"
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
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Save grid as"
              title="Save current view as new"
            >
              <CopyPlus className="h-4 w-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={!props.currentState}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black/5 active:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:focus-visible:ring-0"
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
