import { toColDef } from '@/lib/entities/adapters/aggrid';
import type { TableColumnConfig } from '@/lib/entities/types';
import { describe, expect, it, vi } from 'vitest';

// Mock the lazy-loaded formatters
vi.mock('@/lib/entities/adapters/aggrid-formatters', () => ({
  currencyFormatter: vi.fn((params) => `$${params.value}`),
  dateFormatter: vi.fn((params) => new Date(params.value).toLocaleDateString()),
  datetimeFormatter: vi.fn((params) => new Date(params.value).toLocaleString()),
  numberGetter: vi.fn((params) => Number(params.data?.[params.colDef.field || ''])),
  linkRenderer: vi.fn(() => null),
}));

describe('toColDef', () => {
  it('converts basic config to ColDef', async () => {
    const config: TableColumnConfig = {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: true,
    };

    const colDef = toColDef(config);

    expect(colDef).toEqual({
      field: 'name',
      headerName: 'Name',
      sortable: true,
      hide: false,
    });
  });

  it('uses i18nKey when available', async () => {
    const config: TableColumnConfig = {
      id: 'name',
      label: 'Name',
      i18nKey: 'entity.name',
      accessor: 'name',
    };

    const colDef = toColDef(config);

    expect(colDef.headerName).toBe('entity.name');
  });

  it('applies currency formatting', async () => {
    const config: TableColumnConfig = {
      id: 'value',
      label: 'Value',
      accessor: 'value',
      format: 'currency',
    };

    const colDef = toColDef(config);

    expect(colDef.valueFormatter).toBeDefined();
    expect(colDef.valueGetter).toBeDefined();
  });

  it('applies date formatting', async () => {
    const config: TableColumnConfig = {
      id: 'created',
      label: 'Created',
      accessor: 'created_at',
      format: 'date',
    };

    const colDef = toColDef(config);

    expect(colDef.valueFormatter).toBeDefined();
  });

  it('applies link rendering', async () => {
    const config: TableColumnConfig = {
      id: 'website',
      label: 'Website',
      accessor: 'website',
      format: 'link',
    };

    const colDef = toColDef(config);

    expect(colDef.cellRenderer).toBeDefined();
  });

  it('handles hidden columns', async () => {
    const config: TableColumnConfig = {
      id: 'secret',
      label: 'Secret',
      accessor: 'secret',
      hidden: true,
    };

    const colDef = toColDef(config);

    expect(colDef.hide).toBe(true);
  });

  it('applies width and flex settings', async () => {
    const config: TableColumnConfig = {
      id: 'flexible',
      label: 'Flexible',
      accessor: 'flexible',
      width: 200,
      minWidth: 150,
      flex: 2,
    };

    const colDef = toColDef(config);

    expect(colDef.width).toBe(200);
    expect(colDef.minWidth).toBe(150);
    expect(colDef.flex).toBe(2);
  });

  it('applies accessibility settings', async () => {
    const config: TableColumnConfig = {
      id: 'accessible',
      label: 'Accessible',
      accessor: 'accessible',
      a11y: {
        headerAriaLabel: 'Accessible column header'
      }
    };

    const colDef = toColDef(config);

    expect(colDef.headerTooltip).toBe('Accessible column header');
  });
});

