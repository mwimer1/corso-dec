// lib/validators/dashboard/analytics/warehouse-entity-validation.ts
import { z } from 'zod';

/**
 * @public
 */
export const BaseRowSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).strict();

/**
 * @public
 */
export const CompanyRowSchema = BaseRowSchema.extend({
  name: z.string(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  revenue: z.number().optional(),
  employee_count: z.number().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  project_count: z.number().optional(),
  total_project_value: z.number().optional(),
  last_project_date: z.string().datetime().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
}).strict();

/**
 * @public
 */
export const AddressRowSchema = BaseRowSchema.extend({
  attom_id: z.string(),
  record_last_updated: z.string().datetime(),
  address_type_description: z.string(),
  apn_formatted: z.string(),
  built_year_at: z.number(),
  city: z.string(),
  contractor_names: z.string(),
  county_name: z.string(),
  full_address: z.string(),
  full_address_has_numbers: z.boolean(),
  homeowner_names: z.string(),
  job_count: z.number(),
  latest_permit_date: z.string().datetime(),
  latest_permit_type: z.string(),
  property_latitude: z.number(),
  property_longitude: z.number(),
  property_legal_description: z.string(),
  property_type_major_category: z.string(),
  property_type_sub_category: z.string(),
  state: z.string(),
  total_job_value: z.number(),
  zip: z.string(),
}).strict();

/**
 * @public
 */
export const ProjectRowSchema = BaseRowSchema.extend({
  name: z.string(),
  company_name: z.string(),
  status: z.enum(['active', 'inactive']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  budget: z.number(),
  spent: z.number(),
  progress: z.number(),
  milestone_count: z.number(),
}).strict();

