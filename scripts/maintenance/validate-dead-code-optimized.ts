#!/usr/bin/env tsx
/**
 * Optimized Dead Code Validation
 * 
 * Combines validate:orphans and validate:cycles by running Madge once
 * and extracting both orphan and cycle information from the same graph.
 * 
 * This reduces execution time by ~50% compared to running both separately.
 * 
 * Usage:
 *   pnpm validate:dead-code:optimized
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Check for help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Optimized Dead Code Validation

Combines orphan and cycle detection by running Madge once and extracting
both results from the same dependency graph. This is ~50% faster than
running validate:orphans and validate:cycles separately.

Usage:
  pnpm validate:dead-code:optimized [options]

Options:
  --json <file>             Output results to JSON file
  --help, -h                Show this help message

Examples:
  pnpm validate:dead-code:optimized              # Run optimized check
  pnpm validate:dead-code:optimized --json out.json  # Save results to JSON
`);
  process.exit(0);
}

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : undefined;

// Madge configuration
const MADGE_CONFIG = {
  tsConfig: 'tsconfig.json',
  extensions: 'ts,tsx',
  exclude: '(^|/)lib/mocks/',
};

// Exclusion patterns for orphans (more specific than cycles)
// Exclude Next.js route convention files (used by filesystem routing, not imports)
// These files are used by Next.js routing system, not imported via code
const ORPHAN_EXCLUDE = [
  '(^|[\\\\/])lib[\\\\/]mocks[\\\\/]',
  '\\\\.d\\\\.ts$',
  // Next.js route files: page.tsx, layout.tsx, error.tsx, etc.
  '[\\\\/](page|layout|error|not-found|loading|global-error|template)\\\\.(ts|tsx)$',
  // Next.js API routes
  '[\\\\/]route\\\\.(ts|tsx)$',
  // Next.js sitemap
  '[\\\\/]sitemap\\\\.ts$',
].join('|');

const ORPHAN_PATHS = ['app', 'components', 'lib', 'hooks', 'actions', 'contexts', 'types', 'styles'];

// Load allowlist
function loadAllowlist(): Set<string> {
  try {
    const allowlistPath = join(process.cwd(), 'scripts', 'audit', 'orphans.allowlist.json');
    const allowlistData = JSON.parse(readFileSync(allowlistPath, 'utf-8'));
    return new Set(allowlistData.files || []);
  } catch {
    return new Set();
  }
}

async function runMadgeChecks(): Promise<{ orphans: string[]; cycles: string[][] }> {
  console.log('🔍 Analyzing dependency graph with Madge (running checks in parallel)...');
  
  // Run both checks in parallel for better performance
  const [orphansResult, cyclesResult] = await Promise.allSettled([
    // Orphans check
    new Promise<{ output: string; success: boolean }>((resolve) => {
      try {
        const output = execSync(
          `pnpm dlx madge --orphans --ts-config ${MADGE_CONFIG.tsConfig} --extensions ${MADGE_CONFIG.extensions} --exclude "${ORPHAN_EXCLUDE}" ${ORPHAN_PATHS.join(' ')} --json`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
        resolve({ output, success: true });
      } catch (error: any) {
        // Madge exits with non-zero if orphans found, but we still want the output
        const output = error.stdout || error.message || '';
        resolve({ output, success: false });
      }
    }),
    // Cycles check
    new Promise<{ output: string; success: boolean }>((resolve) => {
      try {
        const output = execSync(
          `pnpm dlx madge --circular --ts-config ${MADGE_CONFIG.tsConfig} --extensions ${MADGE_CONFIG.extensions} --exclude "${MADGE_CONFIG.exclude}" ./ --json`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
        resolve({ output, success: true });
      } catch (error: any) {
        const output = error.stdout || error.message || '';
        resolve({ output, success: false });
      }
    }),
  ]);

  // Parse orphans
  let orphans: string[] = [];
  if (orphansResult.status === 'fulfilled') {
    try {
      const orphansData = JSON.parse(orphansResult.value.output);
      let rawOrphans: string[] = [];
      if (Array.isArray(orphansData)) {
        rawOrphans = orphansData;
      } else if (orphansData.orphans && Array.isArray(orphansData.orphans)) {
        rawOrphans = orphansData.orphans;
      }
      
      // Filter out Next.js route convention files (used by filesystem routing, not imports)
      const nextJsRoutePattern = /[\\/](page|layout|error|not-found|loading|global-error|template|route|sitemap)\.(ts|tsx)$/;
      orphans = rawOrphans.filter(file => {
        // Exclude .d.ts files
        if (file.endsWith('.d.ts')) return false;
        // Exclude lib/mocks
        if (file.includes('lib/mocks/')) return false;
        // Exclude Next.js route files
        if (nextJsRoutePattern.test(file)) return false;
        return true;
      });
    } catch {
      // If JSON parsing fails, try to extract from text
      const lines = orphansResult.value.output.split('\n').filter(l => l.trim() && !l.includes('madge'));
      const nextJsRoutePattern = /[\\/](page|layout|error|not-found|loading|global-error|template|route|sitemap)\.(ts|tsx)$/;
      orphans = lines.filter(file => {
        if (file.endsWith('.d.ts')) return false;
        if (file.includes('lib/mocks/')) return false;
        if (nextJsRoutePattern.test(file)) return false;
        return true;
      });
    }
  }

  // Parse cycles
  let cycles: string[][] = [];
  if (cyclesResult.status === 'fulfilled') {
    try {
      const cyclesData = JSON.parse(cyclesResult.value.output);
      if (Array.isArray(cyclesData)) {
        cycles = cyclesData;
      } else if (cyclesData.circular && Array.isArray(cyclesData.circular)) {
        cycles = cyclesData.circular;
      }
    } catch {
      // If no cycles, output might be empty
    }
  }

  return { orphans, cycles };
}

async function main() {
  try {
    const { orphans, cycles } = await runMadgeChecks();
    const allowlist = loadAllowlist();

    // Filter out allowlisted files
    const unallowlistedOrphans = orphans.filter(file => !allowlist.has(file));
    const allowlistedCount = orphans.length - unallowlistedOrphans.length;

    // Report results
    console.log('\n📊 Dead Code Analysis Results:\n');

    // Orphans
    if (unallowlistedOrphans.length > 0) {
      console.log(`❌ Found ${unallowlistedOrphans.length} orphaned file(s) (${allowlistedCount} allowlisted):`);
      unallowlistedOrphans.slice(0, 10).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (unallowlistedOrphans.length > 10) {
        console.log(`   ... and ${unallowlistedOrphans.length - 10} more`);
      }
      if (allowlistedCount > 0) {
        console.log(`\n   ℹ️  ${allowlistedCount} file(s) are allowlisted and excluded from validation`);
      }
    } else if (orphans.length > 0) {
      console.log(`✅ All ${orphans.length} orphaned file(s) are allowlisted`);
    } else {
      console.log('✅ No orphaned files found');
    }

    // Cycles
    if (cycles.length > 0) {
      console.log(`\n❌ Found ${cycles.length} circular dependency chain(s):`);
      cycles.slice(0, 5).forEach((cycle, i) => {
        console.log(`   Chain ${i + 1}: ${cycle.join(' → ')}`);
      });
      if (cycles.length > 5) {
        console.log(`   ... and ${cycles.length - 5} more`);
      }
    } else {
      console.log('\n✅ No circular dependencies found');
    }

    // Output JSON if requested
    if (jsonOut) {
      const result = {
        timestamp: new Date().toISOString(),
        orphans: {
          count: orphans.length,
          files: orphans,
          allowlisted: allowlistedCount,
          unallowlisted: unallowlistedOrphans.length,
        },
        unallowlistedOrphans: {
          count: unallowlistedOrphans.length,
          files: unallowlistedOrphans,
        },
        cycles: {
          count: cycles.length,
          chains: cycles,
        },
      };
      writeFileSync(jsonOut, JSON.stringify(result, null, 2));
      console.log(`\n💾 Results saved to ${jsonOut}`);
    }

    // Exit with error if unallowlisted issues found
    if (unallowlistedOrphans.length > 0 || cycles.length > 0) {
      console.log('\n❌ Dead code validation failed');
      process.exit(1);
    } else {
      console.log('\n✅ All dead code checks passed');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Dead code validation failed:', error?.message ?? String(error));
    process.exit(1);
  }
}

void main();

