import type {
    ColDef,
    ColGroupDef,
    ColumnState,
    IServerSideGetRowsParams,
    RowSelectionOptions,
    SelectionColumnDef,
    SideBarDef,
    StateUpdatedEvent,
} from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

export type EntityFetchResult = { rows: unknown[]; totalSearchCount?: number | null };
export type EntityFetcher = (
  req: IServerSideGetRowsParams['request'],
  distinctId: string,
) => Promise<EntityFetchResult>;

export type GridId = 'projects' | 'addresses' | 'companies';

export type ColDefsProvider = () => Promise<Array<ColDef | ColGroupDef>>;

export type EntityGridConfig = {
  id: GridId;
  colDefs: ColDefsProvider; // async provider to support lazy adapter
  defaultColDef: ColDef;
  defaultSortModel: ColumnState[];
  fetcher: EntityFetcher;
  ui?: {
    rowHeight?: number;
    headerHeight?: number;
    groupHeaderHeight?: number;
    sideBar?: SideBarDef | null;
    statusBar?: unknown;
    selectionColumnDef?: SelectionColumnDef;
    rowSelection?: RowSelectionOptions;
    paginationPageSize?: number;
  };
};

export type EntityGridProps = {
  config: EntityGridConfig;
  gridRef: React.RefObject<AgGridReact>;
  onStateUpdated: (e: StateUpdatedEvent) => void;
  setSearchCount: React.Dispatch<React.SetStateAction<string | null>>;
  className?: string;
  style?: React.CSSProperties;
};
