#!/usr/bin/env tsx
/**
 * Workspace Index Builder
 *
 * Precomputes workspace indexes that multiple tools can share.
 * Keeps indexes minimal; add only when a second tool needs the same thing.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import type { WorkspaceIndex } from './types';
import { getRepoRoot, normalizePath, getRelativePath } from '../../lint/_utils/paths';

/**
 * Build CSS module importers index: maps CSS module path -> Set of TS/TSX files that import it
 */
export function buildCssModuleImporters(
  rootDir: string,
  tsFiles: string[],
  tsxFiles: string[]
): Map<string, Set<string>> {
  const importers = new Map<string, Set<string>>();

  // Patterns to match CSS module imports
  const cssModuleImportPatterns = [
    // import styles from './component.module.css'
    /import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+['"]([^'"]+\.module\.css)['"]/g,
    // import styles, { other } from './component.module.css'
    /import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]([^'"]+\.module\.css)['"]/g,
  ];

  function resolveCssModulePath(importerFile: string, moduleSpec: string): string | null {
    // Handle relative paths
    if (moduleSpec.startsWith('.')) {
      const importerDir = dirname(importerFile);
      const resolved = normalizePath(normalize(join(importerDir, moduleSpec)));
      // Check if file exists with .css extension
      if (existsSync(resolved)) {
        return getRelativePath(resolved);
      }
      // Try without explicit .css extension (shouldn't happen but be safe)
      if (existsSync(resolved.replace(/\.css$/, ''))) {
        return getRelativePath(resolved.replace(/\.css$/, ''));
      }
    }
    // Handle @/ alias (relative to root)
    if (moduleSpec.startsWith('@/')) {
      const relPath = moduleSpec.replace('@/', '');
      const resolved = normalizePath(normalize(join(rootDir, relPath)));
      if (existsSync(resolved)) {
        return getRelativePath(resolved);
      }
    }
    return null;
  }

  function processFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      const relPath = getRelativePath(filePath);

      for (const pattern of cssModuleImportPatterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
          const moduleSpec = match[2] || match[match.length - 1]; // Last capture group
          if (!moduleSpec) continue;
          const resolved = resolveCssModulePath(filePath, moduleSpec);

          if (resolved) {
            if (!importers.has(resolved)) {
              importers.set(resolved, new Set());
            }
            importers.get(resolved)!.add(relPath);
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  // Process all TS/TSX files
  for (const file of [...tsFiles, ...tsxFiles]) {
    processFile(file);
  }

  return importers;
}

/**
 * Compute impacted CSS modules from changed files
 */
export function computeImpactedCssModules(
  changedFiles: string[],
  cssModuleImporters: Map<string, Set<string>>
): Set<string> {
  const impacted = new Set<string>();

  // 1. Direct changes to CSS modules
  for (const file of changedFiles) {
    if (file.endsWith('.module.css')) {
      const normalized = normalizePath(file);
      impacted.add(normalized);
    }
  }

  // 2. CSS modules imported by changed TS/TSX files
  for (const [cssModule, importers] of cssModuleImporters.entries()) {
    for (const importer of importers) {
      const normalizedImporter = normalizePath(importer);
      if (changedFiles.some(changed => normalizePath(changed) === normalizedImporter)) {
        impacted.add(cssModule);
      }
    }
  }

  return impacted;
}

/**
 * Build complete workspace index
 */
export function buildWorkspaceIndex(
  rootDir: string,
  changedFiles: string[],
  tsFiles: string[],
  tsxFiles: string[],
  cssModuleFiles: string[]
): WorkspaceIndex {
  const index: WorkspaceIndex = {};

  // Only build if we have CSS modules and TS/TSX files
  if (cssModuleFiles.length > 0 && (tsFiles.length > 0 || tsxFiles.length > 0)) {
    index.cssModuleImporters = buildCssModuleImporters(rootDir, tsFiles, tsxFiles);

    // Compute impacted CSS modules if we have changed files
    if (changedFiles.length > 0) {
      index.impactedCssModules = computeImpactedCssModules(
        changedFiles,
        index.cssModuleImporters
      );
    }
  }

  return index;
}
