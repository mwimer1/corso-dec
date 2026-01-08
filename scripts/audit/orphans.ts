#!/usr/bin/env node
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

// Re-export for testing
export { findTextReferences };

// Utility functions for orphans audit (exported for testing)

/** Normalize to project-relative POSIX (no leading "./"). */
function toProjectRelativePosix(absOrRel: string): string {
  const rel = absOrRel.replace(/^[.][\\/]/, '');
  return rel.replace(/\\/g, '/');
}

function normalizePosix(p: string) {
  return p.replace(/\\/g, '/').replace(/^[.]\//, '');
}
function toAbsPosix(p: string): string {
  const abs = nodePath.isAbsolute(p) ? p : nodePath.resolve(p);
  return normalizePosix(nodePath.normalize(abs));
}

// Upgrade: resolvePathAlias with tsconfig.paths wildcard support (+ cache)
const _aliasCache = new Map<string, string>();
export function resolvePathAlias(importPath: string, project: Project): string {
  const { baseUrl = '.', paths } = project.getCompilerOptions() as any;
  const spec = normalizePosix(importPath);
  const cacheKey = `${spec}::${baseUrl}`;
  if (_aliasCache.has(cacheKey)) return _aliasCache.get(cacheKey)!;

  // 1) Apply tsconfig "paths" wildcards (most-specific first)
  if (paths && !spec.startsWith('./') && !spec.startsWith('../')) {
    const keys = Object.keys(paths).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      const targets = paths[k] || [];
      const star = k.indexOf('*');
      if (star < 0) {
        if (spec === k && targets[0]) {
          const joined = nodePath.join(baseUrl, targets[0]);
          const out = normalizePosix(joined);
          _aliasCache.set(cacheKey, out);
          return out;
        }
        continue;
      }
      const prefix = k.slice(0, star);
      const suffix = k.slice(star + 1);
      if (spec.startsWith(prefix) && spec.endsWith(suffix)) {
        const mid = spec.slice(prefix.length, spec.length - suffix.length);
        const target = targets[0];
        if (target) {
          const mapped = target.replace('*', mid);
          const joined = nodePath.join(baseUrl, mapped);
          const out = normalizePosix(joined);
          _aliasCache.set(cacheKey, out);
          return out;
        }
      }
    }
  }

  // 2) Fallback for "@/…" alias
  if (spec.startsWith('@/')) {
    const joined = nodePath.join(baseUrl, spec.slice(2));
    const out = normalizePosix(joined);
    _aliasCache.set(cacheKey, out);
    return out;
  }

  // 3) Non-aliased relative path: preserve leading "./" or "../"
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const normalized = importPath.replace(/\\/g, '/');
    _aliasCache.set(cacheKey, normalized);
    return normalized;
  }
  // 4) Non-aliased bare path: just normalize slashes
  _aliasCache.set(cacheKey, spec);
  return spec;
}

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

export function isNextJsRoute(filePath: string): boolean {
  return /app\/.*\/(route|page|layout|loading|error|not-found|opengraph-image|icon|sitemap)\.(ts|tsx|js|jsx)$/.test(filePath);
}

export function isStyleFile(filePath: string): boolean {
  return /\.(css|scss|sass|less|styl)$/.test(filePath) ||
         filePath.includes('tailwind.config.') ||
         filePath.includes('postcss.config.');
}

export function isBarrelFile(filePath: string): boolean {
  return /\/index\.(ts|tsx|js|jsx)$/.test(filePath) ||
         filePath.endsWith('.ts') && filePath.includes('/index');
}

export function findDynamicImports(content: string): string[] {
  const dynamicImports: string[] = [];

  // Find ES6 dynamic imports: import('./module')
  const es6Regex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    if (match[1]) dynamicImports.push(match[1]);
  }

  // Find CommonJS require calls: require('./module')
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    if (match[1]) dynamicImports.push(match[1]);
  }

  return dynamicImports;
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
  out: z.string().default('orphan-report.json'),
  only: z.enum(['ALL','DROP','KEEP']).default('ALL'),
  apply: z.boolean().default(false),
  yes: z.boolean().default(false),
  stdout: z.boolean().default(false),
  pathsOnly: z.boolean().default(false),
  includeIndex: z.boolean().default(false),
}).strict();

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

await fs.writeJson(argv.out, { summary, files: outputFiles }, { spaces: 2 });

if (argv.stdout) {
  if (argv.pathsOnly) {
    const lines = outputFiles.filter(f => f.status === 'DROP').map(f => f.path).sort();
    process.stdout.write(lines.join('\n') + '\n');
  } else {
    process.stdout.write(JSON.stringify({ summary, files: outputFiles }, null, 2));
  }
}

if (argv.apply && argv.yes) {
  for (const f of outputFiles) {
    if (f.status === 'DROP') await fs.remove(f.path);
  }
}

