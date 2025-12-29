/**
 * Shared utilities for trimming barrel exports.
 * Provides common functionality for trim-*.ts scripts.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  Node,
  Project,
  type ClassDeclaration,
  type EnumDeclaration,
  type ExportDeclaration,
  type FunctionDeclaration,
  type InterfaceDeclaration,
  type TypeAliasDeclaration,
  type VariableStatement,
} from 'ts-morph';

export interface TrimOptions {
  write: boolean;
  dryRun: boolean;
  backup?: boolean;
}

export interface TrimResult {
  barrel: string;
  removed: string[];
  changed: boolean;
  backupPath?: string;
}

/**
 * Create a backup of a file before modification
 */
export function backupFile(filePath: string): string {
  const bak = `${filePath}.bak`;
  fs.copyFileSync(filePath, bak);
  return bak;
}

/**
 * Create a ts-morph Project instance with standard configuration
 */
export function createProject(tsconfigPath?: string, options?: { skipAddingFilesFromTsConfig?: boolean }): Project {
  const tsconfig = tsconfigPath ?? path.join(process.cwd(), 'tsconfig.json');
  return new Project({
    tsConfigFilePath: tsconfig,
    skipAddingFilesFromTsConfig: options?.skipAddingFilesFromTsConfig ?? false,
  });
}

/**
 * Trim named exports from a barrel file using ts-morph.
 * Removes exports that are in the removals set.
 * 
 * @param project - ts-morph Project instance
 * @param barrelPath - Path to the barrel file
 * @param removals - Set of export names to remove
 * @param options - Trim options (write, dryRun, backup)
 * @returns TrimResult with details of what was changed
 */
export function trimBarrelExports(
  project: Project,
  barrelPath: string,
  removals: Set<string>,
  options: TrimOptions
): TrimResult {
  const sf = project.getSourceFile(barrelPath);
  if (!sf) {
    throw new Error(`Barrel file not found: ${barrelPath}`);
  }

  const removed: string[] = [];
  let changed = false;

  // Process each export declaration
  sf.getExportDeclarations().forEach((ed: ExportDeclaration) => {
    const named = ed.getNamedExports();
    const keep = named.filter((ne) => !removals.has(ne.getName()));
    const toRemove = named.filter((ne) => removals.has(ne.getName()));

    if (toRemove.length > 0) {
      changed = true;
      toRemove.forEach((ne) => {
        removed.push(ne.getName());
      });

      if (options.write && !options.dryRun) {
        // Remove all current exports, then re-add the kept ones
        // This preserves formatting better than removing individual exports
        named.forEach((ne) => ne.remove());
        keep.forEach((k) => ed.addNamedExport(k.getName()));
      }
    }
  });

  // Save changes if in write mode
  if (changed && options.write && !options.dryRun) {
    sf.saveSync();
  }

  const result: TrimResult = {
    barrel: barrelPath,
    removed,
    changed,
  };

  if (changed && options.write && !options.dryRun && options.backup !== false) {
    result.backupPath = backupFile(barrelPath);
  }

  return result;
}

/**
 * Trim named exports from a barrel file by module specifier.
 * Removes exports from specific modules that are in the removals set.
 * 
 * @param project - ts-morph Project instance
 * @param barrelPath - Path to the barrel file
 * @param removalsByModule - Map of module specifier to export names to remove
 * @param options - Trim options (write, dryRun, backup)
 * @returns TrimResult with details of what was changed
 */
export function trimBarrelExportsByModule(
  project: Project,
  barrelPath: string,
  removalsByModule: Map<string, Set<string>>,
  options: TrimOptions
): TrimResult {
  const sf = project.getSourceFile(barrelPath);
  if (!sf) {
    throw new Error(`Barrel file not found: ${barrelPath}`);
  }

  const removed: string[] = [];
  let changed = false;

  // Process each export declaration
  sf.getExportDeclarations().forEach((ed: ExportDeclaration) => {
    const mod = ed.getModuleSpecifierValue() ?? '';
    const moduleRemovals = removalsByModule.get(mod);
    
    if (!moduleRemovals || moduleRemovals.size === 0) {
      return;
    }

    const named = ed.getNamedExports();
    const keep = named.filter((ne) => !moduleRemovals.has(ne.getName()));
    const toRemove = named.filter((ne) => moduleRemovals.has(ne.getName()));

    if (toRemove.length > 0) {
      changed = true;
      toRemove.forEach((ne) => {
        removed.push(ne.getName());
      });

      if (options.write && !options.dryRun) {
        // Rebuild the export declaration with the kept names, preserving type-only status
        const isTypeOnly = (ed as any).isTypeOnly?.() ?? false;
        const modText = mod ? ` from "${mod}"` : '';
        const keepNames = keep.map((k) => k.getName());
        
        if (keepNames.length === 0) {
          // Remove entire declaration if nothing left
          ed.remove();
        } else {
          // Replace with new declaration
          const newDecl = `export ${isTypeOnly ? 'type ' : ''}{ ${keepNames.join(', ')} }${modText};`;
          ed.replaceWithText(newDecl);
        }
      }
    }
  });

  // Save changes if in write mode
  if (changed && options.write && !options.dryRun) {
    sf.saveSync();
  }

  const result: TrimResult = {
    barrel: barrelPath,
    removed,
    changed,
  };

  if (changed && options.write && !options.dryRun && options.backup !== false) {
    result.backupPath = backupFile(barrelPath);
  }

  return result;
}

/**
 * Remove export modifier from a declaration node.
 * Supports VariableStatement, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, TypeAliasDeclaration, EnumDeclaration.
 * 
 * @param node - ts-morph Node to remove export modifier from
 * @returns true if the export modifier was removed, false if node type is not supported
 */
export function removeExportModifier(node: Node): boolean {
  if (Node.isVariableStatement(node)) {
    (node as VariableStatement).setIsExported(false);
    return true;
  }
  if (Node.isFunctionDeclaration(node)) {
    (node as FunctionDeclaration).setIsExported(false);
    return true;
  }
  if (Node.isClassDeclaration(node)) {
    (node as ClassDeclaration).setIsExported(false);
    return true;
  }
  if (Node.isInterfaceDeclaration(node)) {
    (node as InterfaceDeclaration).setIsExported(false);
    return true;
  }
  if (Node.isTypeAliasDeclaration(node)) {
    (node as TypeAliasDeclaration).setIsExported(false);
    return true;
  }
  if (Node.isEnumDeclaration(node)) {
    (node as EnumDeclaration).setIsExported(false);
    return true;
  }
  return false;
}

/**
 * Check if a symbol is imported anywhere in the project.
 * Useful for determining if an export can be safely removed.
 * 
 * @param project - ts-morph Project instance
 * @param name - Symbol name to check
 * @param excludePatterns - Optional array of path patterns to exclude from search
 * @returns true if the symbol is imported anywhere, false otherwise
 */
export function isImportedAnywhere(
  project: Project,
  name: string,
  excludePatterns: string[] = ['node_modules', '.next', '.turbo']
): boolean {
  for (const sf of project.getSourceFiles()) {
    const fp = sf.getFilePath();
    
    // Skip excluded patterns
    if (excludePatterns.some(pattern => fp.includes(pattern))) {
      continue;
    }
    
    // Check import declarations
    for (const imp of sf.getImportDeclarations()) {
      for (const ni of imp.getNamedImports()) {
        if (ni.getName() === name) {
          return true; // import { name } from '…'
        }
      }
    }
    
    // Check re-exports
    for (const ed of sf.getExportDeclarations()) {
      for (const ne of ed.getNamedExports()) {
        if (ne.getName() === name) {
          return true; // re-export elsewhere
        }
      }
    }
  }
  return false;
}

/**
 * Load JSON file with error handling
 */
export function loadJson<T>(filePath: string, repoRoot?: string): T {
  if (!fs.existsSync(filePath)) {
    const relPath = repoRoot ? path.relative(repoRoot, filePath) : filePath;
    throw new Error(`Missing file: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

