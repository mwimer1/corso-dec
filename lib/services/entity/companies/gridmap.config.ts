import type { GridConfig } from '../contracts';
import { COMPANIES_COLUMNS } from './columns.config';

const COMPANIES_GRID_CONFIG: GridConfig = {
  tableName: 'companies_mat',
  primaryKey: 'contractor_id',
  columns: COMPANIES_COLUMNS as any[],
};

export default COMPANIES_GRID_CONFIG;



