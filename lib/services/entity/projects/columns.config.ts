// lib/services/entity/projects/columns.config.ts

/**
 * @module lib/services/entity/projects/columns.config
 * @description Projects-specific column configurations for data grids and tables
 */

import { type TableColumnConfig } from '../types';

/**
 * Projects-specific column configurations
 * @remarks Framework-agnostic column definitions for entity grids
 */
export const PROJECTS_COLUMNS: TableColumnConfig[] = [
  { id: 'building_permit_id', label: 'Project ID', accessor: 'building_permit_id', sortable: true, hidden: false, width: 160 },
  { id: 'status', label: 'Status', accessor: 'status', sortable: true, hidden: false },
  { id: 'job_value', label: 'Value', accessor: 'job_value', sortable: true, hidden: false, format: 'currency' },
  { id: 'effective_date', label: 'Date', accessor: 'effective_date', sortable: true, hidden: false, format: 'date' },
  { id: 'effective_year', label: 'Year', accessor: 'effective_year', sortable: true, hidden: false, format: 'number' },
  { id: 'effective_month', label: 'Month', accessor: 'effective_month', sortable: true, hidden: true, format: 'number' },
  { id: 'description', label: 'Description', accessor: 'description', sortable: true, hidden: false, width: 350 },
  { id: 'property_type_major_category', label: 'Category', accessor: 'property_type_major_category', sortable: true, hidden: false, width: 175 },
  { id: 'property_type_sub_category', label: 'Sub Category', accessor: 'property_type_sub_category', sortable: true, hidden: false, width: 175 },
  { id: 'contractor_names', label: 'Contractor(s)', accessor: 'contractor_names', sortable: true, hidden: false, width: 175 },
  { id: 'homeowner_names', label: 'Owner(s)', accessor: 'homeowner_names', sortable: true, hidden: false, width: 175 },
  { id: 'city', label: 'City', accessor: 'city', sortable: true, hidden: false },
  { id: 'state', label: 'State', accessor: 'state', sortable: true, hidden: true, width: 90 },
  { id: 'zipcode', label: 'Zip Code', accessor: 'zipcode', sortable: true, hidden: true },
  { id: 'project_classification_summary', label: 'Project Types', accessor: 'project_classification_summary', sortable: true, hidden: false, width: 250 },
  { id: 'full_address', label: 'Mailing Address', accessor: 'full_address', sortable: true, hidden: true },
  { id: 'attom_id', label: 'Unique ID', accessor: 'attom_id', sortable: true, hidden: true, format: 'number' },
  { id: 'fees', label: 'Fees', accessor: 'fees', sortable: true, hidden: true, format: 'currency' },
  { id: 'property_latitude', label: 'Lat', accessor: 'property_latitude', sortable: true, hidden: true, format: 'number' },
  { id: 'property_longitude', label: 'Long', accessor: 'property_longitude', sortable: true, hidden: true, format: 'number' },
];

// Re-export type separately
export type { TableColumnConfig };


