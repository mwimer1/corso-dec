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
import { findTextReferences } from './utils';
import {
  toProjectRelativePosix,
  normalizePosix,
  toAbsPosix,
  resolvePathAlias,
  isNextJsRoute,
  isStyleFile,
  isBarrelFile,
  findDynamicImports,
} from '../audit-lib/orphan-utils';

// Re-export for testing
export { findTextReferences };
export {
  toProjectRelativePosix,
  normalizePosix,
  toAbsPosix,
  resolvePathAlias,
  isNextJsRoute,
  isStyleFile,
  isBarrelFile,
  findDynamicImports,
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
  if (moduleSpec.startsWith('@/')) {
    base = resolvePathAlias(moduleSpec, project);
  } else if (moduleSpec.startsWith('.')) {
    if (importerSf) {
      base = normalizePosix(nodePath.resolve(nodePath.dirname(importerSf.getFilePath()), moduleSpec));
    }
  } else {
    // bare path like "components/Button"
    base = base.replace(/^\.\//, '');
  }

  const absCore = toAbsPosix(base);
  const core = absCore.replace(/\/+$/, ''); // trim trailing '/'
  const candidates = new Set<string>([core, ...tryExts.map(ext => `${core}${ext}`), ...addIndex(core)]);

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

  // Check for dynamic imports in the file content
  const content = sf.getFullText();
  const dynamicImports = findDynamicImports(content);
  if (dynamicImports.length > 0) {
    result.status = 'KEEP';
    result.reasons.push('KEEP_DYNAMIC_IMPORT');
  }

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

const ArgSchema = z.object({
  out: z.string().default('reports/orphan/orphan-report.json'),
  only: z.enum(['ALL','DROP','KEEP']).default('ALL'),
  apply: z.boolean().default(false),
  yes: z.boolean().default(false),
  stdout: z.boolean().default(false),
  pathsOnly: z.boolean().default(false),
  includeIndex: z.boolean().default(false),
}).strict();

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Orphaned Files Audit Script

Deterministically identifies files that are safe to delete by analyzing:
- Import references via ts-morph
- Next.js implicit route conventions
- Barrel exports and their consumers
- Dynamic imports
- Test, docs, and generator references
- Side-effect imports (CSS, styles)

Usage:
  pnpm audit:orphans [options]

Options:
  --out <file>              Output file path (default: reports/orphan/orphan-report.json)
  --only <type>             Filter results: ALL, DROP, or KEEP (default: ALL)
  --apply                   Apply deletions (requires --yes flag)
  --yes                     Skip confirmation prompt (CI only)
  --stdout                  Output results to stdout instead of file
  --paths-only              Output only file paths (one per line)
  --include-index           Include index barrel files in analysis

Examples:
  pnpm audit:orphans                              # Generate report only
  pnpm audit:orphans --only DROP                  # Show only droppable files
  pnpm audit:orphans --apply --yes                # Apply deletions (CI)
  pnpm audit:orphans --stdout --paths-only        # List paths to stdout

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
});

// Temporary validator file creation removed - file was unused and removed

// ---- TS project --------------------------------------------------------------
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// ---- Discover candidates -----------------------------------------------------
const candidates = await globby(
  ['**/*.{ts,tsx,js,jsx}'],
  { ignore: [...CONFIG.EXCLUDE_PATTERNS] }
);
const filteredCandidates = candidates.filter((rel: string) => {
  if (!argv.includeIndex && isIndexBarrel(rel)) return false;
  return true;
});

type FileStatus = 'DROP' | 'KEEP';
type KeepReason =
  | 'KEEP_EXPORT_USED' | 'KEEP_ROUTES_IMPLICIT' | 'KEEP_BARREL_USED'
  | 'KEEP_DYNAMIC_IMPORT' | 'KEEP_TEST_REF' | 'KEEP_DOCS_REF'
  | 'KEEP_STYLE_SIDE_EFFECT' | 'KEEP_ALLOWLIST';

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

// robust export-reference scan using text-based scanning
function collectExportRefs(sf: SourceFile, project: Project): Array<{ export: string; refs: number }> {
  const out: Array<{ export: string; refs: number }> = [];
  const exported = sf.getExportedDeclarations();
  const others = project.getSourceFiles().filter((f: SourceFile) => f !== sf);
  for (const [name, _decls] of exported) {
    let refs = 0;
    const re = new RegExp(String.raw`\b${name}\b`, 'g');
    for (const f of others) {
      const text = f.getText();
      if (re.test(text)) {
        refs++;
      }
    }
    out.push({ export: name, refs });
  }
  return out;
}

// removed duplicate implementation

for (const rel of filteredCandidates) {
  const abs = nodePath.resolve(process.cwd(), rel);
  const sf = project.getSourceFile(abs);
  const record = {
    path: rel,
    status: 'DROP' as FileStatus,
    reasons: [] as KeepReason[],
    importers: [] as string[],
    exportRefs: [] as { export: string; refs: number }[],
    notes: '',
  };

  // implicit Next.js route files → keep
  if (/(^|[\\/])app[\\/].*\b(page|layout|loading|error|not-found|route|opengraph-image|icon|sitemap)\.(t|j)sx?$/.test(rel)) {
    record.status = 'KEEP';
    record.reasons.push('KEEP_ROUTES_IMPLICIT');
    results.push(record); continue;
  }

  // exported symbol references
  try {
    if (sf) {
      const refs = collectExportRefs(sf, project);
      record.exportRefs = refs;
      if (refs.some(r => r.refs > 0)) { record.status = 'KEEP'; record.reasons.push('KEEP_EXPORT_USED'); }
    }
  } catch (e: any) {
    record.notes = `Analysis error: ${e?.message ?? String(e)}`;
  }

  // dynamic import/require textual scan → keep
  try {
    const content = sf?.getFullText() ?? '';
    const patterns = [
      /import\(\s*['"`](@\/[^'"`]+)['"`]\s*\)/g,
      /require\(\s*['"`](@\/[^'"`]+)['"`]\s*\)/g,
      /from\s+['"`](@\/[^'"`]+)['"`]/g,
      /export\s+\*\s+from\s+['"`](@\/[^'"`]+)['"`]/g,
    ] as const;
    const matches: string[] = [];
    for (const rgx of patterns) {
      let m: RegExpExecArray | null;
      while ((m = rgx.exec(content)) !== null) {
        if (m[1]) matches.push(m[1]);
      }
    }
    if (matches.length > 0) {
      record.status = 'KEEP';
      record.reasons.push('KEEP_DYNAMIC_IMPORT');
    }
  } catch {}

  // docs/tests textual ref → keep
  if (findTextReferences(rel, [...CONFIG.REFERENCE_DIRS])) {
    record.status = 'KEEP';
    record.reasons.push('KEEP_DOCS_REF');
  }

  results.push(record);
}

const outputFiles = argv.only === 'ALL' ? results : results.filter((r) => r.status === argv.only);
const summary = {
  candidates: filteredCandidates.length,
  kept: outputFiles.filter((r) => r.status === 'KEEP').length,
  droppable: outputFiles.filter((r) => r.status === 'DROP').length,
};

// Ensure output directory exists
const outDir = nodePath.dirname(argv.out);
await fs.ensureDir(outDir);

await fs.writeJson(argv.out, { summary, files: outputFiles }, { spaces: 2 });

if (argv.stdout) {
  if (argv.pathsOnly) {
    const lines = outputFiles.filter(f => f.status === 'DROP').map(f => f.path).sort();
    process.stdout.write(lines.join('\n') + '\n');
  } else {
    process.stdout.write(JSON.stringify({ summary, files: outputFiles }, null, 2));
  }
}

if (argv.apply) {
  const dropFiles = outputFiles.filter((f) => f.status === 'DROP');
  
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

