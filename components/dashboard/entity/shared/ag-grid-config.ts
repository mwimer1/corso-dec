import type { ColDef } from 'ag-grid-community';

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
  },
  sortable: true,
  resizable: true,
  enablePivot: false,
  minWidth: 130,
});


