import type { GridConfig } from '../contracts';
import { ADDRESSES_COLUMNS } from './columns.config';

const ADDRESSES_GRID_CONFIG: GridConfig = {
  tableName: 'properties_mat',
  primaryKey: 'full_address',
  columns: ADDRESSES_COLUMNS as any[],
};

export default ADDRESSES_GRID_CONFIG;



