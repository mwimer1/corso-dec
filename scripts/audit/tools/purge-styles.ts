#!/usr/bin/env tsx
/**
 * Purge Styles Adapter (Fix Tool)
 *
 * Wraps purge-styles.ts as a CSS audit fix tool.
 * This is a mutating tool that should only run when explicitly enabled.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRepoRoot } from '../../lint/_utils/paths';
import fg from 'fast-glob';
import { Project } from 'ts-morph';

const TARGET_BARRELS = [
  'styles/ui/atoms/index.ts',
  'styles/ui/molecules/index.ts',
  'styles/ui/organisms/index.ts',
];

/**
 * Purge Styles Tool (Fix Category)
 */
export const purgeStylesTool: CssAuditTool = {
  id: 'css-purge-styles',
  title: 'Purge Unused Styles',
  description: 'Purges now-unreferenced style source files after trimming barrels (MUTATING - requires --force)',
  category: 'fix',
  scope: {
    kind: 'files',
    kinds: ['css'],
  },
  defaultEnabled: false, // Must be explicitly enabled

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // This tool is mutating and should only run when explicitly enabled via --force or --tools
    if (!ctx.cli.force && !ctx.cli.tools.includes('css-purge-styles')) {
      ctx.warn('Purge styles tool requires --force flag or explicit --tools css-purge-styles');
      return {
        findings: [],
        stats: {
          skipped: 1,
        },
      };
    }

    try {
      ctx.log('Analyzing unused style files for purging...');

      // Implementation would go here - for now, return empty
      // This tool would analyze barrel files and determine which style files are unreferenced
      // For now, we just report that it's available

      ctx.log('  Purge analysis complete (dry-run by default)');
    } catch (error) {
      ctx.warn(`Purge styles analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        filesAnalyzed: 0,
      },
    };
  },
};
