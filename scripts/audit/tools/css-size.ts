#!/usr/bin/env tsx
/**
 * CSS Size Analyzer Adapter
 *
 * Wraps css-size-analyzer.ts as a CSS audit tool.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding, Artifact } from '../types';
import { readTextSync } from '../../utils/fs/read';

const MAX_CSS_SIZE_KB = 150;

/**
 * CSS Size Tool
 */
export const cssSizeTool: CssAuditTool = {
  id: 'css-size',
  title: 'CSS Bundle Size',
  description: 'Monitors the built Tailwind CSS file size to prevent bundle bloat',
  category: 'audit',
  scope: {
    kind: 'global', // Always runs globally regardless of changed files
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const artifacts: Artifact[] = [];
    const rootDir = ctx.rootDir;
    const cssPath = join(rootDir, 'styles/build/tailwind.css');

    try {
      ctx.log('Analyzing CSS bundle size...');

      if (!existsSync(cssPath)) {
        ctx.warn(`CSS bundle not found at ${cssPath}. Run build first.`);
        return {
          findings: [],
      stats: {
        sizeKB: 0,
        exceededLimit: 0,
      },
        };
      }

      const css = readTextSync(cssPath);
      const sizeInKb = Buffer.byteLength(css, 'utf8') / 1024;

      // Create artifact with size info
      artifacts.push({
        id: 'css-size-report',
        path: cssPath,
        kind: 'text',
        title: 'CSS Bundle Size Analysis',
      });

      if (sizeInKb > MAX_CSS_SIZE_KB) {
        const fingerprint = `css-size:exceeded:${sizeInKb.toFixed(2)}`;
        findings.push({
          tool: 'css-size',
          ruleId: 'css/bundle-size',
          severity: 'error',
          message: `CSS bundle size (${sizeInKb.toFixed(2)} KB) exceeds maximum allowed size of ${MAX_CSS_SIZE_KB} KB`,
          hint: `Bundle is ${(sizeInKb - MAX_CSS_SIZE_KB).toFixed(2)} KB over limit. Consider optimizing Tailwind classes, removing unused styles, or splitting CSS bundles.`,
          fingerprint,
          data: {
            sizeKB: sizeInKb,
            maxKB: MAX_CSS_SIZE_KB,
            exceededBy: sizeInKb - MAX_CSS_SIZE_KB,
          },
        });
      }

      ctx.log(`  CSS bundle size: ${sizeInKb.toFixed(2)} KB (limit: ${MAX_CSS_SIZE_KB} KB)`);
    } catch (error) {
      ctx.warn(`CSS size analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    let sizeKB = 0;
    if (findings.length > 0 && findings[0]?.data && typeof findings[0].data === 'object' && 'sizeKB' in findings[0].data) {
      const kb = findings[0].data['sizeKB'];
      if (typeof kb === 'number') {
        sizeKB = kb;
      }
    }

    return {
      findings,
      artifacts,
      stats: {
        sizeKB,
        exceededLimit: findings.length > 0 ? 1 : 0,
      },
    };
  },
};
