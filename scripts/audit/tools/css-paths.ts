#!/usr/bin/env tsx
/**
 * CSS Paths Adapter
 *
 * Wraps check-css-paths.ts as a CSS audit tool.
 */

import { execSync } from 'child_process';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath, normalizePath } from '../../lint/_utils/paths';

/**
 * Find CSS files outside styles/ directory
 */
function findStrayCssFiles(rootDir: string): string[] {
  try {
    const output = execSync("rg --files -tcss --glob '!styles/**/*' .", {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd: rootDir,
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .map(f => normalizePath(f.trim()))
      .filter(Boolean);
  } catch (error: any) {
    if (error.status === 1) {
      // ripgrep exit code 1 means no matches (success)
      return [];
    }
    return [];
  }
}

/**
 * CSS Paths Tool
 */
export const cssPathsTool: CssAuditTool = {
  id: 'css-paths',
  title: 'CSS File Paths',
  description: 'Validates that all CSS files are located in the styles/ directory',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css'],
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    try {
      ctx.log('Checking for CSS files outside styles/ directory...');

      const strayFiles = findStrayCssFiles(rootDir);

      for (const file of strayFiles) {
        const relFile = getRelativePath(join(rootDir, file));
        const fingerprint = `css-paths:${relFile}`;

        findings.push({
          tool: 'css-paths',
          ruleId: 'css/file-organization',
          severity: 'error',
          file: relFile,
          message: 'CSS file found outside styles/ directory',
          hint: 'Move CSS files to styles/ directory to enforce consistent file organization',
          fingerprint,
          data: {
            file: relFile,
          },
        });
      }

      ctx.log(`  Found ${findings.length} stray CSS files`);
    } catch (error) {
      ctx.warn(`CSS paths check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        strayFiles: findings.length,
      },
    };
  },
};
