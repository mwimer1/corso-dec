#!/usr/bin/env tsx
/**
 * @fileoverview CI script to validate TypeScript path aliases
 * @description Checks that all path aliases in tsconfig.json point to existing files
 * and reports missing/orphaned aliases with readable diff output
 */

import { globby } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { reportCheckFailures } from './check-common';

interface TSConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  orphaned: string[];
  totalAliases: number;
  validAliases: number;
}

/**
 * Resolve glob patterns to actual file paths
 */
async function resolveGlob(pattern: string, baseDir: string): Promise<string[]> {
  const results = await globby(pattern, { cwd: baseDir, gitignore: true, onlyFiles: true });
  if (results.length > 0) return results;
  return [pattern];
}

/**
 * Check if a path exists, handling both files and directories
 */
function pathExists(filePath: string, baseDir: string): boolean {
  const fullPath = path.resolve(baseDir, filePath);

  // Direct file check
  if (fs.existsSync(fullPath)) {
    return true;
  }

  // Try with common extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (fs.existsSync(fullPath + ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate all path aliases in tsconfig.json
 */
async function validateAliases(): Promise<ValidationResult> {
  const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found in current directory');
  }

  const tsconfig: TSConfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const paths = tsconfig.compilerOptions?.paths || {};

  const missing: string[] = [];
  const orphaned: string[] = [];
  let validAliases = 0;
  let totalAliases = 0;

  console.log('🔍 Validating TypeScript path aliases...\n');

  for (const [alias, targets] of Object.entries(paths)) {
    totalAliases++;
    let hasValidTarget = false;

    // Special case: @/* → * is a valid wildcard alias (resolves to baseUrl)
    if (alias === '@/*' && targets.includes('*')) {
      hasValidTarget = true;
    } else {
      for (const target of targets) {
        const resolvedPaths = await resolveGlob(target, process.cwd());
        for (const resolvedPath of resolvedPaths) {
          if (pathExists(resolvedPath, process.cwd())) {
            hasValidTarget = true;
            break;
          }
        }
        if (hasValidTarget) break;
      }
    }

    if (hasValidTarget) {
      validAliases++;
      console.log(`✅ ${alias}`);
    } else {
      missing.push(alias);
      orphaned.push(...targets);
      console.log(`❌ ${alias} → ${targets.join(', ')}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    orphaned,
    totalAliases,
    validAliases
  };
}


// Main execution
async function main() {
  try {
    const result = await validateAliases();
    if (!result.valid) {
      reportCheckFailures([{
        success: false,
        message: 'Path alias validation failed',
        details: [
          `Missing aliases: ${result.missing.join(', ')}`,
          `Orphaned paths: ${result.orphaned.join(', ')}`
        ]
      }], 'Path alias validation');
    }

    console.log('\n🎉 All path aliases are valid!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error validating aliases:', error);
    process.exit(1);
  }
}

main();

export { validateAliases, type ValidationResult };

