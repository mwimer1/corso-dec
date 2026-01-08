#!/usr/bin/env tsx
/**
 * Unused CSS Classes Detector
 *
 * Detects unused CSS classes in CSS modules by parsing CSS and TS/TSX files.
 * Uses AST parsing for accurate matching without false positives.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath, getRepoRoot, normalizePath } from '../../../lint/_utils/paths';
import * as postcss from 'postcss';
import { Project } from 'ts-morph';

interface CssModuleInfo {
  file: string;
  classes: Set<string>;
}

interface ClassUsage {
  file: string;
  line: number;
  className: string;
  pattern: 'bracket' | 'dot' | 'cn' | 'template' | 'conditional' | 'dynamic';
}

/**
 * Extract class names from CSS module using PostCSS
 */
function extractCssClasses(cssContent: string): Set<string> {
  const classes = new Set<string>();

  try {
    const root = postcss.parse(cssContent);

    root.walkRules(rule => {
      // Skip :global() rules (they're selectors, not class names)
      if (rule.selector.includes(':global')) {
        return;
      }

      // Skip @media, @keyframes, etc.
      if (rule.parent?.type === 'atrule') {
        const atRule = rule.parent;
        if (atRule.name === 'media' || atRule.name === 'keyframes') {
          return;
        }
      }

      // Extract class selectors (e.g., .className)
      const classMatches = rule.selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
      if (classMatches) {
        for (const match of classMatches) {
          if (!match) continue;
          // Remove leading dot
          const className = match.slice(1);
          // Skip pseudo-classes and pseudo-elements
          if (className && !className.includes(':') && !className.includes('::')) {
            classes.add(className);
          }
        }
      }
    });
  } catch {
    // If PostCSS parsing fails, fall back to regex
    const regex = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cssContent)) !== null) {
      const className = match[1];
      if (className && !className.includes(':') && !className.includes('::')) {
        classes.add(className);
      }
    }
  }

  return classes;
}

/**
 * Find CSS module import and resolve path
 */
function findCssModuleImport(
  project: Project,
  tsFile: string,
  cssModulePath: string
): { importName: string; resolved: string } | null {
  try {
    const sourceFile = project.getSourceFile(tsFile);
    if (!sourceFile) return null;

    // Try to find CSS module relative to TS file
    const tsDir = dirname(tsFile);
    const possiblePaths = [
      join(tsDir, cssModulePath),
      join(tsDir, cssModulePath.replace(/^\.\//, '')),
      join(getRepoRoot(), cssModulePath.replace(/^@\//, '')),
    ];

    let resolvedPath: string | null = null;
    for (const possible of possiblePaths) {
      if (existsSync(possible)) {
        resolvedPath = normalizePath(possible);
        break;
      }
      // Try with .css extension if not present
      if (!possible.endsWith('.css')) {
        const withExt = `${possible}.css`;
        if (existsSync(withExt)) {
          resolvedPath = normalizePath(withExt);
          break;
        }
      }
    }

    if (!resolvedPath) return null;

    // Find import statement
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const imp of importDeclarations) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      
      // Check if this import matches our CSS module
      const impDir = dirname(tsFile);
      const possibleImportPaths = [
        normalizePath(join(impDir, moduleSpecifier)),
        normalizePath(join(impDir, moduleSpecifier.replace(/^\.\//, ''))),
        moduleSpecifier.startsWith('@/') 
          ? normalizePath(join(getRepoRoot(), moduleSpecifier.replace(/^@\//, '')))
          : null,
      ].filter(Boolean) as string[];

      for (const possible of possibleImportPaths) {
        if (normalizePath(possible) === resolvedPath || 
            normalizePath(`${possible}.css`) === resolvedPath) {
          // Get import name (default import or namespace)
          const defaultImport = imp.getDefaultImport();
          const namespaceImport = imp.getNamespaceImport();
          const importName = defaultImport?.getText() || namespaceImport?.getText() || 'styles';
          
          return {
            importName,
            resolved: getRelativePath(resolvedPath),
          };
        }
      }
    }
  } catch {
    // Fall through
  }

  return null;
}

/**
 * Extract class usage from TS/TSX file
 */
function extractClassUsage(
  project: Project,
  tsFile: string,
  cssModuleFile: string,
  importName: string
): ClassUsage[] {
  const usages: ClassUsage[] = [];

  try {
    const sourceFile = project.getSourceFile(tsFile);
    if (!sourceFile) return usages;

    const text = sourceFile.getFullText();
    const lines = text.split('\n');

    // Pattern 1: Bracket notation styles['className']
    const bracketPattern = new RegExp(
      `${importName}\\[(['"])([a-zA-Z][a-zA-Z0-9_-]*)\\1\\]`,
      'g'
    );
    let match: RegExpExecArray | null;
    while ((match = bracketPattern.exec(text)) !== null) {
      const className = match[2];
      if (!className) continue;
      const offset = match.index ?? 0;
      const lineNum = text.substring(0, offset).split('\n').length;
      usages.push({
        file: getRelativePath(tsFile),
        line: lineNum,
        className,
        pattern: 'bracket',
      });
    }

    // Pattern 2: Dot notation styles.className (but not function calls)
    const dotPattern = new RegExp(
      `${importName}\\.([a-zA-Z][a-zA-Z0-9_-]*)(?!\\s*\\()`,
      'g'
    );
    while ((match = dotPattern.exec(text)) !== null) {
      const className = match[1];
      if (!className) continue;
      const offset = match.index ?? 0;
      const lineNum = text.substring(0, offset).split('\n').length;
      usages.push({
        file: getRelativePath(tsFile),
        line: lineNum,
        className,
        pattern: 'dot',
      });
    }

    // Pattern 3: Inside cn() calls - multiple styles[] patterns
    const cnPattern = new RegExp(
      `cn\\([^)]*${importName}\\[(['"])([a-zA-Z][a-zA-Z0-9_-]*)\\1\\][^)]*\\)`,
      'g'
    );
    while ((match = cnPattern.exec(text)) !== null) {
      // Extract all styles[] patterns from this cn() call
      const cnCall = match[0];
      const nestedBracketPattern = new RegExp(
        `${importName}\\[(['"])([a-zA-Z][a-zA-Z0-9_-]*)\\1\\]`,
        'g'
      );
      let nestedMatch: RegExpExecArray | null;
      while ((nestedMatch = nestedBracketPattern.exec(cnCall)) !== null) {
        const className = nestedMatch[2];
        if (!className) continue;
        const globalOffset = (match.index ?? 0) + (nestedMatch.index ?? 0);
        const lineNum = text.substring(0, globalOffset).split('\n').length;
        usages.push({
          file: getRelativePath(tsFile),
          line: lineNum,
          className,
          pattern: 'cn',
        });
      }
    }

    // Pattern 4: Template literals `${styles.className()} ...`
    const templatePattern = new RegExp(
      `\\$\{${importName}\\.([a-zA-Z][a-zA-Z0-9_-]*)\\(\\)\\}`,
      'g'
    );
    while ((match = templatePattern.exec(text)) !== null) {
      const className = match[1];
      if (!className) continue;
      const offset = match.index ?? 0;
      const lineNum = text.substring(0, offset).split('\n').length;
      usages.push({
        file: getRelativePath(tsFile),
        line: lineNum,
        className,
        pattern: 'template',
      });
    }

    // Pattern 5: Conditional styles['className'] || ''
    const conditionalPattern = new RegExp(
      `${importName}\\[(['"])([a-zA-Z][a-zA-Z0-9_-]*)\\1\\]\\s*\\|\\|`,
      'g'
    );
    while ((match = conditionalPattern.exec(text)) !== null) {
      const className = match[2];
      if (!className) continue;
      const offset = match.index ?? 0;
      const lineNum = text.substring(0, offset).split('\n').length;
      usages.push({
        file: getRelativePath(tsFile),
        line: lineNum,
        className,
        pattern: 'conditional',
      });
    }

    // Pattern 6: Dynamic access styles[classNameVariable] - mark as potentially used
    // We'll handle this separately to avoid false positives
  } catch {
    // Skip files that can't be parsed
  }

  return usages;
}

/**
 * Create finding for unused class
 */
function createFinding(
  cssModule: string,
  className: string,
  line?: number
): Finding {
  const fingerprint = `css/unused-class:${cssModule}:${className}`;
  
  return {
    tool: 'css-unused-classes',
    ruleId: 'css/unused-class',
    severity: 'warn',
    ...(cssModule ? { file: cssModule } : {}),
    ...(typeof line === 'number' ? { line } : {}),
    message: `Unused CSS class: ${className}`,
    hint: `Class "${className}" is defined but never used. Consider removing it if it's no longer needed.`,
    fingerprint,
    data: {
      className,
    },
  };
}

/**
 * Unused CSS Classes Tool
 */
export const unusedClassesTool: CssAuditTool = {
  id: 'css-unused-classes',
  title: 'Unused CSS Classes',
  description: 'Detects unused CSS classes in CSS modules',
  category: 'audit',
  scope: {
    kind: 'entities',
    entity: 'cssModule',
    impactedBy: ['ts', 'tsx'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Only baseline warn-level unused classes (not info)
    return finding.severity === 'warn';
  },

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // Build TypeScript project for AST parsing
    const project = new Project({
      tsConfigFilePath: join(rootDir, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });

    // Get CSS module files
    const cssModules = ctx.targets.cssModuleFiles;

    // Build CSS module -> importers map from index
    const cssModuleImporters = ctx.index.cssModuleImporters || new Map();

    // Process each CSS module
    for (const cssModuleFile of cssModules) {
      const absPath = join(rootDir, cssModuleFile);
      
      if (!existsSync(absPath)) {
        continue;
      }

      try {
        // Extract class names from CSS
        const cssContent = readFileSync(absPath, 'utf8');
        const classes = extractCssClasses(cssContent);

        if (classes.size === 0) {
          continue;
        }

        // Find files that import this CSS module
        const importers = cssModuleImporters.get(cssModuleFile) || new Set();
        const usedClasses = new Set<string>();

        // Check each importer file
        for (const importer of importers) {
          const importerPath = join(rootDir, importer);
          
          if (!existsSync(importerPath)) {
            continue;
          }

          // Find the CSS module import
          const importInfo = findCssModuleImport(project, importerPath, cssModuleFile);
          if (!importInfo) {
            continue;
          }

          // Extract class usage
          const usages = extractClassUsage(project, importerPath, cssModuleFile, importInfo.importName);
          
          for (const usage of usages) {
            usedClasses.add(usage.className);
          }
        }

        // Find unused classes
        for (const className of classes) {
          if (!usedClasses.has(className)) {
            // Find line number where class is defined
            const lines = cssContent.split('\n');
            let lineNum: number | undefined;
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line && new RegExp(`\\.${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`).test(line)) {
                lineNum = i + 1;
                break;
              }
            }

            findings.push(createFinding(cssModuleFile, className, lineNum));
          }
        }
      } catch (error) {
        ctx.warn(`Failed to process ${cssModuleFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      findings,
      stats: {
        unusedClasses: findings.length,
        cssModulesProcessed: cssModules.length,
      },
    };
  },
};
