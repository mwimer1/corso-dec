#!/usr/bin/env tsx
/**
 * @fileoverview Validate barrel export integrity in lib/ domains
 * @description Ensures all exports from domain index.ts files resolve to files within the same domain
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const LIB_DIR = join(process.cwd(), 'lib');

/**
 * Extract export statements from a barrel file
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  // Match different export patterns
  const exportPatterns = [
    // export * from './module'
    /export\s+\*\s+from\s+['"]([^'"]+)['"]/g,
    // export { name } from './module'
    /export\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
    // export { name }
    /export\s+\{[^}]*\}/g,
  ];

  for (const pattern of exportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        // This is an export from another module
        exports.push(match[1]);
      }
    }
  }

  return exports;
}

/**
 * Check if a path resolves to a file within the same domain
 */
function isValidDomainExport(domainPath: string, exportPath: string): boolean {
  // Resolve relative path from domain root
  const absoluteExportPath = join(domainPath, exportPath);

  // Check if the file exists
  try {
    require.resolve(absoluteExportPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate barrel exports for a domain
 */
async function validateDomainBarrel(domainName: string): Promise<{ valid: boolean; errors: string[] }> {
  const domainPath = join(LIB_DIR, domainName);
  const indexPath = join(domainPath, 'index.ts');

  const errors: string[] = [];

  try {
    // Check if index.ts exists
    await stat(indexPath);

    // Read the barrel file
    const content = await readFile(indexPath, 'utf-8');

    // Extract export statements
    const exports = extractExports(content);

    // Validate each export
    for (const exportPath of exports) {
      if (!isValidDomainExport(domainPath, exportPath)) {
        errors.push(`Export '${exportPath}' does not resolve to a file within domain '${domainName}'`);
      }
    }

  } catch (error) {
    errors.push(`Failed to read or parse ${domainName}/index.ts: ${error}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Main validation function
 */
async function checkBarrels(): Promise<{ success: boolean; errors: string[] }> {
  const allErrors: string[] = [];

  console.log('🔍 Validating barrel exports in lib/ domains...\n');

  // Get all directories in lib/
  const libEntries = await readdir(LIB_DIR, { withFileTypes: true });
  const domainDirs = libEntries.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'));

  console.log(`Checking ${domainDirs.length} domains for barrel integrity`);

  // Validate each domain
  for (const domain of domainDirs) {
    const result = await validateDomainBarrel(domain.name);

    if (!result.valid) {
      allErrors.push(...result.errors.map(error => `  ${domain.name}/: ${error}`));
    }
  }

  // Report results
  if (allErrors.length === 0) {
    console.log('✅ All barrel exports are valid');
    console.log(`✅ Checked ${domainDirs.length} domains, all exports resolve correctly`);
    return { success: true, errors: [] };
  } else {
    console.error('❌ Barrel validation failed:');
    allErrors.forEach(error => console.error(error));
    return { success: false, errors: allErrors };
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const result = await checkBarrels();

    if (!result.success) {
      console.error('\n❌ Barrel validation failed');
      process.exit(1);
    } else {
      console.log('\n✅ Barrel validation passed');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Unexpected error during barrel validation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}


