#!/usr/bin/env tsx
/**
 * CSS Best Practices Tool
 *
 * Cross-file convention checks that don't fit Stylelint:
 * - Forbid :global usage outside allowed directories
 * - Forbid new files under styles/legacy/*
 * - Other cross-file policies
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath, normalizePath } from '../../lint/_utils/paths';

/**
 * Check for :global usage in CSS modules
 */
function checkGlobalUsage(
  filePath: string,
  content: string
): Array<{ line: number; col: number }> {
  const usages: Array<{ line: number; col: number }> = [];

  try {
    const root = postcss.parse(content);
    
    root.walkRules((rule) => {
      // Check if selector contains :global(
      if (rule.selector.includes(':global(')) {
        const source = rule.source;
        if (source && source.start) {
          usages.push({
            line: source.start.line || 1,
            col: source.start.column || 1,
          });
        }
      }
    });
  } catch {
    // Parse error - will be caught by stylelint
  }

  return usages;
}

/**
 * Best Practices Tool
 */
export const cssBestPracticesTool: CssAuditTool = {
  id: 'css-best-practices',
  title: 'CSS Best Practices',
  description: 'Enforces cross-file CSS conventions and best practices',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Baseline all findings except info-level
    return finding.severity !== 'info';
  },

  async run(ctx, toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    let cssFiles: string[] = [];
    const rootDir = ctx.rootDir;

    // Get tool config
    const config = toolConfig as {
      allowGlobalIn?: string[];
      allowLegacyDirectory?: boolean;
    } || {};

    const allowGlobalIn = config.allowGlobalIn || [];
    const allowLegacyDirectory = config.allowLegacyDirectory || false;

    try {
      ctx.log('Checking CSS best practices...');

      cssFiles = [
        ...ctx.targets.cssFiles,
        ...ctx.targets.cssModuleFiles,
      ];

      if (cssFiles.length === 0) {
        return {
          findings: [],
          stats: {
            filesChecked: 0,
            findings: 0,
          },
        };
      }

      // Build set of changed files
      const changedFiles = new Set(
        ctx.targets.mode === 'changed'
          ? ctx.targets.changedFiles
          : []
      );

      for (const file of cssFiles) {
        const absPath = join(rootDir, file);
        if (!existsSync(absPath)) continue;

        const relFile = getRelativePath(absPath);

        try {
          // Check 1: Forbid :global usage outside allowed directories
          // Only check CSS modules (not regular CSS files)
          if (file.endsWith('.module.css')) {
            const content = readFileSync(absPath, 'utf8');
            const globalUsages = checkGlobalUsage(relFile, content);

            if (globalUsages.length > 0) {
              // Check if file is in an allowed directory
              const isAllowed = allowGlobalIn.some(allowed => {
                const pattern = allowed.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
                const regex = new RegExp(`^${pattern}`);
                return regex.test(relFile);
              });

              if (!isAllowed) {
                for (const usage of globalUsages) {
                  const fingerprint = `css-best-practices|css/forbidden-global|${relFile}`;
                  
                  findings.push({
                    tool: 'css-best-practices',
                    ruleId: 'css/forbidden-global',
                    severity: 'warn',
                    file: relFile,
                    line: usage.line,
                    col: usage.col,
                    message: ':global() usage detected in CSS module',
                    hint: ':global() should be avoided in CSS modules. If necessary, add this directory to allowGlobalIn config or move global styles to a regular CSS file.',
                    fingerprint,
                    data: {
                      allowedDirectories: allowGlobalIn,
                    },
                  });
                }
              }
            }
          }

          // Check 2: Forbid new files under styles/legacy/*
          if (relFile.startsWith('styles/legacy/')) {
            // In changed mode, only flag if the file was actually changed
            // In full mode, flag all files in legacy directory
            const shouldFlag = ctx.targets.mode === 'changed'
              ? changedFiles.has(relFile)
              : true;

            if (shouldFlag && !allowLegacyDirectory) {
              const fingerprint = `css-best-practices|css/forbidden-legacy|${relFile}`;
              
              findings.push({
                tool: 'css-best-practices',
                ruleId: 'css/forbidden-legacy',
                severity: 'error',
                file: relFile,
                message: 'File in styles/legacy/ directory is deprecated',
                hint: 'The styles/legacy/ directory is deprecated. Move styles to appropriate locations (styles/tokens/, styles/ui/, or component CSS modules).',
                fingerprint,
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read (error will be caught by other tools)
        }
      }

      ctx.log(`  Checked ${cssFiles.length} files, found ${findings.length} violations`);
    } catch (error) {
      ctx.warn(`Best practices check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        filesChecked: cssFiles.length,
        findings: findings.length,
      },
    };
  },
};
