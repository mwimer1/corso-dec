// lib/entities/companies/columns.config.ts

/**
 * @module lib/entities/companies/columns.config
 * @description Companies-specific column configurations for data grids and tables
 */

import { type TableColumnConfig } from '../types';

/**
 * Companies-specific column configurations
 * @remarks Framework-agnostic column definitions for entity grids
 */
export const COMPANIES_COLUMNS: TableColumnConfig[] = [
  { id: 'company_name', label: 'Company', accessor: 'company_name', sortable: true, hidden: false, width: 265, format: 'companyName' },
  { id: 'headcount', label: 'Headcount', accessor: 'headcount', sortable: true, hidden: false, format: 'number' },
  { id: 'company_description', label: 'Description', accessor: 'company_description', sortable: true, hidden: false, width: 300, format: 'description' },
  { id: 'top_cities', label: 'Top Cities', accessor: 'top_cities', sortable: true, hidden: false, format: 'pillList' },
  { id: 'job_value_ttm', label: 'Value (TTM)', accessor: 'job_value_ttm', sortable: true, hidden: false, format: 'currency' },
  { id: 'job_value_growth_ttm', label: 'Value % (TTM)', accessor: 'job_value_growth_ttm', sortable: true, hidden: false, format: 'number' },
  { id: 'project_count_ttm', label: 'Count (TTM)', accessor: 'project_count_ttm', sortable: true, hidden: false, format: 'number' },
  { id: 'project_count_growth_ttm', label: 'Count % (TTM)', accessor: 'project_count_growth_ttm', sortable: true, hidden: false, format: 'number' },
  { id: 'avg_value_ttm', label: 'Avg. Value (TTM)', accessor: 'avg_value_ttm', sortable: true, hidden: false, format: 'currency' },
  { id: 'avg_job_value_growth_ttm', label: 'Avg. Value % (TTM)', accessor: 'avg_job_value_growth_ttm', sortable: true, hidden: false, format: 'number' },
  { id: 'job_value_2023', label: 'Value (2023)', accessor: 'job_value_2023', sortable: true, hidden: true, format: 'currency' },
  { id: 'project_count_2023', label: 'Count (2023)', accessor: 'project_count_2023', sortable: true, hidden: true, format: 'number' },
  { id: 'job_value_2024', label: 'Value (2024)', accessor: 'job_value_2024', sortable: true, hidden: true, format: 'currency' },
  { id: 'job_value_growth_2024', label: 'Value % (2024)', accessor: 'job_value_growth_2024', sortable: true, hidden: true, format: 'number' },
  { id: 'project_count_2024', label: 'Count (2024)', accessor: 'project_count_2024', sortable: true, hidden: true, format: 'number' },
  { id: 'project_count_growth_2024', label: 'Count % (2024)', accessor: 'project_count_growth_2024', sortable: true, hidden: true, format: 'number' },
  { id: 'avg_job_value_2024', label: 'Avg. Value (2024)', accessor: 'avg_job_value_2024', sortable: true, hidden: true, format: 'currency' },
  { id: 'company_url', label: 'Website', accessor: 'company_url', sortable: true, hidden: true, width: 300, format: 'link' },
  { id: 'linkedin_url', label: 'LinkedIn', accessor: 'linkedin_url', sortable: true, hidden: true, width: 300, format: 'link' },
];

