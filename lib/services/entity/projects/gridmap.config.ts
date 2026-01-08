import type { GridConfig } from '../contracts';
import { PROJECTS_COLUMNS } from './columns.config';

const PROJECTS_GRID_CONFIG: GridConfig = {
  tableName: 'projects_mat',
  primaryKey: 'building_permit_id',
  columns: PROJECTS_COLUMNS as any[],
};

export default PROJECTS_GRID_CONFIG;



