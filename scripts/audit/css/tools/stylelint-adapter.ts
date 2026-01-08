#!/usr/bin/env tsx
/**
 * Stylelint Adapter
 *
 * Wraps existing stylelint validation as a CSS audit tool.
 * This is an example adapter pattern for integrating existing tools.
 */

import { execSync } from 'child_process';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRepoRoot } from '../../../lint/_utils/paths';

/**
 * Convert stylelint output to findings
 */
function parseStylelintOutput(output: string, files: string[]): Finding[] {
  const findings: Finding[] = [];

  try {
    // Stylelint can output JSON format
    const result = JSON.parse(output);

    if (result.results) {
      for (const fileResult of result.results) {
        const file = fileResult.source || '';
        const relFile = file.replace(/\\/g, '/').replace(getRepoRoot().replace(/\\/g, '/') + '/', '');

        for (const warning of fileResult.warnings || []) {
          const fingerprint = `stylelint:${relFile}:${warning.line}:${warning.rule}`;
          
          findings.push({
            tool: 'stylelint',
            ruleId: `stylelint/${warning.rule || 'unknown'}`,
            severity: warning.severity === 'error' ? 'error' : 'warn',
            ...(relFile ? { file: relFile } : {}),
            ...(typeof warning.line === 'number' ? { line: warning.line } : {}),
            ...(typeof warning.column === 'number' ? { col: warning.column } : {}),
            message: warning.text,
            ...(warning.rule ? { hint: `Rule: ${warning.rule}` } : {}),
            fingerprint,
            data: {
              rule: warning.rule,
              severity: warning.severity,
            },
          });
        }
      }
    }
  } catch {
    // If JSON parsing fails, try to parse text output (simpler, less reliable)
    // This is a fallback - ideally stylelint should use JSON format
  }

  return findings;
}

/**
 * Stylelint Adapter Tool
 *
 * Note: This is a reference implementation. In practice, you might want to:
 * 1. Use stylelint's programmatic API instead of execSync
 * 2. Handle stylelint config from the project's config file
 * 3. Cache results for performance
 */
export const stylelintAdapterTool: CssAuditTool = {
  id: 'stylelint',
  title: 'Stylelint',
  description: 'Runs stylelint validation (adapter for existing tool)',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: false, // Disabled by default - enable with --tools stylelint

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // Collect CSS files
    const cssFiles = [
      ...ctx.targets.cssFiles,
      ...ctx.targets.cssModuleFiles,
    ];

    if (cssFiles.length === 0) {
      return { findings, stats: { filesChecked: 0 } };
    }

    try {
      // Run stylelint (this is a simplified example)
      // In practice, you'd use stylelint's programmatic API
      const configPath = join(rootDir, 'config/.stylelintrc.cjs');
      const filePatterns = cssFiles.map(f => join(rootDir, f));

      // Use stylelint programmatic API if available, otherwise exec
      // This is a placeholder - actual implementation would use stylelint API
      ctx.log(`Running stylelint on ${cssFiles.length} files...`);
      
      // For now, return empty findings (requires stylelint programmatic API integration)
      // Example:
      // const stylelint = require('stylelint');
      // const result = await stylelint.lint({
      //   files: filePatterns,
      //   configFile: configPath,
      //   formatter: 'json',
      // });
      // const findings = parseStylelintOutput(result.output, cssFiles);

      ctx.warn('Stylelint adapter requires programmatic API integration');
    } catch (error) {
      ctx.warn(`Stylelint failed: ${error instanceof Error ? error.message : String(error)}`);
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
