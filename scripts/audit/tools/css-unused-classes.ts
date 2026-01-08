#!/usr/bin/env tsx
/**
 * Unused CSS Classes Detector
 *
 * Analyzes CSS modules to find unused classes.
 * Uses PostCSS for CSS parsing and TypeScript AST for usage detection.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import postcss from 'postcss';
import selectorParser, { type Root, type Pseudo, type ClassName } from 'postcss-selector-parser';
import type { SourceFile} from 'ts-morph';
import { Project, Node } from 'ts-morph';
import { getRelativePath, getRepoRoot, normalizePath } from '../../lint/_utils/paths';
import type { CssAuditTool, Finding, ToolRunResult } from '../types';

interface CssModuleInfo {
  file: string;
  classes: Map<string, { line: number; col: number }>;
  composes: Map<string, Set<string>>; // className -> set of composed classes
  composesFrom: Map<string, string>; // className -> source module
  hasSuppression: boolean; // file-level suppression
  suppressedClasses: Set<string>; // classes suppressed by comments
  parseError?: string;
  dynamicAccess: boolean;
}

interface UsageInfo {
  usedClasses: Set<string>;
  dynamicAccess: boolean;
  parseError?: string;
}

/**
 * Parse CSS module and extract class information
 */
function parseCssModule(
  filePath: string,
  content: string,
  ignorePatterns: string[]
): CssModuleInfo {
  const info: CssModuleInfo = {
    file: filePath,
    classes: new Map(),
    composes: new Map(),
    composesFrom: new Map(),
    hasSuppression: false,
    suppressedClasses: new Set(),
    dynamicAccess: false,
  };

  // Check for file-level suppression
  if (/\/\*\s*css-audit-ignore-file\s+unused-classes\s*\*\//.test(content)) {
    info.hasSuppression = true;
    return info;
  }

  // Extract suppression comments
  const suppressionRegex = /\/\*\s*css-audit-ignore\s+unused-class\s*\*\/[\s\S]*?(\.)([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match;
  while ((match = suppressionRegex.exec(content)) !== null) {
    if (match[2]) {
      info.suppressedClasses.add(match[2]);
    }
  }

  try {
    const root = postcss.parse(content);

    // Track if we're in a :global() context
    let inGlobalContext = false;

    root.walkRules((rule) => {
      // Parse selector to extract local class names
      try {
        let localContext = false;
        let globalContext = false;

        const processor = selectorParser((selectors: Root) => {
          selectors.walkPseudos((pseudo: Pseudo) => {
            if (pseudo.value === ':global' || pseudo.value === ':global(') {
              globalContext = true;
            } else if (pseudo.value === ':local' || pseudo.value === ':local(') {
              localContext = true;
            }
          });

          selectors.walkClasses((classNode: ClassName) => {
            const className = classNode.value;
            if (!className) return;

            // Skip if matches ignore pattern
            if (ignorePatterns.some(pattern => {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              return regex.test(className);
            })) {
              return;
            }

            // Skip if suppressed
            if (info.suppressedClasses.has(className)) {
              return;
            }

            // Skip if in :global() context (unless also in :local())
            if (globalContext && !localContext) {
              return;
            }

            // Track class with line/col
            if (!info.classes.has(className)) {
              const source = rule.source;
              if (source && source.start) {
                info.classes.set(className, {
                  line: source.start.line || 1,
                  col: source.start.column || 1,
                });
              } else {
                info.classes.set(className, { line: 1, col: 1 });
              }
            }
          });
        });

        processor.processSync(rule.selector);
      } catch (error) {
        // If selector parsing fails, continue
      }
    });

    // Parse composes declarations
    root.walkDecls((decl) => {
      if (decl.prop === 'composes') {
        const value = decl.value.trim();
        const match = value.match(/^([a-zA-Z_-][a-zA-Z0-9_-]*)\s+(?:from\s+['"](.+?)['"])?/);
        
        if (match) {
          const className = match[1];
          const fromModule = match[2];
          if (!className) {
            return;
          }

          // Same-file composes
          if (!fromModule) {
            const composedClasses = value
              .split(/\s+/)
              .filter(c => c !== 'composes' && c !== className)
              .map(c => c.trim())
              .filter(Boolean);

            if (!info.composes.has(className)) {
              info.composes.set(className, new Set());
            }
            composedClasses.forEach(comp => {
              info.composes.get(className)!.add(comp);
            });
          } else {
            // Cross-module composes - store reference
            info.composesFrom.set(className, fromModule);
          }
        }
      }
    });
  } catch (error) {
    info.parseError = error instanceof Error ? error.message : String(error);
  }

  return info;
}

/**
 * Resolve CSS module path from import specifier
 */
function resolveCssModulePath(
  importSpecifier: string,
  importerFile: string,
  rootDir: string
): string | null {
  // Handle @/ alias
  let resolved: string;
  if (importSpecifier.startsWith('@/')) {
    resolved = join(rootDir, importSpecifier.replace('@/', ''));
  } else if (importSpecifier.startsWith('.')) {
    resolved = resolve(dirname(importerFile), importSpecifier);
  } else {
    return null; // External module
  }

  // Try with .module.css extension
  const withExtension = resolved.endsWith('.module.css') 
    ? resolved 
    : `${resolved}.module.css`;

  if (existsSync(withExtension)) {
    return normalizePath(getRelativePath(withExtension));
  }

  // Try without extension
  if (existsSync(resolved)) {
    return normalizePath(getRelativePath(resolved));
  }

  return null;
}

/**
 * Analyze TypeScript/TSX files for CSS module usage
 */
function analyzeUsage(
  sourceFiles: SourceFile[],
  cssModulePath: string,
  rootDir: string,
  moduleInfo: CssModuleInfo
): UsageInfo {
  const usedClasses = new Set<string>();
  let dynamicAccess = false;
  let parseError: string | undefined;

  for (const sf of sourceFiles) {
    try {
      // Find imports from this CSS module
      const imports = sf.getImportDeclarations().filter(imp => {
        const spec = imp.getModuleSpecifierValue();
        if (!spec) return false;

        const resolved = resolveCssModulePath(spec, sf.getFilePath(), rootDir);
        return resolved === cssModulePath;
      });

      if (imports.length === 0) continue;

      // For each import, analyze usage
      for (const imp of imports) {
        const defaultImport = imp.getDefaultImport();
        const namedImports = imp.getNamedImports();

        // Default import: import styles from '...'
        if (defaultImport) {
          const importName = defaultImport.getText();

          // Walk the source file to find usage
          sf.forEachDescendant((node) => {
            // styles['className'] or styles[var]
            if (Node.isElementAccessExpression(node)) {
              const expr = node.getExpression();
              if (expr && Node.isIdentifier(expr) && expr.getText() === importName) {
                const arg = node.getArgumentExpression();
                if (arg && Node.isStringLiteral(arg)) {
                  const className = arg.getLiteralValue();
                  if (typeof className === 'string') {
                    usedClasses.add(className);
                  }
                } else if (arg) {
                  // Dynamic access (non-literal)
                  dynamicAccess = true;
                }
              }
            }

            // styles.className
            if (Node.isPropertyAccessExpression(node)) {
              const expr = node.getExpression();
              if (expr && Node.isIdentifier(expr) && expr.getText() === importName) {
                // Check if it's a call expression (styles.className()) - ignore
                const parent = node.getParent();
                if (parent && Node.isCallExpression(parent)) {
                  const callee = parent.getExpression();
                  if (callee === node) {
                    return; // Skip - it's a function call
                  }
                }
                
                const name = node.getName();
                if (name) {
                  usedClasses.add(name);
                }
              }
            }

            // Destructuring: const { className, alias: other } = styles
            if (Node.isVariableDeclaration(node)) {
              const init = node.getInitializer();
              if (init && Node.isIdentifier(init) && init.getText() === importName) {
                const nameNode = node.getNameNode();
                if (Node.isObjectBindingPattern(nameNode) || Node.isArrayBindingPattern(nameNode)) {
                  nameNode.getElements().forEach((elem) => {
                    if (!Node.isBindingElement(elem)) return; // Skip OmittedExpression
                    const elemNameNode = elem.getNameNode();
                    if (Node.isIdentifier(elemNameNode)) {
                      const prop = elem.getPropertyNameNode();
                      if (prop) {
                        // Alias: { alias: original }
                        const propName = prop.getText();
                        if (propName) usedClasses.add(propName);
                      } else {
                        // Direct: { original }
                        const n = elemNameNode.getText();
                        if (n) usedClasses.add(n);
                      }
                    }
                  });
                }
              }
            }
          });
        }

        // Named imports: import { className } from '...'
        namedImports.forEach(ni => {
          const name = ni.getNameNode();
          if (Node.isIdentifier(name)) {
            usedClasses.add(name.getText());
          }
        });
      }
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    usedClasses,
    dynamicAccess,
    ...(parseError ? { parseError } : {}),
  } satisfies UsageInfo;
}

/**
 * Propagate composes relationships
 */
function propagateComposes(
  classes: Set<string>,
  composes: Map<string, Set<string>>,
  moduleInfo: CssModuleInfo,
  allModules: Map<string, CssModuleInfo>
): Set<string> {
  let changed = true;
  const result = new Set(classes);

  while (changed) {
    changed = false;
    const beforeSize = result.size;

    // For each used class, add all its composed classes
    for (const className of Array.from(result)) {
      // Same-file composes
      const composed = composes.get(className);
      if (composed) {
        composed.forEach(comp => {
          if (!result.has(comp)) {
            result.add(comp);
            changed = true;
          }
        });
      }

      // Cross-module composes
      const fromModule = moduleInfo.composesFrom.get(className);
      if (fromModule) {
        // Resolve module path
        const resolved = resolveCssModulePath(
          fromModule,
          moduleInfo.file,
          getRepoRoot()
        );
        if (resolved) {
          const otherModule = allModules.get(resolved);
          if (otherModule) {
            // The composed class name is the same as the original
            // In CSS modules, composes propagates the class
            // For simplicity, we mark the class as used in the target module too
            otherModule.classes.forEach((_, compClassName) => {
              if (!result.has(compClassName)) {
                result.add(compClassName);
                changed = true;
              }
            });
          }
        }
      }
    }

    if (result.size > beforeSize) {
      changed = true;
    }
  }

  return result;
}

/**
 * Unused CSS Classes Tool
 */
export const cssUnusedClassesTool: CssAuditTool = {
  id: 'css-unused-classes',
  title: 'Unused CSS Classes',
  description: 'Detects unused CSS module classes using PostCSS and TypeScript AST analysis',
  category: 'audit',
  scope: {
    kind: 'entities',
    entity: 'cssModule',
    impactedBy: ['cssModule', 'ts', 'tsx'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Only baseline warn-level unused class findings
    return finding.ruleId === 'css/unused-class' && finding.severity === 'warn';
  },

  async run(ctx, toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;
    let cssModules: string[] = [];

    // Get tool config
    const config = toolConfig as {
      ignoreClassNamePatterns?: string[];
      ignoreFiles?: string[];
    } || {};

    const ignorePatterns = config.ignoreClassNamePatterns || [];
    const ignoreFiles = new Set(config.ignoreFiles || []);

    try {
      ctx.log('Analyzing CSS modules for unused classes...');

      // Get CSS modules to analyze
      // In changed mode, use impacted modules; otherwise use all module files
      if (ctx.targets.mode === 'changed' && ctx.index.impactedCssModules) {
        cssModules = Array.from(ctx.index.impactedCssModules);
      } else {
        cssModules = Array.from(new Set(ctx.targets.cssModuleFiles));
      }

      if (cssModules.length === 0) {
        return {
          findings: [],
          stats: {
            modulesAnalyzed: 0,
            findings: 0,
          },
        };
      }

      // Filter ignored files
      cssModules = cssModules.filter(m => {
        const relPath = getRelativePath(join(rootDir, m));
        return !ignoreFiles.has(relPath) && !ignoreFiles.has(m);
      });

      // Build TypeScript project for AST analysis
      const project = new Project({
        tsConfigFilePath: join(rootDir, 'tsconfig.json'),
      });

      // Get all source files that might import CSS modules
      // In changed mode, we need ALL importers, not just changed ones
      // So we use all source files in the project
      const sourceFiles = project.getSourceFiles();

      // Parse all CSS modules
      const moduleInfos = new Map<string, CssModuleInfo>();

      for (const modulePath of cssModules) {
        const absPath = join(rootDir, modulePath);
        if (!existsSync(absPath)) continue;

        try {
          const content = readFileSync(absPath, 'utf8');
          const info = parseCssModule(absPath, content, ignorePatterns);
          moduleInfos.set(modulePath, info);

          // Report parse errors
          if (info.parseError) {
            findings.push({
              tool: 'css-unused-classes',
              ruleId: 'css/parse-error',
              severity: 'warn',
              file: modulePath,
              message: `Failed to parse CSS module: ${info.parseError}`,
              fingerprint: `css-unused-classes|css/parse-error|${modulePath}`,
            });
          }
        } catch (error) {
          findings.push({
            tool: 'css-unused-classes',
            ruleId: 'css/parse-error',
            severity: 'warn',
            file: modulePath,
            message: `Failed to read CSS module: ${error instanceof Error ? error.message : String(error)}`,
            fingerprint: `css-unused-classes|css/parse-error|${modulePath}`,
          });
        }
      }

      // Analyze usage for each module
      for (const [modulePath, moduleInfo] of moduleInfos) {
        // Skip if file-level suppression
        if (moduleInfo.hasSuppression) {
          continue;
        }

        // Get all importers of this module
        const importers = ctx.index.cssModuleImporters?.get(modulePath) || new Set();
        
        // Get source files that import this module
        // If we have importers from index, use those; otherwise check all source files
        let importerFiles: SourceFile[];
        if (importers.size > 0) {
          importerFiles = Array.from(importers)
            .map(imp => {
              const absPath = join(rootDir, imp);
              return project.getSourceFile(absPath);
            })
            .filter((sf): sf is SourceFile => sf !== undefined);
        } else {
          // Fallback: check all source files (slower but more thorough)
          importerFiles = sourceFiles;
        }

        // Analyze usage
        const usage = analyzeUsage(importerFiles, modulePath, rootDir, moduleInfo);

        // Track dynamic access
        if (usage.dynamicAccess) {
          moduleInfo.dynamicAccess = true;
          findings.push({
            tool: 'css-unused-classes',
            ruleId: 'css/dynamic-access',
            severity: 'info',
            file: modulePath,
            message: 'CSS module has dynamic class access - unused class detection may be incomplete',
            hint: 'Dynamic access patterns like styles[variable] prevent accurate unused class detection',
            fingerprint: `css-unused-classes|css/dynamic-access|${modulePath}`,
          });
        }

        // Report parse errors in usage analysis
        if (usage.parseError) {
          findings.push({
            tool: 'css-unused-classes',
            ruleId: 'css/parse-error',
            severity: 'warn',
            file: modulePath,
            message: `Failed to analyze usage: ${usage.parseError}`,
            fingerprint: `css-unused-classes|css/parse-error|${modulePath}`,
          });
        }

        // Propagate composes
        const usedClasses = propagateComposes(
          usage.usedClasses,
          moduleInfo.composes,
          moduleInfo,
          moduleInfos
        );

        // Determine confidence level
        const highConfidence = !moduleInfo.dynamicAccess && !usage.parseError && !moduleInfo.parseError;

        // Find unused classes
        for (const [className, location] of moduleInfo.classes) {
          if (!usedClasses.has(className) && !moduleInfo.suppressedClasses.has(className)) {
            const fingerprint = `css-unused-classes|css/unused-class|${modulePath}|${className}`;
            
            findings.push({
              tool: 'css-unused-classes',
              ruleId: 'css/unused-class',
              severity: highConfidence ? 'warn' : 'info',
              file: modulePath,
              line: location.line,
              col: location.col,
              message: `Unused CSS class: ${className}`,
              hint: highConfidence 
                ? 'This class appears unused. Remove it or add a suppression comment.'
                : 'This class may be unused, but detection confidence is low due to dynamic access or parse errors.',
              fingerprint,
              data: {
                className,
                confidence: highConfidence ? 'high' : 'low',
              },
            });
          }
        }
      }

      ctx.log(`  Analyzed ${cssModules.length} CSS modules, found ${findings.length} findings`);
    } catch (error) {
      ctx.warn(`Unused classes analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        modulesAnalyzed: cssModules.length,
        findings: findings.length,
      },
    };
  },
};
