#!/usr/bin/env tsx
/**
 * @fileoverview Utility functions for orphan file analysis
 * @description Pure functions for path normalization, file type detection, and dynamic import scanning
 */

import * as nodePath from 'node:path';
import type { Project } from 'ts-morph';

/** Normalize to project-relative POSIX (no leading "./"). */
export function toProjectRelativePosix(absOrRel: string): string {
  const rel = absOrRel.replace(/^[.][\\/]/, '');
  return rel.replace(/\\/g, '/');
}

export function normalizePosix(p: string): string {
  return p.replace(/\\/g, '/').replace(/^[.]\//, '');
}

export function toAbsPosix(p: string): string {
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

