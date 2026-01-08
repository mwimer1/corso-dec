// types/dashboard/analytics/types.ts
/**
 * @domain analytics
 * @description Warehouse entity types for ClickHouse data structures
 * @author Corso Development Team
 * @since 2.1.0
 */

import type { Row } from '../../shared/core/entity/types';
import type { ISODateString } from '../../shared/dates/types';

/** Common audit columns returned by the warehouse */
export interface BaseRow extends Row {
  id: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}


/* ───── Company ──────────────────────────────────────────────── */

export interface CompanyRow extends BaseRow {
  name: string;
  type: 'company';
  metadata?: Record<string, string>;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  revenue?: number;
  employee_count?: number;
  website?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'pending';
  project_count?: number;
  total_project_value?: number;
  last_project_date?: ISODateString;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  // Additional company-specific fields
  active_permits?: number;
  primary_contractor?: boolean;
  license_number?: string;
  insurance_status?: 'active' | 'expired' | 'pending';
  bonding_capacity?: number;
  safety_rating?: number;
}

/* ───── Address ──────────────────────────────────────────────── */

export interface AddressRow extends BaseRow {
  name: string;
  type: 'address';
  metadata?: Record<string, string>;
  // ATTOM-specific fields
  attom_id: string;
  record_last_updated: ISODateString;
  address_type_description: string;
  apn_formatted: string;
  built_year_at: number;
  city: string;
  contractor_names: string;
  county_name: string;
  full_address: string;
  full_address_has_numbers: boolean;
  homeowner_names: string;
  job_count: number;
  latest_permit_date: ISODateString;
  latest_permit_type: string;
  property_latitude: number;
  property_longitude: number;
  property_legal_description: string;
  property_type_major_category: string;
  property_type_sub_category: string;
  state: string;
  total_job_value: number;
  zip: string;
  // Additional address-specific fields
  street?: string;
  zip_code?: string;
  country?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  address_type?: 'residential' | 'commercial' | 'industrial';
  property_value?: number;
  lot_size?: number;
  building_area?: number;
  year_built?: number;
  zoning?: string;
  project_count?: number;
  last_permit_date?: ISODateString;
}

/* ───── Project ──────────────────────────────────────────────── */

export interface ProjectRow extends BaseRow {
  name: string;
  type: 'project';
  metadata?: Record<string, string>;
  // Project-specific fields
  permit_number: string;
  description: string;
  project_type: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'active' | 'inactive';
  value: number;
  square_footage?: number;
  contractor_id?: string;
  contractor_name?: string;
  owner_name?: string;
  address_id: string;
  address_full: string;
  city: string;
  state: string;
  zip_code: string;
  submitted_date: ISODateString;
  issued_date?: ISODateString;
  completed_date?: ISODateString;
  expiration_date?: ISODateString;
  inspection_count?: number;
  last_inspection_date?: ISODateString;
  fees_total?: number;
  fees_paid?: number;
  // Additional project-specific fields
  company_name?: string;
  start_date?: ISODateString;
  end_date?: ISODateString;
  budget?: number;
  spent?: number;
  progress?: number;
  milestone_count?: number;
}

