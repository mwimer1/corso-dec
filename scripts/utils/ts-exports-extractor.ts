#!/usr/bin/env tsx

/**
 * TypeScript-based export extraction utility
 * Uses ts-morph to correctly handle re-exports, type exports, and barrel files
 */

import type { SourceFile } from 'ts-morph';
import { Project } from 'ts-morph';
import { existsSync } from 'node:fs';
import path from 'node:path';

export interface ExportInfo {
  name: string;
  kind: 'value' | 'type' | 'namespace';
  originFile?: string;
}

// Singleton project instance for performance
let projectInstance: Project | null = null;

function getProject(tsConfigPath: string = 'tsconfig.json'): Project {
  if (!projectInstance) {
    projectInstance = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });
  }
  return projectInstance;
}

/**
 * Extract exports from a TypeScript file using ts-morph
 * Handles re-exports, type exports, and barrel files correctly
 */
export function extractExportsFromFile(
  filePath: string,
  tsConfigPath: string = 'tsconfig.json'
): ExportInfo[] {
  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const project = getProject(tsConfigPath);
    const sourceFile = project.getSourceFile(filePath);

    if (!sourceFile) {
      // Try to add the file if it's not in the project
      project.addSourceFileAtPath(filePath);
      const added = project.getSourceFile(filePath);
      if (!added) {
        return extractExportsRegex(filePath);
      }
      return extractExportsFromSourceFile(added);
    }

    return extractExportsFromSourceFile(sourceFile);
  } catch (error) {
    // Fallback to regex if ts-morph fails
    console.warn(`⚠️  ts-morph extraction failed for ${filePath}, falling back to regex: ${error instanceof Error ? error.message : String(error)}`);
    return extractExportsRegex(filePath);
  }
}

function extractExportsFromSourceFile(sourceFile: SourceFile): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const seen = new Set<string>();

  // Get all exported declarations (handles re-exports automatically)
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDeclarations) {
    if (seen.has(name)) continue;
    seen.add(name);

    // Determine kind from first declaration
    const firstDecl = declarations[0];
    if (!firstDecl) continue;

    let kind: 'value' | 'type' | 'namespace' = 'value';
    
    // Check if it's a type export
    if (firstDecl.getKindName().includes('TypeAlias') || 
        firstDecl.getKindName().includes('Interface') ||
        name.startsWith('type ')) {
      kind = 'type';
    } else if (firstDecl.getKindName().includes('Module')) {
      kind = 'namespace';
    }

    // Get origin file
    const originFile = firstDecl.getSourceFile().getFilePath();
    const relPath = path.relative(process.cwd(), originFile).replace(/\\/g, '/');

    exports.push({
      name,
      kind,
      originFile: relPath,
    });
  }

  // Also check for export * from statements (ts-morph handles these, but let's be explicit)
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    if (exportDecl.isNamespaceExport()) {
      // export * as X from './module'
      const namespace = exportDecl.getNamespaceExport()?.getText();
      if (namespace && !seen.has(namespace)) {
        seen.add(namespace);
        exports.push({
          name: namespace,
          kind: 'namespace',
          originFile: sourceFile.getFilePath().replace(/\\/g, '/'),
        });
      }
    }
  }

  // Sort by name for stable output
  exports.sort((a, b) => a.name.localeCompare(b.name));

  return exports.slice(0, 30); // Limit to 30 exports
}

/**
 * Fallback regex-based export extraction
 * Used when ts-morph is unavailable or fails
 */
function extractExportsRegex(filePath: string): ExportInfo[] {
  const fs = require('node:fs');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports: ExportInfo[] = [];
    
    // Match export statements
    const exportPatterns = [
      { pattern: /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g, kind: 'value' as const },
      { pattern: /export\s+type\s+(\w+)/g, kind: 'type' as const },
      { pattern: /export\s*\{\s*([^}]+)\s*\}/g, kind: 'value' as const },
      { pattern: /export\s+default\s+(\w+)/g, kind: 'value' as const },
    ];
    
    for (const { pattern, kind } of exportPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          if (pattern.source.includes('\\{[^}]+\\}')) {
            // Handle named exports: export { a, b, c }
            const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter((n): n is string => n !== undefined);
            for (const name of names) {
              exports.push({ name, kind });
            }
          } else {
            exports.push({ name: match[1], kind });
          }
        }
      }
    }
    
    return [...new Map(exports.map(e => [e.name, e])).values()].slice(0, 30);
  } catch {
    return [];
  }
}

/**
 * Get export names only (for backward compatibility)
 */
export function getExportNames(filePath: string, tsConfigPath?: string): string[] {
  return extractExportsFromFile(filePath, tsConfigPath).map(e => e.name);
}

/**
 * Reset project instance (useful for testing or when tsconfig changes)
 */
export function resetProject(): void {
  projectInstance = null;
}
