import { RawProjectCsvRow } from '@/lib/mocks/mappers/projects.adapter';
import { normalizeProject } from '@/lib/mocks/normalize';
import { describe, expect, it } from 'vitest';

const sample = {
  date_effective: '6/7/2000',
  date_last_updated: '6/20/2022',
  date_created_atm: '3/1/2020',
  id_permit_og: 'M-000518',
  id_permit_atm: 4915197,
  id_property_atm: 41484487,
  permit_type: 'Mechanical',
  permit_sub_type: 'Apartment',
  description: 'Change 2 outside air conditioning units eg',
  project_name: null,
  status: 'CLOSED',
  job_value: 1000,
  fees: 35,
  company_name: 'M&L Electrical Contractors',
  property_owner: 'Kerem Tepecik',
  property_type_description: 'APARTMENT HOUSE (5+ UNITS)',
  propery_type_major_category: 'Commercial',
  property_type_sub_category: 'MULTI 5+',
  address_type_description: 'STANDARD US',
  subdivision: 'MAMMEN PARK ESTATES',
  cbsa_name: 'DALLAS-FORT WORTH-ARLINGTON, TX',
  county_name: 'Dallas',
  city_state: 'IRVING, TX',
  full_mailing_address: '220 ALPINE CT, IRVING, TX 75060',
  address1: '220 ALPINE CT',
  house_number: 220,
  street_direction: null,
  street_name: 'ALPINE',
  city: 'IRVING',
  state: 'TX',
  zipcode: 75060,
  zipcode4: 2200,
  latitude: 32.813444,
  longitude: -96.985653,
  adu: 0,
  electrical_work: 1,
  hvac: 1,
  mechanical_work: 1,
  residential: 0,
  row_id: 205624,
} as const;

describe('normalizeProject', () => {
  it('handles null strings and 0/1 booleans', () => {
    const parsed = RawProjectCsvRow.parse(sample);
    const normalized = normalizeProject(parsed);
    expect(normalized.project_name).toBe('');
    expect(parsed.hvac).toBe(true);
    expect(parsed.electrical_work).toBe(true);
    expect(parsed.residential).toBe(false);
    expect(normalized.property_type_major_category).toBe('Commercial'); // aliased
  });
});

