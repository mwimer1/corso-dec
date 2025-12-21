import type { ColDef, SideBarDef } from 'ag-grid-community';

/**
 * Factory function to create a default column definition for AG Grid.
 * Returns a factory to avoid accidental mutation across column definitions.
 *
 * @returns Default column definition with global minWidth and standard filter/sort settings
 */
export const createDefaultColDef = (): ColDef => ({
  editable: false,
  hide: false,
  filter: 'agTextColumnFilter',
  filterParams: {
    buttons: ['apply', 'reset'],
    // Restrict to only operators supported by SSRM backend
    // Supported: 'contains', 'equals'
    // Not supported: 'startsWith', 'endsWith', 'notEqual', etc.
    filterOptions: ['contains', 'equals'],
  },
  sortable: true,
  resizable: true,
  enablePivot: false,
  minWidth: 130,
});

/**
 * Default side bar configuration for AG Grid.
 * Provides a Columns tool panel on the right side for column visibility and reordering.
 *
 * @returns Side bar definition with columns panel (closed by default)
 */
export const createDefaultSideBar = (): SideBarDef => ({
  toolPanels: [
    {
      id: 'columns',
      labelDefault: 'Columns',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
      toolPanelParams: {
        suppressRowGroups: true,
        suppressValues: true,
        suppressPivots: true,
        suppressPivotMode: true,
        suppressColumnFilter: true,
        suppressColumnSelectAll: false,
        suppressColumnExpandAll: false,
      },
    },
  ],
  hiddenByDefault: false,
  position: 'right', // Appears on right side (app nav is on left)
});


