// lib/api/mock-normalizers.ts
// Normalization functions for mock data to ensure complete, realistic datasets
// Only applied when loading from public/__mockdb__ JSON files

/**
 * Simple deterministic hash function for seeding random number generation
 * Based on string input, returns a number between 0 and 1
 */
function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

/**
 * Deterministic random number generator seeded by a string
 */
function seededRandom(seed: string): () => number {
  let value = hashSeed(seed);
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Selects a random element from an array using seeded random
 */
function seededChoice<T>(arr: T[], seed: string): T {
  const rng = seededRandom(seed);
  const index = Math.floor(rng() * arr.length);
  const result = arr[index];
  if (result === undefined) {
    throw new Error(`Array index ${index} is out of bounds`);
  }
  return result;
}

/**
 * Generates a realistic construction/trades company name
 */
function generateCompanyName(seed: string): string {
  const rng = seededRandom(seed);
  
  const prefixes = [
    'Summit', 'Front Range', 'Rocky Mountain', 'Prairie', 'Canyon', 'Silver Peak',
    'Red Rocks', 'Pikes Peak', 'Copper Creek', 'Boulder', 'Denver', 'Colorado',
    'Mountain View', 'High Country', 'Alpine', 'Evergreen', 'Aspen', 'Vail'
  ] as const;
  
  const companyTypes = [
    'Mechanical', 'Plumbing & Heating', 'Electric', 'Construction', 'Builders',
    'Home Builders', 'Custom Homes', 'General Contractors', 'Fence & Gate',
    'Pool & Spa', 'Roofing', 'HVAC', 'Power Systems', 'Plumbing', 'Heating & Air',
    'Construction Group', 'Builders LLC', 'Contractors', 'Development'
  ] as const;
  
  const suffixes = ['LLC', 'Inc.', 'Co.', 'Group', 'Company', 'Services'] as const;
  
  const useSuffix = rng() > 0.3;
  const usePrefix = rng() > 0.4;
  
  if (usePrefix && useSuffix) {
    return `${seededChoice([...prefixes], seed + '1')} ${seededChoice([...companyTypes], seed + '2')} ${seededChoice([...suffixes], seed + '3')}`;
  } else if (usePrefix) {
    return `${seededChoice([...prefixes], seed + '1')} ${seededChoice([...companyTypes], seed + '2')}`;
  } else if (useSuffix) {
    return `${seededChoice([...companyTypes], seed + '1')} ${seededChoice([...suffixes], seed + '2')}`;
  } else {
    // Sometimes use a person's name
    const firstNames = ['Reynolds', 'Englewood', 'Young', 'Garcia', 'Zimmerman', 'Nguyen', 'Iverson', 'Anderson', 'Martinez', 'Thompson'] as const;
    const lastNames = ['Mechanical', 'Construction', 'Builders', 'Contractors', 'Services', 'Group'] as const;
    return `${seededChoice([...firstNames], seed + '1')} ${seededChoice([...lastNames], seed + '2')}`;
  }
}

/**
 * Generates a company description based on company type and cities
 */
function generateCompanyDescription(companyName: string, topCities: string | undefined, seed: string): string {
  // Extract city names from top_cities if available
  const cities = topCities 
    ? topCities.split(',').map(c => {
        const parts = c.split('(');
        return parts[0] ? parts[0].trim() : c.trim();
      }).filter((c): c is string => !!c).slice(0, 2)
    : ['the region'];
  
  const cityStr = cities.length > 1 && cities[0] && cities[1]
    ? `${cities[0]} & ${cities[1]}`
    : (cities[0] || 'the region');
  
  const companyType = companyName.toLowerCase();
  let serviceType = 'construction services';
  let specialization = '';
  
  if (companyType.includes('mechanical') || companyType.includes('hvac') || companyType.includes('heating')) {
    serviceType = 'HVAC and mechanical services';
    specialization = seededChoice([
      'design/build, installation, and maintenance',
      'commercial and residential HVAC services',
      'heating, ventilation, and air conditioning solutions'
    ], seed + 'spec');
  } else if (companyType.includes('plumbing')) {
    serviceType = 'plumbing services';
    specialization = seededChoice([
      'residential and commercial plumbing',
      'plumbing & drain services',
      'licensed plumbing contractor'
    ], seed + 'spec');
  } else if (companyType.includes('electric') || companyType.includes('power')) {
    serviceType = 'electrical services';
    specialization = seededChoice([
      'licensed electrical contractor',
      'electrical installation and service',
      'residential and commercial electrical work'
    ], seed + 'spec');
  } else if (companyType.includes('build') || companyType.includes('construction')) {
    serviceType = 'construction services';
    specialization = seededChoice([
      'residential builder specializing in new construction',
      'general contractor serving',
      'custom home builder and construction'
    ], seed + 'spec');
  } else if (companyType.includes('fence')) {
    serviceType = 'fencing services';
    specialization = 'fence installation and gate systems';
  } else if (companyType.includes('pool')) {
    serviceType = 'pool and spa services';
    specialization = 'pool construction and spa installation';
  } else {
    serviceType = 'construction and contracting services';
    specialization = 'serving';
  }
  
  return `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} ${specialization} ${cityStr}.`;
}

/**
 * Generates a realistic headcount based on project count and job value
 */
function generateHeadcount(projectCount: number | undefined, jobValue: number | undefined, seed: string): number {
  const rng = seededRandom(seed);
  
  // Base headcount on project count and job value
  let base = 5;
  
  if (projectCount !== undefined && projectCount > 0) {
    // Roughly 1 employee per 2-5 projects for small companies, 1 per 5-10 for large
    base = Math.max(5, Math.min(600, Math.floor(projectCount / (3 + rng() * 2))));
  }
  
  if (jobValue !== undefined && jobValue > 0) {
    // Roughly $15k-$50k revenue per employee
    const valueBased = Math.max(5, Math.min(600, Math.floor(jobValue / (20000 + rng() * 30000))));
    base = Math.max(base, valueBased);
  }
  
  // Add some variation
  const variation = Math.floor(rng() * 10) - 5;
  return Math.max(1, base + variation);
}

/**
 * Generates growth percentage as decimal (-0.25 to +0.80, most around -0.05 to +0.20)
 */
function generateGrowth(seed: string): number {
  const rng = seededRandom(seed);
  
  // 70% chance of being in the normal range (-0.05 to +0.20)
  if (rng() < 0.7) {
    return -0.05 + rng() * 0.25;
  }
  
  // 20% chance of being in extended range
  if (rng() < 0.9) {
    return -0.15 + rng() * 0.35;
  }
  
  // 10% chance of extreme values
  return -0.25 + rng() * 1.05;
}

/**
 * Generates a company URL from company name
 */
function generateCompanyUrl(companyName: string, seed: string): string {
  const rng = seededRandom(seed);
  
  // Convert company name to URL-friendly format
  const urlName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/llc|inc|co|group|company|services/g, '');
  
  const domains = ['com', 'net', 'co'];
  const domain = seededChoice(domains, seed + 'domain');
  
  return `https://www.${urlName}.${domain}`;
}

/**
 * Generates a LinkedIn URL from company name
 */
function generateLinkedInUrl(companyName: string, seed: string): string {
  const urlName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/llc|inc|co|group|company|services/g, '');
  
  return `https://www.linkedin.com/company/${urlName}`;
}

/**
 * Checks if a string looks like a code/token (short alphanumeric, no spaces)
 */
function isTokenLike(str: string | undefined): boolean {
  if (!str || typeof str !== 'string') return true;
  // Token-like: 6-12 chars, alphanumeric only, no spaces, mostly lowercase/uppercase mix
  return /^[A-Za-z0-9]{6,12}$/.test(str) && !/\s/.test(str) && str.length < 20;
}

/**
 * Normalizes a company row from mock JSON to ensure all required fields are present
 * and company_name is a realistic formatted name (not a token).
 * 
 * This function is deterministic - same input always produces same output.
 */
export function normalizeCompanyRow(
  row: Record<string, unknown>,
  index: number
): Record<string, unknown> {
  // Use company_id as primary seed, fallback to company_name or index
  const companyId = String(row['company_id'] || row['company_name'] || `C${String(index + 1).padStart(4, '0')}`);
  const seed = companyId;
  const rng = seededRandom(seed);
  
  // Preserve existing values or generate new ones
  const normalized: Record<string, unknown> = { ...row };
  
  // Ensure company_id exists
  if (!normalized['company_id']) {
    normalized['company_id'] = companyId.startsWith('C') ? companyId : `C${String(index + 1).padStart(4, '0')}`;
  }
  
  // Fix company_name if it's token-like
  const currentName = String(normalized['company_name'] || '');
  if (isTokenLike(currentName) || !normalized['company_name']) {
    normalized['company_name'] = generateCompanyName(seed + 'name');
  }
  
  // Generate headcount if missing
  if (!normalized['headcount'] || normalized['headcount'] === null) {
    normalized['headcount'] = generateHeadcount(
      normalized['project_count_ttm'] as number | undefined,
      normalized['job_value_ttm'] as number | undefined,
      seed + 'headcount'
    );
  }
  
  // Generate company_description if missing
  if (!normalized['company_description'] || normalized['company_description'] === null) {
    normalized['company_description'] = generateCompanyDescription(
      normalized['company_name'] as string,
      normalized['top_cities'] as string | undefined,
      seed + 'desc'
    );
  }
  
  // Generate growth fields if missing
  if (!normalized['job_value_growth_ttm'] || normalized['job_value_growth_ttm'] === null) {
    normalized['job_value_growth_ttm'] = generateGrowth(seed + 'value_growth');
  }
  
  if (!normalized['project_count_growth_ttm'] || normalized['project_count_growth_ttm'] === null) {
    normalized['project_count_growth_ttm'] = generateGrowth(seed + 'count_growth');
  }
  
  if (!normalized['avg_job_value_growth_ttm'] || normalized['avg_job_value_growth_ttm'] === null) {
    normalized['avg_job_value_growth_ttm'] = generateGrowth(seed + 'avg_growth');
  }
  
  // Generate 2023/2024 fields if missing (derive from TTM + growth)
  const jobValueTtm = (normalized['job_value_ttm'] as number) || 0;
  const projectCountTtm = (normalized['project_count_ttm'] as number) || 0;
  const valueGrowth = (normalized['job_value_growth_ttm'] as number) || 0;
  const countGrowth = (normalized['project_count_growth_ttm'] as number) || 0;
  
  if (!normalized['job_value_2023'] || normalized['job_value_2023'] === null) {
    // Estimate 2023 as TTM * (1 - growth) with some variation
    normalized['job_value_2023'] = Math.max(0, Math.floor(jobValueTtm * (1 - valueGrowth * 0.8) * (0.9 + rng() * 0.2)));
  }
  
  if (!normalized['project_count_2023'] || normalized['project_count_2023'] === null) {
    normalized['project_count_2023'] = Math.max(0, Math.floor(projectCountTtm * (1 - countGrowth * 0.8) * (0.9 + rng() * 0.2)));
  }
  
  if (!normalized['job_value_2024'] || normalized['job_value_2024'] === null) {
    normalized['job_value_2024'] = Math.max(0, Math.floor(jobValueTtm * (1 - valueGrowth * 0.3) * (0.95 + rng() * 0.1)));
  }
  
  if (!normalized['job_value_growth_2024'] || normalized['job_value_growth_2024'] === null) {
    normalized['job_value_growth_2024'] = generateGrowth(seed + 'value_growth_2024');
  }
  
  if (!normalized['project_count_2024'] || normalized['project_count_2024'] === null) {
    normalized['project_count_2024'] = Math.max(0, Math.floor(projectCountTtm * (1 - countGrowth * 0.3) * (0.95 + rng() * 0.1)));
  }
  
  if (!normalized['project_count_growth_2024'] || normalized['project_count_growth_2024'] === null) {
    normalized['project_count_growth_2024'] = generateGrowth(seed + 'count_growth_2024');
  }
  
  if (!normalized['avg_job_value_2024'] || normalized['avg_job_value_2024'] === null) {
    const avgValueTtm = (normalized['avg_value_ttm'] as number) || 0;
    normalized['avg_job_value_2024'] = Math.max(0, avgValueTtm * (0.95 + rng() * 0.1));
  }
  
  // Generate URLs if missing (optional fields for hidden columns)
  if (!normalized['company_url'] || normalized['company_url'] === null) {
    normalized['company_url'] = generateCompanyUrl(normalized['company_name'] as string, seed + 'url');
  }
  
  if (!normalized['linkedin_url'] || normalized['linkedin_url'] === null) {
    normalized['linkedin_url'] = generateLinkedInUrl(normalized['company_name'] as string, seed + 'linkedin');
  }
  
  // Preserve all other fields exactly as they are
  return normalized;
}

/**
 * Parses a date string in various formats and extracts year and month
 * Supports formats like "12/19/2000", "2000-12-19", "2000/12/19"
 */
function parseDateFields(dateStr: string | undefined | null): { year: number | null; month: number | null } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { year: null, month: null };
  }

  try {
    // Try parsing as MM/DD/YYYY or M/D/YYYY
    const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match1 = dateStr.match(mmddyyyy);
    if (match1) {
      const month = parseInt(match1[1]!, 10);
      const year = parseInt(match1[3]!, 10);
      if (month >= 1 && month <= 12 && year > 1900 && year < 2100) {
        return { year, month };
      }
    }

    // Try parsing as YYYY-MM-DD or YYYY/MM/DD
    const yyyymmdd = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;
    const match2 = dateStr.match(yyyymmdd);
    if (match2) {
      const year = parseInt(match2[1]!, 10);
      const month = parseInt(match2[2]!, 10);
      if (month >= 1 && month <= 12 && year > 1900 && year < 2100) {
        return { year, month };
      }
    }

    // Try parsing as Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      if (year > 1900 && year < 2100) {
        return { year, month };
      }
    }
  } catch {
    // Fall through to return null
  }

  return { year: null, month: null };
}

/**
 * Normalizes a project row from mock JSON to ensure computed fields are present
 * Specifically computes effective_year and effective_month from effective_date
 * 
 * This function is deterministic and only adds missing fields.
 */
export function normalizeProjectRow(
  row: Record<string, unknown>,
  _index: number
): Record<string, unknown> {
  // Preserve existing values
  const normalized: Record<string, unknown> = { ...row };

  // Only compute if fields are missing (don't overwrite existing values)
  if (!normalized['effective_year'] || normalized['effective_year'] === null) {
    const effectiveDate = normalized['effective_date'];
    const { year } = parseDateFields(
      typeof effectiveDate === 'string' ? effectiveDate : undefined
    );
    normalized['effective_year'] = year;
  }

  if (!normalized['effective_month'] || normalized['effective_month'] === null) {
    const effectiveDate = normalized['effective_date'];
    const { month } = parseDateFields(
      typeof effectiveDate === 'string' ? effectiveDate : undefined
    );
    normalized['effective_month'] = month;
  }

  // Preserve all other fields exactly as they are
  return normalized;
}

/**
 * Parses a full address string into components
 * Supports formats like "2386 Main Dr, McKinney, TX 75069"
 * Returns parsed components or null if parsing fails
 */
function parseFullAddress(fullAddress: string | undefined | null): {
  street: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
} {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return { street: null, city: null, state: null, zipcode: null };
  }

  try {
    // Pattern: "STREET, CITY, STATE ZIPCODE" or "STREET, CITY, STATE  ZIPCODE"
    // Examples: "2386 Main Dr, McKinney, TX 75069"
    const pattern = /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
    const match = fullAddress.match(pattern);
    
    if (match) {
      return {
        street: match[1]?.trim() || null,
        city: match[2]?.trim() || null,
        state: match[3]?.trim() || null,
        zipcode: match[4]?.trim() || null,
      };
    }

    // Fallback: try to extract at least city, state, zip from end
    // Pattern: ", CITY, STATE ZIP" at the end
    const endPattern = /,\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
    const endMatch = fullAddress.match(endPattern);
    
    if (endMatch) {
      const street = fullAddress.substring(0, fullAddress.indexOf(',')).trim();
      return {
        street: street || null,
        city: endMatch[1]?.trim() || null,
        state: endMatch[2]?.trim() || null,
        zipcode: endMatch[3]?.trim() || null,
      };
    }
  } catch {
    // Fall through to return null
  }

  return { street: null, city: null, state: null, zipcode: null };
}

/**
 * Checks if an address string contains numbers (suitable for mailers)
 */
function hasAddressNumbers(address: string | undefined | null): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Check if address starts with a number or contains a number pattern
  return /^\d+/.test(address.trim()) || /\d+/.test(address);
}

/**
 * Normalizes an address row from mock JSON to ensure all required fields are present
 * Parses full_address into separate components if they're missing
 * 
 * This function is deterministic and only adds missing fields.
 */
export function normalizeAddressRow(
  row: Record<string, unknown>,
  _index: number
): Record<string, unknown> {
  // Preserve existing values
  const normalized: Record<string, unknown> = { ...row };

  const fullAddress = normalized['full_address'] as string | undefined;

  // Parse full_address if city, state, or zipcode are missing
  const needsParsing = !normalized['city'] || !normalized['state'] || !normalized['zipcode'];
  
  if (needsParsing && fullAddress) {
    const parsed = parseFullAddress(fullAddress);
    
    if (!normalized['city'] && parsed.city) {
      normalized['city'] = parsed.city;
    }
    
    if (!normalized['state'] && parsed.state) {
      normalized['state'] = parsed.state;
    }
    
    if (!normalized['zipcode'] && parsed.zipcode) {
      // Ensure zipcode is a string (column config expects string)
      normalized['zipcode'] = String(parsed.zipcode);
    }
  }

  // Ensure zipcode is a string if it exists but is a number
  if (normalized['zipcode'] && typeof normalized['zipcode'] === 'number') {
    normalized['zipcode'] = String(normalized['zipcode']);
  }

  // Compute full_address_has_numbers if missing
  if (normalized['full_address_has_numbers'] === undefined || normalized['full_address_has_numbers'] === null) {
    normalized['full_address_has_numbers'] = hasAddressNumbers(fullAddress);
  }

  // Ensure property_type_major_category exists (set to empty string if missing, not null)
  if (normalized['property_type_major_category'] === undefined || normalized['property_type_major_category'] === null) {
    normalized['property_type_major_category'] = '';
  }

  // Ensure property_type_sub_category exists (set to empty string if missing, not null)
  if (normalized['property_type_sub_category'] === undefined || normalized['property_type_sub_category'] === null) {
    normalized['property_type_sub_category'] = '';
  }

  // Preserve all other fields exactly as they are
  return normalized;
}

