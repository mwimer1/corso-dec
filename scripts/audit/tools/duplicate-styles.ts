#!/usr/bin/env tsx
/**
 * Duplicate Styles Adapter
 *
 * Wraps check-duplicate-styles.ts as a CSS audit tool.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRepoRoot, getRelativePath } from '../../lint/_utils/paths';

const ALLOWLIST = new Set<string>([
  // Add component names here if duplicate styling is intentional
]);

/**
 * Run duplicate styles check
 */
function checkDuplicateStyles(rootDir: string): Array<{ patternName: string; componentFiles: string[] }> {
  const duplicates: Array<{ patternName: string; componentFiles: string[] }> = [];
  const patternsDir = join(rootDir, 'styles', 'ui', 'patterns');

  if (!existsSync(patternsDir)) {
    return duplicates;
  }

  let patternFiles: string[] = [];
  try {
    patternFiles = readdirSync(patternsDir)
      .filter(f => f.endsWith('.css'))
      .map(f => basename(f, '.css'));
  } catch {
    return duplicates;
  }

  for (const patternName of patternFiles) {
    if (ALLOWLIST.has(patternName)) {
      continue;
    }

    try {
      const moduleCss = execSync(
        `rg --files -g "*${patternName}.module.css" components/`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], cwd: rootDir }
      ).trim();

      const plainCss = execSync(
        `rg --files -g "*${patternName}.css" components/`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], cwd: rootDir }
      ).trim();

      if (moduleCss || plainCss) {
        const found = [moduleCss, plainCss].filter(Boolean);
        duplicates.push({
          patternName,
          componentFiles: found,
        });
      }
    } catch (error: any) {
      if (error.status !== 1) {
        // Real error - continue anyway
      }
    }
  }

  return duplicates;
}

/**
 * Duplicate Styles Tool
 */
export const duplicateStylesTool: CssAuditTool = {
  id: 'css-duplicate-styles',
  title: 'Duplicate Styles',
  description: 'Detects duplicate styling sources for the same component',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    try {
      ctx.log('Checking for duplicate styling sources...');

      const duplicates = checkDuplicateStyles(rootDir);

      for (const { patternName, componentFiles } of duplicates) {
        const patternFile = `styles/ui/patterns/${patternName}.css`;
        const fingerprint = `css-duplicate-styles:${patternName}:${componentFiles.join(',')}`;

        findings.push({
          tool: 'css-duplicate-styles',
          ruleId: 'css/duplicate-styles',
          severity: 'warn',
          file: patternFile,
          message: `Duplicate styling detected for "${patternName}"`,
          hint: `Pattern CSS: ${patternFile}\nComponent CSS: ${componentFiles.join(', ')}\n→ Choose one owner. If duplicate is intentional, add "${patternName}" to ALLOWLIST.`,
          fingerprint,
          data: {
            patternName,
            patternFile,
            componentFiles,
          },
        });
      }

      ctx.log(`  Found ${findings.length} duplicate styling sources`);
    } catch (error) {
      ctx.warn(`Duplicate styles check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        duplicates: findings.length,
      },
    };
  },
};
