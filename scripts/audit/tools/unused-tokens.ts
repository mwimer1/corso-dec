#!/usr/bin/env tsx
/**
 * Unused Tokens Adapter
 *
 * Wraps audit-unused-tokens.ts as a CSS audit tool.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath, normalizePath } from '../../lint/_utils/paths';

/**
 * Find files recursively
 */
function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    try {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (item === 'build') continue;
          walk(fullPath);
        } else if (stat.isFile() && extensions.includes(extname(item))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  walk(dir);
  return files;
}

/**
 * Extract tokens from file
 */
function extractTokensFromFile(filePath: string): { defs: string[]; uses: string[] } {
  const content = readFileSync(filePath, 'utf8');
  const defs: string[] = [];
  const uses: string[] = [];

  const defMatches = content.matchAll(/^\s*--([A-Za-z0-9_-]+)\s*:/gm);
  for (const match of defMatches) {
    if (match[1]) {
      defs.push(match[1]);
    }
  }

  const useMatches = content.matchAll(/var\(--([A-Za-z0-9_-]+)\)/g);
  for (const match of useMatches) {
    if (match[1]) {
      uses.push(match[1]);
    }
  }

  return { defs, uses };
}

/**
 * Unused Tokens Tool
 */
export const unusedTokensTool: CssAuditTool = {
  id: 'css-unused-tokens',
  title: 'Unused CSS Tokens',
  description: 'Finds CSS custom properties that are defined but not referenced via var(--token-name)',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css'],
  },
  defaultEnabled: true,

  baselineInclude: (finding) => {
    // Many tokens appear unused but are consumed via Tailwind - baseline warn-level
    return finding.severity === 'warn';
  },

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    try {
      ctx.log('Checking for unused CSS tokens...');

      // Find all CSS files in styles directory
      const cssFiles = findFiles(join(rootDir, 'styles'), ['.css']);
      const codeFiles = findFiles(rootDir, ['.css', '.ts', '.tsx', '.js', '.jsx']);

      // Collect all definitions and usages
      const allDefs: string[] = [];
      const allUses: string[] = [];

      for (const file of cssFiles) {
        const { defs } = extractTokensFromFile(file);
        allDefs.push(...defs);
      }

      for (const file of codeFiles) {
        if (file.includes('/build/') || file.includes('\\build\\')) continue;
        const { uses } = extractTokensFromFile(file);
        allUses.push(...uses);
      }

      // Load allowlist
      const allowlistPath = join(rootDir, 'styles', 'tokens', 'UNUSED.allowlist.json');
      let allowed: string[] = [];
      if (existsSync(allowlistPath)) {
        try {
          const allowlistData = JSON.parse(readFileSync(allowlistPath, 'utf8'));
          allowed = allowlistData.allowed || [];
        } catch {
          // Invalid allowlist, continue
        }
      }

      // Create allowlist regex
      const allowRE = new RegExp(
        '^(' +
        allowed
          .map((pattern: string) => pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*'))
          .join('|') +
        ')$'
      );

      // Find unused tokens
      const uniqueDefs = [...new Set(allDefs)];
      const uniqueUses = [...new Set(allUses)];
      const unusedTokens = uniqueDefs
        .filter(token => !uniqueUses.includes(token))
        .filter(token => !allowRE.test(token))
        .sort();

      // Find where each token is defined
      const tokenLocations = new Map<string, { file: string; line: number }>();

      for (const file of cssFiles) {
        try {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const match = line.match(/^\s*--([A-Za-z0-9_-]+)\s*:/);
            if (match && match[1] && unusedTokens.includes(match[1])) {
              const relFile = getRelativePath(file);
              tokenLocations.set(match[1], {
                file: relFile,
                line: i + 1,
              });
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      for (const token of unusedTokens) {
        const location = tokenLocations.get(token);
        const fingerprint = `css-unused-tokens:${token}`;

        const finding: Finding = {
          tool: 'css-unused-tokens',
          ruleId: 'css/unused-token',
          severity: 'warn',
          message: `Unused CSS token: --${token}`,
          hint: 'Token is defined but never referenced via var(--token-name). Note: This only detects direct var() usage, not Tailwind class usage. If token is used via Tailwind, add to styles/tokens/UNUSED.allowlist.json',
          fingerprint,
          data: {
            token,
          },
        };

        if (location && location.file) {
          finding.file = location.file;
          finding.line = location.line;
        }

        findings.push(finding);
      }

      ctx.log(`  Found ${findings.length} unused tokens`);
    } catch (error) {
      ctx.warn(`Unused tokens check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        unusedTokens: findings.length,
      },
    };
  },
};
