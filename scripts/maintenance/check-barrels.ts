#!/usr/bin/env tsx
/**
 * @fileoverview Validate barrel export integrity in lib/ domains
 * @description Ensures all exports from domain index.ts files resolve to files within the same domain.
 * Also checks for intradomain root barrel circular dependencies.
 * 
 * Consolidates:
 * - Barrel export integrity validation (original check-barrels.ts)
 * - Intradomain root barrel import validation (from verify-intradomain-barrels.ts)
 */

import { globby } from 'globby';
import { readFileSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';

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
 * Validates intradomain root barrel imports (from verify-intradomain-barrels.ts)
 * Prevents circular dependencies by detecting when domain index files import their own root barrel
 */
async function checkIntradomainBarrels(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const aliasRoots = [
    ['lib', '@/lib/'],
    ['components', '@/components/'],
    ['types', '@/types/'],
  ] as const;

  const domainIndexes = await globby([
    'lib/*/index.ts',
    'components/*/index.ts',
    'types/*/index.ts',
  ], { gitignore: true });

  for (const file of domainIndexes) {
    const src = readFileSync(file, 'utf8');
    const dir = dirname(file).split(posix.sep).pop()!;
    const lines = src.split('\n');

    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('import ')) continue;
      const m = line.match(/from\s+['"]([^'"]+)['"]/);
      if (!m) continue;
      const spec = m[1];
      if (!spec || spec.startsWith('./') || spec.startsWith('../')) continue;
      for (const [root, alias] of aliasRoots) {
        if (file.startsWith(`${root}/`)) {
          if (spec === `${alias}${dir}` || spec.startsWith(`${alias}${dir}/`)) {
            errors.push(`${file}: imports its own domain root barrel (${spec}) -> avoid cycles`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('Intradomain root barrel check failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    return { success: false, errors };
  }

  console.log('✅ Intradomain root barrel check passed');
  return { success: true, errors: [] };
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const intradomainOnly = args.includes('--intradomain-only') || args.includes('--intradomain');

  try {
    if (intradomainOnly) {
      // When --intradomain-only flag is used, only run intradomain check
      const result = await checkIntradomainBarrels();
      if (!result.success) {
        console.error('\n❌ Intradomain barrel validation failed');
        process.exit(1);
      } else {
        console.log('\n✅ Intradomain barrel validation passed');
        process.exit(0);
      }
    } else {
      // Full validation (default)
      const [barrelResult, intradomainResult] = await Promise.all([
        checkBarrels(),
        checkIntradomainBarrels(),
      ]);

      if (!barrelResult.success || !intradomainResult.success) {
        console.error('\n❌ Barrel validation failed');
        process.exit(1);
      } else {
        console.log('\n✅ Barrel validation passed');
        process.exit(0);
      }
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


