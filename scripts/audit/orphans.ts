#!/usr/bin/env tsx
/**
 * Orphaned Files Audit Script
 *
 * Deterministically identifies files that are safe to delete by analyzing:
 * - Import references via ts-morph
 * - Next.js implicit route conventions
 * - Barrel exports and their consumers
 * - Dynamic imports
 * - Test, docs, and generator references
 * - Side-effect imports (CSS, styles)
 *
 * Usage:
 *   pnpm audit:orphans                    # Generate report only
 *   pnpm audit:orphans --apply --yes     # Apply deletions (requires --yes)
 */

import fs from 'fs-extra';
import { globby } from 'globby';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import { parseArgs } from 'node:util';
import type { SourceFile } from 'ts-morph';
import { Project } from 'ts-morph';
import { z } from 'zod';
import {
  findDynamicImports,
  isBarrelFile,
  isNextJsRoute,
  isStyleFile,
  normalizePosix,
  resolvePathAlias,
  toAbsPosix,
  toProjectRelativePosix,
} from '../audit-lib/orphan-utils';
import { COMMON_IGNORE_PATTERNS } from '../utils/constants';
import { walkDirectorySync } from '../utils/fs/walker';

/**
 * Find text references to a file path in reference directories (docs, tests, scripts, etc.)
 * Returns list of referencing files and classification (docs-only vs mixed).
 */
function findTextReferences(filePath: string, searchDirs: string[]): { found: boolean; refs: string[]; docsOnly: boolean } {
  const refs: string[] = [];
  try {
    const fileName = nodePath.basename(filePath);
    const relPath = normalizePosix(filePath);
    
    // Search patterns: filename, relative path, absolute path variants
    const searchPatterns = [
      fileName,
      relPath,
      filePath.replace(/\\/g, '/'),
      `"${relPath}"`,
      `'${relPath}'`,
      `\`${relPath}\``,
    ];

    // Use unified walker to get all files, then search them
    function searchDirectory(dir: string): void {
      try {
        // Use unified walker to get all files matching our extensions
        const result = walkDirectorySync(dir, {
          maxDepth: 20, // Reasonable depth for docs/tests/scripts
          includeFiles: true,
          includeDirs: false,
          exclude: [...COMMON_IGNORE_PATTERNS],
        });

        // Filter to files with relevant extensions
        const relevantFiles = result.files.filter(f => 
          /\.(md|txt|ts|tsx|js|jsx|json)$/.test(f)
        );

        // Search each file for patterns
        for (const fullPath of relevantFiles) {
          try {
            const content = nodeFs.readFileSync(fullPath, 'utf8');
            if (searchPatterns.some(pattern => content.includes(pattern))) {
              const relRef = toProjectRelativePosix(fullPath);
              if (!refs.includes(relRef)) {
                refs.push(relRef);
              }
            }
          } catch {
            // Skip files that can't be read
            continue;
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    for (const dirPattern of searchDirs) {
      // Remove glob patterns and search actual directories
      const dir = dirPattern.replace(/\/\*\*$/, '').replace(/\*\*/g, '');
      if (nodeFs.existsSync(dir) && nodeFs.statSync(dir).isDirectory()) {
        searchDirectory(dir);
      }
    }
  } catch {
    // Return empty on any error (conservative - don't mark as referenced if search fails)
    return { found: false, refs: [], docsOnly: false };
  }
  
  // Classify as docs-only if all references are in docs/ or README.md
  const docsOnly = refs.length > 0 && refs.every(ref => 
    ref.startsWith('docs/') || ref === 'README.md'
  );
  
  return { found: refs.length > 0, refs, docsOnly };
}

// Re-export for testing
export {
  findDynamicImports, findTextReferences, isBarrelFile, isNextJsRoute,
  isStyleFile, normalizePosix, resolvePathAlias, toAbsPosix, toProjectRelativePosix
};

// Robust resolver for module specifiers (with tiny cache)
const _resolveCache = new Map<string, string | null>();
function resolveModuleSpecifierToAbs(
  moduleSpec: string,
  importerSf: SourceFile | null,
  project: Project
): string | null {
  const cacheKey = `${importerSf?.getFilePath() ?? 'root'}::${moduleSpec}`;
  if (_resolveCache.has(cacheKey)) return _resolveCache.get(cacheKey)!;

  const tryExts = ['.ts', '.tsx', '.js', '.jsx'];
  const addIndex = (p: string) => tryExts.map(ext => `${p}/index${ext}`);

  let base = moduleSpec.replace(/\\/g, '/');
  let resolvedViaAlias = false;
  
  if (moduleSpec.startsWith('@/')) {
    // Try existing alias resolution first
    base = resolvePathAlias(moduleSpec, project);
    resolvedViaAlias = true;
    
    // Fallback: if alias resolution didn't find a file, try direct repo root mapping
    const absFromAlias = toAbsPosix(base);
    const existsFromAlias = project.getSourceFile(absFromAlias) || 
                            (nodeFs.existsSync(absFromAlias) && nodeFs.statSync(absFromAlias).isFile());
    
    if (!existsFromAlias) {
      // Fallback: @/scripts/... → scripts/...
      const repoRelative = moduleSpec.slice(2); // remove "@/"
      base = normalizePosix(nodePath.resolve(process.cwd(), repoRelative));
    }
  } else if (moduleSpec.startsWith('.')) {
    if (importerSf) {
      // Resolve relative to importer's directory
      const importerDir = nodePath.dirname(importerSf.getFilePath());
      const resolved = nodePath.resolve(importerDir, moduleSpec);
      base = normalizePosix(resolved);
    }
  } else {
    // bare path like "components/Button"
    base = base.replace(/^\.\//, '');
  }

  // If base is already absolute, use it directly; otherwise make it absolute
  const absCore = nodePath.isAbsolute(base) ? toAbsPosix(base) : toAbsPosix(nodePath.resolve(process.cwd(), base));
  
  // Handle ESM-style .js/.mjs/.cjs specifiers pointing to .ts source files
  // Example: ../maintenance/scan-roots.js should resolve to scan-roots.ts
  const jsExtMatch = absCore.match(/\.(m?js|cjs|jsx)$/);
  let core = absCore.replace(/\/+$/, ''); // trim trailing '/'
  let candidates = new Set<string>([core]);
  
  if (jsExtMatch && !nodeFs.existsSync(core)) {
    // Remove .js/.mjs/.cjs/.jsx extension and try .ts/.tsx variants
    const noExt = core.replace(/\.(m?js|cjs|jsx)$/, '');
    candidates = new Set<string>([noExt, ...tryExts.map(ext => `${noExt}${ext}`), ...addIndex(noExt)]);
  } else {
    // Normal path: try with extensions
    candidates = new Set<string>([core, ...tryExts.map(ext => `${core}${ext}`), ...addIndex(core)]);
  }

  for (const cand of candidates) {
    const abs = toAbsPosix(cand);
    const sf = project.getSourceFile(abs);
    if (sf) {
      const out = toAbsPosix(sf.getFilePath());
      _resolveCache.set(cacheKey, out);
      return out;
    }
    if (nodeFs.existsSync(abs) && nodeFs.statSync(abs).isFile()) {
      const out = toAbsPosix(abs);
      _resolveCache.set(cacheKey, out);
      return out;
    }
  }
  _resolveCache.set(cacheKey, null);
  return null;
}



export async function analyzeFile(
  filePath: string,
  project: Project,
  allowlist: Set<string>
): Promise<{
  status: 'KEEP' | 'DROP';
  reasons: string[];
  exportRefs?: Array<{ export: string; refs: number }>;
}> {
  const result = {
    status: 'DROP' as 'KEEP' | 'DROP',
    reasons: [] as string[],
    exportRefs: [] as Array<{ export: string; refs: number }>,
  };

  /**
   * Normalize possibly-missing export identifiers (e.g., anonymous default exports).
   * Ensures we always persist a `string` for `exportRefs[].export`.
   */
  function normalizeExportName(name: string | null | undefined): string {
    return typeof name === 'string' && name.trim().length > 0 ? name : 'default';
  }

  // Check allowlist
  if (allowlist.has(filePath)) {
    result.status = 'KEEP';
    result.reasons.push('KEEP_ALLOWLIST');
    return result;
  }

  // Load source file (support relative input)
  let absPath = toAbsPosix(nodePath.resolve(process.cwd(), filePath));
  let sf = project.getSourceFile(absPath);
  // If not found at resolved path, try to find by filename in the project
  if (!sf) {
    sf = project.getSourceFile(filePath) ?? project.getSourceFile(toAbsPosix(filePath));
    if (!sf) {
      // Last resort: search for file by exact basename match (handles test fixtures)
      const fileName = nodePath.basename(filePath);
      for (const candidateSf of project.getSourceFiles()) {
        if (nodePath.basename(candidateSf.getFilePath()) === fileName) {
          sf = candidateSf;
          break;
        }
      }
    }
  }
  if (!sf) {
    return result;
  }

  const fileAbs = toAbsPosix(sf.getFilePath());


  // Check if it's a Next.js route file
  if (isNextJsRoute(fileAbs)) {
    result.status = 'KEEP';
    result.reasons.push('KEEP_ROUTES_IMPLICIT');
  }

  // Note: Dynamic import detection is now handled in buildImporterMap
  // This checks if the file CONTAINS dynamic imports (less useful than checking if it's imported dynamically)
  // Keeping for backward compatibility but the real check is in importerMap

  const isBarrel = isBarrelFile(fileAbs);


  // Check if file is a barrel and has exports
  if (isBarrel) {
    // Use text-based export detection since getExportedDeclarations() may not work in test environments
    const content = sf.getFullText();
    const hasExports = /\bexport\s+/.test(content);


    if (hasExports) {
      // Check if this barrel file is imported anywhere
      const importers = project.getSourceFiles().filter((otherSf: SourceFile) => {
        if (otherSf === sf) return false;
        const imports = otherSf.getImportDeclarations();

        for (const imp of imports) {
          const moduleSpec = imp.getModuleSpecifierValue();
          const resolvedAbs = resolveModuleSpecifierToAbs(moduleSpec, otherSf, project);

          if (!resolvedAbs) continue;

          const lhs = process.platform === 'win32' ? resolvedAbs.toLowerCase() : resolvedAbs;
          const rhs1 = process.platform === 'win32' ? fileAbs.toLowerCase() : fileAbs;
          const rhs2 = rhs1.replace(/\/index\.(ts|tsx|js|jsx)$/, '');

          // Match import to barrel file (exact path or directory path without "/index")
          if (lhs === rhs1 || lhs === rhs2) {
            return true;
          }
        }
        return false;
      });


      if (importers.length > 0) {
        result.status = 'KEEP';
        result.reasons.push('KEEP_BARREL_USED');
      }
    }
  }

  // Check export references → KEEP_EXPORT_USED if any refs
  // Use text-based export detection and reference counting
  const fileContent = sf.getFullText();
  const exportMatches = fileContent.match(/\bexport\s+(?:const|let|var|function|class|default|\{[^}]*\})\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  const exportedNames = exportMatches.map(match => {
    const nameMatch = match.match(/(?:const|let|var|function|class|default|\{[^}]*\})\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return nameMatch ? nameMatch[1] : null;
  }).filter(Boolean);

  // Also check for export default and other patterns
  if (/\bexport\s+default\b/.test(fileContent)) {
    exportedNames.push('default');
  }

  if (exportedNames.length > 0) {
    // Build a simple word-boundary regex per export and scan other files' text
    const others = project.getSourceFiles().filter((f: SourceFile) => f !== sf);
    for (const name of exportedNames) {
      let refs = 0;
      const re = new RegExp(String.raw`\b${name}\b`, 'g');
      for (const f of others) {
        const text = f.getText();
        if (re.test(text)) {
          refs++;
        }
      }
      result.exportRefs.push({ export: normalizeExportName(name), refs });
    }

    if (result.exportRefs.some((r) => r.refs > 0)) {
      result.status = 'KEEP';
      result.reasons.push('KEEP_EXPORT_USED');
    }
  }

  return result;
}

// ---- Config -----------------------------------------------------------------
// keep arrays readonly at the type level, but spread when passing to APIs that require mutable string[]
const CONFIG = {
  EXCLUDE_PATTERNS: [
    '**/node_modules/**','**/.next/**','**/.turbo/**','**/dist/**','**/coverage/**','**/build/**','**/reports/**','**/cache/**',
    'scripts/codemods/_archive/**','eslint-plugin-corso/dist/**'
  ] as const,
  REFERENCE_DIRS: ['docs/**','scripts/**','tools/**','tests/**','.agent/**'] as const,
} as const;

// ---- Allowlist Loading ------------------------------------------------------
interface AllowlistData {
  description: string;
  files: string[];
  notes?: Record<string, string>;
}

function loadAllowlist(): { files: Set<string>; notes: Record<string, string> } {
  // Always load allowlist file content (files + notes) regardless of flags
  // Flags control whether allowlist is USED for KEEP decisions, not whether it's LOADED
  const allowlistPath = nodePath.resolve(process.cwd(), 'scripts', 'audit', 'orphans.allowlist.json');
  try {
    const content = nodeFs.readFileSync(allowlistPath, 'utf-8');
    const data = JSON.parse(content) as AllowlistData;
    return {
      files: new Set(data.files || []),
      notes: data.notes || {},
    };
  } catch (error) {
    console.warn(`⚠️  Warning: Could not load allowlist from ${allowlistPath}: ${error}`);
    return { files: new Set(), notes: {} };
  }
}

// ---- Importer Map Building --------------------------------------------------
/**
 * Build a map of file paths to their importers (files that import them).
 * This is the core of "real" orphan detection: if a file has importers, it's used.
 * Includes both static imports and dynamic imports.
 */
function buildImporterMap(project: Project): Map<string, string[]> {
  const importerMap = new Map<string, string[]>();
  const allSourceFiles = project.getSourceFiles();

  for (const sourceFile of allSourceFiles) {
    const sourceFilePath = sourceFile.getFilePath();
    const importerPath = toProjectRelativePosix(toAbsPosix(sourceFilePath));
    const importerRel = normalizePosix(nodePath.relative(process.cwd(), sourceFilePath));
    
    // Check all import declarations (static imports)
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpec = imp.getModuleSpecifierValue();
      const resolvedAbs = resolveModuleSpecifierToAbs(moduleSpec, sourceFile, project);
      
      if (!resolvedAbs) continue;
      
      // Convert to project-relative path (matching filteredCandidates format)
      const targetAbs = toAbsPosix(resolvedAbs);
      const targetPath = normalizePosix(nodePath.relative(process.cwd(), targetAbs));
      
      // Also check for barrel imports (directory without /index)
      const targetPathNoIndex = targetPath.replace(/\/index\.(ts|tsx|js|jsx)$/, '');
      
      // Record both exact path and barrel path
      if (!importerMap.has(targetPath)) {
        importerMap.set(targetPath, []);
      }
      if (!importerMap.get(targetPath)!.includes(importerRel)) {
        importerMap.get(targetPath)!.push(importerRel);
      }
      
      // Also record barrel-style import (directory without /index)
      const importTargetPathNoIndex = targetPath.replace(/\/index\.(ts|tsx|js|jsx)$/, '');
      if (importTargetPathNoIndex !== targetPath) {
        if (!importerMap.has(importTargetPathNoIndex)) {
          importerMap.set(importTargetPathNoIndex, []);
        }
        if (!importerMap.get(importTargetPathNoIndex)!.includes(importerRel)) {
          importerMap.get(importTargetPathNoIndex)!.push(importerRel);
        }
      }
    }

    // Check for dynamic imports (import(), require(), next/dynamic)
    const content = sourceFile.getFullText();
    const dynamicImports = findDynamicImports(content);
    
    // Also check for next/dynamic pattern: dynamic(() => import("..."))
    const nextDynamicRegex = /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = nextDynamicRegex.exec(content)) !== null) {
      if (match[1]) dynamicImports.push(match[1]);
    }
    
    // Also check for .then(m => m.ExportName) pattern after import()
    const thenPatternRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.\s*then\s*\(/g;
    while ((match = thenPatternRegex.exec(content)) !== null) {
      if (match[1]) dynamicImports.push(match[1]);
    }
    
    for (const moduleSpec of dynamicImports) {
      const resolvedAbs = resolveModuleSpecifierToAbs(moduleSpec, sourceFile, project);
      if (!resolvedAbs) continue;
      
      const targetAbs = toAbsPosix(resolvedAbs);
      const targetPath = normalizePosix(nodePath.relative(process.cwd(), targetAbs));
      const targetPathNoIndex = targetPath.replace(/\/index\.(ts|tsx|js|jsx)$/, '');
      
      // Record dynamic import
      if (!importerMap.has(targetPath)) {
        importerMap.set(targetPath, []);
      }
      if (!importerMap.get(targetPath)!.includes(importerRel)) {
        importerMap.get(targetPath)!.push(importerRel);
      }
      
      if (targetPathNoIndex !== targetPath) {
        if (!importerMap.has(targetPathNoIndex)) {
          importerMap.set(targetPathNoIndex, []);
        }
        if (!importerMap.get(targetPathNoIndex)!.includes(importerRel)) {
          importerMap.get(targetPathNoIndex)!.push(importerRel);
        }
      }
    }

    // Also check export declarations (re-exports)
    const exports = sourceFile.getExportDeclarations();
    for (const exp of exports) {
      const moduleSpec = exp.getModuleSpecifierValue();
      if (!moduleSpec) continue;
      
      const resolvedAbs = resolveModuleSpecifierToAbs(moduleSpec, sourceFile, project);
      if (!resolvedAbs) continue;
      
      const targetAbs = toAbsPosix(resolvedAbs);
      const exportTargetPath = normalizePosix(nodePath.relative(process.cwd(), targetAbs));
      const exportTargetPathNoIndex = exportTargetPath.replace(/\/index\.(ts|tsx|js|jsx)$/, '');
      
      if (!importerMap.has(exportTargetPath)) {
        importerMap.set(exportTargetPath, []);
      }
      if (!importerMap.get(exportTargetPath)!.includes(importerRel)) {
        importerMap.get(exportTargetPath)!.push(importerRel);
      }
      
      if (exportTargetPathNoIndex !== exportTargetPath) {
        if (!importerMap.has(exportTargetPathNoIndex)) {
          importerMap.set(exportTargetPathNoIndex, []);
        }
        if (!importerMap.get(exportTargetPathNoIndex)!.includes(importerRel)) {
          importerMap.get(exportTargetPathNoIndex)!.push(importerRel);
        }
      }
    }
  }

  return importerMap;
}

const ArgSchema = z.object({
  out: z.string().default('reports/orphan/orphan-report.json'),
  only: z.enum(['ALL','DROP','KEEP','REVIEW']).default('ALL'),
  apply: z.boolean().default(false),
  yes: z.boolean().default(false),
  stdout: z.boolean().default(false),
  pathsOnly: z.boolean().default(false),
  includeIndex: z.boolean().default(false),
  noAllowlist: z.boolean().default(false),
  onlyAllowlisted: z.boolean().default(false),
  quiet: z.boolean().default(false),
  ci: z.boolean().default(false),
}).strict();

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Orphaned Files Audit Script

Deterministically identifies files that are safe to delete by analyzing:
- Import references via ts-morph (real import graph analysis)
- Package.json script entrypoints (files invoked via npm/pnpm scripts)
- Next.js implicit route conventions (page.tsx, layout.tsx, route.ts, etc.)
- Barrel exports and their consumers
- Actual import/export relationships (not text search)
- Test, docs, and generator references

Usage:
  pnpm audit:orphans [options]

Options:
  --out <file>              Output file path (default: reports/orphan/orphan-report.json)
  --only <type>             Filter results: ALL, DROP, KEEP, or REVIEW (default: ALL)
  --apply                   Apply deletions (requires --yes flag)
  --yes                     Skip confirmation prompt (CI only)
  --stdout                  Output results to stdout instead of file
  --paths-only              Output only file paths (one per line)
  --include-index           Include index barrel files in analysis
  --no-allowlist            Don't auto-KEEP allowlisted files (still loads allowlist for filtering/safety)
  --only-allowlisted        Show only allowlisted files and their status (works with --no-allowlist for auditing)
  --quiet                   Suppress progress logs (keep errors visible)
  --ci                      CI mode: implies --quiet, exits 1 if DROP > 0, prints only drop paths to stdout

Examples:
  pnpm audit:orphans                              # Generate report only
  pnpm audit:orphans --only DROP                  # Show only droppable files
  pnpm audit:orphans --no-allowlist               # Show all orphans (allowlist not used for KEEP)
  pnpm audit:orphans --no-allowlist --only-allowlisted  # Audit allowlist entries (what would happen without auto-KEEP)
  pnpm audit:orphans --only-allowlisted           # Show allowlisted files and their status
  pnpm audit:orphans --apply --yes                # Apply deletions (CI)
  pnpm audit:orphans --stdout --paths-only        # List paths to stdout
  pnpm audit:orphans --ci                         # CI mode: exit 1 if DROP > 0, print only drop paths

Safety:
  - Default mode is read-only (report generation)
  - --apply requires --yes flag for safety
  - Interactive confirmation required in non-CI environments
  - Shows list of files before deletion
`);
  process.exit(0);
}

const parsed = parseArgs({
  args: process.argv.slice(2),
  options: {
    out: { type: 'string' },
    only: { type: 'string' },
    apply: { type: 'boolean' },
    yes: { type: 'boolean' },
    stdout: { type: 'boolean' },
    'paths-only': { type: 'boolean' },
    'include-index': { type: 'boolean' },
    'no-allowlist': { type: 'boolean' },
    'only-allowlisted': { type: 'boolean' },
    quiet: { type: 'boolean' },
    ci: { type: 'boolean' },
    help: { type: 'boolean' },
    h: { type: 'boolean' },
  },
  allowPositionals: true,
});

const isIndexBarrel = (p: string) => /(^|[\\/])index\.(?:t|j)sx?$/.test(p);

const argv = ArgSchema.parse({
  out: parsed.values.out,
  only: parsed.values.only as any,
  apply: parsed.values.apply,
  yes: parsed.values.yes,
  stdout: parsed.values.stdout,
  pathsOnly: parsed.values['paths-only'],
  includeIndex: parsed.values['include-index'],
  noAllowlist: parsed.values['no-allowlist'],
  onlyAllowlisted: parsed.values['only-allowlisted'],
  quiet: parsed.values.quiet ?? false,
  ci: parsed.values.ci ?? false,
});

// ---- TS project --------------------------------------------------------------
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// ---- CI mode: implies quiet --------------------------------------------------
const isQuiet = argv.quiet || argv.ci;

// Helper to conditionally log (respects quiet/ci flags)
function log(message: string): void {
  if (!isQuiet) {
    console.log(message);
  }
}

// ---- Ensure all source files are in project before building importerMap ----
// This fixes cases where script/test files aren't in ts-morph scope
log('🔍 Adding all source files to project...');
// Include test files so they can act as importers (e.g., tests importing lib files)
const allSourceFiles = await globby(
  ['**/*.{ts,tsx,js,jsx}'],
  { ignore: [...CONFIG.EXCLUDE_PATTERNS] }
);
for (const relPath of allSourceFiles) {
  const absPath = nodePath.resolve(process.cwd(), relPath);
  if (!project.getSourceFile(absPath)) {
    try {
      project.addSourceFileAtPath(absPath);
    } catch {
      // Skip files that can't be added (e.g., invalid syntax, missing deps)
      continue;
    }
  }
}
log(`   Added ${allSourceFiles.length} source files to project\n`);

// ---- Load allowlist ----------------------------------------------------------
// Always load allowlist data (files + notes) for filtering and safety checks
// Flags control whether allowlist is USED for KEEP decisions (useAllowlistForKeep)
const { files: allowlistFiles, notes: allowlistNotes } = loadAllowlist();
const useAllowlistForKeep = !argv.noAllowlist;

// ---- Build importer map ------------------------------------------------------
log('🔍 Building importer map...');
const importerMap = buildImporterMap(project);
log(`   Found ${importerMap.size} files with importers\n`);

// ---- Build package.json entrypoint map ---------------------------------------
log('🔍 Building package.json entrypoint map...');
const packageEntrypoints = buildPackageScriptEntrypointMap();
log(`   Found ${packageEntrypoints.size} files referenced by package.json scripts\n`);

// ---- Build workflow entrypoint map (optional, low-maintenance) ---------------
log('🔍 Building workflow entrypoint map...');
const workflowEntrypoints = buildWorkflowEntrypointMap();
log(`   Found ${workflowEntrypoints.size} files referenced by workflows\n`);

// ---- Build script-to-script execution entrypoint map -------------------------
log('🔍 Building script execution entrypoint map...');
const scriptExecEntrypoints = buildScriptExecEntrypointMap(project);
log(`   Found ${scriptExecEntrypoints.size} files invoked by scripts\n`);

// ---- Discover candidates -----------------------------------------------------
const candidates = await globby(
  ['**/*.{ts,tsx,js,jsx}'],
  { ignore: [...CONFIG.EXCLUDE_PATTERNS] }
);
// Convention files that should be excluded from orphan detection
// (consumed by tooling/CLI, not imported via TS)
const CONVENTION_FILE_PATTERNS = [
  /^next-env\.d\.ts$/,                      // Next.js generated types
  /^instrumentation(-client)?\.ts$/,        // Next.js instrumentation hooks
  /^playwright\.config\./,                  // Playwright E2E test config
  /^tailwind\.config\./,                    // Tailwind CSS config (root level)
  /^.*[\\/]tailwind\.config\.(t|j)s$/,     // Tailwind CSS config (anywhere, e.g., styles/tailwind.config.ts)
  /^postcss\.config\./,                     // PostCSS config
  /^vitest\.config\./,                      // Vitest test config
  /^config\/postcss\.config\.js$/,          // Root PostCSS config
  /^public\/mockServiceWorker\.js$/,        // MSW worker (URL referenced)
  /^types\/.*\.d\.ts$/,                     // Type declarations (module augmentation)
  /^config\/domain-map\.ts$/,               // Architecture config (dependency-cruiser)
] as const;

const filteredCandidates = candidates.filter((rel: string) => {
  if (!argv.includeIndex && isIndexBarrel(rel)) return false;
  // Exclude convention files (tooling/CLI consumed, not TS imported)
  if (CONVENTION_FILE_PATTERNS.some(pattern => pattern.test(rel))) return false;
  // Exclude test files (discovered by Vitest glob patterns, not via imports)
  // Test files are entrypoints for the test runner, not production code modules
  if (rel.startsWith('tests/')) return false;
  return true;
});

type FileStatus = 'DROP' | 'KEEP' | 'REVIEW';
type KeepReason =
  | 'KEEP_IMPORT_USED'        // File is imported by other files (real usage)
  | 'KEEP_ROUTES_IMPLICIT'    // Next.js route convention file
  | 'KEEP_BARREL_USED'        // Barrel file that is imported
  | 'KEEP_ALLOWLIST'          // Explicitly allowlisted
  | 'KEEP_ENTRYPOINT_PACKAGE_JSON'  // File is invoked via package.json script
  | 'KEEP_TEST_VITEST'        // Test file executed by vitest
  | 'KEEP_DYNAMIC_IMPORT'     // File is dynamically imported by other files
  | 'KEEP_ENTRYPOINT_WORKFLOW' // File is directly invoked in GitHub workflows
  | 'KEEP_ENTRYPOINT_SCRIPT_EXEC' // File is invoked by script-to-script execution
  | 'REVIEW_TEXT_REF';         // Referenced in docs/tests/scripts (not code import)

const results: Array<{
  path: string;
  status: FileStatus;
  reasons: KeepReason[];
  importers: string[];
  exportRefs: Array<{ export: string; refs: number }>;
  notes?: string;
}> = [];

function resolveFromBase(relativePath: string, baseUrl?: string) {
  return nodePath.resolve(baseUrl ?? '.', relativePath);
}

// ---- Package.json Entrypoint Detection ---------------------------------------
/**
 * Tokenize shell-like command string, preserving quoted substrings.
 * Supports "double" and 'single' quotes. No escape handling needed for our scripts.
 */
function shellTokenize(input: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === undefined) continue;

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (cur.length) {
        out.push(cur);
        cur = '';
      }
      continue;
    }

    cur += ch;
  }

  if (cur.length) out.push(cur);
  return out;
}

/**
 * Split command string on shell operators (&&, ||, ;, |).
 */
function splitShellSegments(cmd: string): string[] {
  const normalized = cmd.replace(/\\/g, '/');
  // Split on &&, ||, ;, |  (simple is fine; our scripts rarely have these inside quotes)
  return normalized
    .split(/\s*(?:&&|\|\||;|\|)\s*/g)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Check if path has a runnable extension.
 */
function isRunnableExt(p: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p);
}

/**
 * Normalize relative path (remove leading ./, normalize slashes).
 */
function normalizeRelPath(p: string): string {
  let s = p.trim().replace(/\\/g, '/');
  s = s.replace(/^\.\/+/, ''); // remove leading ./
  return s;
}

/**
 * Extract entrypoint file paths from a package.json script value.
 * Handles patterns like: tsx scripts/foo.ts, pnpm tsx scripts/foo.ts, node scripts/foo.mjs, etc.
 */
function extractEntrypointPathsFromScriptValue(value: string): string[] {
  const results = new Set<string>();

  for (const seg of splitShellSegments(value)) {
    const tokens = shellTokenize(seg);
    if (tokens.length === 0) continue;

    // Normalize tokens too (filter out any undefined/null values)
    const t = tokens.map(tok => normalizeRelPath(tok)).filter((tok): tok is string => Boolean(tok));

    // Helper: add candidate if it looks like a local file
    const maybeAdd = (candidate: string | undefined) => {
      if (!candidate) return;
      const p = normalizeRelPath(candidate);
      if (!isRunnableExt(p)) return;
      if (
        p.startsWith('scripts/') ||
        p.startsWith('.github/') ||
        p.startsWith('docs/_scripts/')
      ) {
        results.add(p);
      }
    };

    // Handle patterns:
    // 1) tsx <file>
    // 2) node <file>
    // 3) pnpm tsx <file>
    // 4) pnpm exec tsx <file>
    // 5) pnpm exec node <file>
    //
    // Skip pnpm dlx <tool> ... (not local)
    for (let i = 0; i < t.length; i++) {
      const tok = t[i];
      if (!tok) continue;

      if (tok === 'tsx' || tok.endsWith('/tsx')) {
        maybeAdd(t[i + 1]);
        continue;
      }

      if (tok === 'node' || tok.endsWith('/node')) {
        maybeAdd(t[i + 1]);
        continue;
      }

      if (tok === 'pnpm') {
        const next = t[i + 1];

        // pnpm dlx ... (ignore)
        if (next === 'dlx') continue;

        // pnpm tsx <file>
        if (next === 'tsx') {
          maybeAdd(t[i + 2]);
          continue;
        }

        // pnpm exec tsx <file> / pnpm exec node <file>
        if (next === 'exec') {
          const runner = t[i + 2];
          if (runner && (runner === 'tsx' || runner.endsWith('/tsx') || runner === 'node' || runner.endsWith('/node'))) {
            maybeAdd(t[i + 3]);
          }
          continue;
        }
      }
    }
  }

  return Array.from(results);
}

/**
 * Build a map of file paths to script names that reference them.
 * Returns Map<repoRelativePath, string[]> where values are script keys.
 */
function buildPackageScriptEntrypointMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  try {
    const pkgPath = nodePath.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(nodeFs.readFileSync(pkgPath, 'utf8')) as any;
    const scripts: Record<string, string> = pkg?.scripts ?? {};

    for (const [scriptName, scriptValue] of Object.entries(scripts)) {
      const paths = extractEntrypointPathsFromScriptValue(String(scriptValue));
      for (const p of paths) {
        const arr = map.get(p) ?? [];
        arr.push(scriptName);
        map.set(p, arr);
      }
    }
  } catch (error) {
    // If package.json can't be read, treat as no entrypoints.
    console.warn(`⚠️  Warning: Could not read package.json for entrypoint detection: ${error}`);
  }

  // Dedup + stable order
  for (const [k, v] of map.entries()) {
    map.set(k, Array.from(new Set(v)).sort());
  }
  return map;
}

/**
 * Build a map of file paths directly invoked in GitHub workflows.
 * Only scans for direct file invocations (tsx scripts/..., node scripts/...).
 * Does NOT resolve pnpm run <script> (package.json already covers that).
 */
function buildWorkflowEntrypointMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  try {
    const workflowsDir = nodePath.resolve(process.cwd(), '.github', 'workflows');
    if (!nodeFs.existsSync(workflowsDir)) {
      return map;
    }

    // Find all YAML files in workflows directory (synchronous for simplicity)
    const workflowFiles: string[] = [];
    function findYamlFiles(dir: string, baseDir: string = workflowsDir): void {
      try {
        const entries = nodeFs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = nodePath.join(dir, entry.name);
          const relPath = nodePath.relative(baseDir, fullPath);
          if (entry.isDirectory()) {
            findYamlFiles(fullPath, baseDir);
          } else if (/\.(yml|yaml)$/.test(entry.name)) {
            workflowFiles.push(relPath.replace(/\\/g, '/'));
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }
    findYamlFiles(workflowsDir);

    for (const workflowFile of workflowFiles) {
      const workflowPath = nodePath.join(workflowsDir, workflowFile);
      try {
        const content = nodeFs.readFileSync(workflowPath, 'utf8');
        
        // Look for direct file invocations: tsx scripts/..., node scripts/...
        // Pattern: tsx scripts/... or node scripts/... (may be in run: lines)
        const directInvocationRegex = /(?:^|\s)(?:tsx|node)\s+(scripts\/[^\s"'`]+|\.github\/[^\s"'`]+|docs\/_scripts\/[^\s"'`]+)/gm;
        let match;
        while ((match = directInvocationRegex.exec(content)) !== null) {
          const filePath = normalizeRelPath(match[1] || '');
          if (filePath && isRunnableExt(filePath)) {
            const arr = map.get(filePath) ?? [];
            if (!arr.includes(workflowFile)) {
              arr.push(workflowFile);
            }
            map.set(filePath, arr);
          }
        }
      } catch {
        // Skip workflows that can't be read
        continue;
      }
    }
  } catch (error) {
    // If workflows can't be scanned, treat as no entrypoints
    console.warn(`⚠️  Warning: Could not scan workflows for entrypoints: ${error}`);
  }

  // Dedup + stable order
  for (const [k, v] of map.entries()) {
    map.set(k, Array.from(new Set(v)).sort());
  }
  return map;
}

/**
 * Build a map of file paths invoked by script-to-script execution.
 * Detects patterns like:
 * - execSync('pnpm tsx scripts/...')
 * - execa('pnpm', ['exec', 'tsx', 'scripts/...'])
 * - execa('tsx', ['scripts/...'])
 * - spawn(...) equivalents
 */
function buildScriptExecEntrypointMap(project: Project): Map<string, string[]> {
  const map = new Map<string, string[]>();
  
  try {
    // Only scan script files (those in scripts/ directory)
    const scriptFiles = project.getSourceFiles().filter(sf => {
      const relPath = normalizePosix(nodePath.relative(process.cwd(), sf.getFilePath()));
      return relPath.startsWith('scripts/');
    });

    for (const scriptFile of scriptFiles) {
      const callerRel = normalizePosix(nodePath.relative(process.cwd(), scriptFile.getFilePath()));
      const content = scriptFile.getFullText();

      // Pattern 1: execSync('pnpm tsx scripts/...') or execSync(`pnpm tsx scripts/...`)
      const execSyncPattern = /execSync\s*\(\s*['"`](pnpm\s+tsx\s+scripts\/[^'"`]+|pnpm\s+exec\s+tsx\s+scripts\/[^'"`]+)['"`]/g;
      let match;
      while ((match = execSyncPattern.exec(content)) !== null) {
        const cmdStr = match[1];
        if (!cmdStr) continue;
        const paths = extractEntrypointPathsFromScriptValue(cmdStr);
        for (const p of paths) {
          const arr = map.get(p) ?? [];
          if (!arr.includes(callerRel)) {
            arr.push(callerRel);
          }
          map.set(p, arr);
        }
      }

      // Pattern 2: execa('pnpm', ['exec', 'tsx', 'scripts/...']) or execa('tsx', ['scripts/...'])
      // Also handle: args: ['exec', 'tsx', 'scripts/...'] in object literals
      // Match: execa('cmd', ['arg1', 'arg2', 'scripts/...'])
      const execaArrayPattern = /(execa|spawn|spawnSync)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\[([^\]]+)\]/g;
      while ((match = execaArrayPattern.exec(content)) !== null) {
        const cmd = match[2];
        const argsStr = match[3];
        
        if (!cmd || !argsStr) continue;
        
        // Extract quoted strings from array (ignore variables)
        const quotedArgs = argsStr.match(/['"`]([^'"`]+)['"`]/g) || [];
        const args = quotedArgs.map(q => q.slice(1, -1)); // Remove quotes
        
        // Synthesize command string for extractEntrypointPathsFromScriptValue
        if (args.length > 0 && (cmd === 'pnpm' || cmd === 'tsx' || cmd.endsWith('/tsx'))) {
          const synthesized = `${cmd} ${args.join(' ')}`;
          const paths = extractEntrypointPathsFromScriptValue(synthesized);
          for (const p of paths) {
            const arr = map.get(p) ?? [];
            if (!arr.includes(callerRel)) {
              arr.push(callerRel);
            }
            map.set(p, arr);
          }
        }
      }

      // Pattern 2b: Object literal with args array (e.g., { command: 'pnpm', args: ['exec', 'tsx', 'scripts/...'] })
      // This catches cases where execa is called with variables but the args are defined as literals
      const objectLiteralArgsPattern = /args:\s*\[([^\]]+)\]/g;
      while ((match = objectLiteralArgsPattern.exec(content)) !== null) {
        const argsStr = match[1];
        if (!argsStr) continue;
        
        // Extract quoted strings from array
        const quotedArgs = argsStr.match(/['"`]([^'"`]+)['"`]/g) || [];
        const args = quotedArgs.map(q => q.slice(1, -1));
        
        // Check if this looks like a pnpm exec tsx pattern
        if (args.length >= 3 && args[0] === 'exec' && args[1] === 'tsx' && args[2]?.startsWith('scripts/')) {
          const synthesized = `pnpm exec tsx ${args[2]}`;
          const paths = extractEntrypointPathsFromScriptValue(synthesized);
          for (const p of paths) {
            const arr = map.get(p) ?? [];
            if (!arr.includes(callerRel)) {
              arr.push(callerRel);
            }
            map.set(p, arr);
          }
        }
      }

      // Pattern 3: execSync with template literals containing scripts/ paths
      const execSyncTemplatePattern = /execSync\s*\(\s*`([^`]*scripts\/[^`]+)`/g;
      while ((match = execSyncTemplatePattern.exec(content)) !== null) {
        const cmdStr = match[1];
        if (!cmdStr) continue;
        
        const paths = extractEntrypointPathsFromScriptValue(cmdStr);
        for (const p of paths) {
          const arr = map.get(p) ?? [];
          if (!arr.includes(callerRel)) {
            arr.push(callerRel);
          }
          map.set(p, arr);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not scan scripts for execution patterns: ${error}`);
  }

  // Dedup + stable order
  for (const [k, v] of map.entries()) {
    map.set(k, Array.from(new Set(v)).sort());
  }
  return map;
}

// ---- Analyze candidates ------------------------------------------------------
log(`📋 Analyzing ${filteredCandidates.length} candidate file(s)...\n`);

for (const rel of filteredCandidates) {
  const abs = nodePath.resolve(process.cwd(), rel);
  const sf = project.getSourceFile(abs);
  const relNormalized = normalizePosix(rel);
  
  const record = {
    path: rel,
    status: 'DROP' as FileStatus,
    reasons: [] as KeepReason[],
    importers: [] as string[],
    exportRefs: [] as { export: string; refs: number }[],
    notes: allowlistNotes[rel] || '',
  };

  // Check allowlist first (if useAllowlistForKeep is true)
  // Note: allowlistFiles is always loaded for filtering and safety checks
  if (useAllowlistForKeep && allowlistFiles.has(rel)) {
    record.status = 'KEEP';
    record.reasons.push('KEEP_ALLOWLIST');
    results.push(record);
    continue;
  }

  // If --only-allowlisted, skip non-allowlisted files
  // This works even when --no-allowlist is set (for auditing allowlist)
  if (argv.onlyAllowlisted && !allowlistFiles.has(rel)) {
    continue;
  }

  // Check if file has importers (real usage - static + dynamic)
  // Use normalized relative path (matching what's in importerMap)
  const fileImporters = importerMap.get(relNormalized) || [];
  
  // Also check barrel-style imports (directory without /index)
  const relNoIndex = relNormalized.replace(/\/index\.(ts|tsx|js|jsx)$/, '');
  const barrelImporters = relNoIndex !== relNormalized ? (importerMap.get(relNoIndex) || []) : [];
  
  const allImporters = Array.from(new Set([...fileImporters, ...barrelImporters]));
  
  if (allImporters.length > 0) {
    record.status = 'KEEP';
    record.reasons.push('KEEP_IMPORT_USED');
    record.importers = allImporters;
  }

  // Check if file is a package.json script entrypoint
  const entryScripts = packageEntrypoints.get(relNormalized) ?? [];
  if (entryScripts.length > 0) {
    if (record.status !== 'KEEP') {
      record.status = 'KEEP';
    }
    record.reasons.push('KEEP_ENTRYPOINT_PACKAGE_JSON');
    record.notes = (record.notes ? `${record.notes}; ` : '') + `Entrypoint scripts: ${entryScripts.join(', ')}`;
  }

  // Check if file is a vitest test entrypoint
  // Pattern: scripts/**/__tests__/**/*.test.ts (and variants)
  if (/^scripts\/.*\/__tests__\/.*\.test\.(ts|tsx|js|jsx)$/.test(relNormalized)) {
    // Special case: git.test.ts is standalone (excluded from vitest)
    if (relNormalized.includes('__tests__/git.test.ts')) {
      // Check if it's referenced by package.json scripts or docs
      const hasScriptRef = entryScripts.length > 0;
      const textRefs = findTextReferences(rel, [...CONFIG.REFERENCE_DIRS]);
      if (hasScriptRef || textRefs.found) {
        if (record.status !== 'KEEP') {
          record.status = 'KEEP';
        }
        record.reasons.push('KEEP_TEST_VITEST'); // Marked as test even though standalone
      }
    } else {
      // Regular vitest test - mark as KEEP
      if (record.status !== 'KEEP') {
        record.status = 'KEEP';
      }
      record.reasons.push('KEEP_TEST_VITEST');
    }
  }

  // Check if file is a workflow entrypoint
  const workflowRefs = workflowEntrypoints.get(relNormalized) ?? [];
  if (workflowRefs.length > 0) {
    if (record.status !== 'KEEP') {
      record.status = 'KEEP';
    }
    record.reasons.push('KEEP_ENTRYPOINT_WORKFLOW');
    record.notes = (record.notes ? `${record.notes}; ` : '') + `Workflow entrypoints: ${workflowRefs.join(', ')}`;
  }

  // Check if file is invoked by script-to-script execution
  const execCallers = scriptExecEntrypoints.get(relNormalized) ?? [];
  if (execCallers.length > 0) {
    if (record.status !== 'KEEP') {
      record.status = 'KEEP';
    }
    record.reasons.push('KEEP_ENTRYPOINT_SCRIPT_EXEC');
    record.notes = (record.notes ? `${record.notes}; ` : '') + `Invoked by scripts: ${execCallers.join(', ')}`;
  }

  // Implicit Next.js route files → keep
  if (/(^|[\\/])app[\\/].*\b(page|layout|loading|error|not-found|route|opengraph-image|icon|sitemap)\.(t|j)sx?$/.test(rel)) {
    if (record.status === 'DROP') {
      record.status = 'KEEP';
    }
    record.reasons.push('KEEP_ROUTES_IMPLICIT');
  }

  // Next.js proxy.ts (replaces middleware.ts in Next.js 16+)
  if (relNormalized === 'proxy.ts') {
    if (record.status === 'DROP') {
      record.status = 'KEEP';
    }
    record.reasons.push('KEEP_ROUTES_IMPLICIT');
  }

  // Check if it's a barrel file that's imported
  if (sf && isBarrelFile(toAbsPosix(sf.getFilePath()))) {
    if (allImporters.length > 0) {
      if (!record.reasons.includes('KEEP_BARREL_USED')) {
        record.reasons.push('KEEP_BARREL_USED');
      }
    }
  }

  // Collect export info (for reporting, not for KEEP decision)
  if (sf) {
    try {
      const exported = sf.getExportedDeclarations();
      for (const [name, _decls] of exported) {
        record.exportRefs.push({ export: name, refs: 0 }); // refs not used for decision, just reporting
      }
    } catch (e: any) {
      record.notes = (record.notes ? record.notes + '; ' : '') + `Analysis error: ${e?.message ?? String(e)}`;
    }
  }

  // Check for text references (docs/tests) - only if not already KEEP for other reasons
  // Note: Script execution is now handled by scriptExecEntrypoints map above
  const textRefs = findTextReferences(rel, [...CONFIG.REFERENCE_DIRS]);
  if (textRefs.found && record.status === 'DROP') {
    // Only set REVIEW if no other KEEP reasons exist (script execution is handled above)
    record.status = 'REVIEW';
    record.reasons.push('REVIEW_TEXT_REF');

    if (textRefs.docsOnly) {
      record.notes = (record.notes ? `${record.notes}; ` : '') +
        `docs-only reference (${textRefs.refs.length} file(s): ${textRefs.refs.slice(0, 3).join(', ')}${textRefs.refs.length > 3 ? '...' : ''})`;
    } else {
      record.notes = (record.notes ? `${record.notes}; ` : '') +
        `text reference in ${textRefs.refs.length} file(s): ${textRefs.refs.slice(0, 3).join(', ')}${textRefs.refs.length > 3 ? '...' : ''}`;
    }
  } else if (textRefs.found && record.status === 'KEEP') {
    // If already KEEP, just add the text ref reason for completeness
    record.reasons.push('REVIEW_TEXT_REF');
  }

  results.push(record);
}

// Filter results based on flags
let outputFiles = results;
if (argv.onlyAllowlisted) {
  // Show only allowlisted files (works even with --no-allowlist for auditing)
  outputFiles = results.filter((r) => allowlistFiles.has(r.path));
} else if (argv.only !== 'ALL') {
  outputFiles = results.filter((r) => r.status === argv.only);
}

const summary = {
  candidates: filteredCandidates.length,
  analyzed: results.length,
  kept: outputFiles.filter((r) => r.status === 'KEEP').length,
  review: outputFiles.filter((r) => r.status === 'REVIEW').length,
  droppable: outputFiles.filter((r) => r.status === 'DROP').length,
  allowlisted: results.filter((r) => allowlistFiles.has(r.path)).length,
  allowlistedButOrphan: results.filter((r) => allowlistFiles.has(r.path) && r.status === 'DROP').length,
};

// Ensure output directory exists
const outDir = nodePath.dirname(argv.out);
await fs.ensureDir(outDir);

// Atomic file write: write to temp file then rename
const tempFile = `${argv.out}.tmp`;
await fs.writeJson(tempFile, { summary, files: outputFiles }, { spaces: 2 });
await fs.move(tempFile, argv.out, { overwrite: true });

// ---- CI mode: fail only if DROP > 0 ------------------------------------------
// Note: CI mode must run BEFORE stdout/apply logic to handle exit codes correctly
if (argv.ci) {
  // CI mode: compute TRUE drop set (respect allowlist protection)
  // Even in --no-allowlist mode, don't count allowlisted files as drops (safety)
  const trueDropCount = results.filter((r) => r.status === 'DROP' && !allowlistFiles.has(r.path)).length;
  
  if (trueDropCount > 0) {
    // Print ONLY the drop file paths (one per line) to stdout
    const dropPaths = results
      .filter((r) => r.status === 'DROP' && !allowlistFiles.has(r.path))
      .map((r) => r.path)
      .sort();
    process.stdout.write(dropPaths.join('\n') + '\n');
    process.exit(1);
  } else {
    // No drops: exit 0 (no output for cleaner CI logs)
    process.exit(0);
  }
}

// Print summary to console (unless quiet/ci or stdout)
if (!argv.stdout && !isQuiet) {
  console.log(`\n📊 Orphan Audit Summary:`);
  console.log(`   Candidates: ${summary.candidates}`);
  console.log(`   Analyzed: ${summary.analyzed}`);
  console.log(`   Kept: ${summary.kept}`);
  console.log(`   Review: ${summary.review}`);
  console.log(`   Droppable: ${summary.droppable}`);
  if (!argv.noAllowlist && summary.allowlisted > 0) {
    console.log(`   Allowlisted: ${summary.allowlisted}`);
    if (summary.allowlistedButOrphan > 0) {
      console.log(`   ⚠️  Allowlisted but still orphan: ${summary.allowlistedButOrphan}`);
    }
  }
  if (argv.onlyAllowlisted) {
    console.log(`\n   ℹ️  Showing only allowlisted files (use --no-allowlist to see all)`);
  }
  console.log(`\n📄 Report written to: ${argv.out}\n`);
}

// ---- CI mode: fail only if DROP > 0 ------------------------------------------
if (argv.ci) {
  // CI mode: compute TRUE drop set (respect allowlist protection)
  // Even in --no-allowlist mode, don't count allowlisted files as drops
  const trueDropCount = results.filter((r) => r.status === 'DROP' && !allowlistFiles.has(r.path)).length;
  
  if (trueDropCount > 0) {
    // Print ONLY the drop file paths (one per line) to stdout
    const dropPaths = results
      .filter((r) => r.status === 'DROP' && !allowlistFiles.has(r.path))
      .map((r) => r.path)
      .sort();
    process.stdout.write(dropPaths.join('\n') + '\n');
    process.exit(1);
  } else {
    // No drops: exit 0 (no output, or optional "OK" line)
    // Prefer no output for cleaner CI logs
    process.exit(0);
  }
}

if (argv.stdout) {
  if (argv.pathsOnly) {
    const lines = outputFiles.filter(f => f.status === 'DROP').map(f => f.path).sort();
    process.stdout.write(lines.join('\n') + '\n');
  } else {
    process.stdout.write(JSON.stringify({ summary, files: outputFiles }, null, 2));
  }
}

if (argv.apply) {
  // Safety: Don't delete allowlisted files even if they're DROP status
  // This protection applies regardless of --no-allowlist flag
  const dropFiles = outputFiles.filter((f) => f.status === 'DROP' && !allowlistFiles.has(f.path));
  
  if (dropFiles.length === 0) {
    console.log('✅ No files to drop. Exiting.');
    process.exit(0);
  }

  // Safety: Require explicit confirmation even with --yes flag (unless in CI)
  const isCI = process.env['CI'] === 'true' || process.env['GITHUB_ACTIONS'] === 'true';
  let confirmed = argv.yes;

  if (!isCI && !confirmed) {
    console.log(`\n⚠️  WARNING: You are about to DELETE ${dropFiles.length} file(s):`);
    dropFiles.slice(0, 10).forEach((f) => {
      console.log(`   - ${f.path}`);
    });
    if (dropFiles.length > 10) {
      console.log(`   ... and ${dropFiles.length - 10} more (see report for full list)`);
    }
    console.log(`\n❓ Type "YES" (all caps) to confirm deletion:`);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('> ', resolve);
    });
    rl.close();
    
    confirmed = answer === 'YES';
  }

  if (!confirmed) {
    console.log('❌ Aborted: Deletion not confirmed. Use --yes to skip confirmation (CI only).');
    process.exit(1);
  }

  // Perform deletions
  console.log(`\n🗑️  Deleting ${dropFiles.length} file(s)...`);
  for (const f of dropFiles) {
    try {
      await fs.remove(f.path);
      console.log(`   ✅ Deleted: ${f.path}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to delete ${f.path}: ${error?.message ?? String(error)}`);
    }
  }
  console.log(`\n✅ Deletion complete. ${dropFiles.length} file(s) removed.`);
}

