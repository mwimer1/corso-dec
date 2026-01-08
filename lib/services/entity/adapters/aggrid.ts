'use client';
import type { TableColumnConfig } from '../types';
import type { ColDef } from 'ag-grid-community';
import * as fmt from './aggrid-formatters';

export function toColDef(cfg: TableColumnConfig): ColDef {
  const base: ColDef = {
    field: cfg.accessor,
    headerName: cfg.i18nKey ?? cfg.label,
    sortable: cfg.sortable ?? false,
    hide: cfg.hidden ?? false,
    ...(cfg.width && { width: cfg.width }),
    ...(cfg.minWidth && { minWidth: cfg.minWidth }),
    ...(cfg.flex && { flex: cfg.flex }),
    ...(cfg.a11y?.headerAriaLabel && { headerTooltip: cfg.a11y.headerAriaLabel })
  };

  if (!cfg.format) return base;

  switch (cfg.format) {
    case 'currency':
      return { ...base, valueGetter: fmt.numberGetter, valueFormatter: fmt.currencyFormatter };
    case 'date':
      return { ...base, valueFormatter: fmt.dateFormatter };
    case 'datetime':
      return { ...base, valueFormatter: fmt.datetimeFormatter };
    case 'link':
      return { ...base, cellRenderer: fmt.linkRenderer };
    default:
      return base;
  }
}

