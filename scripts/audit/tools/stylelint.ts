#!/usr/bin/env tsx
/**
 * Stylelint Adapter
 *
 * Wraps stylelint as a CSS audit tool.
 * Converts stylelint results into Finding objects with stable fingerprints.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath } from '../../lint/_utils/paths';
import { readJsonSync } from '../../utils/fs/read';

/**
 * Run stylelint via child_process and parse results
 */
async function runStylelint(
  rootDir: string,
  files: string[]
): Promise<any> {
  const { execSync } = await import('child_process');
  const configPath = join(rootDir, 'config/.stylelintrc.cjs');

  if (files.length === 0) {
    return { results: [] };
  }

  try {
    // Use pnpm/npm stylelint command
    const fileArgs = files.map(f => join(rootDir, f));
    const cmd = `pnpm exec stylelint --config "${configPath}" --formatter json ${fileArgs.map(f => `"${f}"`).join(' ')}`;
    
    try {
      const output = execSync(cmd, {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      try {
        return JSON.parse(output);
      } catch {
        // If output isn't JSON, return empty
        return { results: [] };
      }
    } catch (error: any) {
      // Stylelint exits with non-zero on findings, but that's expected
      // Try to parse stdout for JSON output
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch {
          // Not JSON, return empty
        }
      }
      return { results: [] };
    }
  } catch {
    return { results: [] };
  }
}

/**
 * Convert stylelint result to Finding
 */
function stylelintToFinding(
  result: any,
  rootDir: string
): Finding {
  const file = result.source ? getRelativePath(result.source) : '';
  const warning = result.warnings?.[0] || {};
  const ruleId = warning.rule || 'unknown';
  
  // Create stable fingerprint (must NOT include line/col)
  // Use: tool + ruleId + file + message hash
  const messageHash = warning.text ? 
    Buffer.from(warning.text).toString('base64').slice(0, 16) : '';
  const fingerprint = `stylelint:${ruleId}:${file}:${messageHash}`;

  return {
    tool: 'stylelint',
    ruleId: `stylelint/${ruleId}`,
    severity: warning.severity === 'error' ? 'error' : 'warn',
    ...(file ? { file } : {}),
    ...(typeof warning.line === 'number' ? { line: warning.line } : {}),
    ...(typeof warning.column === 'number' ? { col: warning.column } : {}),
        message: warning.text || 'Stylelint violation',
        ...(warning.rule ? { hint: `Rule: ${warning.rule}` } : {}),
    fingerprint,
    data: {
      rule: warning.rule,
      severity: warning.severity,
    },
  };
}

/**
 * Stylelint Tool
 */
export const stylelintTool: CssAuditTool = {
  id: 'stylelint',
  title: 'Stylelint',
  description: 'Runs stylelint validation',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Include all findings (error and warn) in baseline
    return finding.severity !== 'info';
  },

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // Collect CSS files based on scope
    const cssFiles = [
      ...ctx.targets.cssFiles,
      ...ctx.targets.cssModuleFiles,
    ].filter(f => {
      // Filter out non-existent files
      return existsSync(join(rootDir, f));
    });

    if (cssFiles.length === 0) {
      return { 
        findings: [],
        stats: { filesChecked: 0, findings: 0 },
      };
    }

    try {
      ctx.log(`Running stylelint on ${cssFiles.length} files...`);

      // Run stylelint
      const result = await runStylelint(rootDir, cssFiles);

      // Convert results to findings
      if (result.results) {
        for (const fileResult of result.results) {
          if (fileResult.warnings && fileResult.warnings.length > 0) {
            // Group warnings by file, create one finding per warning
            for (const warning of fileResult.warnings) {
              const finding = stylelintToFinding(
                {
                  source: fileResult.source,
                  warnings: [warning],
                },
                rootDir
              );
              findings.push(finding);
            }
          }
        }
      }

      ctx.log(`  Found ${findings.length} findings`);
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
