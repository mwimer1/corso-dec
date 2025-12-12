// lib/mocks/normalize.ts
// Pure mappers from raw JSON → app records

// normalizeProject function removed as unused

/**
 * Normalize a raw company JSON record to the expected CompanyRow shape
 */
export function normalizeCompany(raw: Record<string, unknown>): Record<string, unknown> {
  // Handle legacy field mapping
  const contractor_id = (raw as any)['contractor_id'] || (raw as any)['id_contractor'] || '';
  const job_value_ttm = (raw as any)['job_value_ttm'] || (raw as any)['total_value'] || null;

  return {
    contractor_id: String(contractor_id),
    contractor_name: String((raw as any)['contractor_name'] || ''),
    headcount: typeof (raw as any)['headcount'] === 'number' ? (raw as any)['headcount'] : null,
    job_value_ttm,
  };
}

/**
 * Normalize a raw address JSON record to the expected AddressRow shape
 */
export function normalizeAddress(raw: Record<string, unknown>): Record<string, unknown> {
  // Handle legacy field mapping
  const full_address = (raw as any)['full_address'] || (raw as any)['property_address_type_key'] || '';

  return {
    full_address: String(full_address),
    city: String((raw as any)['city'] || ''),
    state: String((raw as any)['state'] || ''),
    zipcode: String((raw as any)['zipcode'] || ''),
    property_type_major_category: String((raw as any)['property_type_major_category'] || ''),
  };
}

