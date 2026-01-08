#!/usr/bin/env tsx
/**
 * Overlapping/Duplicate Rules Detector
 *
 * Detects:
 * 1. Exact duplicate declaration blocks across files
 * 2. Same selector repeated in same file with conflicting declarations
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath, normalizePath } from '../../lint/_utils/paths';

interface DeclarationBlock {
  declarations: Map<string, string>; // prop -> value
  selector: string;
  sourceFile: string;
  ruleIndex: number;
}

/**
 * Normalize declaration value (trim whitespace, normalize)
 */
function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Create canonical signature from declaration block
 */
function createDeclarationSignature(declarations: Map<string, string>): string {
  const pairs = Array.from(declarations.entries())
    .map(([prop, value]) => `${prop}:${normalizeValue(value)}`)
    .sort()
    .join(';');
  return pairs;
}

/**
 * Parse CSS file and extract rules
 */
function parseCssFile(filePath: string, content: string): {
  declarationBlocks: DeclarationBlock[];
  parseError?: string;
} {
  const declarationBlocks: DeclarationBlock[] = [];

  try {
    const root = postcss.parse(content);
    let ruleIndex = 0;

    root.walkRules((rule) => {
      // Skip @keyframes bodies
      if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') {
        return;
      }

      // Collect declarations
      const declarations = new Map<string, string>();
      rule.walkDecls((decl) => {
        const prop = decl.prop.trim();
        const value = normalizeValue(decl.value);
        declarations.set(prop, value);
      });

      // Only process rules with declarations
      if (declarations.size > 0) {
        declarationBlocks.push({
          declarations,
          selector: rule.selector.trim(),
          sourceFile: filePath,
          ruleIndex,
        });
        ruleIndex++;
      }
    });
  } catch (error) {
    return {
      declarationBlocks: [],
      parseError: error instanceof Error ? error.message : String(error),
    };
  }

  return { declarationBlocks };
}

/**
 * Detect exact duplicate declaration blocks across files
 */
function detectCrossFileDuplicates(
  allBlocks: Array<{ file: string; blocks: DeclarationBlock[] }>,
  changedFiles: Set<string>
): Finding[] {
  const findings: Finding[] = [];

  // Build signature -> files map
  const signatureMap = new Map<string, Array<{ file: string; selector: string; block: DeclarationBlock }>>();

  for (const { file, blocks } of allBlocks) {
    for (const block of blocks) {
      const signature = createDeclarationSignature(block.declarations);
      if (!signatureMap.has(signature)) {
        signatureMap.set(signature, []);
      }
      signatureMap.get(signature)!.push({ file, selector: block.selector, block });
    }
  }

  // Find signatures appearing in multiple files
  for (const [signature, entries] of signatureMap.entries()) {
    if (entries.length < 2) continue;

    // Get unique files and selectors
    const uniqueFiles = new Set(entries.map(e => e.file));
    const uniqueSelectors = new Set(entries.map(e => e.selector));

    // Only report if:
    // 1. Appears in multiple files, OR
    // 2. Appears with different selectors (potential refactoring opportunity)
    const isDuplicate = uniqueFiles.size >= 2 || uniqueSelectors.size > 1;

    if (isDuplicate) {
      // In changed mode, only report if at least one file is changed
      // In full mode, report all duplicates
      const hasChangedFile = entries.some(e => changedFiles.has(e.file));
      
      // Skip if we're in changed mode and no changed files involved
      if (changedFiles.size > 0 && !hasChangedFile) {
        continue;
      }

      // Find the "best" representative file (prefer non-changed files for consolidation target)
      const representativeEntry = entries.find(e => !changedFiles.has(e.file)) ?? entries.at(0);
      if (!representativeEntry) continue; // defensive; should not happen due to entries.length >= 2

      // Create fingerprint (doesn't include line/col)
      const fingerprint = `css-overlapping-rules|css/duplicate-declarations|${signature}`;

      // Determine severity: warn if different selectors (more actionable), info if same selector
      const severity = uniqueSelectors.size > 1 ? 'warn' : 'info';

      // Build message
      const fileList = Array.from(uniqueFiles).slice(0, 5).join(', ');
      const fileCount = uniqueFiles.size;
      const selectorCount = uniqueSelectors.size;
      
      let message = `Duplicate declaration block found in ${fileCount} file(s)`;
      if (selectorCount > 1) {
        message += ` with ${selectorCount} different selector(s)`;
      }

      let hint = `Consider consolidating into a shared utility class or CSS variable.`;
      if (uniqueFiles.size === 2) {
        hint += ` Files: ${Array.from(uniqueFiles).join(', ')}`;
      } else {
        hint += ` Found in ${fileCount} files: ${fileList}${fileCount > 5 ? '...' : ''}`;
      }

      // Create finding for each file involved (but only once per signature)
      const reportedFiles = new Set<string>();
      for (const entry of entries) {
        if (reportedFiles.has(entry.file)) continue;
        reportedFiles.add(entry.file);

        findings.push({
          tool: 'css-overlapping-rules',
          ruleId: 'css/duplicate-declarations',
          severity,
          file: entry.file,
          message,
          hint,
          fingerprint: `${fingerprint}|${entry.file}`,
          data: {
            signature,
            fileCount: uniqueFiles.size,
            selectorCount: uniqueSelectors.size,
            otherFiles: Array.from(uniqueFiles).filter(f => f !== entry.file),
            selectors: Array.from(uniqueSelectors),
            recommendation: representativeEntry.file !== entry.file
              ? `Consider consolidating in ${representativeEntry.file}`
              : 'Consider extracting to shared utility or token',
          },
        });
      }
    }
  }

  return findings;
}

/**
 * Detect conflicting declarations for same selector in same file
 */
function detectConflictingSelectors(
  allBlocks: Array<{ file: string; blocks: DeclarationBlock[] }>
): Finding[] {
  const findings: Finding[] = [];

  for (const { file, blocks } of allBlocks) {
    // Group blocks by selector
    const selectorMap = new Map<string, DeclarationBlock[]>();
    
    for (const block of blocks) {
      if (!selectorMap.has(block.selector)) {
        selectorMap.set(block.selector, []);
      }
      selectorMap.get(block.selector)!.push(block);
    }

    // Check for selectors with multiple occurrences
    for (const [selector, selectorBlocks] of selectorMap.entries()) {
      if (selectorBlocks.length < 2) continue;

      // Check for conflicting property values
      const propertyValues = new Map<string, Set<string>>(); // prop -> set of values

      for (const block of selectorBlocks) {
        for (const [prop, value] of block.declarations.entries()) {
          if (!propertyValues.has(prop)) {
            propertyValues.set(prop, new Set());
          }
          propertyValues.get(prop)!.add(value);
        }
      }

      // Find conflicting properties (same property, different values)
      const conflicts: Array<{ property: string; values: string[] }> = [];
      for (const [prop, values] of propertyValues.entries()) {
        if (values.size > 1) {
          conflicts.push({
            property: prop,
            values: Array.from(values),
          });
        }
      }

      if (conflicts.length > 0) {
        const fingerprint = `css-overlapping-rules|css/conflicting-selector|${file}|${selector}`;

        // Build conflict description
        const conflictDescs = conflicts
          .slice(0, 3)
          .map(c => `${c.property}: ${c.values.join(' vs ')}`)
          .join('; ');

        const message = `Selector "${selector}" appears ${selectorBlocks.length} time(s) with conflicting declarations`;
        const firstConflict = conflicts.at(0);
        const hint = conflicts.length === 1 && firstConflict
          ? `Property ${firstConflict.property} has conflicting values: ${firstConflict.values.join(', ')}. Consolidate into a single rule.`
          : `Conflicting properties: ${conflictDescs}${conflicts.length > 3 ? ` (and ${conflicts.length - 3} more)` : ''}. Consolidate into a single rule.`;

        findings.push({
          tool: 'css-overlapping-rules',
          ruleId: 'css/conflicting-selector',
          severity: 'warn',
          file,
          message,
          hint,
          fingerprint,
          data: {
            selector,
            occurrenceCount: selectorBlocks.length,
            conflicts: conflicts.map(c => ({
              property: c.property,
              values: c.values,
            })),
          },
        });
      }
    }
  }

  return findings;
}

/**
 * Overlapping Rules Tool
 */
export const cssOverlappingRulesTool: CssAuditTool = {
  id: 'css-overlapping-rules',
  title: 'Overlapping/Duplicate Rules',
  description: 'Detects exact duplicate declaration blocks across files and conflicting declarations for same selector',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Baseline both warn and info findings
    return finding.severity !== 'info' || finding.ruleId === 'css/duplicate-declarations';
  },

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;
    let cssFilesForAnalysis: string[] = [];
    let allCssFiles: string[] = [];
    let filesToParse: string[] = [];

    try {
      ctx.log('Analyzing CSS files for overlapping/duplicate rules...');

      // In changed mode, we need all CSS files for cross-file duplicate detection
      // but only analyze changed files for conflicting selectors
      if (ctx.targets.mode === 'changed') {
        // For cross-file duplicates, we need all files to detect if a changed file
        // duplicates an existing file. But we'll only report if at least one file is changed.
        const { glob } = await import('glob');
        try {
          const allFiles = await glob('**/*.{css,module.css}', {
            cwd: rootDir,
            ignore: ['**/node_modules/**', '**/.next/**', '**/build/**', '**/dist/**'],
            absolute: false,
          });
          allCssFiles = allFiles.map(f => normalizePath(f));
        } catch {
          allCssFiles = [];
        }

        // For conflicting selectors, only analyze changed files
        cssFilesForAnalysis = [
          ...ctx.targets.cssFiles,
          ...ctx.targets.cssModuleFiles,
        ];
      } else {
        // Full mode: analyze all files
        allCssFiles = [
          ...ctx.targets.cssFiles,
          ...ctx.targets.cssModuleFiles,
        ];
        cssFilesForAnalysis = allCssFiles;
      }

      if (cssFilesForAnalysis.length === 0) {
        return {
          findings: [],
          stats: {
            filesAnalyzed: 0,
            findings: 0,
          },
        };
      }

      // Build set of changed files for filtering
      const changedFilesSet = new Set(
        ctx.targets.mode === 'changed'
          ? ctx.targets.changedFiles
          : []
      );

      // Parse all CSS files (use allCssFiles for cross-file duplicates, cssFilesForAnalysis for conflicting)
      const allBlocks: Array<{ file: string; blocks: DeclarationBlock[] }> = [];
      filesToParse = ctx.targets.mode === 'changed' ? allCssFiles : cssFilesForAnalysis;

      for (const file of filesToParse) {
        const absPath = join(rootDir, file);
        if (!existsSync(absPath)) continue;

        try {
          const content = readFileSync(absPath, 'utf8');
          const relFile = getRelativePath(absPath);
          const result = parseCssFile(relFile, content);

          if (result.parseError) {
            findings.push({
              tool: 'css-overlapping-rules',
              ruleId: 'css/parse-error',
              severity: 'warn',
              file: relFile,
              message: `Failed to parse CSS file: ${result.parseError}`,
              fingerprint: `css-overlapping-rules|css/parse-error|${relFile}`,
            });
            continue;
          }

          if (result.declarationBlocks.length > 0) {
            allBlocks.push({
              file: relFile,
              blocks: result.declarationBlocks,
            });
          }
        } catch (error) {
          findings.push({
            tool: 'css-overlapping-rules',
            ruleId: 'css/parse-error',
            severity: 'warn',
            file: getRelativePath(absPath),
            message: `Failed to read CSS file: ${error instanceof Error ? error.message : String(error)}`,
            fingerprint: `css-overlapping-rules|css/parse-error|${getRelativePath(absPath)}`,
          });
        }
      }

      // Detect cross-file duplicates
      const duplicateFindings = detectCrossFileDuplicates(allBlocks, changedFilesSet);
      findings.push(...duplicateFindings);

      // Detect conflicting selectors (within same file) - only analyze changed files
      // Group blocks by file for conflicting selector detection
      const blocksByFile = new Map<string, DeclarationBlock[]>();
      for (const group of allBlocks) {
        if (cssFilesForAnalysis.includes(group.file)) {
          if (!blocksByFile.has(group.file)) {
            blocksByFile.set(group.file, []);
          }
          // group is { file, blocks }, so push the DeclarationBlock[] not the wrapper object
          blocksByFile.get(group.file)!.push(...group.blocks);
        }
      }
      const conflictingBlocksArray = Array.from(blocksByFile.entries()).map(([file, blocks]) => ({ file, blocks }));
      const conflictingFindings = detectConflictingSelectors(conflictingBlocksArray);
      findings.push(...conflictingFindings);

      ctx.log(`  Analyzed ${filesToParse.length} CSS files (${cssFilesForAnalysis.length} for conflicting), found ${findings.length} findings`);
    } catch (error) {
      ctx.warn(`Overlapping rules analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        filesAnalyzed: filesToParse.length,
        findings: findings.length,
      },
    };
  },
};
