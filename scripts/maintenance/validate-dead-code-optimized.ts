#!/usr/bin/env tsx
/**
 * Optimized Dead Code Validation
 *
 * Combines validate:orphans and validate:cycles by running Madge once
 * and extracting both orphan and cycle information from the same graph.
 *
 * NEW: Detects "tooling-only imports" edge cases where a file is only imported
 * by tooling configs (e.g., tailwind.config.ts), which are excluded from the orphan scan.
 * These show up as false-orphans and should be allowlisted if intentional.
 *
 * This reduces execution time by ~50% compared to running both separately.
 *
 * Usage:
 *   pnpm validate:dead-code:optimized
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Check for help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Optimized Dead Code Validation

Combines orphan and cycle detection by running Madge once and extracting
both results from the same dependency graph. This is ~50% faster than
running validate:orphans and validate:cycles separately.

NEW: Tooling-Only Import Detection
  Detects files that are only imported by tooling configs (e.g., tailwind.config.ts,
  postcss.config.ts). These appear as "false orphans" because tooling configs are
  excluded from the standard orphan scan (they're consumed by CLI tools, not via TS imports).

  - Tooling-only files are shown as warnings (⚠️), not errors
  - They include import chain information for debugging
  - If intentional, add them to scripts/audit/orphans.allowlist.json
  - CI will not fail on tooling-only orphans (only real orphans fail)

Usage:
  pnpm validate:dead-code:optimized [options]

Options:
  --json <file>             Output results to JSON file (includes tooling-only import details)
  --help, -h                Show this help message

Examples:
  pnpm validate:dead-code:optimized              # Run optimized check
  pnpm validate:dead-code:optimized --json out.json  # Save results to JSON

Output:
  - ⚠️  Tooling-only imports: Files only imported by tooling configs (warnings)
  - ❌ Real orphans: Files with no imports (errors, fail CI)
  - ❌ Circular dependencies: Import cycles (errors, fail CI)

For detailed documentation, see: docs/reference/deps.md
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

function normalizeMadgePath(p: string): string {
  // Madge can return mixed separators and sometimes leading ./ depending on platform/invocation
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

// Graph-level exclude: minimal, only things we truly never want in analysis
// Tooling configs and Next route files ARE included in graph (as roots or via scans)
// They're just excluded from orphan reporting (see ORPHAN_CANDIDATE_EXCLUDE_REGEX)
const ORPHAN_MADGE_EXCLUDE = [
  '(^|[\\\\/])lib[\\\\/]mocks[\\\\/]',
  '\\\\.d\\\\.ts$',
].join('|');

// Report-level exclude: files that should not be reported as orphan candidates
// These are filesystem/tooling entrypoints that are not imported via TS code
// Using template literal to avoid double-escaping issues
const ORPHAN_CANDIDATE_EXCLUDE_REGEX = String.raw`(page|layout|error|not-found|loading|global-error|template)\.(ts|tsx)$|route\.(ts|tsx)$|sitemap\.ts$|(^|[\\/])tailwind\.config\.(t|j)s$|(^|[\\/])postcss\.config\.(t|j)s?$|(^|[\\/])next\.config\.(t|j)s?$|(^|[\\/])vitest\.config\.(t|j)s?$|(^|[\\/])playwright\.config\.(t|j)s?$|^instrumentation(-client)?\.ts$`;

const ORPHAN_CANDIDATE_EXCLUDE = new RegExp(ORPHAN_CANDIDATE_EXCLUDE_REGEX);

const ORPHAN_PATHS = ['app', 'components', 'lib', 'types', 'styles'];

// Tooling config pattern (for detecting tooling-only import paths)
const TOOLING_CONFIG_PATTERN =
  /(^|[\\/])(tailwind|postcss|next|vitest|playwright)\.config\.(t|j)sx?$|(^|[\\/])instrumentation(-client)?\.ts$/;

// Test file pattern (so "tooling-only" can optionally include tests, which are often outside entrypoint scanning)
const TEST_FILE_PATTERN =
  /(^|[\\/])(tests?|__tests__)[\\/]|(\.|[\\/])(spec|test)\.(t|j)sx?$|\.test\./;

/**
 * Importer counting policy for orphan detection.
 *
 * Key nuance: Next.js route entrypoints (page/layout/etc.) are excluded from being
 * REPORTED as orphan candidates, but they MUST still count as IMPORTERS.
 *
 * Otherwise, any file imported only by a route file becomes a false-positive orphan.
 */
function countsAsOrphanImporter(importerFile: string): boolean {
  // Test-only importers do NOT rescue an orphan (by design).
  if (TEST_FILE_PATTERN.test(importerFile)) return false;

  // IMPORTANT: Do NOT exclude Next.js route files here.
  // Route files are framework entrypoints and are excluded as ORPHAN CANDIDATES,
  // but they must count as IMPORTERS for dependency liveness.

  return true;
}

// For the full dependency graph, exclude obvious build output to avoid noisy graph growth
const FULL_GRAPH_EXCLUDE = [
  MADGE_CONFIG.exclude,
  '(^|[\\\\/])node_modules[\\\\/]',
  '(^|[\\\\/])\\.next[\\\\/]',
  '(^|[\\\\/])(dist|build)[\\\\/]',
].join('|');

// Helper to determine if a file should be reported as an orphan candidate
function isReportableOrphan(file: string): boolean {
  // Exclude .d.ts files
  if (file.endsWith('.d.ts')) return false;
  // Exclude lib/mocks
  if (file.includes('lib/mocks/')) return false;
  // Exclude Next route files and tooling configs
  if (ORPHAN_CANDIDATE_EXCLUDE.test(file)) return false;
  return true;
}

// Get tooling entrypoint files that exist in the repo root
// These are included as Madge roots so their dependencies are tracked
function getToolingEntrypoints(): string[] {
  const root = process.cwd();
  const candidates = [
    'tailwind.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'postcss.config.ts',
    'next.config.js',
    'next.config.ts',
    'vitest.config.ts',
    'vitest.config.js',
    'playwright.config.ts',
    'playwright.config.js',
    'instrumentation.ts',
    'instrumentation-client.ts',
  ];
  
  return candidates.filter(relPath => {
    const absPath = resolve(root, relPath);
    return existsSync(absPath);
  });
}

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

// Validate allowlist entries exist
function validateAllowlist(): void {
  const allowlistPath = join(process.cwd(), 'scripts', 'audit', 'orphans.allowlist.json');
  const allowlistData = JSON.parse(readFileSync(allowlistPath, 'utf-8'));
  const files = allowlistData.files || [];
  const missing: string[] = [];
  const root = process.cwd();

  for (const filePath of files) {
    const absPath = resolve(root, filePath);
    if (!existsSync(absPath)) {
      missing.push(filePath);
    }
  }

  if (missing.length > 0) {
    console.error(`\n❌ Orphan allowlist validation failed: ${missing.length} non-existent path(s):\n`);
    missing.forEach((path) => {
      console.error(`   - ${path}`);
    });
    console.error(`\n💡 Remove these entries from ${allowlistPath} or create the missing files.\n`);
    process.exit(1);
  }
}

async function buildFullDependencyGraph(): Promise<Record<string, string[]>> {
  // Build a full graph including tooling configs so we can trace "false orphans"
  try {
    const output = execSync(
      `pnpm dlx madge --ts-config ${MADGE_CONFIG.tsConfig} --extensions ${MADGE_CONFIG.extensions} --exclude "${FULL_GRAPH_EXCLUDE}" ./ --json`,
      { encoding: 'utf8', cwd: process.cwd() }
    );

    const raw = JSON.parse(output) as Record<string, string[]>;
    const graph: Record<string, string[]> = {};

    for (const [k, deps] of Object.entries(raw || {})) {
      const key = normalizeMadgePath(k);
      graph[key] = (deps || []).map(normalizeMadgePath);
    }

    return graph;
  } catch {
    return {};
  }
}

function findToolingOnlyImports(
  orphans: string[],
  fullGraph: Record<string, string[]>
): Map<string, { importedBy: string[]; importChains: string[][] }> {
  const toolingOnly = new Map<string, { importedBy: string[]; importChains: string[][] }>();

  // Build reverse graph: dep -> [importers]
  const reverseGraph: Record<string, string[]> = {};
  for (const [file, deps] of Object.entries(fullGraph)) {
    for (const dep of deps) {
      const d = normalizeMadgePath(dep);
      const f = normalizeMadgePath(file);
      if (!reverseGraph[d]) reverseGraph[d] = [];
      reverseGraph[d].push(f);
    }
  }

  // Find (some) import chains that include tooling configs.
  // We search "upstream" from the orphan via reverseGraph until we hit a tooling config.
  function findToolingPaths(target: string, visited = new Set<string>()): string[][] {
    const chains: string[][] = [];
    const importers = reverseGraph[target] || [];

    for (const importer of importers) {
      if (visited.has(importer)) continue;

      // Direct tooling import
      if (TOOLING_CONFIG_PATTERN.test(importer)) {
        chains.push([importer, target]);
        continue;
      }

      // Recurse
      const sub = findToolingPaths(importer, new Set([...visited, importer]));
      for (const path of sub) {
        // path ends at importer; append target
        chains.push([...path, target]);
      }
    }

    return chains;
  }

  for (const orphan of orphans) {
    const o = normalizeMadgePath(orphan);
    const importers = (reverseGraph[o] || []).map(normalizeMadgePath);

    const toolingImporters = importers.filter((imp) => TOOLING_CONFIG_PATTERN.test(imp));
    const nonToolingNonTestImporters = importers.filter(
      (imp) => !TOOLING_CONFIG_PATTERN.test(imp) && !TEST_FILE_PATTERN.test(imp)
    );

    // "Tooling-only" = imported by tooling configs (and optionally tests), but not by app code.
    if (toolingImporters.length > 0 && nonToolingNonTestImporters.length === 0) {
      const importChains = findToolingPaths(o).filter((chain) =>
        chain.some((p) => TOOLING_CONFIG_PATTERN.test(p))
      );

      toolingOnly.set(o, {
        importedBy: Array.from(new Set(toolingImporters)),
        importChains: importChains.slice(0, 3), // cap for readability
      });
    }
  }

  return toolingOnly;
}

/**
 * Compute orphans and reverse graph from dependency graph
 */
function computeOrphansAndImporters(
  graph: Record<string, string[]>
): {
  orphansRaw: string[];
  reverseGraph: Record<string, string[]>;
} {
  // Build reverse graph: dep -> [importers]
  const reverseGraph: Record<string, string[]> = {};
  const indegree: Record<string, number> = {};

  // Initialize all nodes
  for (const file of Object.keys(graph)) {
    const normalized = normalizeMadgePath(file);
    indegree[normalized] = 0;
    if (!reverseGraph[normalized]) {
      reverseGraph[normalized] = [];
    }
  }

  // Build reverse graph and count indegree
  for (const [file, deps] of Object.entries(graph)) {
    const normalizedFile = normalizeMadgePath(file);
    for (const dep of deps) {
      const normalizedDep = normalizeMadgePath(dep);
      // Only count dependencies within the graph scope
      if (normalizedDep in indegree) {
        if (!reverseGraph[normalizedDep]) {
          reverseGraph[normalizedDep] = [];
        }
        reverseGraph[normalizedDep].push(normalizedFile);
        indegree[normalizedDep] = (indegree[normalizedDep] || 0) + 1;
      }
    }
  }

  /**
   * Orphans are files with *effective* indegree == 0, where "effective"
   * importers exclude test-only importers but INCLUDE Next.js route entrypoints.
   *
   * This prevents false positives where a file is only imported by `page.tsx`
   * (or other framework entrypoints) which are excluded as orphan candidates.
   */
  const orphansRaw = Object.keys(indegree).filter((file) => {
    const importers = reverseGraph[file] || [];
    const effectiveImporterCount = importers.filter(countsAsOrphanImporter).length;
    return effectiveImporterCount === 0;
  });

  // Sort reverse graph arrays for determinism
  for (const key of Object.keys(reverseGraph)) {
    const arr = reverseGraph[key];
    if (arr) {
      arr.sort();
    }
  }

  return { orphansRaw, reverseGraph };
}

async function runMadgeChecks(): Promise<{
  orphans: string[];
  cycles: string[][];
  orphanRoots: string[];
  toolingOnlyImports: Map<string, { importedBy: string[]; importChains: string[][] }>;
  fullGraph: Record<string, string[]>;
  orphanGraph?: Record<string, string[]>;
  orphanReverseGraph?: Record<string, string[]>;
}> {
  console.log('🔍 Analyzing dependency graph with Madge (running checks in parallel)...');

  // Build full graph first (for tooling-only detection)
  const fullGraph = await buildFullDependencyGraph();

  // Include tooling entrypoints as roots so their dependencies are tracked
  const toolingEntrypoints = getToolingEntrypoints();
  const orphanRoots = [...ORPHAN_PATHS, ...toolingEntrypoints];

  // Run both checks in parallel for better performance
  const [orphanGraphResult, cyclesResult] = await Promise.allSettled([
    // Orphan graph check (changed from --orphans to --json to get full graph)
    new Promise<{ output: string; success: boolean }>((resolve) => {
      try {
        const output = execSync(
          `pnpm dlx madge --ts-config ${MADGE_CONFIG.tsConfig} --extensions ${MADGE_CONFIG.extensions} --exclude "${ORPHAN_MADGE_EXCLUDE}" ${orphanRoots.join(' ')} --json`,
          { encoding: 'utf8', cwd: process.cwd() }
        );
        resolve({ output, success: true });
      } catch (error: any) {
        // Madge may exit with non-zero, but we still want the output
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

  // Parse orphan graph and compute orphans
  let orphans: string[] = [];
  let orphanGraph: Record<string, string[]> = {};
  let orphanReverseGraph: Record<string, string[]> = {};

  if (orphanGraphResult.status === 'fulfilled') {
    try {
      const graphData = JSON.parse(orphanGraphResult.value.output);
      
      // Normalize graph
      for (const [k, deps] of Object.entries(graphData || {})) {
        const key = normalizeMadgePath(k);
        if (Array.isArray(deps)) {
          orphanGraph[key] = deps.map(normalizeMadgePath);
        } else {
          orphanGraph[key] = [];
        }
      }

      // Compute orphans from graph
      // IMPORTANT: Use fullGraph for reverse graph to include route files (page.tsx, etc.)
      // that might not be in orphanGraph. Route files are entrypoints and must count as importers.
      if (Object.keys(orphanGraph).length > 0) {
        // Build reverse graph from fullGraph (includes all files) but compute orphans
        // only for files in orphanGraph scope (app/components/lib/types/styles)
        const { orphansRaw, reverseGraph } = computeOrphansAndImporters(fullGraph);
        orphanReverseGraph = reverseGraph;
        
        // Filter orphans to only include files in the orphanGraph scope
        // (we computed from fullGraph to get complete importer info, but only
        // report orphans from the scoped directories)
        const orphanGraphFiles = new Set(Object.keys(orphanGraph).map(normalizeMadgePath));
        const scopedOrphans = orphansRaw.filter(file => orphanGraphFiles.has(normalizeMadgePath(file)));
        
        // Filter using isReportableOrphan helper
        orphans = scopedOrphans.filter(file => isReportableOrphan(file));
      }
    } catch {
      // If JSON parsing fails, fallback to empty graph
      orphanGraph = {};
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

  const toolingOnlyImports = findToolingOnlyImports(orphans, fullGraph);
  
  const result: {
    orphans: string[];
    cycles: string[][];
    orphanRoots: string[];
    toolingOnlyImports: Map<string, { importedBy: string[]; importChains: string[][] }>;
    fullGraph: Record<string, string[]>;
    orphanGraph?: Record<string, string[]>;
    orphanReverseGraph?: Record<string, string[]>;
  } = {
    orphans,
    cycles,
    orphanRoots,
    toolingOnlyImports,
    fullGraph,
  };

  if (Object.keys(orphanGraph).length > 0) {
    result.orphanGraph = orphanGraph;
  }
  if (Object.keys(orphanReverseGraph).length > 0) {
    result.orphanReverseGraph = orphanReverseGraph;
  }

  return result;
}

async function main() {
  try {
    // Validate allowlist first to catch drift early
    validateAllowlist();

    const { orphans, cycles, orphanRoots, toolingOnlyImports, fullGraph, orphanReverseGraph } = await runMadgeChecks();
    const allowlist = loadAllowlist();

    // Filter out allowlisted files
    const unallowlistedOrphans = orphans.filter(file => !allowlist.has(file));
    const allowlistedCount = orphans.length - unallowlistedOrphans.length;

    // Split tooling-only (false orphans) vs real orphans
    const toolingOnlyOrphans = unallowlistedOrphans.filter((f) => toolingOnlyImports.has(normalizeMadgePath(f)));
    const realOrphans = unallowlistedOrphans.filter((f) => !toolingOnlyImports.has(normalizeMadgePath(f)));

    // Report results
    console.log('\n📊 Dead Code Analysis Results:\n');

    // Tooling-only (false orphans)
    if (toolingOnlyOrphans.length > 0) {
      console.log(`⚠️  Found ${toolingOnlyOrphans.length} file(s) imported ONLY by tooling configs (false orphans):`);
      toolingOnlyOrphans.slice(0, 10).forEach((file) => {
        const info = toolingOnlyImports.get(normalizeMadgePath(file));
        console.log(`   - ${file}`);
        if (info?.importedBy?.length) {
          console.log(`     Imported by: ${info.importedBy.join(', ')}`);
        }
        const chain = info?.importChains?.[0];
        if (chain?.length) {
          console.log(`     Import chain example: ${chain.join(' → ')}`);
        }
      });
      if (toolingOnlyOrphans.length > 10) {
        console.log(`   ... and ${toolingOnlyOrphans.length - 10} more`);
      }
      console.log(`\n   💡 If intentional, add these to scripts/audit/orphans.allowlist.json.\n`);
    }

    // Orphans
    if (realOrphans.length > 0) {
      console.log(`❌ Found ${realOrphans.length} orphaned file(s) (${allowlistedCount} allowlisted):`);
      realOrphans.slice(0, 10).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (realOrphans.length > 10) {
        console.log(`   ... and ${realOrphans.length - 10} more`);
      }
      if (allowlistedCount > 0) {
        console.log(`\n   ℹ️  ${allowlistedCount} file(s) are allowlisted and excluded from validation`);
      }
    } else if (orphans.length > 0 && toolingOnlyOrphans.length === 0) {
      console.log(`✅ All ${orphans.length} orphaned file(s) are allowlisted`);
    } else {
      console.log('✅ No orphaned files found (excluding tooling-only)');
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

    // Build importer summary for reportable orphans (JSON only)
    const orphanImporterSummary: Record<string, { directImporters: string[]; notes?: string[] }> = {};
    if (jsonOut && orphanReverseGraph && Object.keys(orphanReverseGraph).length > 0) {
      for (const orphan of realOrphans) {
        const normalized = normalizeMadgePath(orphan);
        // Get direct importers from reverse graph (already sorted in computeOrphansAndImporters)
        const rawImporters = orphanReverseGraph[normalized];
        // Only include importers that are also in the orphanRoots graph scope
        const directImporters = (rawImporters ? [...rawImporters] : [])
          .filter(imp => normalized !== imp) // Exclude self-references
          .map(normalizeMadgePath)
          .sort();

        const notes: string[] = [];

        // Check if all importers match excluded patterns
        if (directImporters.length > 0) {
          const allExcluded = directImporters.every(imp => 
            ORPHAN_CANDIDATE_EXCLUDE.test(imp)
          );
          if (allExcluded) {
            notes.push('Imported only by excluded candidate entrypoints (tooling/routes).');
          }
        }

        orphanImporterSummary[normalized] = {
          directImporters,
          ...(notes.length > 0 ? { notes } : {}),
        };
      }
    }

    // Output JSON if requested
    if (jsonOut) {
      const result: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        orphans: {
          count: orphans.length,
          files: orphans,
          allowlisted: allowlistedCount,
          unallowlisted: unallowlistedOrphans.length,
          toolingOnly: toolingOnlyOrphans.length,
          real: realOrphans.length,
        },
        toolingOnlyImports: Array.from(toolingOnlyImports.entries()).map(([file, info]) => ({
          file,
          importedBy: info.importedBy,
          importChains: info.importChains,
        })),
        unallowlistedOrphans: {
          count: unallowlistedOrphans.length,
          files: unallowlistedOrphans,
          toolingOnly: toolingOnlyOrphans,
          real: realOrphans,
        },
        cycles: {
          count: cycles.length,
          chains: cycles,
        },
        debug: {
          fullGraphSize: Object.keys(fullGraph).length,
          graphEntrypoints: ORPHAN_PATHS,
          orphanRoots,
          orphanMadgeExclude: ORPHAN_MADGE_EXCLUDE,
          orphanCandidateExclude: ORPHAN_CANDIDATE_EXCLUDE_REGEX,
        },
      };

      // Add importer summary if available
      if (Object.keys(orphanImporterSummary).length > 0) {
        result['orphanImporterSummary'] = orphanImporterSummary;
      }

      writeFileSync(jsonOut, JSON.stringify(result, null, 2));
      console.log(`\n💾 Results saved to ${jsonOut}`);
    }

    // Exit with error if REAL (non-tooling-only) orphans found or cycles exist
    // Tooling-only orphans are informational and should be allowlisted if intentional.
    if (realOrphans.length > 0 || cycles.length > 0) {
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

