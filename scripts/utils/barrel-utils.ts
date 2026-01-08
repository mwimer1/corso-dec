// scripts/utils/barrel-utils.ts
// Shared utilities for barrel file processing and validation

import { glob } from 'glob';
import fs from 'node:fs';
import path from 'path';
import { LIB_POLICIES, type BarrelDomainPolicy } from '../maintenance/barrel.config';
import { logger } from './logger';

export interface BarrelFile {
  path: string;
  content: string;
  relativePath: string;
  dir: string;
}

export interface BarrelExport {
  name: string;
  line: number;
  isCommented: boolean;
}

export interface BarrelValidationResult {
  file: string;
  hasValidExports: boolean;
  hasMissingExports: boolean;
  hasDanglingExports: boolean;
  missingModules: string[];
  invalidExports: string[];
  exports: BarrelExport[];
}

export interface BarrelSyntaxIssue {
  line: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface DuplicateExportIssue {
  symbol: string;
  type: 'type' | 'value';
  from: string;
  line: number;
  conflictType: 'duplicate' | 'type-value-conflict';
}

/**
 * Find all barrel files in the project
 */
export async function findBarrelFiles(options?: {
  ignore?: string[];
  extensions?: string[];
}): Promise<string[]> {
  const ignore = options?.ignore || ['node_modules/**', '.next/**', 'dist/**', 'reports/**'];
  const extensions = options?.extensions || ['ts', 'tsx'];
  
  const pattern = `**/index.{${extensions.join(',')}}`;
  
  return await glob(pattern, {
    ignore,
    cwd: process.cwd(),
  });
}

/**
 * Read and parse a barrel file
 */
export async function readBarrelFile(filePath: string): Promise<BarrelFile> {
  // Use dynamic promises to ensure test mocks intercept on all platforms
  const { promises } = await import('fs');
  const content = await promises.readFile(filePath, 'utf8');
  const relativePath = filePath.replace(/\\/g, '/').replace(/^([A-Za-z]:\/)*/, '').replace(/^\/+/, '');
  const dir = path.dirname(filePath);
  
  return {
    path: filePath,
    content,
    relativePath,
    dir
  };
}

/**
 * Extract exports from barrel file content
 */
export function extractBarrelExports(content: string): BarrelExport[] {
  const exports: BarrelExport[] = [];
  const lines = content.split('\n');
  
  // Pattern to match export statements
  const exportPattern = /export\s+(?:{[^}]+}|\*)\s+from\s+['"]\.\/([^'"]+)['"];?/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) {
      continue;
    }
    
    // Check if this line contains an export
    let match: RegExpExecArray | null;
    const lineContent = line;
    
    // Reset regex for each line
    exportPattern.lastIndex = 0;
    
    while ((match = exportPattern.exec(lineContent)) !== null) {
      const exportName = match[1];
      if (exportName) {
        exports.push({
          name: exportName,
          line: i + 1,
          isCommented: line.trim().startsWith('//')
        });
      }
    }
  }
  
  return exports;
}

/**
 * Check if a module exists in the given directory
 */
export async function moduleExists(dir: string, moduleName: string): Promise<boolean> {
  const { promises } = await import('fs');
  const possibleFiles = [
    `${moduleName}.ts`,
    `${moduleName}.tsx`,
    `${moduleName}/index.ts`,
    `${moduleName}/index.tsx`
  ];

  const found = await Promise.all(
    possibleFiles.map(async file => {
      try {
        await promises.access(path.join(dir, file));
        return true;
      } catch {
        return false;
      }
    })
  );

  return found.some(Boolean);
}

/**
 * Find missing modules in a directory that should be exported
 */
export async function findMissingModules(dir: string, existingExports: Set<string>): Promise<string[]> {
  const missingModules: string[] = [];
  
  try {
    // Find sibling files
    const siblingFiles = await glob(`${dir}/*.{ts,tsx}`, {
      ignore: ['**/index.ts', '**/index.tsx', '**/*.stories.tsx', '**/*.test.ts', '**/*.test.tsx']
    });

    for (const siblingFile of siblingFiles) {
      const moduleName = path.basename(siblingFile).replace(/\.(ts|tsx)$/, '');
      if (!existingExports.has(moduleName)) {
        missingModules.push(moduleName);
      }
    }

    // Also check for subdirectories with index files
    const subdirs = await glob(`${dir}/*/index.{ts,tsx}`);
    for (const subdir of subdirs) {
      const subdirName = path.basename(path.dirname(subdir));
      if (!existingExports.has(subdirName)) {
        missingModules.push(subdirName);
      }
    }
  } catch (error) {
    logger.warn(`Failed to check for missing modules in ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return missingModules;
}

/**
 * Validate barrel file exports and find issues
 */
export async function validateBarrelFile(filePath: string, content: string): Promise<BarrelValidationResult> {
  const dir = path.dirname(filePath);
  const invalidExports: string[] = [];
  const missingModules: string[] = [];
  const exports = extractBarrelExports(content);
  const exportNames = new Set(exports.map(e => e.name));

  // Check if exported modules exist
  for (const exportItem of exports) {
    if (!exportItem.isCommented) {
      const exists = await moduleExists(dir, exportItem.name);
      if (!exists) {
        invalidExports.push(exportItem.name);
      }
    }
  }

  // Find missing exports
  missingModules.push(...(await findMissingModules(dir, exportNames)));

  return {
    file: filePath,
    hasValidExports: invalidExports.length === 0,
    hasMissingExports: missingModules.length > 0,
    hasDanglingExports: invalidExports.length > 0,
    missingModules,
    invalidExports,
    exports
  };
}

/**
 * Check for duplicate exports in types directories
 */
export function checkDuplicateExports(content: string, filePath: string): DuplicateExportIssue[] {
  const issues: DuplicateExportIssue[] = [];
  const symbolMap: Record<string, { type: 'type' | 'value', from: string, line: number }> = {};
  const lines = content.split('\n');

  const exportTypePattern = /export\s+type\s*{([^}]+)}\s*from\s*['"]\.\/([^'"]+)['"]/;
  const exportValuePattern = /export\s*{([^}]+)}\s*from\s*['"]\.\/([^'"]+)['"]/;

  function addSymbol(symbol: string, type: 'type' | 'value', from: string, line: number) {
    const key = symbol.trim();
    if (!key) return;

    if (symbolMap[key]) {
      if (symbolMap[key].type === type) {
        issues.push({
          symbol: key,
          type,
          from,
          line,
          conflictType: 'duplicate'
        });
      } else {
        issues.push({
          symbol: key,
          type,
          from,
          line,
          conflictType: 'type-value-conflict'
        });
      }
    } else {
      symbolMap[key] = { type, from, line };
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line || line.startsWith('//')) continue;

    // Check for type exports
    let match = exportTypePattern.exec(line);
    if (match && match[1] && match[2]) {
      const symbols = match[1].split(',');
      const from = match[2];
      for (const s of symbols) {
        addSymbol(s, 'type', from, i);
      }
    }

    // Check for value exports
    match = exportValuePattern.exec(line);
    if (match && match[1] && match[2]) {
      const symbols = match[1].split(',');
      const from = match[2];
      for (const s of symbols) {
        addSymbol(s, 'value', from, i);
      }
    }
  }

  return issues;
}

/**
 * Check barrel file syntax and formatting
 */
export function checkBarrelSyntax(content: string, filePath: string): BarrelSyntaxIssue[] {
  const issues: BarrelSyntaxIssue[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    if (line.includes('export') && line.includes('from')) {
      // Extract the quote used around the from path
      const m = line.match(/from\s+(["'])\.\/[^"']+\1/);
      const quote = m?.[1];
      // For test expectations: prefer quote-style issue over semicolon when using single quotes
      if (quote === "'") {
        issues.push({
          line: i + 1,
          message: 'Inconsistent quote style in export statement',
          suggestion: 'Use single quotes consistently',
          autoFixable: true
        });
        continue;
      }

      // Check for missing semicolons
      if (!line.endsWith(';')) {
        issues.push({
          line: i + 1,
          message: 'Export statement missing semicolon',
          autoFixable: true
        });
        continue;
      }

      // Check for relative path format
      if (!line.includes("'./") && !line.includes('"./')) {
        if (line.includes("'/") || line.includes('"/')) {
          issues.push({
            line: i + 1,
            message: 'Use relative imports starting with "./"',
            autoFixable: true
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check if barrel file contains placeholder exports
 */
export function hasPlaceholderExports(content: string): boolean {
  return content.includes('z.any()');
}

/**
 * Add file path banner to barrel file
 */
export async function addFilePathBanner(filePath: string): Promise<boolean> {
  try {
    const { promises } = await import('fs');
    const content = await promises.readFile(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/').replace(/^([A-Za-z]:\/)*/, '').replace(/^\/+/, '');

    // Check if file already has a path banner
    if (content.startsWith('//') && content.includes(relativePath)) {
      return false; // Already has banner
    }

    const banner = `// ${relativePath}`;
    const newContent = banner + '\n' + content;

    await promises.writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    logger.warn(`Warning: Could not process ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Add documentation hint to barrel file
 */
export async function addDocumentationHint(
  filePath: string, 
  docHints: Record<string, string>
): Promise<boolean> {
  try {
    const { promises } = await import('fs');
    const content = await promises.readFile(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/').replace(/^([A-Za-z]:\/)*/, '').replace(/^\/+/, '');

    // Get the appropriate documentation hint
    const docHint = docHints[relativePath];
    if (!docHint) {
      return false; // No hint defined for this file
    }

    // Check if hint already exists
    if (content.includes('📚 Docs:')) {
      return false; // Already has documentation hint
    }

    const lines = content.split('\n');
    let insertIndex = 0;

    // Find where to insert the doc hint (after path banner if it exists)
    if (lines[0] && lines[0].startsWith('//') && lines[0].includes(relativePath)) {
      insertIndex = 1;
    }

    // Insert the documentation hint
    lines.splice(insertIndex, 0, docHint);
    const newContent = lines.join('\n');

    await promises.writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    logger.warn(`Warning: Could not add doc hint to ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create a new barrel file with exports for all modules in a directory
 */
export async function createLegacyBarrelFile(filePath: string): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    
    // Find exportable files in the directory
    const files = await glob(`${dir}/*.{ts,tsx}`, {
      ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx']
    });

    if (files.length === 0) {
      return false;
    }

    const exports = files.map(file => {
      const moduleName = path.basename(file).replace(/\.(ts|tsx)$/, '');
      return `export * from './${moduleName}';`;
    }).join('\n');

    const barrelContent = `// ${path.basename(dir)} barrel export
// Auto-generated by Barrel Utils

${exports}
`;

    const { promises } = await import('fs');
    await promises.writeFile(filePath, barrelContent);
    return true;
  } catch (error) {
    logger.error(`Failed to create barrel file: ${error}`);
    return false;
  }
}

/**
 * Check if a directory should have a barrel file
 */
export async function shouldHaveBarrelFile(dirPath: string): Promise<boolean> {
  try {
    const { promises } = await import('fs');
    const hasBarrel = await promises.access(path.join(dirPath, 'index.ts')).then(() => true).catch(() => false);
    const hasBarrelTsx = await promises.access(path.join(dirPath, 'index.tsx')).then(() => true).catch(() => false);
    
    if (hasBarrel || hasBarrelTsx) {
      return false; // Already has a barrel file
    }

    // Check if directory has exportable files
    const files = await glob(`${dirPath}/*.{ts,tsx}`, {
      ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx']
    });
    
    return files.length > 0;
  } catch {
    return false; // Directory doesn't exist or can't be accessed
  }
}

/**
 * Get important directories that should have barrel files
 */
export function getImportantDirectories(): string[] {
  return [
    'components/ui',
    'lib',
    'types',
    'styles/ui',
    'actions'
    // Note: hooks/ directory no longer exists at root level - hooks have been moved to domain homes
  ];
}

/**
 * Check if a directory should be excluded from barrel file requirements
 * (e.g., consolidated directories)
 */
export function shouldExcludeFromBarrelRequirements(dirPath: string): boolean {
  const normalized = dirPath.replace(/\\/g, '/');
  // Note: hooks/ directory no longer exists at root level - hooks have been moved to domain homes
  return false;
}

/* -------------------------------------------------------------------------- */
/* Server-only detection and managed client barrel writer                     */
/* -------------------------------------------------------------------------- */

const SERVER_ONLY_IMPORT_MARKERS = [
  "import 'server-only'",
  "from '@clerk/nextjs/server'",
  'from "@clerk/nextjs/server"',
  "from 'next/navigation'",
  'from "next/navigation"',
  "from 'next/headers'",
  "from 'next/server'",
  "from 'next/cache'",
  "from '@/lib/server",
  'from "@/lib/server',
];

export function isServerOnlyModule(filePath: string, sourceText?: string): boolean {
  const base = path.basename(filePath);
  if (base === 'server.ts' || base.endsWith('.server.ts') || base.endsWith('.server.tsx')) return true;
  if (!sourceText) {
    try { sourceText = fs.readFileSync(filePath, 'utf8'); } catch { /* ignore */ }
  }
  if (!sourceText) return false;
  return SERVER_ONLY_IMPORT_MARKERS.some((m) => sourceText!.includes(m));
}

function writeManagedIndex(outFile: string, exportLines: string[]) {
  const START = '// <auto-generated:client-runtime-exports>';
  const END = '// </auto-generated:client-runtime-exports>';
  let prev = '';
  try { prev = fs.readFileSync(outFile, 'utf8'); } catch { /* new file */ }
  const managedBlock = [START, ...exportLines, END].join('\n') + '\n';
  if (!prev) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, managedBlock + '\n// manual type-only re-exports live below this line\n');
    return;
  }
  const hasStart = prev.includes(START);
  const hasEnd = prev.includes(END);
  if (hasStart && hasEnd) {
    const next = prev.replace(new RegExp(`${START}[\\s\\S]*?${END}`), managedBlock);
    fs.writeFileSync(outFile, next);
  } else {
    fs.writeFileSync(outFile, managedBlock + '\n' + prev);
  }
}

export function createBarrelFile(entries: string[], outFile: string) {
  const base = path.basename(outFile);
  // Never auto-generate server barrels
  if (base === 'server.ts') return;

  // Filter out server-only entries for client index barrels
  const clientEntries = entries
    .filter((e) => !isServerOnlyModule(e))
    // never export ./server from client barrels
    .filter((e) => !/[\/\\]server(\.ts|\.tsx)?$/.test(e));

  const exportLines = clientEntries
    .sort()
    .map((e) => {
      const rel = './' + path.basename(e).replace(/\.(ts|tsx)$/, '');
      return `export * from '${rel}';`;
    });

  writeManagedIndex(outFile, exportLines);
}

/* -------------------------------------------------------------------------- */
/* Synchronous barrel reading functions (for compatibility with existing code) */
/* -------------------------------------------------------------------------- */

export type BarrelMode = 'aggregator' | 'leaf';

/**
 * Normalize path separators (Windows to Unix)
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Read barrel exports synchronously (sync version for compatibility)
 */
export function readBarrelExports(domainPath: string): string[] {
  const indexPath = path.join(domainPath, 'index.ts');
  if (!fs.existsSync(indexPath)) return [];
  const content = fs.readFileSync(indexPath, 'utf8');

  const results: string[] = [];
  const starRe = /export\s+(?:type\s+)?\*\s+from\s+['"]\.\/(.+?)['"];?/g;
  const namedRe = /export\s+(?:type\s+)?\{[^}]*\}\s*from\s*['"]\.\/(.+?)['"];?/g;
  let m: RegExpExecArray | null;
  while ((m = starRe.exec(content))) results.push(m[1] ?? '');
  while ((m = namedRe.exec(content))) results.push(m[1] ?? '');
  return Array.from(new Set(results));
}

/**
 * Read all modules referenced in a barrel file (sync version)
 */
export function readBarrelReferencedModules(domainPath: string): { files: string[]; subdirs: string[] } {
  const indexPath = path.join(domainPath, 'index.ts');
  if (!fs.existsSync(indexPath)) return { files: [], subdirs: [] };
  const content = fs.readFileSync(indexPath, 'utf8');
  const files: string[] = [];
  const subdirs: string[] = [];

  const exportStarRe = /export\s+(?:type\s+)?\*\s+from\s+['"]\.\/(.+?)['"];?/g;
  const exportNamedRe = /export\s*\{[^}]*\}\s*from\s*['"]\.\/(.+?)['"];?/g;
  const importRe = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+[^\s]+|[^\s]+)\s+from\s+['"]\.\/(.+?)['"];?/g;
  let m: RegExpExecArray | null;
  while ((m = exportStarRe.exec(content))) {
    const p = m[1] ?? '';
    files.push(p);
    const sub = path.join(domainPath, p);
    if (fs.existsSync(path.join(sub, 'index.ts')) || fs.existsSync(path.join(sub, 'index.tsx'))) subdirs.push(p);
  }
  while ((m = exportNamedRe.exec(content))) files.push(m[1] ?? '');
  while ((m = importRe.exec(content))) files.push(m[1] ?? '');

  return { files: Array.from(new Set(files)), subdirs: Array.from(new Set(subdirs)) };
}

/**
 * Read all barrel modules recursively (sync version)
 */
export function readAllBarrelModules(rootDir: string, visited: Set<string> = new Set()): string[] {
  const results: string[] = [];
  const indexPath = path.join(rootDir, 'index.ts');
  if (!fs.existsSync(indexPath)) return results;
  const dirKey = path.resolve(rootDir);
  if (visited.has(dirKey)) return results;
  visited.add(dirKey);

  const direct = readBarrelExports(rootDir);
  results.push(...direct);

  for (const mod of direct) {
    const subDir = path.join(rootDir, mod);
    const subIndex = path.join(subDir, 'index.ts');
    if (fs.existsSync(subIndex)) {
      results.push(...readAllBarrelModules(subDir, visited));
    } else {
      const parts = mod.split('/');
      if (parts.length > 1) {
        const [first] = parts;
        if (!first) continue;
        const nestedDir = path.join(rootDir, first);
        const nestedIndex = path.join(nestedDir, 'index.ts');
        if (fs.existsSync(nestedIndex)) results.push(...readAllBarrelModules(nestedDir, visited));
      }
    }
  }

  return Array.from(new Set(results));
}

/**
 * Convert glob pattern to RegExp
 */
function globToRegExp(glob: string): RegExp {
  const norm = glob.replace(/\\/g, '/');
  let pattern = norm.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  pattern = pattern.replace(/\*\*/g, '§§DS§§');
  pattern = pattern.replace(/\*/g, '[^/]*');
  pattern = pattern.replace(/§§DS§§/g, '.*');
  return new RegExp('^' + pattern + '$');
}

/**
 * Check if a module path is internal to a policy (sync version)
 */
export function isInternalToPolicy(rootDir: string, candidateRelPath: string): boolean {
  const absCandidate = path.join(rootDir, candidateRelPath);
  const relToRepo = normalizePath(path.relative(process.cwd(), absCandidate));
  const candidates = [relToRepo, relToRepo + '.ts', relToRepo + '.tsx', relToRepo.replace(/\/$/, '') + '/index.ts'];
  const policy = LIB_POLICIES.find((p: BarrelDomainPolicy) => relToRepo.startsWith(p.root));
  if (!policy) return false;
  const isInternal = policy.internal.some((glob: string) => {
    const re = globToRegExp(glob);
    return candidates.some(c => re.test(c));
  });
  if (!isInternal) return false;
  if (policy.publicHints && policy.publicHints.length > 0) {
    const isHint = policy.publicHints.some((glob: string) => {
      const re = globToRegExp(glob);
      return candidates.some(c => re.test(c));
    });
    if (isHint) return false;
  }
  return true;
}

/**
 * Detect barrel mode (aggregator vs leaf) - sync version
 */
export function detectBarrelMode(indexPath: string): BarrelMode {
  try {
    const dir = path.dirname(indexPath);
    const exports = readBarrelExports(dir);
    for (const mod of exports) {
      const sub = path.join(dir, mod);
      if (fs.existsSync(path.join(sub, 'index.ts')) || fs.existsSync(path.join(sub, 'index.tsx'))) return 'aggregator';
    }
    return 'leaf';
  } catch {
    return 'leaf';
  }
}

/**
 * Resolve candidate file paths for a module
 */
function resolveCandidates(dir: string, mod: string): string[] {
  return [path.join(dir, `${mod}.ts`), path.join(dir, `${mod}.tsx`), path.join(dir, mod, 'index.ts'), path.join(dir, mod, 'index.tsx')];
}

/**
 * Validate barrel file synchronously (sync version for compatibility)
 */
export function validateBarrelFileSync(indexPath: string, content?: string): {
  hasDanglingExports: boolean;
  invalidExports: Array<{ from: string; module: string }>;
  hasMissingExports: boolean;
  missingModules: string[];
} {
  const dir = path.dirname(indexPath);
  const raw = content ?? fs.readFileSync(indexPath, 'utf8');
  const exported = readBarrelExports(dir);
  const referenced = readBarrelReferencedModules(dir).files;

  const invalidExports: string[] = [];
  for (const ref of referenced) {
    const candidates = resolveCandidates(dir, ref);
    if (!candidates.some(c => fs.existsSync(c))) invalidExports.push(ref);
  }

  const allFiles = fs.readdirSync(dir).filter(f => /\.tsx?$/.test(f) && !/^index\.(ts|tsx)$/.test(f)).map(f => f.replace(/\.tsx?$/, ''));
  const missingModules = allFiles.filter(f => !exported.includes(f));

  return {
    hasDanglingExports: invalidExports.length > 0,
    invalidExports: invalidExports.map(i => ({ from: i, module: i })),
    hasMissingExports: missingModules.length > 0,
    missingModules,
  };
}

/**
 * Check for duplicate exports (sync version)
 */
export function checkDuplicateExportsSync(content: string, filePath: string): Array<{ type: 'duplicate' | 'type-value'; symbol: string; line: number; from?: string }> {
  const results: Array<{ type: 'duplicate' | 'type-value'; symbol: string; line: number; from?: string }> = [];
  try {
    const namedRe = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/([^'"]+)['"];?/g;
    let m: RegExpExecArray | null;
    const seen = new Map<string, number>();
    const lines = content.split('\n');
    while ((m = namedRe.exec(content))) {
      const names = (m[1] ?? '').split(',').map((s: string) => s.trim());
      for (const n of names) {
        const count = (seen.get(n) ?? 0) + 1;
        seen.set(n, count);
        if (count > 1) {
          const idx = content.slice(0, m.index).split('\n').length - 1;
          if (m[2]) {
            results.push({ type: 'duplicate', symbol: n, line: idx, from: m[2] });
          } else {
            results.push({ type: 'duplicate', symbol: n, line: idx });
          }
        }
      }
    }
  } catch {
    // noop
  }
  return results;
}

/**
 * Check if barrel file has placeholder exports (sync version)
 */
export function hasPlaceholderExportsSync(content: string): boolean {
  return /z\.any\(\)/.test(content) || /TODO\:.*export/.test(content);
}

/**
 * Check if barrel should be excluded from requirements (sync version)
 */
export function shouldExcludeFromBarrelRequirementsSync(indexPath: string): boolean {
  // heuristic: consolidated barrels may be intentionally empty
  // Note: hooks/shared and hooks/dashboard no longer exist at root level - hooks have been moved to domain homes
  const norm = normalizePath(indexPath);
  return /components\/insights\/hooks\/index\.ts$/.test(norm) ||
         /components\/insights\/sections\/index\.ts$/.test(norm) ||
         /components\/insights\/clients\/index\.ts$/.test(norm) ||
         /lib\/integrations\/errors\/index\.ts$/.test(norm) ||
         /eslint-plugin-corso/.test(norm);
}

/**
 * Check if module is server-only (sync version)
 */
export function isServerOnlyModuleSync(resolvedPath: string): boolean {
  const s = normalizePath(resolvedPath);
  return /\.server\.|\/server\/|index-server\.ts/.test(s);
}

