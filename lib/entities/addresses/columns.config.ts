// lib/entities/addresses/columns.config.ts

/**
 * @module lib/entities/addresses/columns.config
 * @description Addresses-specific column configurations for data grids and tables
 */

import { type TableColumnConfig } from '../types';

/**
 * Addresses-specific column configurations
 * @remarks Framework-agnostic column definitions for entity grids
 */
export const ADDRESSES_COLUMNS: TableColumnConfig[] = [
  { id: 'full_address', label: 'Address', accessor: 'full_address', sortable: true, hidden: false, width: 280 },
  { id: 'city', label: 'City', accessor: 'city', sortable: true, hidden: false },
  { id: 'state', label: 'State', accessor: 'state', sortable: true, hidden: false, width: 90 },
  { id: 'zipcode', label: 'ZIP', accessor: 'zipcode', sortable: true, hidden: false },
  { id: 'property_type_major_category', label: 'Use Class', accessor: 'property_type_major_category', sortable: true, hidden: false, format: 'badge' },
  { id: 'property_type_sub_category', label: 'Sub Type', accessor: 'property_type_sub_category', sortable: true, hidden: false, format: 'badge' },
  { id: 'full_address_has_numbers', label: 'Suitable For Mailers?', accessor: 'full_address_has_numbers', sortable: true, hidden: false },
  { id: 'total_job_value', label: 'Total Job Value', accessor: 'total_job_value', sortable: true, hidden: false, format: 'currency' },
  { id: 'job_count', label: 'Job Count', accessor: 'job_count', sortable: true, hidden: false, format: 'number' },
  { id: 'record_last_updated', label: 'Last Updated', accessor: 'record_last_updated', sortable: true, hidden: false, format: 'date' },
];

