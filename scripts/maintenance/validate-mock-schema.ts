// scripts/maintenance/validate-mock-schema.ts
// Node-only: Validate that generated mock JSON files have all required fields from column configs.
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Known optional/computed fields that may not exist in mock data
 * These are fields that are computed at runtime or are optional
 */
const KNOWN_OPTIONAL_FIELDS: Record<string, Set<string>> = {
  projects: new Set([
    'effective_year', // Can be computed from effective_date
    'effective_month', // Can be computed from effective_date
    'project_classification_summary', // May be computed
  ]),
  companies: new Set([
    'headcount', // May not be in source data
    'company_description', // May not be in source data
    'job_value_growth_ttm', // Computed field
    'project_count_growth_ttm', // Computed field
    'avg_job_value_growth_ttm', // Computed field
    'job_value_2023', // Historical data, may be optional
    'project_count_2023', // Historical data, may be optional
    'job_value_2024', // Historical data, may be optional
    'job_value_growth_2024', // Computed field
    'project_count_2024', // Historical data, may be optional
    'project_count_growth_2024', // Computed field
    'avg_job_value_2024', // Historical data, may be optional
    'avg_job_value_growth_ttm', // Computed field
    'company_url', // Optional field
    'linkedin_url', // Optional field
  ]),
  addresses: new Set([
    'city', // May need to be parsed from full_address
    'state', // May need to be parsed from full_address
    'zipcode', // May need to be parsed from full_address
    'property_type_major_category', // May not be in source data
    'property_type_sub_category', // May not be in source data
    'full_address_has_numbers', // Computed field
  ]),
};

async function getColumnConfigAccessors(entity: string): Promise<string[]> {
  switch (entity) {
    case 'projects': {
      const mod = await import('../../lib/entities/projects/columns.config');
      return mod.PROJECTS_COLUMNS.map((col: { accessor: string }) => col.accessor);
    }
    case 'companies': {
      const mod = await import('../../lib/entities/companies/columns.config');
      return mod.COMPANIES_COLUMNS.map((col: { accessor: string }) => col.accessor);
    }
    case 'addresses': {
      const mod = await import('../../lib/entities/addresses/columns.config');
      return mod.ADDRESSES_COLUMNS.map((col: { accessor: string }) => col.accessor);
    }
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

async function validateMockSchema(entity: string): Promise<boolean> {
  const root = process.cwd();
  const mockPath = path.resolve(root, 'public', '__mockdb__', `${entity}.json`);

  try {
    const jsonContent = await fs.readFile(mockPath, 'utf8');
    const rows = JSON.parse(jsonContent) as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      console.error(`[validate-mock-schema] ERROR: ${entity}.json is empty`);
      return false;
    }

    const sampleRow = rows[0] as Record<string, unknown>;
    const accessors = await getColumnConfigAccessors(entity);
    const optionalFields = KNOWN_OPTIONAL_FIELDS[entity] || new Set<string>();

    const missingFields: string[] = [];
    for (const accessor of accessors) {
      if (!(accessor in sampleRow) && !optionalFields.has(accessor)) {
        missingFields.push(accessor);
      }
    }

    if (missingFields.length > 0) {
      console.error(`[validate-mock-schema] ERROR: ${entity}.json is missing required fields:`);
      for (const field of missingFields) {
        console.error(`  - ${field}`);
      }
      console.error(`[validate-mock-schema] Available fields in sample row: ${Object.keys(sampleRow).join(', ')}`);
      return false;
    }

    console.log(`[validate-mock-schema] ✓ ${entity}: All required fields present (${accessors.length} accessors checked)`);
    return true;
  } catch (err) {
    console.error(`[validate-mock-schema] ERROR: Failed to validate ${entity}:`, err);
    return false;
  }
}

async function main() {
  const entities = ['projects', 'companies', 'addresses'];
  let allValid = true;

  for (const entity of entities) {
    const isValid = await validateMockSchema(entity);
    if (!isValid) {
      allValid = false;
    }
  }

  if (!allValid) {
    console.error('[validate-mock-schema] Validation failed. Please regenerate mock JSON files.');
    process.exitCode = 1;
    return;
  }

  console.log('[validate-mock-schema] ✓ All mock schemas are valid');
}

main().catch((err) => {
  console.error('[validate-mock-schema] Fatal error:', err);
  process.exitCode = 1;
});
