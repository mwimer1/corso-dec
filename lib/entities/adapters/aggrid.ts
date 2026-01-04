'use client';
import type { ColDef } from 'ag-grid-community';
import type { TableColumnConfig } from '../types';
import {
  currencyFormatter,
  dateFormatter,
  datetimeFormatter,
  linkRenderer,
  numberGetter,
  badgeRenderer,
  companyNameRenderer,
  descriptionRenderer,
  pillListRenderer,
  loadingRenderer,
} from './aggrid-formatters';

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
      return { ...base, valueGetter: numberGetter, valueFormatter: currencyFormatter };
    case 'date':
      return { ...base, valueFormatter: dateFormatter };
    case 'datetime':
      return { ...base, valueFormatter: datetimeFormatter };
    case 'link':
      return { ...base, cellRenderer: linkRenderer };
    case 'badge':
      return { ...base, cellRenderer: badgeRenderer, cellClass: 'corso-badge-cell' };
    case 'companyName':
      return { ...base, cellRenderer: companyNameRenderer };
    case 'description':
      return { ...base, cellRenderer: descriptionRenderer };
    case 'pillList':
      return { ...base, cellRenderer: pillListRenderer };
    case 'loading':
      return { ...base, cellRenderer: loadingRenderer };
    default:
      return base;
  }
}

