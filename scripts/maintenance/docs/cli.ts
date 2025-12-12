/**
 * @fileoverview CLI entry point for unified docs maintenance tools
 * @description Command-line interface for documentation generation, enhancement, and normalization
 */

import { isDefined } from '../_utils/guards';
import { enhanceReadmes } from './tasks/enhance';
import { generateReadmes } from './tasks/generate';
import { normalizeFrontmatter } from './tasks/normalize';
import type { EnhanceOptions, GenerateOptions, NormalizeOptions } from './types';

/**
 * Main CLI entry point for docs maintenance tools
 */
export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];

  if (!command) {
    printHelp();
    throw new Error('No command specified');
  }

  try {
    switch (command) {
      case 'generate':
        await handleGenerate(args.slice(1));
        break;
      case 'enhance':
        await handleEnhance(args.slice(1));
        break;
      case 'normalize':
        await handleNormalize(args.slice(1));
        break;
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`❌ Command failed: ${error}`);
    throw error; // Re-throw instead of process.exit
  }
}

/**
 * Handle generate command
 */
async function handleGenerate(args: string[]): Promise<void> {
  const options: GenerateOptions = parseCommonOptions(args);

  // Parse generate-specific options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--domains' && args[i + 1]) {
      const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
      if (isDefined(domainsValue)) {
        options.domains = domainsValue;
      }
    } else if (arg === '--skip-existing') {
      options.skipExisting = true;
    }
  }

  console.log('🚀 Generating README files...');
  const results = await generateReadmes(options);

  printResultsSummary(results);
}

/**
 * Handle enhance command
 */
async function handleEnhance(args: string[]): Promise<void> {
  const options: EnhanceOptions = parseCommonOptions(args);

  // Parse enhance-specific options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--skip-existing') {
      options.skipExisting = true;
    }
  }

  console.log('🚀 Enhancing README files...');
  const results = await enhanceReadmes(options);

  printResultsSummary(results);
}

/**
 * Handle normalize command
 */
async function handleNormalize(args: string[]): Promise<void> {
  const options: NormalizeOptions = parseCommonOptions(args);

  // Parse normalize-specific options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force') {
      options.force = true;
    }
  }

  console.log('🚀 Normalizing frontmatter...');
  const results = await normalizeFrontmatter(options);

  printResultsSummary(results);
}

/**
 * Parse common options shared across commands
 */
function parseCommonOptions(args: string[]): any {
  const options: any = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--include' && args[i + 1]) {
      const includeValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
      if (isDefined(includeValue)) {
        options.include = includeValue;
      }
    } else if (arg === '--exclude' && args[i + 1]) {
      const excludeValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
      if (isDefined(excludeValue)) {
        options.exclude = excludeValue;
      }
    }
  }

  return options;
}

/**
 * Print results summary
 */
function printResultsSummary(results: Array<{ changed: boolean; errors: string[] }>): void {
  const changedCount = results.filter(r => r.changed).length;
  const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${results.length}`);
  console.log(`   Files changed: ${changedCount}`);
  console.log(`   Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log(`\n❌ Errors:`);
    results.forEach((result, index) => {
      if (result.errors.length > 0) {
        console.error(`   File ${index + 1}: ${result.errors.join(', ')}`);
      }
    });
  }
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
📖 Docs Maintenance Tools

Usage: tsx scripts/maintenance/docs/cli.ts <command> [options]

Commands:
  generate    Generate README files with export tables and metadata
  enhance     Enhance README files with rich frontmatter and structure
  normalize   Normalize and fix malformed frontmatter
  help        Show this help message

Options:
  --check         Run in check mode (validate without writing changes)
  --write         Write changes to files (required for actual modifications)
  --verbose       Enable verbose logging
  --include <patterns>  Include only files matching patterns (comma-separated)
  --exclude <patterns>  Exclude files matching patterns (comma-separated)

Generate-specific options:
  --domains <domains>   Generate only for specified domains (comma-separated)
  --skip-existing       Skip files that are already enhanced

Enhance-specific options:
  --skip-existing       Skip files that are already enhanced

Normalize-specific options:
  --force              Force normalization even if no changes needed

Examples:
  # Check all README files for generation needs
  tsx scripts/maintenance/docs/cli.ts generate --check

  # Generate READMEs for lib and components domains
  tsx scripts/maintenance/docs/cli.ts generate --write --domains lib,components

  # Enhance all README files
  tsx scripts/maintenance/docs/cli.ts enhance --write

  # Normalize frontmatter across all files
  tsx scripts/maintenance/docs/cli.ts normalize --write --force

  # Check specific files only
  tsx scripts/maintenance/docs/cli.ts enhance --check --include "lib/**/README.md"
  `);
}

// Run CLI when executed directly
// tsx provides import.meta.main, otherwise always run for CLI scripts
if (typeof import.meta.main === 'undefined' || import.meta.main) {
  runCli().catch(err => {
    console.error('❌ Script failed:', (err as Error).message);
    process.exit(1);
  });
}

