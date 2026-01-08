#!/usr/bin/env tsx
/**
 * Validation script for mock database setup
 * Checks that all required JSON files exist and are valid
 */

import * as fs from 'fs';
import * as path from 'path';

const MOCK_DB_DIR = path.join(process.cwd(), 'public', '__mockdb__');
const REQUIRED_FILES = ['projects.json', 'companies.json', 'addresses.json'] as const;

function validateMockDb(): { success: boolean; errors: string[]; info: string[] } {
  const errors: string[] = [];
  const info: string[] = [];

  // Check if directory exists
  if (!fs.existsSync(MOCK_DB_DIR)) {
    errors.push(`Mock DB directory not found: ${MOCK_DB_DIR}`);
    return { success: false, errors, info };
  }

  info.push(`✓ Mock DB directory exists: ${MOCK_DB_DIR}`);

  // Check each required file
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(MOCK_DB_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing file: ${file}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        errors.push(`${file}: Invalid format (expected array)`);
        continue;
      }

      info.push(`✓ ${file}: Valid JSON with ${data.length} records`);
      
      // Check if records have org_id (or if it will be injected)
      if (data.length > 0) {
        const firstRecord = data[0] as Record<string, unknown>;
        if ('org_id' in firstRecord) {
          info.push(`  → Contains org_id field (will use existing)`);
        } else {
          info.push(`  → No org_id field (will be injected by mock DB)`);
        }
      }
    } catch (error) {
      errors.push(`${file}: Invalid JSON - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    info,
  };
}

// Run validation
const result = validateMockDb();

console.log('\n📊 Mock DB Validation Results\n');
console.log('='.repeat(50));

if (result.info.length > 0) {
  console.log('\n✅ Validations:');
  result.info.forEach(msg => console.log(`  ${msg}`));
}

if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  result.errors.forEach(msg => console.log(`  ${msg}`));
}

console.log('\n' + '='.repeat(50));

if (result.success) {
  console.log('\n✅ Mock DB setup is valid!\n');
  console.log('To enable mock DB, set in .env.local:');
  console.log('  CORSO_USE_MOCK_DB=true');
  console.log('  CORSO_MOCK_ORG_ID=demo-org  # Optional\n');
  process.exit(0);
} else {
  console.log('\n❌ Mock DB setup has errors. Please fix them before using mock DB.\n');
  process.exit(1);
}
