#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { LIB_POLICIES } from './barrel.config';

export type BarrelMode = 'aggregator' | 'leaf';

export function normalizePath(p: string) {
  return p.replace(/\\/g, '/');
}

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

export function readBarrelReferencedModules(domainPath: string) {
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

function globToRegExp(glob: string): RegExp {
  const norm = glob.replace(/\\/g, '/');
  let pattern = norm.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  pattern = pattern.replace(/\*\*/g, '§§DS§§');
  pattern = pattern.replace(/\*/g, '[^/]*');
  pattern = pattern.replace(/§§DS§§/g, '.*');
  return new RegExp('^' + pattern + '$');
}

export function isInternalToPolicy(rootDir: string, candidateRelPath: string): boolean {
  const absCandidate = path.join(rootDir, candidateRelPath);
  const relToRepo = normalizePath(path.relative(process.cwd(), absCandidate));
  const candidates = [relToRepo, relToRepo + '.ts', relToRepo + '.tsx', relToRepo.replace(/\/$/, '') + '/index.ts'];
  const policy = LIB_POLICIES.find(p => relToRepo.startsWith(p.root));
  if (!policy) return false;
  const isInternal = policy.internal.some(glob => {
    const re = globToRegExp(glob);
    return candidates.some(c => re.test(c));
  });
  if (!isInternal) return false;
  if (policy.publicHints && policy.publicHints.length > 0) {
    const isHint = policy.publicHints.some(glob => {
      const re = globToRegExp(glob);
      return candidates.some(c => re.test(c));
    });
    if (isHint) return false;
  }
  return true;
}

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

function resolveCandidates(dir: string, mod: string): string[] {
  return [path.join(dir, `${mod}.ts`), path.join(dir, `${mod}.tsx`), path.join(dir, mod, 'index.ts'), path.join(dir, mod, 'index.tsx')];
}

export function validateBarrelFile(indexPath: string, content?: string) {
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

export function checkDuplicateExports(content: string, filePath: string) {
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

export function hasPlaceholderExports(content: string) {
  return /z\.any\(\)/.test(content) || /TODO\:.*export/.test(content);
}

export function shouldExcludeFromBarrelRequirements(indexPath: string) {
  // heuristic: consolidated root barrels (e.g., hooks/shared, hooks/dashboard) may be intentionally empty
  const norm = normalizePath(indexPath);
  return /hooks\/shared\/index\.ts$/.test(norm) ||
         /hooks\/dashboard\/index\.ts$/.test(norm) ||
         /components\/insights\/hooks\/index\.ts$/.test(norm) ||
         /components\/insights\/sections\/index\.ts$/.test(norm) ||
         /components\/insights\/clients\/index\.ts$/.test(norm) ||
         /lib\/integrations\/errors\/index\.ts$/.test(norm) ||
         /eslint-plugin-corso/.test(norm);
}

export function isServerOnlyModule(resolvedPath: string) {
  const s = normalizePath(resolvedPath);
  return /\.server\.|\/server\/|index-server\.ts/.test(s);
}



